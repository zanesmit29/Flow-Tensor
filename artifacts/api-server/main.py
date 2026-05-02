import os
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
