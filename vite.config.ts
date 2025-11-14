import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Library build mode
  if (mode === 'lib') {
    return {
      plugins: [vue()],
      build: {
        lib: {
          entry: resolve(__dirname, 'src/index.ts'),
          name: 'VueExcelPreview',
          fileName: (format) => `excel-preview.${format}.js`,
          formats: ['es', 'umd']
        },
        rollupOptions: {
          external: ['vue', 'exceljs', 'papaparse'],
          output: {
            globals: {
              vue: 'Vue',
              exceljs: 'ExcelJS',
              papaparse: 'Papa'
            },
            exports: 'named',
            assetFileNames: (assetInfo) => {
              if (assetInfo.name === 'style.css') {
                return 'style.css'
              }
              return assetInfo.name || ''
            }
          }
        },
        cssCodeSplit: false,
        sourcemap: true,
        emptyOutDir: true
      },
      resolve: {
        alias: {
          '@': resolve(__dirname, 'src')
        }
      }
    }
  }

  // Development mode
  return {
    plugins: [vue()],
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src')
      }
    },
    server: {
      port: 3000
    }
  }
})
