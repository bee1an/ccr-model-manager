import { defineConfig } from 'tsdown'

export default defineConfig({
  entry: ['./src/index.ts', './src/cs.ts'],
  format: 'cjs',
  outDir: 'dist',
  dts: true,
  clean: true,
  target: 'node18',
  minify: false
})