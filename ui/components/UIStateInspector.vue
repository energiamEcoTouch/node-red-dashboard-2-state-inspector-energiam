<template>
    <div class="esi-wrap" :style="wrapStyle">

        <!-- ── Toolbar ─────────────────────────────────────────────────── -->
        <div class="esi-toolbar">
            <div class="esi-brand">
                <span class="esi-brand-dot"></span>
                <span class="esi-brand-name">STATE INSPECTOR</span>
                <span class="esi-brand-tag">EnergIAM</span>
            </div>
            <div class="esi-toolbar-right">
                <span class="esi-pill" v-if="totalEstados > 0">
                    {{ totalEstados }} estado{{ totalEstados !== 1 ? 's' : '' }}
                </span>
                <button class="esi-btn-icon esi-btn-gear" @click="toggleSettings" :class="{ 'esi-btn-active': showSettings }" title="Ajustes">
                    ⚙
                </button>
                <button class="esi-btn-icon esi-btn-reset-x" v-if="totalEstados > 0" @click="resetLocal" title="Limpiar tabla">
                    <svg width="10" height="10" viewBox="0 0 10 10">
                        <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
                    </svg>
                </button>
            </div>
        </div>

        <!-- ── Panel de ajustes ────────────────────────────────────────── -->
        <transition name="esi-slide">
            <div class="esi-settings" v-if="showSettings">
                <div class="esi-settings-row">
                    <span class="esi-settings-label">Tamaño de fuente</span>
                    <div class="esi-size-btns">
                        <button v-for="s in fontSizes" :key="s.val"
                                class="esi-size-btn"
                                :class="{ 'esi-size-btn-active': cfg.fontSize === s.val }"
                                @click="setFontSize(s.val)">
                            {{ s.label }}
                        </button>
                    </div>
                </div>
                <div class="esi-settings-row">
                    <span class="esi-settings-label">Densidad de filas</span>
                    <div class="esi-size-btns">
                        <button v-for="d in densidades" :key="d.val"
                                class="esi-size-btn"
                                :class="{ 'esi-size-btn-active': cfg.density === d.val }"
                                @click="setDensity(d.val)">
                            {{ d.label }}
                        </button>
                    </div>
                </div>
                <div class="esi-settings-row">
                    <span class="esi-settings-label">Timestamps</span>
                    <button class="esi-toggle" :class="{ 'esi-toggle-on': cfg.showTs }" @click="toggle('showTs')">
                        <span class="esi-toggle-knob"></span>
                    </button>
                </div>
                <div class="esi-settings-row">
                    <span class="esi-settings-label">Col. variables fija</span>
                    <button class="esi-toggle" :class="{ 'esi-toggle-on': cfg.stickyVar }" @click="toggle('stickyVar')">
                        <span class="esi-toggle-knob"></span>
                    </button>
                </div>
            </div>
        </transition>

        <!-- ── Divisor ─────────────────────────────────────────────────── -->
        <div class="esi-divider"></div>

        <!-- ── Tabla ───────────────────────────────────────────────────── -->
        <div class="esi-scroll" v-if="columnas.length > 0">
            <table class="esi-table">
                <thead>
                    <tr>
                        <th class="esi-th esi-th-var" :class="{ 'esi-sticky-col': cfg.stickyVar }">
                            variable
                        </th>
                        <th class="esi-th esi-th-col"
                            v-for="col in columnas"
                            :key="col.nombre"
                            :title="col.ts ? new Date(col.ts).toLocaleString() : ''">
                            <div class="esi-th-inner">
                                <span class="esi-col-nombre">{{ col.nombre }}</span>
                                <span class="esi-col-ts" v-if="cfg.showTs && col.ts">{{ fmtTs(col.ts) }}</span>
                            </div>
                        </th>
                    </tr>
                </thead>
                <tbody>
                    <tr v-for="(fila, idx) in filas" :key="fila" class="esi-row" :class="idx % 2 === 0 ? 'esi-row-even' : 'esi-row-odd'">
                        <td class="esi-td esi-td-var" :class="{ 'esi-sticky-col': cfg.stickyVar }" :style="tdVarStyle">
                            <span class="esi-var-dot"></span>{{ fila }}
                        </td>
                        <td class="esi-td esi-td-val"
                            v-for="col in columnas"
                            :key="col.nombre"
                            :style="tdStyle">
                            <span :class="valClass(getVal(col, fila))"
                                  :style="valStyle(getVal(col, fila))">
                                {{ fmt(getVal(col, fila)) }}
                            </span>
                        </td>
                    </tr>
                </tbody>
            </table>
        </div>

        <!-- ── Empty state ─────────────────────────────────────────────── -->
        <div class="esi-empty" v-else>
            <div class="esi-empty-grid">
                <div v-for="i in 9" :key="i" class="esi-empty-cell"></div>
            </div>
            <div class="esi-empty-content">
                <div class="esi-empty-icon">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.2">
                        <rect x="3" y="3" width="18" height="18" rx="2"/>
                        <line x1="3" y1="9" x2="21" y2="9"/>
                        <line x1="9" y1="9" x2="9" y2="21"/>
                    </svg>
                </div>
                <p class="esi-empty-title">Sin estados capturados</p>
                <p class="esi-empty-hint">Enviá <code>{ nombre, valores }</code> al nodo</p>
            </div>
        </div>

        <!-- ── Footer ─────────────────────────────────────────────────── -->
        <div class="esi-footer" v-if="columnas.length > 0">
            <span>{{ filas.length }} variable{{ filas.length !== 1 ? 's' : '' }}</span>
            <span class="esi-footer-sep">·</span>
            <span>{{ columnas.length }} / {{ maxColumnas }} cols</span>
        </div>

    </div>
