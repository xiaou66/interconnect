import { defineConfig } from 'vite'
import dts from 'vite-plugin-dts'

export default defineConfig({
  build: {
    lib: {
      entry: 'src/index.ts',
      formats: ['es', 'cjs'],
      fileName: (format) => `index.${format}.js`,
    },
    sourcemap: true,
    outDir: 'dist',
  },
  plugins: [
    dts({
      insertTypesEntry: true,
    }),
  ],
})
