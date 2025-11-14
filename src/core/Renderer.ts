import { Cell } from './Cell'
import type { ICellData } from './types'
import { EventBus } from './EventBus'

/**
 * Renderer - Handles cell rendering and formatting
 */
export interface IRenderer {
  formatCellValue(cell: Cell): string
  getCellClass(cell: Cell): string
  getCellStyle(cell: Cell): Record<string, any>
}

export class TableRenderer implements IRenderer {
  // EventBus reserved for future use (e.g., cell render events)
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  // private eventBus: EventBus

  constructor(_eventBus: EventBus) {
    // this.eventBus = eventBus
  }

  /**
   * Format cell value for display
   */
  formatCellValue(cell: Cell): string {
    const data = cell.getData()
    const value = cell.getValue()
    
    if (value === null || value === undefined) return ''

    const type = cell.getType()

    switch (type) {
      case '2': // Number
      case 'number':
        return this.formatNumber(value, data.style?.numFmt)

      case '9': // Boolean
      case 'boolean':
        return value ? 'TRUE' : 'FALSE'

      case '4': // Date
      case 'date':
        return this.formatDate(value, data.style?.numFmt)

      case '3': // Text
      case 'string':
        return typeof value === 'string' ? value.trim() : String(value || '')

      case '6': // Formula
      case 'formula':
        return this.formatFormula(value, data)

      case '8': // Rich Text
        return this.formatRichText(value)

      default:
        return this.formatDefault(value)
    }
  }

  /**
   * Get CSS class for cell
   */
  getCellClass(cell: Cell): string {
    const classes: string[] = []
    const data = cell.getData()
    const type = cell.getType()

    if (type === 'number' || type === '2') classes.push('number-cell')
    if (type === 'date' || type === '4') classes.push('date-cell')
    if (cell.getFormula()) classes.push('formula-cell')

    // Check for text wrapping
    if (data.style?.alignment?.wrapText) {
      classes.push('wrap-text')
    }

    // Check for long text
    const cellValue = this.formatCellValue(cell)
    if (cellValue?.length > 20) {
      classes.push('long-text')
    }

    if (cell.isMerged()) {
      classes.push('merged-cell')
    }

    return classes.join(' ')
  }

  /**
   * Get inline style for cell
   */
  getCellStyle(cell: Cell): Record<string, any> {
    const style: Record<string, any> = {}
    const cellStyle = cell.getStyle()

    if (!cellStyle) return style

    // Font styles
    if (cellStyle.font) {
      const font = cellStyle.font
      if (font.bold) style.fontWeight = 'bold'
      if (font.italic) style.fontStyle = 'italic'
      if (font.underline) style.textDecoration = 'underline'
      if (font.strike) style.textDecoration = 'line-through'
      if (font.size) style.fontSize = `${font.size}px`
      if (font.name) style.fontFamily = font.name

      // Font color
      if (font.color) {
        if (font.color.argb) {
          style.color = `#${font.color.argb.slice(2)}`
        } else if (font.color.rgb) {
          style.color = `#${font.color.rgb}`
        }
      }
    }

    // Background fill
    if (cellStyle.fill) {
      if (cellStyle.fill.type === 'pattern' && cellStyle.fill.pattern === 'solid') {
        if (cellStyle.fill.fgColor) {
          if (cellStyle.fill.fgColor.argb) {
            style.backgroundColor = `#${cellStyle.fill.fgColor.argb.slice(2)}`
          } else if (cellStyle.fill.fgColor.rgb) {
            style.backgroundColor = `#${cellStyle.fill.fgColor.rgb}`
          }
        }
      } else if (cellStyle.fill.type === 'gradient') {
        // Simplified gradient handling
        if (cellStyle.fill.stops && cellStyle.fill.stops.length > 0) {
          const firstStop = cellStyle.fill.stops[0]
          if (firstStop?.color?.argb) {
            style.backgroundColor = `#${firstStop.color.argb.slice(2)}`
          }
        }
      }
    }

    // Alignment
    if (cellStyle.alignment) {
      const alignment = cellStyle.alignment
      if (alignment.horizontal) {
        style.textAlign = alignment.horizontal
      }
      if (alignment.vertical) {
        style.verticalAlign = alignment.vertical === 'middle' ? 'middle' : alignment.vertical
      }
      if (alignment.wrapText) {
        style.whiteSpace = 'pre-wrap'
        style.wordWrap = 'break-word'
      }
      if (alignment.indent) {
        style.paddingLeft = `${alignment.indent * 8}px`
      }
    }

    // Number format
    if (cellStyle.numFmt) {
      if (cellStyle.numFmt.includes('%') || cellStyle.numFmt.includes('¥') || cellStyle.numFmt.includes('$')) {
        style.textAlign = style.textAlign || 'right'
      }
    }

    return style
  }