</template>

<script>
const STORAGE_KEY = 'esi-cfg'

const defaults = {
    fontSize:  12,
    density:   'normal',
    showTs:    true,
    stickyVar: true
}

export default {
    name: 'UIStateInspector',

    inject: ['$socket'],

    props: {
        id:    { type: String, required: true },
        props: { type: Object, default: () => ({}) },
        state: { type: Object, default: () => ({}) }
    },

    data () {
        return {
            columnas:     [],
            filas:        [],
            maxColumnas:  10,
            showSettings: false,
            colores: {
                true:  '#3fb950',
                false: '#f85149',
                num:   '#58a6ff',
                str:   '#e3b341',
                null:  '#484f58'
            },
            cfg: { ...defaults },
            fontSizes: [
                { val: 10, label: 'XS' },
                { val: 12, label: 'S'  },
                { val: 14, label: 'M'  },
                { val: 16, label: 'L'  }
            ],
            densidades: [
                { val: 'compact', label: 'Compact' },
                { val: 'normal',  label: 'Normal'  },
                { val: 'relaxed', label: 'Relaxed' }
            ]
        }
    },

    computed: {
        totalEstados () { return this.columnas.length },

        wrapStyle () {
            return { fontSize: this.cfg.fontSize + 'px' }
        },

        tdStyle () {
            const pad = { compact: '3px 10px', normal: '5px 14px', relaxed: '8px 18px' }
            return { padding: pad[this.cfg.density] || pad.normal }
        },

        tdVarStyle () {
            const pad = { compact: '3px 10px', normal: '5px 14px', relaxed: '8px 18px' }
            return { padding: pad[this.cfg.density] || pad.normal }
        }
    },

    methods: {
        onMsg (msg) {
            if (!msg || !msg.payload) return
            const { columnas, filas, colores } = msg.payload
            if (Array.isArray(columnas))                this.columnas    = columnas
            if (Array.isArray(filas))                   this.filas       = filas
            if (colores && typeof colores === 'object') this.colores     = { ...this.colores, ...colores }
            if (this.props?.maxColumnas)                this.maxColumnas = parseInt(this.props.maxColumnas) || 10
        },

        onLoad (msg, state) {
            const data = (state && state.payload) ? state : msg
            if (data && data.payload) this.onMsg(data)
        },

        fmt (val) {
            if (val === null || val === undefined) return '—'
            if (typeof val === 'object') return JSON.stringify(val)
            return String(val)
        },

        fmtTs (ts) {
            if (!ts) return ''
            const d = new Date(ts)
            return `${String(d.getHours()).padStart(2,'0')}:${String(d.getMinutes()).padStart(2,'0')}:${String(d.getSeconds()).padStart(2,'0')}`
        },

        valStyle (val) {
            if (val === null || val === undefined) return { color: this.colores.null }
            if (val === true  || val === 'true')   return { color: this.colores.true }
            if (val === false || val === 'false')  return { color: this.colores.false }
            if (typeof val === 'number')           return { color: this.colores.num }
            return { color: this.colores.str }
        },

        valClass (val) {
            if (val === true  || val === 'true')  return 'esi-badge esi-badge-true'
            if (val === false || val === 'false') return 'esi-badge esi-badge-false'
            if (val === null  || val === undefined) return 'esi-val-null'
            return 'esi-val'
        },

        getVal (col, fila) {
            if (!col.valores) return null
            const v = col.valores[fila]
            return v !== undefined ? v : null
        },

        resetLocal () {
            if (this.$socket) {
                this.$socket.emit('widget-action', { widgetId: this.id, action: 'reset' })
            }
            this.columnas = []
            this.filas    = []
        },

        toggleSettings () {
            this.showSettings = !this.showSettings
        },

        setFontSize (val) {
            this.cfg.fontSize = val
            this.saveCfg()
        },

        setDensity (val) {
            this.cfg.density = val
            this.saveCfg()
        },

        toggle (key) {
            this.cfg[key] = !this.cfg[key]
            this.saveCfg()
        },

        saveCfg () {
            try { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.cfg)) } catch (_) {}
        },

        loadCfg () {
            try {
                const saved = localStorage.getItem(STORAGE_KEY)
                if (saved) this.cfg = { ...defaults, ...JSON.parse(saved) }
            } catch (_) {}
        }
    },

    mounted () {
        this.loadCfg()
        // Restaurar estado guardado por Dashboard 2.0 al navegar entre páginas
        if (this.state && this.state.payload) {
            this.onMsg(this.state)
        }
        if (this.$socket) {
            this.$socket.on(`msg-input:${this.id}`,   this.onMsg)
            this.$socket.on(`widget-load:${this.id}`, this.onLoad)
            this.$socket.emit('widget-load', this.id)
        }
    },

    beforeUnmount () {
        if (this.$socket) {
            this.$socket.off(`msg-input:${this.id}`,   this.onMsg)
            this.$socket.off(`widget-load:${this.id}`, this.onLoad)
        }
    }
}
</script>

