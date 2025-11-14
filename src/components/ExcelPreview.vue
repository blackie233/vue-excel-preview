<template>
  <div class="excel-preview-refactored">
    <!-- Loading State -->
    <div v-if="loading" class="loading-container">
      <slot name="loading-icon">
        <div class="loading-spinner"></div>
      </slot>
      <div class="loading-text">{{ props.loadingMessage }}</div>
    </div>

    <!-- Error State -->
    <div v-else-if="error" class="error-container">
      <slot name="error-icon">
        <div class="error-icon" v-html="props.errorIcon"></div>
      </slot>
      <div class="error-title">{{ props.errorMessage }}</div>
      <div class="error-detail">{{ error }}</div>
      <button class="retry-btn" @click="loadFile(currentFile!)">重试</button>
    </div>

    <!-- Preview Content -->
    <div v-else-if="workbookData" class="preview-content">
      <!-- Virtual Scroll Container -->
      <div
          ref="scrollContainerRef"
          class="virtual-scroll-container"
          :style="containerStyle"
          @scroll="handleScroll"
          @mousedown="handleMouseDown"
          @mousemove="handleMouseMove"
          @mouseup="handleMouseUp"
      >
        <div class="virtual-scroll-wrapper" :style="tableWrapperStyle">
          <div class="virtual-table-content" :style="tableContentStyle">
            <table class="excel-table">
              <thead v-if="visibleData.length > 0">
              <tr>
                <th class="row-header">#</th>
                <th
                    v-for="colIndex in maxColumns"
                    :key="colIndex - 1"
                    class="column-header"
                >
                  {{ getColumnLabel(colIndex - 1) }}
                </th>
              </tr>
              </thead>
              <!-- Body -->
              <tbody>
              <tr
                  v-for="(row, displayRowIndex) in visibleData"
                  :key="visibleRange.startRow + displayRowIndex"
                  :class="{ 'even-row': (visibleRange.startRow + displayRowIndex) % 2 === 0 }"
              >
                <td class="row-header">{{ visibleRange.startRow + displayRowIndex + 1 }}</td>
                <td
                    v-for="(cellData, displayColIndex) in row"
                    :key="displayColIndex"
                    v-show="!cellData.hidden"
                    class="cell"
                    :class="[
                      getCellClass(cellData),
                      {
                        'selected': selectionInteraction?.isCellSelected(cellData.originalRowIndex!, cellData.originalColIndex!),
                        'in-selection': selectionInteraction?.isCellInSelection(cellData.originalRowIndex!, cellData.originalColIndex!)
                      }
                    ]"
                    :style="getCellStyle(cellData)"
                    :data-row="cellData.originalRowIndex"
                    :data-col="cellData.originalColIndex"
                    :rowspan="cellData.rowspan || 1"
                    :colspan="cellData.colspan || 1"
                    @click="handleCellClick(cellData.originalRowIndex!, cellData.originalColIndex!)"
                >
                  <span v-html="formatCellValue(cellData)"></span>
                </td>
              </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <!-- Sheet Tabs -->
      <div v-if="workbookData.sheets.length > 1" class="sheet-tabs">
        <button
            v-for="(sheet, index) in workbookData.sheets"
            :key="index"
            :class="['sheet-tab', { active: currentSheetIndex === index }]"
            @click="switchSheet(index)"
        >
          {{ sheet.name }}
        </button>
      </div>
    </div>

    <div v-else class="no-data-container">
      <slot name="no-data-icon">
        <div class="no-data-icon" v-html="props.noDataIcon"></div>
      </slot>
      <div class="no-data-text">{{ props.noDataMessage }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import {ref, computed, onMounted, onUnmounted, watch} from 'vue'
import {ExcelViewer} from '../core/ExcelViewer'
import {Cell} from '../core/Cell'
import {
  VirtualScrollInteraction,
  SelectionInteraction,
  type VirtualScrollState,
  type SelectionState,
  type VisibleRange
} from '../core/Interaction'
import {Events} from '../core/EventBus'
import type {IWorkbookData, ICellData} from '../core/types'

// Props for customization
interface Props {
  // Error state configuration
  errorIcon?: string
  errorMessage?: string
  // No data state configuration
  noDataIcon?: string
  noDataMessage?: string
  // Loading state configuration
  loadingMessage?: string
}

const props = withDefaults(defineProps<Props>(), {
  errorIcon: '⚠️',
  errorMessage: '文件解析失败',
  noDataIcon: '📊',
  noDataMessage: '请选择 Excel 文件进行预览',
  loadingMessage: '正在解析文件...'
})

// Excel Viewer instance
const viewer = ref<ExcelViewer | null>(null)

// State
const loading = ref(false)
const error = ref('')
const workbookData = ref<IWorkbookData | null>(null)
const currentSheetIndex = ref(0)
const currentFile = ref<File | null>(null)

// Virtual scroll state
const scrollContainerRef = ref<HTMLElement>()
const virtualScrollState = ref<VirtualScrollState>({
  scrollTop: 0,
  scrollLeft: 0,
  containerHeight: 600,
  containerWidth: 800,
  rowHeight: 28,
  columnWidth: 100,
  overscan: 5
})

// Visible range
const visibleRange = ref<VisibleRange>({
  startRow: 0,
  endRow: 0,
  startCol: 0,
  endCol: 0
})

// Selection state
const selectionState = ref<SelectionState>({
  selectedCell: null,
  selectionRange: {
    start: null,
    end: null
  },
  isSelecting: false
})

// Interactions
let virtualScrollInteraction: VirtualScrollInteraction | null = null
let selectionInteraction: SelectionInteraction | null = null

// Computed
const currentSheet = computed(() => {
  if (!workbookData.value || currentSheetIndex.value >= workbookData.value.sheets.length) {
    return null
  }
  return workbookData.value.sheets[currentSheetIndex.value]
})

const currentSheetData = computed(() => {
  return currentSheet.value?.data || []
})

const maxColumns = computed(() => {
  return Math.max(...currentSheetData.value.map(row => row.length), 0)
})

const visibleData = computed(() => {
  if (!currentSheetData.value.length) return []

  const {startRow, endRow} = visibleRange.value
  const visibleRows: (ICellData & { originalRowIndex?: number; originalColIndex?: number })[][] = []

  for (let rowIndex = startRow; rowIndex <= endRow; rowIndex++) {
    if (rowIndex >= 0 && rowIndex < currentSheetData.value.length) {
      const row = currentSheetData.value[rowIndex]
      const visibleRow = row?.map((cell, colIndex) => ({
        ...cell,
        originalRowIndex: rowIndex,
        originalColIndex: colIndex
      }))
      visibleRows.push(visibleRow)
    }
  }

  return visibleRows
})

const containerStyle = computed(() => ({
  maxHeight: `${virtualScrollState.value.containerHeight}px`,
  overflow: 'auto',
  position: 'relative' as const
}))

const tableWrapperStyle = computed(() => {
  const totalHeight = currentSheetData.value.length * virtualScrollState.value.rowHeight
  return {
    height: `${totalHeight}px`,
    width: 'auto',
    position: 'relative' as const
  }
})

const tableContentStyle = computed(() => {
  const {startRow} = visibleRange.value
  const {rowHeight} = virtualScrollState.value

  return {
    position: 'absolute' as const,
    top: `${startRow * rowHeight}px`,
    left: '0',
    transform: 'translateZ(0)'
  }
})

// Methods
const loadFile = async (file: File) => {
  if (!file || !viewer.value) return

  loading.value = true
  error.value = ''
  currentFile.value = file

  try {
    const result = await viewer.value.loadFile(file)
    workbookData.value = result.workbook
    currentSheetIndex.value = 0

    // Initialize virtual scroll
    if (currentSheetData.value.length > 0) {
      calculateVisibleRange()
    }
  } catch (err: any) {
    console.error('加载文件失败:', err)
    error.value = err.message || '无法解析文件，请检查文件格式'
    workbookData.value = null
  } finally {
    loading.value = false
  }
}

const switchSheet = (index: number) => {
  if (index === currentSheetIndex.value) return
  currentSheetIndex.value = index

  // Reset scroll position
  virtualScrollState.value.scrollTop = 0
  virtualScrollState.value.scrollLeft = 0
  if (scrollContainerRef.value) {
    scrollContainerRef.value.scrollTop = 0
    scrollContainerRef.value.scrollLeft = 0
  }

  calculateVisibleRange()
}

const calculateVisibleRange = () => {
  if (!virtualScrollInteraction) return
  const range = virtualScrollInteraction.calculateVisibleRange()
  visibleRange.value = range
}

const handleScroll = (event: Event) => {
  if (virtualScrollInteraction) {
    virtualScrollInteraction.handleScroll(event)
  }
}

const handleMouseDown = (event: MouseEvent) => {
  if (selectionInteraction) {
    selectionInteraction.handleMouseDown(event)
  }
}

const handleMouseMove = (event: MouseEvent) => {
  if (selectionInteraction) {
    selectionInteraction.handleMouseMove(event)
  }
}

const handleMouseUp = () => {
  if (selectionInteraction) {
    selectionInteraction.handleMouseUp()
  }
}

const handleCellClick = (row: number, col: number) => {
  if (selectionInteraction) {
    selectionInteraction.selectCell(row, col)
  }
}

const getColumnLabel = (index: number): string => {
  let label = ''
  let num = index

  while (num >= 0) {
    label = String.fromCharCode(65 + (num % 26)) + label
    num = Math.floor(num / 26) - 1
  }

  return label
}

const formatCellValue = (cellData: ICellData): string => {
  if (!viewer.value) return ''
  const cell = new Cell(cellData)
  const renderer = viewer.value.getRenderer()
  return renderer.formatCellValue(cell)
}

const getCellClass = (cellData: ICellData): string => {
  if (!viewer.value) return ''
  const cell = new Cell(cellData)
  const renderer = viewer.value.getRenderer()
  return renderer.getCellClass(cell)
}

const getCellStyle = (cellData: ICellData): Record<string, any> => {
  if (!viewer.value) return {}
  const cell = new Cell(cellData)
  const renderer = viewer.value.getRenderer()
  return renderer.getCellStyle(cell)
}

/**
 * Handle keyboard events for copy functionality
 */
const handleKeyDown = async (event: KeyboardEvent) => {
  // Ctrl+C or Cmd+C: Copy selected cells
  if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'c') {
    event.preventDefault()
    await copySelectedCells()
  }

  // ESC: Clear selection
  if (event.key === 'Escape' && selectionInteraction) {
    selectionInteraction.clearSelection()
  }
}