  /**
   * Format number
   */
  private formatNumber(value: any, numFmt?: string): string {
    if (typeof value !== 'number') return String(value)
    if (!numFmt || numFmt === 'General') {
      return value.toString()
    }

    // Percentage
    if (numFmt.includes('%')) {
      return `${(value * 100).toFixed(2)}%`
    }

    // Currency
    if (numFmt.includes('￥') || numFmt.includes('¥')) {
      return `¥${value.toFixed(2)}`
    }
    if (numFmt.includes('$')) {
      return `$${value.toFixed(2)}`
    }

    // Decimal places
    if (numFmt.includes('.00')) {
      return value.toFixed(2)
    }
    if (numFmt.includes('.0')) {
      return value.toFixed(1)
    }

    // Thousand separator
    if (numFmt.includes(',')) {
      return value.toLocaleString()
    }

    return value.toString()
  }

  /**
   * Format date
   */
  private formatDate(value: any, numFmt?: string): string {
    let date: Date

    if (value instanceof Date) {
      date = value
    } else if (typeof value === 'number') {
      // Excel date (days since 1900-01-01)
      date = new Date((value - 25569) * 86400 * 1000)
    } else if (typeof value === 'string') {
      date = new Date(value)
    } else {
      return String(value)
    }

    if (isNaN(date.getTime())) {
      return String(value)
    }

    // Format based on numFmt
    if (numFmt) {
      if (numFmt.includes('yyyy')) {
        return date.toISOString().split('T')[0] || '' // YYYY-MM-DD
      }
      if (numFmt.includes('mm:ss')) {
        return date.toTimeString().split(' ')[0] || '' // HH:MM:SS
      }
      if (numFmt.includes('h:mm')) {
        const hours = date.getHours()
        const minutes = date.getMinutes()
        return `${hours}:${minutes.toString().padStart(2, '0')}`
      }
    }

    return date.toLocaleDateString()
  }

  /**
   * Format formula
   */
  private formatFormula(value: any, data: ICellData): string {
    // If formula has result, show result
    if (typeof value?.result === 'number') {
      return value.result.toFixed(2)
    }
    if (value?.result instanceof Date) {
      return this.formatDate(value.result, data.style?.numFmt)
    }
    if (value?.result !== undefined && value?.result !== null) {
      if (value?.result.error) {
        return value?.result.error
      }
      return String(value.result)
    }

    // Show formula string
    const formula = value?.formula || data.formula
    return formula ? `=${formula}` : ''
  }

  /**
   * Format rich text
   */
  private formatRichText(value: any): string {
    if (!Array.isArray(value?.richText)) {
      return typeof value === 'string' ? value : String(value || '')
    }

    return value.richText.map((rt: any) => {
      const text = rt.text ?? ''
      return this.escapeHtml(text)
    }).join('')
  }

  /**
   * Format default
   */
  private formatDefault(value: any): string {
    if (typeof value === 'string' || typeof value === 'number') {
      return String(value)
    }
    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE'
    }
    if (value && typeof value === 'object') {
      if (value.text !== undefined) {
        return String(value.text)
      }
      if (value.result !== undefined) {
        return String(value.result)
      }
      if (value.formula) {
        return `=${value.formula}`
      }
      return ''
    }
    return String(value || '')
  }

  /**
   * Escape HTML
   */
  private escapeHtml(text: string): string {
    return text
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
  }
}

