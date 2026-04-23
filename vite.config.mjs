import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
import { resolve } from 'path'

export default defineConfig({
    plugins: [vue(), cssInjectedByJsPlugin()],
    build: {
        lib: {
            entry: resolve(__dirname, 'ui/index.js'),
            // CRÍTICO: debe coincidir con el tipo del nodo en registerType()
            // y con la clave en node-red-dashboard-2.widgets de package.json
            name: 'state-inspector',
            fileName: () => 'state-inspector.umd.js',
            formats: ['umd']
        },
        // CRÍTICO: Dashboard 2.0 sirve UMDs desde resources/, NO desde ui/ ni dist/
        outDir: 'resources',
        rollupOptions: {
            // Vue se inyecta por el dashboard, no bundlear
            external: ['vue'],
            output: {
                globals: { vue: 'Vue' },
                exports: 'named'
            }
        },
        // CSS se inyecta en el JS para evitar problemas de carga
        cssCodeSplit: false
    }
})
