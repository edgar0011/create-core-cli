# create-core-cli

`npx create-core-cli create-my-tool` — scaffold a **new `create-*` scaffolder package** by cloning [`github:edgar0011/create-core-cli`](https://github.com/edgar0011/create-core-cli) into a fresh repo you can rename and customize.

> See [PRD.md](./PRD.md) for the full picture — library decisions with rationale, structure, quality bar.

## What this is for

You use this when you want to **publish your own `npx create-X`** package — for example, you've made a CLI library and want users to scaffold it via `npm create my-tool`. Run `create-core-cli` to get the scaffolder skeleton, then edit the cloned `REPO` constant to point at whatever template you want your scaffolder to fetch.

**You do not need this to use [`core-cli`](https://github.com/edgar0011/core-cli) as a CLI template.** For that, clone `core-cli` directly with `giget`:

```sh
npx giget@latest github:edgar0011/core-cli my-tool
cd my-tool && npm install && npm run check
```

## Use

```sh
npx create-core-cli create-my-tool
# or
npm create core-cli create-my-tool
```

Non-interactive:

```sh
npx create-core-cli create-my-tool \
  --installer npm \
  --no-install --no-git
```

## What it does

1. Prompts for a target folder (also used as the new scaffolder's package name — convention is `create-X`).
2. Prompts for an installer (`npm` / `pnpm` / `yarn` / `bun`).
3. Fetches the latest [`github:edgar0011/create-core-cli`](https://github.com/edgar0011/create-core-cli) tarball via [`giget`](https://github.com/unjs/giget).
4. Rewrites the new project's `package.json` — sets `name`, resets `version` to `0.0.1`, rebinds the `bin` entry, removes the upstream `repository` field.
5. `git init` (unless `--no-git`).
6. Runs `<installer> install` (unless `--no-install`).

After scaffolding, **edit `src/command.ts` in the new project**:
- Change the `REPO` constant to your own template repo URL.
- Update the meta `description`.
- Build, test, publish.

## Use a fork as the source

```sh
CREATE_CORE_CLI_TEMPLATE_REPO=github:youruser/your-fork npx create-core-cli create-my-tool
```

Use this while iterating on a fork before merging upstream.

## Stack

| Concern | Library |
| --- | --- |
| Args | [`citty`](https://github.com/unjs/citty) |
| Prompts | [`@clack/prompts`](https://github.com/bombshell-dev/clack) |
| Colors | [`picocolors`](https://github.com/alexeyraspopov/picocolors) |
| Template fetch | [`giget`](https://github.com/unjs/giget) |
| Exec | [`tinyexec`](https://github.com/tinylibs/tinyexec) |

Same direct-imports pattern as [`core-cli`](https://github.com/edgar0011/core-cli) — no SDK. Full rationale in [PRD §5](./PRD.md#5-library-decisions).

## Develop

```sh
nvm use            # Node 24
npm install
npm run check      # lint + typecheck + test + build
node dist/cli.mjs create-test --no-install --no-git
```

## License

MIT
