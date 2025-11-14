import { EventBus, Events } from './EventBus'
import type {Ref} from "vue";

/**
 * Interaction Manager
 * Handles user interactions: scrolling, zooming, selection
 */
export interface IInteraction {
  handleScroll(event: Event): void
  handleZoom(delta: number): void
  destroy(): void
}

/**
 * Virtual Scroll State
 */
export interface VirtualScrollState {
  scrollTop: number
  scrollLeft: number
  containerHeight: number
  containerWidth: number
  rowHeight: number
  columnWidth: number
  overscan: number
}

/**
 * Visible Range
 */
export interface VisibleRange {
  startRow: number
  endRow: number
  startCol: number
  endCol: number
}

/**
 * Virtual Scroll Interaction
 * Handles virtual scrolling for large datasets
 */
export class VirtualScrollInteraction implements IInteraction {
  private eventBus: EventBus
  private scrollState: Ref<VirtualScrollState>
  private totalRows: number
  private totalCols: number
  private scrollTimer: number | null = null

  constructor(
    eventBus: EventBus,
    scrollState: Ref<VirtualScrollState>,
    totalRows: number,
    totalCols: number
  ) {
    this.eventBus = eventBus
    this.scrollState = scrollState
    this.totalRows = totalRows
    this.totalCols = totalCols
  }

  /**
   * Handle scroll event with debouncing
   */
  handleScroll(event: Event): void {
    const target = event.target as HTMLElement
    
    // Update scroll position immediately for smooth scrolling
    this.scrollState.value.scrollTop = target.scrollTop
    this.scrollState.value.scrollLeft = target.scrollLeft

    // Debounce visible range calculation
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
    }

    this.scrollTimer = window.setTimeout(() => {
      const visibleRange = this.calculateVisibleRange()
      this.eventBus.emit(Events.SCROLL, { visibleRange })
    }, 16) // ~60fps
  }

  /**
   * Calculate visible range based on scroll position
   */
  calculateVisibleRange(): VisibleRange {
    const state = this.scrollState.value

    // Calculate visible row range
    const startRow = Math.max(0, Math.floor(state.scrollTop / state.rowHeight) - state.overscan)
    const visibleRowCount = Math.ceil(state.containerHeight / state.rowHeight)
    const endRow = Math.min(
      this.totalRows - 1,
      startRow + visibleRowCount + state.overscan * 2
    )

    // Calculate visible column range (all columns for now)
    const startCol = 0
    const endCol = Math.max(0, this.totalCols - 1)

    return {
      startRow,
      endRow,
      startCol,
      endCol
    }
  }

  /**
   * Update total rows/cols
   */
  updateDimensions(totalRows: number, totalCols: number): void {
    this.totalRows = totalRows
    this.totalCols = totalCols
  }

  /**
   * Handle zoom (placeholder for future implementation)
   */
  handleZoom(delta: number): void {
    // Emit zoom event
    this.eventBus.emit(Events.ZOOM, { delta })
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.scrollTimer) {
      clearTimeout(this.scrollTimer)
    }
  }
}

/**
 * Selection State
 */
export interface SelectionState {
  selectedCell: { row: number; col: number } | null
  selectionRange: {
    start: { row: number; col: number } | null
    end: { row: number; col: number } | null
  }
  isSelecting: boolean
}

/**
 * Selection Interaction
 * Handles cell selection and drag selection
 */
export class SelectionInteraction {
  private eventBus: EventBus
  private selectionState: Ref<SelectionState>

  constructor(eventBus: EventBus, selectionState: Ref<SelectionState>) {
    this.eventBus = eventBus
    this.selectionState = selectionState
  }

  /**
   * Handle mouse down (start selection)
   */
  handleMouseDown(event: MouseEvent): void {
    const target = event.target as HTMLElement
    if (!target.classList.contains('cell')) return

    const row = parseInt(target.dataset.row || '-1')
    const col = parseInt(target.dataset.col || '-1')

    if (row >= 0 && col >= 0) {
      this.selectionState.value.isSelecting = true
      this.selectionState.value.selectionRange.start = { row, col }
      this.selectionState.value.selectionRange.end = { row, col }
      this.selectionState.value.selectedCell = { row, col }

      this.eventBus.emit(Events.CELL_SELECT, { row, col })
    }
  }

  /**
   * Handle mouse move (drag selection)
   */
  handleMouseMove(event: MouseEvent): void {
    if (!this.selectionState.value.isSelecting) return
    if (!this.selectionState.value.selectionRange.start) return

    const target = event.target as HTMLElement
    if (!target.classList.contains('cell')) return

    const row = parseInt(target.dataset.row || '-1')
    const col = parseInt(target.dataset.col || '-1')

    if (row >= 0 && col >= 0) {
      this.selectionState.value.selectionRange.end = { row, col }
    }
  }

  /**
   * Handle mouse up (end selection)
   */
  handleMouseUp(): void {
    this.selectionState.value.isSelecting = false
  }

  /**
   * Select a cell
   */
  selectCell(row: number, col: number): void {
    this.selectionState.value.selectedCell = { row, col }
    this.selectionState.value.selectionRange = {
      start: { row, col },
      end: { row, col }
    }

    this.eventBus.emit(Events.CELL_SELECT, { row, col })
  }

  /**
   * Check if cell is selected
   */
  isCellSelected(row: number, col: number): boolean {
    const selected = this.selectionState.value.selectedCell
    return selected?.row === row && selected?.col === col
  }

  /**
   * Check if cell is in selection range
   */
  isCellInSelection(row: number, col: number): boolean {
    const range = this.selectionState.value.selectionRange
    if (!range.start || !range.end) return false

    const startRow = Math.min(range.start.row, range.end.row)
    const endRow = Math.max(range.start.row, range.end.row)
    const startCol = Math.min(range.start.col, range.end.col)
    const endCol = Math.max(range.start.col, range.end.col)

    return row >= startRow && row <= endRow && col >= startCol && col <= endCol
  }

  /**
   * Get selected data as string
   */
  getSelectionData(data: any[][], formatter?: (cellData: any) => string): string {
    const range = this.selectionState.value.selectionRange
    if (!range.start || !range.end) return ''

    const startRow = Math.min(range.start.row, range.end.row)
    const endRow = Math.max(range.start.row, range.end.row)
    const startCol = Math.min(range.start.col, range.end.col)
    const endCol = Math.max(range.start.col, range.end.col)

    const selectedData: string[][] = []

    for (let row = startRow; row <= endRow; row++) {
      const rowData: string[] = []
      for (let col = startCol; col <= endCol; col++) {
        if (data[row] && data[row][col]) {
          const cellData = data[row][col]
          // Use formatter if provided (e.g., Renderer.formatCellValue), otherwise use raw value
          const cellValue = formatter ? formatter(cellData) : String(cellData?.value || '')
          rowData.push(cellValue)
        } else {
          rowData.push('')
        }
      }
      selectedData.push(rowData)
    }
    // Convert to tab-separated text
    return selectedData.map(row => row.join('\t')).join('\n')
  }

  /**
   * Clear selection
   */
  clearSelection(): void {
    this.selectionState.value.selectedCell = null
    this.selectionState.value.selectionRange = {
      start: null,
      end: null
    }
    this.selectionState.value.isSelecting = false
  }
}
