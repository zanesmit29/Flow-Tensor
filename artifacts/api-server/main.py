import os
import re
import base64
import urllib.parse
import urllib.request
import urllib.error
import json
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from parser_ast import parse_python_code, ParseError

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


class FetchFileRequest(BaseModel):
    owner: str
    repo: str
    path: str


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


def _gh_get(url: str):
    """GET a GitHub API URL. Returns (status, json_or_text)."""
    request = urllib.request.Request(
        url,
        headers={
            "Accept": "application/vnd.github+json",
            "User-Agent": "FlowTensor",
        },
    )
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


def _walk_repo(owner: str, repo: str, path: str, depth: int, out: list) -> None:
    if depth > MAX_DEPTH:
        return
    encoded = urllib.parse.quote(path)
    contents_url = f"https://api.github.com/repos/{owner}/{repo}/contents/{encoded}"
    items = _gh_get(contents_url)
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
            _walk_repo(owner, repo, item_path, depth + 1, out)
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

    try:
        meta = _gh_get(f"https://api.github.com/repos/{owner}/{repo}")
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
        _walk_repo(owner, repo, "", 0, files)
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
        data = _gh_get(api_url)
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
