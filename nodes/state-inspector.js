/**
 * node-red-dashboard-2-state-inspector-energiam
 * Backend Node-RED — widget nativo de Dashboard 2.0
 *
 * ARQUITECTURA:
 * - group.register(node, config, evts) registra el widget
 * - onInput(msg, send) — firma sin done; ui_base llama done() solo
 * - ui_base emite 'msg-input:<id>' automáticamente DESPUÉS de onInput
 *   → NO llamar emit manual dentro de onInput; solo transformar msg.payload
 * - Para acciones del widget (reset desde botón Vue) sí emitir manualmente
 */

module.exports = function (RED) {

    function StateInspectorNode (config) {
        RED.nodes.createNode(this, config)
        const node = this

        const group = RED.nodes.getNode(config.group)

        node.maxColumnas = parseInt(config.maxColumnas) || 10
        node.ordenFilas  = config.ordenFilas            || 'arrival'
        node.colorTrue   = config.colorTrue             || '#3fb950'
        node.colorFalse  = config.colorFalse            || '#f85149'
        node.colorNum    = config.colorNum              || '#58a6ff'
        node.colorStr    = config.colorStr              || '#ffa657'
        node.colorNull   = config.colorNull             || '#484f58'

        const ctx = node.context()

        function getEstado () {
            return ctx.get('estado') || { columnas: [], filas: [] }
        }

        function setEstado (estado) {
            ctx.set('estado', estado)
        }

        function buildPayload (estado) {
            return {
                columnas: estado.columnas,
                filas:    estado.filas,
                colores: {
                    true:  node.colorTrue,
                    false: node.colorFalse,
                    num:   node.colorNum,
                    str:   node.colorStr,
                    null:  node.colorNull
                }
            }
        }

        function actualizarStatus (estado) {
            const n = estado.columnas.length
            node.status({
                fill:  n > 0 ? 'green' : 'grey',
                shape: 'dot',
                text:  n > 0 ? `${n} estado(s)` : 'sin datos'
            })
        }

        // Emitir manualmente (solo para acciones del widget, no para onInput)
        function emitirManual (estado) {
            if (group) {
                try {
                    const base = group.getBase()
                    if (base && base.emit) {
                        base.emit('msg-input:' + node.id, { payload: buildPayload(estado) }, node)
                    }
                } catch (err) {
                    node.warn('state-inspector: emit error: ' + err.message)
                }
            }
            actualizarStatus(estado)
        }

        // Procesar msg y actualizar estado interno
        // Devuelve el estado resultante
        function procesarMensaje (msg) {
            const estado = getEstado()

            // Reset
            if (
                msg.topic === 'state-inspector/reset' ||
                (msg.payload && msg.payload.action === 'reset')
            ) {
                const nuevo = { columnas: [], filas: [] }
                setEstado(nuevo)
                return nuevo
            }

            // Eliminar columna
            if (
                msg.topic === 'state-inspector/remove' ||
                (msg.payload && msg.payload.action === 'remove')
            ) {
                const nombre = (msg.payload && msg.payload.nombre) || msg.payload
                estado.columnas = estado.columnas.filter(c => c.nombre !== nombre)
                setEstado(estado)
                return estado
            }

            // Agregar / actualizar snapshot
            const payload = msg.payload
            if (!payload || typeof payload !== 'object') {
                node.warn('state-inspector: msg.payload debe ser { nombre, valores }')
                return estado
            }

            const nombre  = payload.nombre || msg.topic || `estado_${Date.now()}`
            const valores = payload.valores
            if (!valores || typeof valores !== 'object') {
                node.warn('state-inspector: msg.payload.valores debe ser un objeto plano')
                return estado
            }

            const keysNuevas = Object.keys(valores).filter(k => !estado.filas.includes(k))
            if (keysNuevas.length > 0) {
                estado.filas = estado.filas.concat(keysNuevas)
                if (node.ordenFilas === 'alpha') estado.filas.sort()
            }

            const idx = estado.columnas.findIndex(c => c.nombre === nombre)
            if (idx >= 0) {
                estado.columnas[idx] = { nombre, valores, ts: Date.now() }
            } else {
                estado.columnas.push({ nombre, valores, ts: Date.now() })
                if (estado.columnas.length > node.maxColumnas) estado.columnas.shift()
            }

            setEstado(estado)
            return estado
        }

        // ── Registrar con Dashboard 2.0 ───────────────────────────────────
        // onInput firma: (msg, send) — ui_base llama done() y emit automáticamente
        const evts = {
            onAction: true,
            onInput: function (msg, send) {
                const estado = procesarMensaje(msg)
                msg.payload = buildPayload(estado)
                actualizarStatus(estado)
            }
        }

        if (group) {
            group.register(node, config, evts)
        } else {
            node.error('state-inspector: no se encontró el grupo de Dashboard 2.0')
            node.status({ fill: 'red', shape: 'ring', text: 'sin grupo' })
        }

        // ── Acciones desde el widget Vue (botón reset) ────────────────────
        node.on('widget-action', function (action) {
            if (action && action.action === 'reset') {
                const nuevo = { columnas: [], filas: [] }
                setEstado(nuevo)
                emitirManual(nuevo)
            }
        })

        node.on('close', function () {
            node.status({})
        })
    }

    RED.nodes.registerType('state-inspector', StateInspectorNode)
}
