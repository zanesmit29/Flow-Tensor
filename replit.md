# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Contains the FlowTensor app — a web app where data scientists paste PyTorch or Pandas code and instantly see a beautiful, animated node graph visualizing the data flow.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend framework**: React + Vite (artifacts/flowtensor)
- **Backend**: Python FastAPI (artifacts/api-server/main.py)
- **Python AST parser**: artifacts/api-server/parser_ast.py
- **Graph rendering**: @xyflow/react (React Flow v12)
- **Code editor**: @uiw/react-codemirror with @codemirror/lang-python
- **Animations**: framer-motion
- **API codegen**: Orval (from OpenAPI spec)
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **Build**: esbuild (CJS bundle) for Node; uvicorn for Python

## Architecture

- `artifacts/flowtensor/` — React + Vite frontend served at `/`
- `artifacts/api-server/main.py` — FastAPI backend served at `/api`
- `artifacts/api-server/parser_ast.py` — Python AST parser (NO code execution — parse only)
- `lib/api-spec/openapi.yaml` — OpenAPI contract
- `lib/api-client-react/` — Generated React Query hooks
- `lib/api-zod/` — Generated Zod schemas

## Key API Endpoints

- `GET /api/healthz` — health check
- `POST /api/parse` — parses Python code (PyTorch/Pandas) and returns flow graph nodes + edges

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec

## Security

- AST parse only — user code is NEVER executed
- Hard security boundary in parser_ast.py

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