/**
 * Copy selected cells to clipboard
 */
const copySelectedCells = async () => {
  if (!selectionInteraction || !currentSheetData.value.length || !viewer.value) {
    return
  }

  // Create formatter function using renderer
  const renderer = viewer.value.getRenderer()
  const formatter = (cellData: ICellData): string => {
    const cell = new Cell(cellData)
    return renderer.formatCellValue(cell)
  }

  // Get selected data with formatted values
  const selectedData = selectionInteraction.getSelectionData(currentSheetData.value, formatter)
  
  if (!selectedData) {
    console.warn('No cells selected')
    return
  }

  try {
    await navigator.clipboard.writeText(selectedData)
    console.log('Copied to clipboard:', selectedData)
  } catch (error) {
    console.error('Failed to copy to clipboard:', error)
  }
}

// Lifecycle
onMounted(() => {
  // Initialize viewer
  viewer.value = new ExcelViewer()

  // Initialize interactions
  if (viewer.value) {
    const eventBus = viewer.value.getEventBus()

    virtualScrollInteraction = new VirtualScrollInteraction(
        eventBus,
        virtualScrollState,
        currentSheetData.value.length,
        maxColumns.value
    )

    selectionInteraction = new SelectionInteraction(eventBus, selectionState)

    // Subscribe to scroll events
    eventBus.on(Events.SCROLL, ({visibleRange: range}) => {
      visibleRange.value = range
    })
  }

  // Setup container size
  if (scrollContainerRef.value) {
    virtualScrollState.value.containerHeight = scrollContainerRef.value.clientHeight || 600
    virtualScrollState.value.containerWidth = scrollContainerRef.value.clientWidth || 800
  }

  // Add keyboard event listener
  window.addEventListener('keydown', handleKeyDown)
})

