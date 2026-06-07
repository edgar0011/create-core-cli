import { readFile, writeFile } from 'node:fs/promises'

import * as p from '@clack/prompts'
import { defineCommand } from 'citty'
import { downloadTemplate } from 'giget'
import pc from 'picocolors'
import { x } from 'tinyexec'

const REPO = process.env.CREATE_CORE_CLI_TEMPLATE_REPO ?? 'github:edgar0011/create-core-cli'

const INSTALLERS = ['npm', 'pnpm', 'yarn', 'bun'] as const
type Installer = (typeof INSTALLERS)[number]

const FOLDER_NAME_RE = /^[a-z0-9][a-z0-9._-]*$/
const FOLDER_NAME_HELP =
  'lowercase letters, digits, dot, hyphen or underscore (must start with letter/digit)'

const validateFolderName = (v: string): string | undefined =>
  FOLDER_NAME_RE.test(v) ? undefined : FOLDER_NAME_HELP

const isInstaller = (v: string | undefined): v is Installer =>
  v !== undefined && (INSTALLERS as ReadonlyArray<string>).includes(v)

export const command = defineCommand({
  meta: {
    name: 'create-core-cli',
    version: '0.0.1',
    description:
      'Scaffold a new npx-style create-* package by cloning create-core-cli into a folder you can rename and customize.',
  },
  args: {
    folder: {
      type: 'positional',
      required: false,
      description: 'Target folder (also used as the new scaffolder name, e.g. "create-my-tool")',
    },
    installer: {
      type: 'string',
      description: `Package installer: ${INSTALLERS.join(' | ')}`,
    },
    install: {
      type: 'boolean',
      default: true,
      description: 'Run the installer after scaffolding (use --no-install to skip)',
    },
    git: {
      type: 'boolean',
      default: true,
      description: 'Initialize a git repo (use --no-git to skip)',
    },
  },
  async run({ args }) {
    p.intro(pc.bold('create-core-cli'))

    const folder =
      args.folder ??
      (await ask(
        p.text({
          message: 'Project folder (also the CLI name)',
          defaultValue: 'my-cli',
          validate: validateFolderName,
        }),
      ))

    const folderError = validateFolderName(folder)
    if (folderError !== undefined) {
      throw new Error(`Invalid folder name "${folder}". ${folderError}`)
    }

    let installer: Installer = 'npm'
    if (args.installer !== undefined) {
      if (!isInstaller(args.installer)) {
        throw new Error(
          `Unknown installer "${args.installer}". Expected one of: ${INSTALLERS.join(', ')}`,
        )
      }
      installer = args.installer
    } else if (args.install) {
      installer = await ask(
        p.select({
          message: 'Package installer',
          options: INSTALLERS.map((v) => ({ value: v, label: v })),
          initialValue: 'npm',
        }),
      )
    }

    const cloning = p.spinner()
    cloning.start(`Cloning ${REPO}`)
    await downloadTemplate(REPO, { dir: folder, force: false })
    cloning.stop('Template cloned')

    const pkgPath = `${folder}/package.json`
    const raw = await readFile(pkgPath, 'utf8')
    const pkg = JSON.parse(raw) as {
      name?: string
      version?: string
      bin?: Record<string, string>
      description?: string
      repository?: unknown
    }
    pkg.name = folder
    pkg.version = '0.0.1'
    pkg.bin = { [folder]: './dist/cli.mjs' }
    delete pkg.repository
    await writeFile(pkgPath, `${JSON.stringify(pkg, null, 2)}\n`, 'utf8')

    if (args.git) {
      try {
        await x('git', ['init', '--quiet'], { nodeOptions: { cwd: folder } })
      } catch {
        // git not installed — skip silently
      }
    }

    if (args.install) {
      const installing = p.spinner()
      installing.start(`Running ${installer} install`)
      await x(installer, ['install'], { nodeOptions: { cwd: folder, stdio: 'inherit' } })
      installing.stop('Dependencies installed')
    } else {
      p.note(`Run \`${installer} install\` inside ${folder} when ready.`)
    }

    p.outro(`${pc.bold(folder)} is ready — ${pc.dim(`cd ${folder} && ${installer} run dev`)}`)
  },
})

const ask = async <T>(promise: Promise<T | symbol>): Promise<T> => {
  const result = await promise
  if (p.isCancel(result)) {
    p.cancel('Cancelled')
    process.exit(0)
  }
  return result as T
}
