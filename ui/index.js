// Entry point para Vite build UMD
// Dashboard 2.0 busca window['ui-state-inspector'] — el nombre del export default
// debe coincidir con el component declarado en package.json: "UIStateInspector"
export { default as UIStateInspector } from './components/UIStateInspector.vue'
