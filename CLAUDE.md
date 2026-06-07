# CLAUDE.md — guidance for Claude Code working in this repo

## Read first

- **[PRD.md](./PRD.md)** — product, library choices with rationale, the scaffolder flow, quality bar, non-goals. Source of truth. If you would contradict it, propose updating PRD.md first.
- **[TODOS.md](./TODOS.md)** — what's next.
- **[`core-cli/CLAUDE.md`](../core-cli/CLAUDE.md)** — companion repo's guidance. Most conventions there apply here too (this repo is structurally a copy of that one).

## What this repo is

A **standalone Node 24+ ESM scaffolder** for bootstrapping new `npx create-*` packages.

It clones **itself** (`github:edgar0011/create-core-cli`) — it does **not** clone [`core-cli`](../core-cli). The audience is people building `create-*` packages, not people scaffolding a new CLI library. See [PRD §2](./PRD.md#2-what-this-is-not-for).

The whole product is ~120 lines in `src/command.ts`:

1. Prompts (folder, installer)
2. `giget` fetches `github:edgar0011/create-core-cli`
3. Rewrite the fetched `package.json` (name, version, bin key, drop upstream repository)
4. Optional `git init` + `<installer> install`

Direct deps:
- `citty` — args + auto `--help`
- `@clack/prompts` — prompts + spinner + intro/outro
- `picocolors` — terminal colors
- `giget` — template fetch (tarball, no SSH, no `.git`)
- `tinyexec` — `<installer> install` and `git init`

## Why "scaffolder for scaffolders" and not "scaffolder for core-cli"

The v0.1 of this repo cloned `core-cli`, mirroring the legacy `create-core-vite` pattern. The v0.2 pivot points it at itself instead.

Reason: "scaffold a new `core-cli` project" is a one-line `giget` invocation — doesn't justify a packaged tool. "Scaffold a new `create-*` scaffolder" is a less trivial bootstrap (you want a working bin, prompts, exec, JSON-edit patterns) that warrants a packaged starting point.

If a user wants to scaffold a new CLI from `core-cli`, point them at `npx giget@latest github:edgar0011/core-cli my-tool` (documented in `core-cli/README.md`).

## Hard constraints

- **Node 24 LTS, ESM-only.** Same as `core-cli`.
- **TypeScript strict + `verbatimModuleSyntax`.** Internal imports use `.js` extensions.
- **No SDK.** Each file imports deps directly. PRD §5.
- **Lint, typecheck, test, build must all stay green.** Run `npm run check` before claiming done.
- **No new deps without updating PRD §5.** Every library has a "why not the alternative" entry.
- **vitest must be `^4.1.8+`** — v3.x has a critical CVE in `--ui`.
- **The template source is `process.env.CREATE_CORE_CLI_TEMPLATE_REPO ?? 'github:edgar0011/create-core-cli'`.** Don't hardcode anything else. The env override is the documented dev path. NOTE: the env var name changed in v0.2 — older docs may reference `CORE_CLI_TEMPLATE_REPO` which no longer exists.

## Scaffolder-specific conventions

- **`giget` does NOT support `file:` URIs for local paths.** Treats `file:foo` as a template-registry name → 404. Local dev testing requires (a) pushing to a fork and pointing `CREATE_CORE_CLI_TEMPLATE_REPO` at it, or (b) command-shape tests only.
- **The `package.json` rewrite uses `JSON.parse` + mutate + `JSON.stringify(..., null, 2)`.** It does NOT preserve original indent. Fine — `create-core-cli` uses 2-space indent. Keep in sync.
- **Installer choice from CLI flag bypasses the prompt.** `--installer pnpm` → no prompt fires. Same for `--no-install`.
- **`git init` failures are swallowed silently.** If git isn't installed, the rest of the scaffold still works.
- **REPO constant is NOT auto-rewritten in the scaffolded project.** The cloned project still references `github:edgar0011/create-core-cli` as its source until the user edits `src/command.ts` manually. This is intentional — see PRD §10.

## Library choices — quick reference

| Concern | Library | Don't reach for |
| --- | --- | --- |
| Args | `citty` | `commander`, `yargs`, `node:util.parseArgs` |
| Prompts | `@clack/prompts` | `inquirer`, `prompts`, `enquirer` |
| Colors | `picocolors` | `chalk`, `chalk-pipe`, `kleur` |
| Template fetch | `giget` | hand-rolled `git clone`, `degit` |
| Exec | `tinyexec` | `shelljs` (unmaintained), `execa`, raw `child_process` |
| Build | `tsdown` | `tsup` (deprecated) |
| Lint | `oxlint` | ESLint |
| Format | `prettier@3` | Biome (not yet) |
| Test | `vitest@4` | vitest 3.x, `node:test`, `jest` |

## Workspace commands

| Command | What it does |
| --- | --- |
| `npm install` | Install deps |
| `npm run lint` | oxlint |
| `npm run typecheck` | `tsc --noEmit` |
| `npm test` | vitest run |
| `npm run build` | tsdown |
| `npm run check` | Composite: lint + typecheck + test + build |
| `node dist/cli.mjs create-test --no-install --no-git` | Live scaffold (requires this repo pushed to GitHub) |

## Conventions

- **No comments unless the *why* is non-obvious.**
- **Validator return shape**: `string | undefined` — error when invalid, `undefined` when valid. Name them `validateX`. Compare with `!== undefined`.
- **Tests** live under `test/`. Command-shape assertions only — live giget testing requires this repo on GitHub.

## When you finish a task

1. Run `npm run check` — must pass.
2. **Run the built binary against a real argument** with `--no-install --no-git`. vitest doesn't exercise the full path.
3. Update [TODOS.md](./TODOS.md).
4. If a decision was made that's not yet in PRD.md, propose the PRD update in the same change.