<style>
/* ── Root ────────────────────────────────────────────────────────────── */
.esi-wrap {
    background:     #0d1117;
    color:          #c9d1d9;
    font-family:    'JetBrains Mono', 'Cascadia Code', 'Fira Code', 'Consolas', monospace;
    height:         100%;
    display:        flex;
    flex-direction: column;
    box-sizing:     border-box;
    overflow:       hidden;
    border:         1px solid #21262d;
    border-radius:  6px;
}

/* ── Toolbar ─────────────────────────────────────────────────────────── */
.esi-toolbar {
    display:         flex;
    align-items:     center;
    justify-content: space-between;
    padding:         8px 12px 7px;
    flex-shrink:     0;
    background:      #161b22;
}

.esi-brand {
    display:     flex;
    align-items: center;
    gap:         8px;
}

.esi-brand-dot {
    width:         7px;
    height:        7px;
    border-radius: 50%;
    background:    #3fb950;
    box-shadow:    0 0 6px #3fb95080;
    flex-shrink:   0;
}

.esi-brand-name {
    font-size:      10px;
    font-weight:    700;
    letter-spacing: 0.12em;
    color:          #e6edf3;
}

.esi-brand-tag {
    font-size:      9px;
    color:          #3fb950;
    border:         1px solid #3fb95040;
    background:     #3fb95012;
    padding:        1px 6px;
    border-radius:  3px;
    letter-spacing: 0.06em;
}

.esi-toolbar-right {
    display:     flex;
    align-items: center;
    gap:         6px;
}

.esi-pill {
    font-size:      10px;
    color:          #58a6ff;
    background:     #58a6ff14;
    border:         1px solid #58a6ff30;
    padding:        2px 9px;
    border-radius:  20px;
    letter-spacing: 0.02em;
}

