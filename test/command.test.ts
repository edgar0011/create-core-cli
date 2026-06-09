import { describe, expect, it } from 'vitest'

import { command } from '../src/command.ts'

describe('create-core-cli command', () => {
  it('declares expected meta', () => {
    expect(command.meta).toMatchObject({
      name: 'create-core-cli',
      description: expect.stringContaining('core-cli'),
    })
  })

  it('declares folder as optional positional', () => {
    const args = command.args as { folder?: { type: string; required: boolean } }
    expect(args?.folder).toMatchObject({ type: 'positional', required: false })
  })

  it('declares installer / install / git flags', () => {
    const args = command.args as {
      installer?: { type: string }
      install?: { type: string; default: boolean }
      git?: { type: string; default: boolean }
    }
    expect(args.installer).toMatchObject({ type: 'string' })
    expect(args.install).toMatchObject({ type: 'boolean', default: true })
    expect(args.git).toMatchObject({ type: 'boolean', default: true })
  })

  it('exposes a callable run function', () => {
    expect(typeof command.run).toBe('function')
  })
})
