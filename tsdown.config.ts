import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['src/cli.ts'],
  format: ['esm'],
  dts: false,
  clean: true,
  target: 'node24',
  platform: 'node',
  sourcemap: true,
  shims: true,
})