onUnmounted(() => {
  if (viewer.value) {
    viewer.value.destroy()
  }
  if (virtualScrollInteraction) {
    virtualScrollInteraction.destroy()
  }
  window.removeEventListener('keydown', handleKeyDown)

})

// Watch sheet changes
watch(() => currentSheetData.value, () => {
  if (virtualScrollInteraction) {
    virtualScrollInteraction.updateDimensions(
        currentSheetData.value.length,
        maxColumns.value
    )
  }
  calculateVisibleRange()
})

// Expose methods for parent component
defineExpose({
  loadFile
})
</script>

<style scoped lang="scss">
.excel-preview-refactored {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: #ffffff;
  overflow: hidden;
}

.loading-container, .error-container, .no-data-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  padding: 40px 20px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid #f3f3f3;
  border-left: 4px solid #007bff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.loading-text, .no-data-text {
  font-size: 14px;
  color: #666;
}

.error-icon, .no-data-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.error-title {
  font-size: 16px;
  font-weight: 600;
  color: #dc3545;
  margin-bottom: 8px;
}

.error-detail {
  font-size: 13px;
  color: #666;
  margin-bottom: 8px;
  max-width: 400px;
  word-break: break-word;
}

.retry-btn {
  padding: 8px 16px;
  background: #dc3545;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  margin-top: 16px;

  &:hover {
    background: #c82333;
  }
}