.esi-btn-icon {
    background:    transparent;
    border:        1px solid #30363d;
    color:         #8b949e;
    width:         24px;
    height:        24px;
    border-radius: 4px;
    cursor:        pointer;
    display:       flex;
    align-items:   center;
    justify-content: center;
    transition:    all 0.15s;
    padding:       0;
    font-size:     13px;
    line-height:   1;
}
.esi-btn-icon:hover     { border-color: #58a6ff; color: #58a6ff; background: #58a6ff10; }
.esi-btn-active         { border-color: #58a6ff !important; color: #58a6ff !important; background: #58a6ff18 !important; }
.esi-btn-gear           { font-size: 14px; }
.esi-btn-reset-x:hover  { border-color: #f85149 !important; color: #f85149 !important; background: #f8514910 !important; }

/* ── Panel de ajustes ────────────────────────────────────────────────── */
.esi-settings {
    background:  #161b22;
    border-bottom: 1px solid #21262d;
    padding:     10px 14px;
    display:     flex;
    flex-direction: column;
    gap:         10px;
    flex-shrink: 0;
}

.esi-settings-row {
    display:         flex;
    align-items:     center;
    justify-content: space-between;
    gap:             12px;
}

.esi-settings-label {
    font-size:      10px;
    color:          #8b949e;
    letter-spacing: 0.04em;
    white-space:    nowrap;
}

.esi-size-btns {
    display: flex;
    gap:     4px;
}

.esi-size-btn {
    background:    #0d1117;
    border:        1px solid #30363d;
    color:         #484f58;
    font-family:   inherit;
    font-size:     9px;
    padding:       2px 8px;
    border-radius: 3px;
    cursor:        pointer;
    transition:    all 0.12s;
    letter-spacing: 0.04em;
}
.esi-size-btn:hover       { border-color: #58a6ff40; color: #8b949e; }
.esi-size-btn-active      { border-color: #58a6ff; color: #58a6ff; background: #58a6ff14; }

/* Toggle switch */
.esi-toggle {
    width:         34px;
    height:        18px;
    border-radius: 9px;
    background:    #21262d;
    border:        1px solid #30363d;
    cursor:        pointer;
    position:      relative;
    transition:    all 0.2s;
    flex-shrink:   0;
    padding:       0;
}
.esi-toggle-on {
    background:  #3fb95030;
    border-color: #3fb950;
}
.esi-toggle-knob {
    position:      absolute;
    top:           2px;
    left:          2px;
    width:         12px;
    height:        12px;
    border-radius: 50%;
    background:    #484f58;
    transition:    all 0.2s;
    display:       block;
}
.esi-toggle-on .esi-toggle-knob {
    left:       18px;
    background: #3fb950;
}

/* Slide transition */
.esi-slide-enter-active, .esi-slide-leave-active { transition: all 0.18s ease; overflow: hidden; }
.esi-slide-enter-from, .esi-slide-leave-to       { max-height: 0; opacity: 0; padding-top: 0; padding-bottom: 0; }
.esi-slide-enter-to, .esi-slide-leave-from       { max-height: 200px; opacity: 1; }

/* ── Divider ─────────────────────────────────────────────────────────── */
.esi-divider {
    height:      1px;
    background:  linear-gradient(90deg, #3fb95030 0%, #58a6ff20 50%, transparent 100%);
    flex-shrink: 0;
}

/* ── Scroll container ────────────────────────────────────────────────── */
.esi-scroll {
    flex:       1;
    overflow-x: auto;
    overflow-y: auto;
    min-height: 0;
}

/* ── Tabla ───────────────────────────────────────────────────────────── */
.esi-table {
    border-collapse: collapse;
    width:           100%;
    min-width:       100%;
}

/* ── Headers ─────────────────────────────────────────────────────────── */
.esi-th {
    padding:        6px 14px 5px;
    background:     #161b22;
    color:          #8b949e;
    font-weight:    600;
    font-size:      0.83em;
    letter-spacing: 0.06em;
    text-transform: uppercase;
    white-space:    nowrap;
    position:       sticky;
    top:            0;
    z-index:        2;
    border-bottom:  1px solid #30363d;
    border-right:   1px solid #21262d;
    text-align:     center;
}
.esi-th:last-child { border-right: none; }

.esi-th-var {
    text-align: left;
    min-width:  120px;
    color:      #484f58;
    z-index:    3;
}

.esi-sticky-col {
    position:   sticky !important;
    left:       0;
    z-index:    3 !important;
    background: inherit;
}

.esi-th-col { min-width: 100px; }

.esi-th-inner {
    display:        flex;
    flex-direction: column;
    align-items:    center;
    gap:            2px;
}

.esi-col-nombre { color: #c9d1d9; }

.esi-col-ts {
    font-size:   0.78em;
    color:       #3fb95070;
    font-weight: 400;
}

/* ── Filas ───────────────────────────────────────────────────────────── */
.esi-row-even .esi-td { background: #0d1117; }
.esi-row-odd  .esi-td { background: #0d1117; }
.esi-row:hover .esi-td     { background: #161b22 !important; }
.esi-row:hover .esi-td-var { background: #161b22 !important; }

/* ── Celdas ──────────────────────────────────────────────────────────── */
.esi-td {
    padding:       5px 14px;
    border-bottom: 1px solid #161b22;
    border-right:  1px solid #161b22;
    text-align:    center;
    white-space:   nowrap;
    vertical-align: middle;
}
.esi-td:last-child { border-right: none; }

.esi-td-var {
    text-align:  left;
    color:       #8b949e;
    font-weight: 500;
    border-right: 1px solid #21262d;
    display:     flex;
    align-items: center;
    gap:         7px;
    background:  inherit;
}

.esi-var-dot {
    width:         4px;
    height:        4px;
    border-radius: 50%;
    background:    #30363d;
    flex-shrink:   0;
}

/* ── Valores ─────────────────────────────────────────────────────────── */
.esi-val-null { opacity: 0.35; }

.esi-badge {
    display:        inline-block;
    padding:        1px 8px;
    border-radius:  3px;
    font-size:      0.88em;
    font-weight:    700;
    letter-spacing: 0.04em;
}
.esi-badge-true  { background: #3fb95018; border: 1px solid #3fb95035; }
.esi-badge-false { background: #f8514912; border: 1px solid #f8514930; }

/* ── Empty state ─────────────────────────────────────────────────────── */
.esi-empty {
    flex:     1;
    position: relative;
    display:  flex;
    align-items: center;
    justify-content: center;
    min-height: 120px;
    overflow:   hidden;
}
.esi-empty-grid {
    position: absolute;
    inset:    0;
    display:  grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows:    repeat(3, 1fr);
    gap:      1px;
    opacity:  0.04;
}
.esi-empty-cell { border: 1px solid #58a6ff; }
.esi-empty-content {
    position:   relative;
    text-align: center;
    display:    flex;
    flex-direction: column;
    align-items: center;
    gap:         8px;
}
.esi-empty-icon  { color: #21262d; opacity: 0.6; }
.esi-empty-title { margin: 0; color: #484f58; font-size: 1em; font-weight: 500; }
.esi-empty-hint  { margin: 0; color: #30363d; font-size: 0.88em; }
.esi-empty-hint code {
    background: #161b22; padding: 1px 5px; border-radius: 3px;
    color: #58a6ff; font-family: inherit;
}

/* ── Footer ──────────────────────────────────────────────────────────── */
.esi-footer {
    display:     flex;
    align-items: center;
    gap:         6px;
    padding:     4px 12px;
    background:  #0d1117;
    border-top:  1px solid #21262d;
    color:       #30363d;
    font-size:   0.8em;
    flex-shrink: 0;
    letter-spacing: 0.04em;
}
.esi-footer-sep { color: #21262d; }

/* ── Scrollbar ───────────────────────────────────────────────────────── */
.esi-scroll::-webkit-scrollbar       { width: 5px; height: 5px; }
.esi-scroll::-webkit-scrollbar-track { background: #0d1117; }
.esi-scroll::-webkit-scrollbar-thumb { background: #21262d; border-radius: 3px; }
.esi-scroll::-webkit-scrollbar-thumb:hover { background: #30363d; }
</style>
