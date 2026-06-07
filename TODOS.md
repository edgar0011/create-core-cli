# TODOS

See [PRD.md](./PRD.md) for the why behind each item.

## Done

- [x] Standalone repo built — `src/cli.ts` + `src/command.ts` + tests + configs
- [x] Direct deps wired: `citty` + `@clack/prompts` + `picocolors` + `giget` + `tinyexec`
- [x] `npm run check` green — 0 lint issues, typecheck clean, 4/4 tests, build OK
- [x] `npm audit` — 0 vulnerabilities
- [x] **v0.2 pivot — scaffolder clones itself, not `core-cli`.** Audience is now people bootstrapping `create-*` packages. The "scaffold a new CLI from core-cli" use case is served by `npx giget@latest github:edgar0011/core-cli my-tool`, documented in `core-cli/README.md`.
- [x] Env override renamed `CORE_CLI_TEMPLATE_REPO` → `CREATE_CORE_CLI_TEMPLATE_REPO`.

## Next — unblocked once this repo is on GitHub

- [ ] **Live end-to-end smoke** — push to `github:edgar0011/create-core-cli`, then run `node dist/cli.mjs create-test --no-install --no-git` against a tempdir. Verify clone + JSON rewrite produce a runnable scaffolder.
- [ ] **Vitest integration test** with the real GitHub repo, gated on `RUN_NETWORK_TESTS=true`.

## Next — publish

- [ ] **Push to `github:edgar0011/create-core-cli`** — first push populates the repo.
- [ ] **GitHub Actions CI** — `.github/workflows/ci.yml`: install + lint + typecheck + test + build on every push.
- [ ] **Release workflow** — tag-driven publish to npm with `--provenance`.
- [ ] **`npm publish`** — enables `npm create core-cli create-my-tool` / `npx create-core-cli create-my-tool`.

## Polish

- [ ] **Outro checklist** — after scaffolding, print a `prompts.note(...)` reminding the user to edit `src/command.ts`'s `REPO` constant + meta `description` + README. See PRD §8.
- [ ] **`prepare` script in scaffolded projects' package.json** — so `npx github:user/repo` works without a prior `npm run build`. The scaffolded `package.json` currently doesn't include this; needs a tiny addition to the rewrite step.

## Investigated and rejected

- **`file:` URI support in giget** — not supported. giget treats `file:foo` as a template-registry name and fetches `https://raw.githubusercontent.com/unjs/giget/main/templates/foo.json` (404). Dev-time local testing requires pointing `CREATE_CORE_CLI_TEMPLATE_REPO` at a GitHub fork.
- **Auto-rewriting the cloned project's `REPO` constant** to a user-provided URL. Would couple the scaffolder to AST manipulation of TS source. The user editing one line manually after scaffolding is acceptable. PRD §10.

## Maybe / parked

- **Description / author / email prompts** — would substitute into the scaffolded `package.json`. The current scaffolder doesn't — the user edits those manually after scaffold (one minute of work, removes the placeholder substitution layer entirely). Reconsider if user feedback says this is friction.
- **`git config` defaulting** — would auto-fill author / email if the above gets added.
