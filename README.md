# FlowTensor

FlowTensor visualizes data flow in Python ML/data-science code. Paste a snippet, import a public GitHub file, and inspect the pipeline as an interactive graph. The app focuses on PyTorch, Pandas, and NumPy code.

## What it does

- Parses Python code with AST analysis
- Renders the result as a node/edge graph
- Supports drill-down views for higher-level and lower-level structure
- Lets you import Python files from public GitHub repositories
- Can generate node-level AI explanations with Groq when a key is configured

## Repository structure

- `artifacts/flowtensor/` — React + Vite frontend
- `artifacts/api-server/` — API/server code and the Python AST parser
- `lib/api-spec/` — OpenAPI contract
- `lib/api-client-react/` — generated React Query hooks
- `lib/api-zod/` — generated Zod schemas
- `lib/db/` — shared database package
- `scripts/` — workspace scripts and utilities

## Frontend

The main UI lives in `artifacts/flowtensor/` and includes:

- a landing page
- a CodeMirror editor
- a GitHub import panel
- an examples panel
- a help/FAQ panel
- a settings modal for Groq API key management
- a graph canvas built with React Flow
- an AI panel for node explanations

## Backend and API

The API contract is defined in `lib/api-spec/openapi.yaml`, and the generated client packages consume it from the frontend.

Main API routes:

- `GET /api/healthz`
- `POST /api/parse`
- `POST /api/fetch-repo`
- `POST /api/fetch-file`
- `POST /api/explain-node`
- `POST /api/set-groq-key`
- `GET /api/groq-key-status`

## Security model

- User code is parsed only; it is not executed.
- Groq keys are stored in backend memory only for the current session.
- GitHub tokens are optional and only used to raise rate limits for browsing public repositories.

## Prerequisites

- Node.js 24+
- pnpm
- Python 3 for the parser/backend artifacts

## Getting started

```bash
corepack enable pnpm
pnpm install
```

## Common commands

```bash
pnpm run typecheck
pnpm run build
pnpm --filter @workspace/flowtensor dev
PORT=8080 pnpm --filter @workspace/api-server dev
pnpm --filter @workspace/api-spec run codegen
```

## Notes

- The workspace is a pnpm monorepo.
- The root `build` and `typecheck` scripts run across the workspace.
- The default app experience is the FlowTensor frontend.
