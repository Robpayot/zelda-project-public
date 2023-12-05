import { defineConfig } from 'vite'
import glslify from 'rollup-plugin-glslify'
import * as path from 'path'

export default ({ mode }) => {
  return defineConfig({
    root: 'src',
    base: mode === 'development' ? '/zelda-project-public/' : './', // for Github pages, otherwise use './'
    build: {
      outDir: '../dist',
      sourcemap: true,
    },
    server: {
      host: true, // to test on other devices with IP address
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
        '@glsl': path.resolve(__dirname, './src/js/glsl'),
      },
    },
    plugins: [glslify()],
  })
}
