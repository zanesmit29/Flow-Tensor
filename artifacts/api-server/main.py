import os
import re
import base64
import hashlib
import urllib.parse
import json
from collections import OrderedDict
from typing import Any, Literal

import httpx
from fastapi import FastAPI, Header
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from parser_ast import parse_python_code, ParseError

# Get a free Groq API key at console.groq.com/keys

app = FastAPI(title="FlowTensor API", version="0.1.0")

# ---------------------------------------------------------------------------
# CORS — configurable origins via FLOWTENSOR_ALLOWED_ORIGINS env var
# ---------------------------------------------------------------------------

_raw_origins = os.environ.get("FLOWTENSOR_ALLOWED_ORIGINS", "")
_allowed_origins: list[str] = (
    [o.strip() for o in _raw_origins.split(",") if o.strip()]
    if _raw_origins.strip()
    else ["*"]
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=_allowed_origins,
    allow_credentials=False,
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


async def _gh_get(client: httpx.AsyncClient, url: str, token: str | None = None):
    """GET a GitHub API URL. Returns parsed JSON."""
    resp = await client.get(url, headers=_gh_headers(token), timeout=15)
    resp.raise_for_status()
    return resp.json()


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


async def _walk_repo(
    client: httpx.AsyncClient,
    owner: str,
    repo: str,
    path: str,
    depth: int,
    out: list,
    token: str | None = None,
) -> None:
    if depth > MAX_DEPTH:
        return
    encoded = urllib.parse.quote(path)
    contents_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{encoded}"
    items = await _gh_get(client, contents_url, token)
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
            await _walk_repo(client, owner, repo, item_path, depth + 1, out, token)
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
async def health_check():
    return {"status": "ok"}


# ──────────────────────────────────────────────────────────────────────
# AI Explainer (Groq)
# ──────────────────────────────────────────────────────────────────────

GROQ_MODEL = "qwen/qwen3-32b"
GROQ_URL = "https://api.groq.com/openai/v1/chat/completions"

# ---------------------------------------------------------------------------
# Per-session state keyed by X-FlowTensor-Session header
# ---------------------------------------------------------------------------

_sessions: dict[str, dict] = {}

_LRU_MAX = 256
_groq_cache: OrderedDict[str, dict] = OrderedDict()


def _get_session(sid: str) -> dict:
    if sid not in _sessions:
        _sessions[sid] = {"user_key": None, "explanation_count": 0}
    return _sessions[sid]


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


def _active_groq_key(sid: str) -> tuple[str | None, str]:
    session = _get_session(sid)
    user_key = session.get("user_key")
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


def _cache_get(key: str) -> dict | None:
    if key in _groq_cache:
        _groq_cache.move_to_end(key)
        return _groq_cache[key]
    return None


def _cache_set(key: str, value: dict) -> None:
    _groq_cache[key] = value
    _groq_cache.move_to_end(key)
    while len(_groq_cache) > _LRU_MAX:
        _groq_cache.popitem(last=False)


_GROQ_SYSTEM_PROMPT = """You are an expert data science mentor embedded in a code visualization tool called FlowTensor.
Your job is to explain ONE specific operation in the user's code so a developer truly understands:
  \u2022 WHY this line matters (its importance in the overall pipeline)
  \u2022 HOW it works at a high level (the mechanism, intuition, or math \u2014 without drowning them in detail)
  \u2022 WHAT it actually does to the data flowing through it (refer to real shapes/numbers when given)

Be specific to THIS code, never generic textbook definitions. Talk like a senior engineer mentoring a teammate.
Plain English. No filler. Each field is 1\u20132 sentences.

Always respond with valid JSON using exactly these keys:
{
  "what": "What this operation does AND a high-level intuition for HOW it works (mechanism in one breath, e.g. 'slides learnable filters across the input'). Reference the variable name and library when relevant.",
  "impact": "Why this step matters in the overall pipeline AND what it does to the data (use the actual before/after shapes or parameter values to make it concrete).",
  "tip": "A practical, situation-specific tip \u2014 a tunable knob, a common alternative, or a way to debug this exact step. No generic advice.",
  "risk": "Only include if there\u2019s a real risk in THIS context (e.g. shape mismatch, data leakage, numerical instability). Omit the key entirely if nothing concrete to flag."
}"""


def _level_hint(level: str) -> str:
    if level == "beginner":
        return "Audience: beginner \u2014 use plain English, analogies, no jargon."
    if level == "pro":
        return "Audience: pro \u2014 terse, precise, mention edge cases and performance implications."
    return "Audience: intermediate \u2014 practical focus, assume Python/ML knowledge."


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


def _session_id_from_header(x_flowtensor_session: str | None) -> str:
    return x_flowtensor_session.strip() if x_flowtensor_session else "default"


@app.post("/api/explain-node")
async def explain_node(
    req: ExplainNodeRequestModel,
    x_flowtensor_session: str | None = Header(None),
):
    sid = _session_id_from_header(x_flowtensor_session)
    key, _ = _active_groq_key(sid)
    if not key:
        # Silent fallback — caller renders no-key panel state
        return _static_explanation()

    ck = _groq_cache_key(req)
    cached = _cache_get(ck)
    if cached is not None:
        return {"source": "ai", "cached": True, **cached}

    # Note: qwen3-32b is a reasoning model that emits <think>…</think> blocks
    # before its actual answer. Groq's `response_format: json_object` enforcement
    # rejects this with json_validate_failed. We drop the strict format and rely
    # on the post-processing below to strip thinking + fenced code blocks.
    payload = {
        "model": GROQ_MODEL,
        "messages": [
            {"role": "system", "content": _GROQ_SYSTEM_PROMPT},
            {"role": "user", "content": _build_user_prompt(req)},
        ],
        "max_tokens": 1200,
        "temperature": 0.3,
    }

    try:
        async with httpx.AsyncClient() as client:
            resp = await client.post(
                GROQ_URL,
                json=payload,
                headers={
                    "Authorization": f"Bearer {key}",
                    "User-Agent": "FlowTensor/1.0 (+https://flowtensor.app)",
                    "Accept": "application/json",
                },
                timeout=20,
            )
            resp.raise_for_status()
            data = resp.json()
    except httpx.HTTPStatusError as e:
        body = e.response.text[:500] if e.response else ""
        print(f"[groq] HTTPError {e.response.status_code}: {body}", flush=True)
        return _static_explanation()
    except Exception as e:
        print(f"[groq] error: {type(e).__name__}: {e}", flush=True)
        return _static_explanation()

    content = ""
    try:
        content = data["choices"][0]["message"]["content"] or ""
    except Exception as e:
        print(f"[groq] missing choices: {e}; data={str(data)[:300]}", flush=True)
        return _static_explanation()

    # Strip <think>...</think> blocks that some reasoning models (e.g. qwen3) emit.
    if "<think>" in content and "</think>" in content:
        content = content.split("</think>", 1)[1].strip()
    # Also handle fenced JSON code blocks.
    if "```" in content:
        parts = content.split("```")
        for part in parts:
            stripped = part.strip()
            if stripped.startswith("json"):
                stripped = stripped[4:].strip()
            if stripped.startswith("{") and stripped.endswith("}"):
                content = stripped
                break

    try:
        parsed = json.loads(content)
    except Exception as e:
        print(f"[groq] JSON parse failed: {e}; content={content[:300]}", flush=True)
        return _static_explanation()

    cleaned = {k: parsed[k] for k in ("what", "impact", "tip", "risk") if k in parsed and parsed[k]}
    _cache_set(ck, cleaned)
    session = _get_session(sid)
    session["explanation_count"] += 1
    return {"source": "ai", "cached": False, **cleaned}


@app.post("/api/set-groq-key")
async def set_groq_key(
    req: SetGroqKeyRequestModel,
    x_flowtensor_session: str | None = Header(None),
):
    sid = _session_id_from_header(x_flowtensor_session)
    session = _get_session(sid)
    trimmed = (req.key or "").strip()
    session["user_key"] = trimmed if trimmed else None
    key, source = _active_groq_key(sid)
    return {
        "has_key": bool(key),
        "source": source,
        "explanation_count": session["explanation_count"],
    }


@app.get("/api/groq-key-status")
async def groq_key_status(
    x_flowtensor_session: str | None = Header(None),
):
    sid = _session_id_from_header(x_flowtensor_session)
    session = _get_session(sid)
    key, source = _active_groq_key(sid)
    return {
        "has_key": bool(key),
        "source": source,
        "explanation_count": session["explanation_count"],
    }


@app.post("/api/parse")
async def parse_code(req: ParseRequest):
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
        print(f"[parse] unexpected error: {type(e).__name__}: {e}", flush=True)
        return JSONResponse(
            status_code=422,
            content={"error": "Could not parse the code. Make sure it's valid Python.", "detail": None},
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
async def fetch_repo(req: FetchRepoRequest):
    raw_url = (req.url or "").strip()
    if not raw_url:
        return _err("Invalid GitHub repository URL")

    parsed = _parse_repo_url(raw_url)
    if not parsed:
        return _err("Invalid GitHub repository URL")
    owner, repo = parsed

    user_token = req.github_token
    async with httpx.AsyncClient() as client:
        try:
            meta = await _gh_get(client, f"https://api.github.com/repos/{owner}/{repo}", user_token)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return _err("Repository not found or is private")
            if e.response.status_code == 403:
                return _err("GitHub rate limit reached, try again in a minute")
            return _err("Could not fetch repository from GitHub")
        except httpx.ConnectError:
            return _err("Could not reach GitHub. Check your connection and try again.")
        except Exception:
            return _err("Could not fetch repository from GitHub")

        files: list = []
        try:
            await _walk_repo(client, owner, repo, "", 0, files, user_token)
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return _err("Repository contents not found")
            if e.response.status_code == 403:
                return _err("GitHub rate limit reached, try again in a minute")
            return _err("Could not list repository files")
        except httpx.ConnectError:
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
async def fetch_file(req: FetchFileRequest):
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
    async with httpx.AsyncClient() as client:
        try:
            resp = await client.get(api_url, headers=_gh_headers(req.github_token), timeout=15)
            resp.raise_for_status()
            data = resp.json()
        except httpx.HTTPStatusError as e:
            if e.response.status_code == 404:
                return _err("File not found")
            if e.response.status_code == 403:
                return _err("GitHub rate limit reached, try again in a minute")
            return _err("Could not fetch file from GitHub")
        except httpx.ConnectError:
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
                dl_resp = await client.get(download_url, timeout=15)
                dl_resp.raise_for_status()
                content = dl_resp.text
            except Exception:
                return _err("Could not download file content")

    filename = path.rsplit("/", 1)[-1]
    return {"code": content, "filename": filename}
