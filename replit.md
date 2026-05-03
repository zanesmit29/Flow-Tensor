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
- `POST /api/parse` — parses Python code (PyTorch/Pandas) and returns:
  - flat `nodes`/`edges` (legacy linear view)
  - hierarchical `blocks` (Level 1: classes, top-level functions, module main) with `children` containing per-method node graphs (Level 3). Frontend uses these for drill-down navigation.
- `POST /api/explain-node` — generates context-aware AI explanation for a node via Groq (`llama3-8b-8192`). Returns `{source: "ai" | "static", what?, impact?, tip?, risk?, cached}`. Falls back silently to `static` when no key is configured or any error occurs. Cached in-memory by `(operation, parameters, shape_before, level)`.
- `POST /api/set-groq-key` / `GET /api/groq-key-status` — manage user-supplied Groq key for the current backend session (stored in memory only, never persisted). Priority: user key → `GROQ_API_KEY` env var → none.

## AI Explainer (frontend)

- `src/contexts/AISettingsContext.tsx` — provides `hasKey`, `source`, `explanationCount`, `saveKey`, `refreshStatus`.
- `src/components/SettingsModal.tsx` — gear-icon modal with masked key input, debounced live validation (`https://api.groq.com/openai/v1/models`), and session counter.
- `src/components/AIPanel.tsx` — slide-in right panel (340px) opened on Level 3 node click; shows WHAT/IMPACT/TIP/RISK sections, three audience levels (beginner/intermediate/pro), "Explain differently" reload, no-key CTA fallback.
- `CustomNode.tsx` shows a hover-only ✦ badge, muted when no key is configured.

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec

## Security

- AST parse only — user code is NEVER executed
- Hard security boundary in parser_ast.py

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
