import os
import re
import base64
import hashlib
import urllib.parse
import urllib.request
import urllib.error
import json
from typing import Any, Literal
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from parser_ast import parse_python_code, ParseError

# Get a free Groq API key at console.groq.com/keys

app = FastAPI(title="FlowTensor API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


class ParseRequest(BaseModel):
    code: str


class FetchRepoRequest(BaseModel):
    url: str
    github_token: str | None = None


class FetchFileRequest(BaseModel):
    owner: str
    repo: str
    path: str
    github_token: str | None = None


REPO_URL_RE = re.compile(
    r"^(?:https?://)?(?:www\.)?github\.com/([A-Za-z0-9_.-]+)/([A-Za-z0-9_.-]+?)(?:\.git)?/?(?:[?#].*)?$"
)

EXCLUDED_DIRS = {"__pycache__", "venv", ".venv", "migrations", "node_modules", ".git"}
EXCLUDED_FILES = {"setup.py", "conftest.py"}
MAX_DEPTH = 3


def _err(message: str, status_code: int = 422):
    return JSONResponse(
        status_code=status_code,
        content={"error": message, "detail": None},
    )


def _gh_headers(user_token: str | None = None) -> dict:
    headers = {
        "Accept": "application/vnd.github+json",
        "User-Agent": "FlowTensor",
    }
    env_token = os.environ.get("GITHUB_TOKEN")
    # User-provided token takes priority over env variable
    active_token = (user_token or "").strip() or env_token
    if active_token:
        headers["Authorization"] = f"Bearer {active_token}"
    return headers


def _gh_get(url: str, token: str | None = None):
    """GET a GitHub API URL. Returns parsed JSON."""
    request = urllib.request.Request(url, headers=_gh_headers(token))
    with urllib.request.urlopen(request, timeout=15) as resp:
        return json.loads(resp.read().decode("utf-8"))


def _is_excluded_file(name: str) -> bool:
    if not name.lower().endswith(".py"):
        return True
    if name in EXCLUDED_FILES:
        return True
    if name.startswith("test_") and name.endswith(".py"):
        return True
    if name.endswith("_test.py"):
        return True
    return False


def _walk_repo(
    owner: str, repo: str, path: str, depth: int, out: list, token: str | None = None
) -> None:
    if depth > MAX_DEPTH:
        return
    encoded = urllib.parse.quote(path)
    contents_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{encoded}"
    items = _gh_get(contents_url, token)
    if not isinstance(items, list):
        return
    for item in items:
        if not isinstance(item, dict):
            continue
        item_type = item.get("type")
        name = item.get("name") or ""
        item_path = item.get("path") or name
        if item_type == "dir":
            if name in EXCLUDED_DIRS or name.startswith("."):
                continue
            _walk_repo(owner, repo, item_path, depth + 1, out, token)
        elif item_type == "file":
            if _is_excluded_file(name):
                continue
            out.append(
                {
                    "name": name,
                    "path": item_path,
                    "size": int(item.get("size") or 0),
                }
            )


@app.get("/api/healthz")
def health_check():
    return {"status": "ok"}


# ──────────────────────────────────────────────────────────────────────
# AI Explainer (Groq)
# ──────────────────────────────────────────────────────────────────────

GROQ_MODEL = "llama3-8b-8192"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# Backend session state — never persisted to disk
_groq_state: dict = {"user_key": None, "explanation_count": 0}
_groq_cache: dict[str, dict] = {}


class ExplainNodeRequestModel(BaseModel):
    operation: str
    parameters: dict[str, Any] | None = None
    shape_before: str | None = None
    shape_after: str | None = None
    variable_name: str | None = None
    library: str | None = None
    surrounding_context: str | None = None
    level: Literal["beginner", "intermediate", "pro"]


class SetGroqKeyRequestModel(BaseModel):
    key: str


def _active_groq_key() -> tuple[str | None, str]:
    user_key = _groq_state.get("user_key")
    if user_key:
        return user_key, "user"
    env_key = os.environ.get("GROQ_API_KEY")
    if env_key:
        return env_key, "env"
    return None, "none"


def _groq_cache_key(req: "ExplainNodeRequestModel") -> str:
    raw = "::".join(
        [
            req.operation,
            json.dumps(req.parameters or {}, sort_keys=True),
            req.shape_before or "",
            req.shape_after or "",
            req.variable_name or "",
            req.library or "",
            hashlib.sha256((req.surrounding_context or "").encode("utf-8")).hexdigest(),
            req.level,
        ]
    )
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


_GROQ_SYSTEM_PROMPT = """You are an expert data science mentor embedded in a code visualization tool called FlowTensor.
Explain what a specific operation does in a practical, insightful way — not generically, but for THIS specific code.
Be concise. Plain English. Max 4 sentences total.
Always respond with valid JSON using exactly these keys:
{
  "what": "1 sentence — what this does in this specific context",
  "impact": "1 sentence — what it means for the data, reference actual numbers",
  "tip": "1 sentence — a practical tip specific to this situation",
  "risk": "1 sentence — only include if there is a real risk, else omit this key"
}"""


def _level_hint(level: str) -> str:
    if level == "beginner":
        return "Audience: beginner — use plain English, analogies, no jargon."
    if level == "pro":
        return "Audience: pro — terse, precise, mention edge cases and performance implications."
    return "Audience: intermediate — practical focus, assume Python/ML knowledge."


def _build_user_prompt(req: ExplainNodeRequestModel) -> str:
    return (
        f"{_level_hint(req.level)}\n\n"
        f"Operation: {req.operation}({json.dumps(req.parameters or {})})\n"
        f"Library: {req.library or 'unknown'}\n"
        f"Data before: {req.shape_before or 'unknown'}\n"
        f"Data after: {req.shape_after or 'unknown'}\n"
        f"Variable: {req.variable_name or 'unknown'}\n"
        f"Surrounding code:\n{req.surrounding_context or '(not provided)'}"
    )


def _static_explanation() -> dict:
    return {"source": "static", "cached": False}


@app.post("/api/explain-node")
def explain_node(req: ExplainNodeRequestModel):
    key, _ = _active_groq_key()
    if not key:
        # Silent fallback — caller renders no-key panel state
        return _static_explanation()

    ck = _groq_cache_key(req)
    cached = _groq_cache.get(ck)
    if cached is not None:
        return {"source": "ai", "cached": True, **cached}

    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": _GROQ_SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(req)},
        ],
        "max_tokens": 300,
        "temperature": 0.3,
        "response_format": {"type": "json_object"},
    }

    try:
        request = urllib.request.Request(
            GROQ_URL,
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {key}",
                "Content-Type": "application/json",
            },
            method="POST",
        )
        with urllib.request.urlopen(request, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except Exception:
        # Never crash — fall back silently to static
        return _static_explanation()

    content = ""
    try:
        content = data["choices"][0]["message"]["content"] or ""
    except Exception:
        return _static_explanation()

    try:
        parsed = json.loads(content)
    except Exception:
        return _static_explanation()

    cleaned = {k: parsed[k] for k in ("what", "impact", "tip", "risk") if k in parsed and parsed[k]}
    _groq_cache[ck] = cleaned
    _groq_state["explanation_count"] += 1
    return {"source": "ai", "cached": False, **cleaned}


@app.post("/api/set-groq-key")
def set_groq_key(req: SetGroqKeyRequestModel):
    trimmed = (req.key or "").strip()
    _groq_state["user_key"] = trimmed if trimmed else None
    key, source = _active_groq_key()
    return {
        "has_key": bool(key),
        "source": source,
        "explanation_count": _groq_state["explanation_count"],
    }


@app.get("/api/groq-key-status")
def groq_key_status():
    key, source = _active_groq_key()
    return {
        "has_key": bool(key),
        "source": source,
        "explanation_count": _groq_state["explanation_count"],
    }


@app.post("/api/parse")
def parse_code(req: ParseRequest):
    if not req.code or not req.code.strip():
        return JSONResponse(
            status_code=422,
            content={"error": "No code provided. Paste some Python code to visualize.", "detail": None},
        )
    try:
        result = parse_python_code(req.code)
        return result
    except ParseError as e:
        return JSONResponse(
            status_code=422,
            content={"error": str(e), "detail": e.detail},
        )
    except Exception as e:
        return JSONResponse(
            status_code=422,
            content={"error": "Could not parse the code. Make sure it's valid Python.", "detail": str(e)},
        )


def _parse_repo_url(raw_url: str):
    match = REPO_URL_RE.match(raw_url)
    if not match:
        return None
    owner, repo = match.group(1), match.group(2)
    if repo.endswith(".git"):
        repo = repo[:-4]
    return owner, repo


@app.post("/api/fetch-repo")
def fetch_repo(req: FetchRepoRequest):
    raw_url = (req.url or "").strip()
    if not raw_url:
        return _err("Invalid GitHub repository URL")

    parsed = _parse_repo_url(raw_url)
    if not parsed:
        return _err("Invalid GitHub repository URL")
    owner, repo = parsed

    user_token = req.github_token
    try:
        meta = _gh_get(f"https://api.github.com/repos/{owner}/{repo}", user_token)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return _err("Repository not found or is private")
        if e.code == 403:
            return _err("GitHub rate limit reached, try again in a minute")
        return _err("Could not fetch repository from GitHub")
    except urllib.error.URLError:
        return _err("Could not reach GitHub. Check your connection and try again.")
    except Exception:
        return _err("Could not fetch repository from GitHub")

    files: list = []
    try:
        _walk_repo(owner, repo, "", 0, files, user_token)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return _err("Repository contents not found")
        if e.code == 403:
            return _err("GitHub rate limit reached, try again in a minute")
        return _err("Could not list repository files")
    except urllib.error.URLError:
        return _err("Could not reach GitHub. Check your connection and try again.")
    except Exception:
        return _err("Could not list repository files")

    if not files:
        return _err("No Python files found in this repository")

    files.sort(key=lambda f: f.get("size", 0), reverse=True)

    info = {
        "owner": owner,
        "repo": repo,
        "name": meta.get("name") or repo,
        "description": meta.get("description"),
        "stars": int(meta.get("stargazers_count") or 0),
        "language": meta.get("language"),
    }
    return {"info": info, "files": files}


@app.post("/api/fetch-file")
def fetch_file(req: FetchFileRequest):
    owner = (req.owner or "").strip()
    repo = (req.repo or "").strip()
    path = (req.path or "").strip().lstrip("/")
    if not owner or not repo or not path:
        return _err("Missing owner, repo, or path")
    # Defensive: prevent path traversal
    if ".." in path.split("/"):
        return _err("Invalid file path")

    encoded = urllib.parse.quote(path)
    api_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{encoded}"
    try:
        data = _gh_get(api_url, req.github_token)
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return _err("File not found")
        if e.code == 403:
            return _err("GitHub rate limit reached, try again in a minute")
        return _err("Could not fetch file from GitHub")
    except urllib.error.URLError:
        return _err("Could not reach GitHub. Check your connection and try again.")
    except Exception:
        return _err("Could not fetch file from GitHub")

    if not isinstance(data, dict) or data.get("type") != "file":
        return _err("Path does not point to a file")

    encoding = data.get("encoding")
    raw_content = data.get("content") or ""
    content: str
    if encoding == "base64":
        try:
            content = base64.b64decode(raw_content).decode("utf-8")
        except Exception:
            return _err("Could not decode file content")
    else:
        # Large files require fetching via download_url
        download_url = data.get("download_url")
        if not download_url:
            return _err("Could not download file content")
        try:
            with urllib.request.urlopen(download_url, timeout=15) as r:
                content = r.read().decode("utf-8")
        except Exception:
            return _err("Could not download file content")

    filename = path.rsplit("/", 1)[-1]
    return {"code": content, "filename": filename}