.preview-content {
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

.virtual-scroll-container {
  overflow: auto;
  position: relative;
  flex: 1;
}

.virtual-scroll-wrapper {
  position: relative;
}

.virtual-table-content {
  position: absolute;
  top: 0;
  left: 0;
}

.excel-table {
  width: 100%;
  border-collapse: separate;
  border-spacing: 0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  font-size: 12px;
  background: white;
}

.column-header, .row-header {
  background: #f8f9fa;
  border: 1px solid #dee2e6;
  padding: 4px 8px;
  font-weight: 600;
  color: #333;
  text-align: center;
  position: sticky;
  z-index: 10;
}

.column-header {
  top: 0;
  min-width: 80px;
  z-index: 20;
}

.row-header {
  left: 0;
  min-width: 40px;
  width: 40px;
  background: #f1f3f4;
  z-index: 20;
}

.cell {
  border: 1px solid #dee2e6;
  border-right: none;
  border-bottom: none;
  padding: 4px 8px;
  min-width: 80px;
  max-width: 200px;
  word-wrap: break-word;
  vertical-align: top;
  background: white;
  cursor: cell;
  user-select: none;
  position: relative;

  &:last-child {
    border-right: 1px solid #dee2e6;
  }

  &:hover {
    background: #f0f8ff;
  }

  &.selected {
    background: #d4edda !important;
    border: 2px solid #007bff !important;
    box-shadow: 0 0 0 1px #007bff;
    z-index: 10;
  }

  &.in-selection {
    background: #e3f2fd !important;
  }

  &.number-cell {
    text-align: right;
  }

  &.date-cell {
    text-align: center;
  }

  &.formula-cell {
    background: #f8f9ff;
  }
}

.even-row .cell {
  background: #fafafa;
}

tr:last-child .cell {
  border-bottom: 1px solid #dee2e6;
}

.sheet-tabs {
  display: flex;
  border-top: 1px solid #dee2e6;
  background: #f8f9fa;
  overflow-x: auto;
  flex-shrink: 0;
}

.sheet-tab {
  padding: 8px 16px;
  background: transparent;
  border: none;
  border-top: 2px solid transparent;
  cursor: pointer;
  font-size: 13px;
  color: #666;
  white-space: nowrap;
  transition: all 0.2s ease;

  &:hover {
    background: #e9ecef;
    color: #333;
  }

  &.active {
    color: #007bff;
    border-top-color: #007bff;
    background: white;
  }
}

// Fade transition
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

