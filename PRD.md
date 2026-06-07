# create-core-cli — Product Requirements Document

> Status: **v0.2 (self-scaffolding pivot — clones itself, not core-cli)** · Owner: Martin Weiser · Last updated: 2026-06-06

## 1. Goal

A tiny `npm create core-cli` tool that helps you **bootstrap a new `npx create-*` scaffolder package** by cloning the [`create-core-cli`](https://github.com/edgar0011/create-core-cli) repo itself into a new folder you rename and edit.

It's a scaffolder for scaffolders. Niche audience, but a coherent one: anyone who wants to ship their own `npx create-my-tool` for their own CLI library.

The whole product is ~120 lines in `src/command.ts`.

## 2. What this is NOT for

**It does not scaffold a new [`core-cli`](https://github.com/edgar0011/core-cli) project.** To use `core-cli` as a CLI template, clone it directly:

```sh
npx giget@latest github:edgar0011/core-cli my-tool
```

That's a one-liner — no scaffolder needed. Adding a third tool ("a packaged scaffolder for cloning one repo") would have been pointless ceremony.

`create-core-cli` exists for a different audience: people building their *own* `create-*` packages who want a battle-tested starting point.

## 3. Why this design

### Previous iteration

Earlier versions (v0.1) had `create-core-cli` cloning `github:edgar0011/core-cli`, mirroring the legacy `create-core-vite` / `core-vite` pattern. That worked but conflated two distinct user journeys:

| Audience | Need | Right tool |
| --- | --- | --- |
| Person making a new CLI | "Give me a working CLI skeleton" | `giget` against `core-cli`, ~1 minute |
| Person making a new `create-*` scaffolder | "Give me a working scaffolder skeleton" | A `create-*` package they can clone-and-edit |

Folding both into a single `create-core-cli` made the tool less honest about who it served. The v0.2 pivot picks the *second* audience and serves them cleanly. The first audience is handled by a documented `giget` one-liner.

### Architecture (v0.2)

| Repo | Role | Bin behavior |
| --- | --- | --- |
| [`core-cli`](../core-cli) | Working Node 24+ ESM CLI library example | Greets the user (demo). Edit `src/command.ts` to make it your own CLI. |
| **`create-core-cli`** (this repo) | Working `npx create-*` scaffolder example | Clones itself into a new folder. Edit `src/command.ts` REPO constant to point at your own template. |

Both repos are **standalone, self-contained, and serve as templates for their respective shapes**. Neither depends on the other. The relationship is documented (this README + [`core-cli/README.md`](../core-cli/README.md)) but not coded.

## 4. Runtime baseline

**Node 24 LTS.** ESM-only. Identical to [`core-cli`'s baseline](../core-cli/PRD.md#4-runtime-baseline).

## 5. Library decisions

Identical picks to `core-cli`'s, plus two extras for scaffolding:

| Concern | Library | Why |
| --- | --- | --- |
| Args | `citty` | Same as `core-cli` — see [its PRD §5.1](../core-cli/PRD.md#51-argument-parsing--citty) |
| Prompts | `@clack/prompts` | Same — [§5.2](../core-cli/PRD.md#52-prompts--clackprompts) |
| Colors | `picocolors` | Same — [§5.3](../core-cli/PRD.md#53-colors--picocolors) |
| Build | `tsdown` | Same — [§5.4](../core-cli/PRD.md#54-build--tsdown) |
| Test | `vitest@4` | Same. v4 required for [CVE](https://github.com/advisories/GHSA-5xrq-8626-4rwp). |
| Lint / Format | `oxlint` + `prettier@3` | Same |
| **Template fetch** | **`giget`** | Handles `github:` shortcuts, caching, tarball-only (no SSH/`.git`). UnJS family, ESM-first. |
| **Exec** | **`tinyexec`** | Tiny, typed `child_process` wrapper. Used for `<installer> install` + `git init`. |

`giget` and `tinyexec` are scaffolder-only — `core-cli` itself doesn't ship them. The duplication-of-direct-deps between the two repos is deliberate (PRD §5 of `core-cli` rejects a shared SDK).

## 6. Project structure

```
create-core-cli/
├── src/
│   ├── cli.ts                # 5 lines: shebang + runMain(command)
│   └── command.ts            # ~120 lines: prompts + giget + JSON rewrite + install
├── test/
│   └── command.test.ts       # command-shape assertions
├── package.json              # bin: { "create-core-cli": "./dist/cli.mjs" }
├── tsconfig.json             # identical to core-cli's
├── tsdown.config.ts          # identical to core-cli's
├── vitest.config.ts
├── .gitignore .nvmrc .npmrc
├── .oxlintrc.json .prettierrc.json .prettierignore
├── README.md
├── PRD.md                    # this file
├── CLAUDE.md
└── TODOS.md
```

Identical layout to `core-cli`. Differences from `core-cli`:

- `src/command.ts` content (scaffolding logic vs greeter)
- Two extra deps (`giget`, `tinyexec`)
- `bin` name (`create-core-cli` vs `core-cli`)

## 7. The scaffolder flow

```
1. Intro
2. Prompt: target folder name (default "my-cli", validated against /^[a-z0-9][a-z0-9._-]*$/)
   Convention: name your new scaffolder "create-X"
3. Prompt: package installer — npm | pnpm | yarn | bun (default "npm")
4. giget downloadTemplate(REPO, folder) where REPO = github:edgar0011/create-core-cli
5. Read folder/package.json, mutate: name = folder, version = "0.0.1",
   bin = { [folder]: "./dist/cli.mjs" }, delete repository field
6. git init --quiet (unless --no-git; failures swallowed if git isn't installed)
7. <installer> install with stdio: inherit (unless --no-install)
8. Outro with cd hint
```

Non-interactive, all prompts have CLI-flag overrides:

```sh
npx create-core-cli create-my-tool --installer pnpm --no-install --no-git
```

Custom template source via env override:

```sh
CREATE_CORE_CLI_TEMPLATE_REPO=github:youruser/your-fork npx create-core-cli create-my-tool
```

This lets you test forks before merging upstream. `giget` does **not** support `file:` URIs for local paths — see [TODOS.md](./TODOS.md).

## 8. Post-scaffold checklist (for the user who just ran it)

After `npx create-core-cli create-my-tool`, the user should:

1. **`cd create-my-tool`**.
2. **Edit `src/command.ts`** — change the `REPO` constant from `github:edgar0011/create-core-cli` to whatever template the new scaffolder should fetch.
3. **Edit the meta `description`** to describe the new scaffolder's purpose.
4. **Update README, PRD, CLAUDE** for the new tool.
5. **`npm run check`** — verify the rename didn't break anything.
6. **Push to GitHub**, **`npm publish`**.

This checklist could become a `prompts.note(...)` in the outro of `create-core-cli` — see [TODOS.md](./TODOS.md).

## 9. Quality gates (all green at v0.2)

| Gate | Status |
| --- | --- |
| `npm run lint` (oxlint) | ✅ clean |
| `npm run typecheck` | ✅ clean |
| `npm test` (vitest, 4 tests) | ✅ |
| `npm run build` (tsdown) | ✅ |
| `npm audit` | ✅ 0 vulnerabilities |
| Live end-to-end via giget against the real GitHub repo | ⏳ **blocked on `create-core-cli` being pushed.** |

Composite: `npm run check`.

## 10. Non-goals

- **Scaffolding a new `core-cli` CLI.** That's a `giget` one-liner; see §2.
- **Multiple template variants.** This scaffolder fetches one repo. Forks override via `CREATE_CORE_CLI_TEMPLATE_REPO`. We're not growing a variant matrix.
- **Workspace / monorepo scaffolding.** Single-package output only.
- **Template substitution machinery (`{{var}}` engine).** The only mutation is the `package.json` rewrite in step 5 of §7.
- **Auto-updating the cloned REPO constant** to a user-provided URL. The user edits `src/command.ts` after scaffolding. We don't try to be clever.

## 11. References

- Companion: [`core-cli`](../core-cli) — the working CLI library template (different audience)
- [TypeScript Tooling Landscape — June 2026](../../education/IT/ts-tooling-landscape-2026.html) — basis for library picks
- Legacy CLIs whose patterns this replaces: [`create-core-app`](../create-core-app), [`create-core-vite`](../create-core-vite)
- [TODOS.md](./TODOS.md)
- [CLAUDE.md](./CLAUDE.md)
