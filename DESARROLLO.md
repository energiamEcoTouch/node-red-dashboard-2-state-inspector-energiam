node-red-dashboard-2-state-inspector-energiam
Informe Técnico de Desarrollo — v0.2.0
EnergIAM EcoTouch · Node-RED Dashboard 2.0 · IIoT
Abril 2026

================================================================================
1. DIFERENCIA CRÍTICA: v0.1.0 vs v0.2.0
================================================================================

La versión v0.1.0 (estado-inspector-informe.docx) documentaba un nodo funcional
como flujo Node-RED estándar, pero NO era un widget nativo de Dashboard 2.0.
Usaba node.send() para enviar datos al dashboard, que es el mecanismo genérico
de Node-RED, no el de Dashboard 2.0.

La v0.2.0 reescribe el nodo como widget nativo de Dashboard 2.0, siguiendo
exactamente el mismo patrón que ui-insight (node-red-dashboard-2-insight-energiam).

================================================================================
2. LECCIONES APRENDIDAS DE ui-insight APLICADAS A state-inspector
================================================================================

2.1 Nombre del paquete
─────────────────────
El prefijo "node-red-dashboard-2-" es OBLIGATORIO.
Dashboard 2.0 detecta widgets de terceros via getThirdPartyWidgets() que busca
paquetes cuyo nombre contiene este prefijo.

  INCORRECTO: node-red-contrib-state-inspector-energiam
  CORRECTO:   node-red-dashboard-2-state-inspector-energiam

2.2 Declaración del widget en package.json
──────────────────────────────────────────
El package.json DEBE tener la clave "node-red-dashboard-2" con la estructura:

  "node-red-dashboard-2": {
    "widgets": {
      "ui-state-inspector": {           ← widgetName
        "output": "ui-state-inspector.umd.js",
        "component": "UIStateInspector" ← nombre del export del componente Vue
      }
    }
  }

2.3 Configuración de Vite — dos parámetros CRÍTICOS
────────────────────────────────────────────────────
  name: 'ui-state-inspector'   ← DEBE coincidir con la clave en widgets{}
                                  y con window['ui-state-inspector'] que busca D2
  outDir: 'resources'          ← DEBE ser 'resources/', NO 'ui/' ni 'dist/'

2.4 Entry point del UMD
───────────────────────
  ui/index.js:
    export { default as UIStateInspector } from './components/UIStateInspector.vue'

  El nombre del export (UIStateInspector) debe coincidir con "component" en package.json.

2.5 Comunicación backend → widget
──────────────────────────────────
  INCORRECTO (v0.1.0): node.send({ payload, topic: 'state-inspector/data' })
  CORRECTO (v0.2.0):   dashboard.emit() via el objeto devuelto por addWidget()

  El widget Vue escucha en el canal 'ui-state-inspector:<nodeId>' via Socket.IO.
  El backend emite en ese mismo canal.

2.6 Registro del widget con addWidget()
────────────────────────────────────────
  const evts = {
    onAction: true,     ← habilita que acciones del widget lleguen al backend
    onInput: function (msg, send, done) {
      procesarMensaje(msg)
      done()
    }
  }

  node._dashboard = dashboard.addWidget({
    node,
    widgetConfig: config,
    widgetName: 'ui-state-inspector',
    evts,
    getState: function () {
      return buildPayload(getEstado())  ← lo que se envía al reconectar el dashboard
    }
  })

2.7 Persistencia de estado al reconectar
─────────────────────────────────────────
  El parámetro getState() en addWidget() es lo que Dashboard 2.0 envía al widget
  cuando el usuario recarga la página o el dashboard se reconecta.
  Sin esto, la tabla aparece vacía al reconectar aunque el nodo tenga datos.

================================================================================
3. ESTRUCTURA DE ARCHIVOS v0.2.0
================================================================================

  package.json                     ← metadata + declaración node-red-dashboard-2
  vite.config.js                   ← build UMD (name + outDir CRÍTICOS)
  nodes/
    state-inspector.js             ← backend: addWidget, procesarMensaje, emit
    state-inspector.html           ← panel editor Node-RED (sin cambios estructurales)
    icons/
      energiam.png                 ← ícono verde en la paleta
  ui/
    index.js                       ← entry point Vite: export UIStateInspector
    components/
      UIStateInspector.vue         ← componente Vue 3 completo con <style scoped>
  resources/
    ui-state-inspector.umd.js      ← generado por npm run build (incluir en repo y npm)
  examples/
    flows_state_inspector_test.json ← flujo de prueba con mock estático

================================================================================
4. PROCESO DE PUBLICACIÓN (orden correcto)
================================================================================

  1. npm run build               → genera resources/ui-state-inspector.umd.js
  2. Actualizar version en package.json
  3. git add -A && git commit -m "feat: v0.x.x"
  4. git push
  5. npm publish

  El UMD compilado DEBE incluirse en el repositorio y en el paquete npm.
  Sin el UMD compilado, el paquete no funciona al instalarlo.

================================================================================
5. PRÓXIMOS PASOS
================================================================================

  □ Registrar en flows.nodered.org (autenticando con GitHub)
  □ Probar addWidget() con la versión exacta de @flowfuse/node-red-dashboard instalada
  □ Ajustar el canal de socket si la API de addWidget cambió en versiones recientes
  □ Agregar tests unitarios para procesarMensaje()

  Funcionalidades planificadas para v0.3.0:
  □ Exportar tabla como CSV desde el dashboard
  □ Modo diff: resaltar celdas que difieren entre columnas
  □ Timestamp por columna visible en el header
  □ Filtro de filas por nombre de variable
  □ Drag & drop para reordenar columnas

================================================================================
EnergIAM EcoTouch · Confidencial — uso interno
================================================================================
