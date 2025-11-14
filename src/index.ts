/**
 * Vue Excel Preview Component
 * A lightweight Excel preview component built with Vue 3 and design patterns
 */

import type {App} from 'vue'
import ExcelPreview from './components/ExcelPreview.vue'
// Export component
export {ExcelPreview}

// Export core modules for advanced usage
export {ExcelViewer} from './core/ExcelViewer'
export {Cell} from './core/Cell'
export {EventBus, Events} from './core/EventBus'
export {TableRenderer} from './core/Renderer'
export {FileLoader} from './core/Loader'
export {ParserFactory} from './core/Parser'
export {XLSXParserStrategy} from './core/parsers/XLSXParserStrategy'
export {CSVParserStrategy} from './core/parsers/CSVParserStrategy'
export {
    VirtualScrollInteraction,
    SelectionInteraction,
    type VirtualScrollState,
    type SelectionState,
    type VisibleRange,
} from './core/Interaction'

export type {
    ICellData,
    ICellStyle,
    IWorksheetData,
    IWorkbookData,
    IParseResult,
} from './core/types'

export function install(app: App) {
    app.component('ExcelPreview', ExcelPreview)
}

// Default export
export default {
    install,
    ExcelPreview,
}

