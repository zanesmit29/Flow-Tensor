import os
import re
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


class FetchGistRequest(BaseModel):
    url: str


GIST_ID_RE = re.compile(
    r"^(?:https?://)?gist\.github\.com/(?:[^/\s]+/)?([0-9a-fA-F]+)/?(?:#.*)?$"
)


def _gist_error(message: str, status_code: int = 422):
    return JSONResponse(
        status_code=status_code,
        content={"error": message, "detail": None},
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


@app.post("/api/fetch-gist")
def fetch_gist(req: FetchGistRequest):
    raw_url = (req.url or "").strip()
    if not raw_url:
        return _gist_error("Invalid Gist URL")

    match = GIST_ID_RE.match(raw_url)
    if not match:
        return _gist_error("Invalid Gist URL")

    gist_id = match.group(1)
    api_url = f"https://api.github.com/gists/{gist_id}"

    try:
        request = urllib.request.Request(
            api_url,
            headers={
                "Accept": "application/vnd.github+json",
                "User-Agent": "FlowTensor",
            },
        )
        with urllib.request.urlopen(request, timeout=15) as resp:
            data = json.loads(resp.read().decode("utf-8"))
    except urllib.error.HTTPError as e:
        if e.code == 404:
            return _gist_error("Gist not found or is private")
        if e.code == 403:
            return _gist_error("GitHub rate limit reached, try again in a minute")
        return _gist_error("Could not fetch Gist from GitHub")
    except urllib.error.URLError:
        return _gist_error("Could not reach GitHub. Check your connection and try again.")
    except Exception:
        return _gist_error("Could not fetch Gist from GitHub")

    files = data.get("files") or {}
    if not isinstance(files, dict):
        return _gist_error("Unexpected response from GitHub")
    py_files = [
        (name, meta)
        for name, meta in files.items()
        if isinstance(name, str) and name.lower().endswith(".py") and isinstance(meta, dict)
    ]

    if not py_files:
        return _gist_error("No Python files found in this Gist")

    if len(py_files) == 1:
        name, meta = py_files[0]
        content = meta.get("content")
        if content is None:
            # Truncated content — fetch raw
            raw = meta.get("raw_url")
            if raw:
                try:
                    with urllib.request.urlopen(raw, timeout=15) as r:
                        content = r.read().decode("utf-8")
                except Exception:
                    return _gist_error("Could not download Gist file content")
            else:
                return _gist_error("Could not download Gist file content")
        return {"code": content, "filename": name, "files": None}

    file_list = [
        {"filename": name, "size": int(meta.get("size") or 0)}
        for name, meta in py_files
    ]
    return {"code": None, "filename": None, "files": file_list}
