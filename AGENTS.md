<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# PathForge — Workspace Agent Guidelines & Architectural Rules

Welcome to **PathForge**, an open-source contributor graph intelligence platform backed by CognoDB Cloud (managed openCypher graph database) and built with Next.js 16 App Router, TypeScript, and Tailwind CSS.

---

## 1. Non-Negotiable Database & Security Rules

1. **100% Parameterized Cypher Queries**:
   - Every Cypher query MUST use `$paramName` placeholders via the official `neo4j-driver`.
   - **Zero String Concatenation**: Never construct Cypher queries using template literals (`${variable}`) or string concatenation.
2. **CognoDB Free-Tier Connection Limits**:
   - Connection pooling MUST be managed via the singleton driver in `src/lib/db.ts` (`maxConnectionPoolSize: 50`).
   - Always close Neo4j sessions in a `finally` block: `const session = driver.session(); try { ... } finally { await session.close(); }`.
3. **Idempotent Graph Ingestion**:
   - Batch writes in `seed/ingest.ts` MUST use openCypher `UNWIND $batch AS item` patterns for high performance.
   - MERGE MUST only target constrained key properties (`Person.login`, `Repository.fullName`).

---

## 2. Vercel React & Next.js Performance Rules

1. **Dynamic Heavy Component Imports**:
   - Browser-only canvas libraries (e.g. `react-force-graph-2d`) MUST be imported dynamically using `next/dynamic` with `ssr: false` and a lightweight loading skeleton.
2. **Rerender & Transient State Optimization**:
   - Use `useRef` for transient values like input debounce timers (`debounceRef.current`) to avoid unnecessary re-renders.
   - Use safe ternary operators (`condition ? <A /> : null`) for conditional JSX rendering instead of logical `&&`.
3. **API Response Telemetry**:
   - All REST API routes under `/api/*` MUST include `X-Query-Time-Ms` execution time headers to track sub-millisecond graph query performance.

---

## 3. Bespoke Design System & UI/UX Standards

1. **Cyber Void Dark Aesthetic**:
   - Backgrounds: `#04050a` Deep Void Dark with animated grid mesh overlay (`.bg-mesh-grid`) and glowing radial ambient orbs.
   - Glassmorphism Cards: `.glass-card-premium` with multi-layer backdrop blur (`backdrop-filter: blur(24px)`) and 1px specular borders.
2. **Zero Raw Emojis**:
   - Never use raw Unicode emojis (e.g., `⭐`, `🔗`, `🤝`). Always use vector-sharp, accessible SVG icons.
3. **Responsive Viewport Safety**:
   - Enforce `overflow-x: hidden` on `html` and `body`.
   - All cards and titles MUST use `break-all` or `truncate` to prevent text overflowing on mobile viewports (320px+).
   - Interactive touch targets MUST satisfy the 44px × 44px minimum sizing rule.

---

## 4. Repository & Version Control Policy

1. **Tracked Files**:
   - Only production source code (`src/`, `seed/`, `public/`), `package.json`, `tsconfig.json`, `next.config.ts`, `AGENTS.md`, and `README.md` are tracked in git.
2. **Ignored Files**:
   - `.agents/`, `docs/`, `PROGRESS.md`, `skills-lock.json`, `.env.local`, `.next/`, and `node_modules/` MUST remain in `.gitignore`. Do not commit agent scratch files or internal docs.

---

## 5. Verification Protocol

- Before declaring any task or feature complete, always execute `npm run build` to verify TypeScript compilation and static page generation.
