import * as XLSX from 'exceljs'
import { BaseParser } from '../Parser'
import { EventBus } from '../EventBus'
import type { IWorkbookData, IWorksheetData, ICellData } from '../types'

/**
 * XLSX Parser Strategy
 * Handles .xlsx and .xls files using exceljs
 */
export class XLSXParserStrategy extends BaseParser {
  constructor(eventBus: EventBus) {
    super(eventBus)
  }

  /**
   * Check if file is XLSX format
   */
  canParse(fileName: string): boolean {
    const lowerName = fileName.toLowerCase()
    return lowerName.endsWith('.xlsx') || lowerName.endsWith('.xls')
  }

  /**
   * Parse XLSX data
   */
  protected async parseData(arrayBuffer: ArrayBuffer): Promise<IWorkbookData> {
    const workbook = new XLSX.Workbook()
    await workbook.xlsx.load(arrayBuffer)

    const sheets: IWorksheetData[] = []

    for (const worksheet of workbook.worksheets) {
      const sheetData = this.parseWorksheet(worksheet)
      sheets.push(sheetData)
    }

    return {
      sheets,
      activeSheetIndex: 0
    }
  }

  /**
   * Parse worksheet into structured data
   */
  private parseWorksheet(worksheet: XLSX.Worksheet): IWorksheetData {
    const data: ICellData[][] = []

    const dimensions = worksheet.dimensions
    if (!dimensions) {
      return {
        name: worksheet.name,
        data: [],
        dimensions: undefined
      }
    }

    const startRow = Math.max(1, dimensions.top)
    const endRow = dimensions.bottom
    const startCol = Math.max(1, dimensions.left)
    const endCol = dimensions.right

    // Parse merged cells
    const mergedCells = this.parseMergedCells(worksheet)

    // Parse rows and cells
    for (let rowNum = startRow; rowNum <= endRow; rowNum++) {
      const row: ICellData[] = []
      const worksheetRow = worksheet.getRow(rowNum)

      for (let colNum = startCol; colNum <= endCol; colNum++) {
        const cell = worksheetRow.getCell(colNum)
        const cellKey = `${rowNum}-${colNum}`
        const mergeInfo = mergedCells.get(cellKey)

        const cellData: ICellData = {
          value: cell.value,
          type: cell.type?.toString() || 'string',
          style: cell.style as any,
          formula: cell.formula as any,
          address: cell.address
        }

        // Handle merged cells
        if (mergeInfo) {
          const isMaster = mergeInfo.master.row === rowNum && mergeInfo.master.col === colNum

          if (isMaster) {
            cellData.isMerged = true
            cellData.rowspan = mergeInfo.rowspan
            cellData.colspan = mergeInfo.colspan
          } else {
            cellData.hidden = true
            cellData.masterCell = mergeInfo.master
          }
        }

        row.push(cellData)
      }

      data.push(row)
    }

    return {
      name: worksheet.name,
      data,
      dimensions: {
        top: startRow,
        bottom: endRow,
        left: startCol,
        right: endCol
      }
    }
  }

  /**
   * Parse merged cells information
   */
  private parseMergedCells(worksheet: XLSX.Worksheet): Map<string, {
    master: { row: number; col: number }
    rowspan: number
    colspan: number
  }> {
    const mergedCells = new Map<string, {
      master: { row: number; col: number }
      rowspan: number
      colspan: number
    }>()

    const mergeCellsData = (worksheet.model as any).merges
    if (!mergeCellsData) return mergedCells

    for (const mergeRange of mergeCellsData) {
      const match = mergeRange.match(/^([A-Z]+)(\d+):([A-Z]+)(\d+)$/)
      if (match) {
        const startColStr = match[1]
        const startRowNum = parseInt(match[2])
        const endColStr = match[3]
        const endRowNum = parseInt(match[4])

        const startColNum = this.columnStringToNumber(startColStr)
        const endColNum = this.columnStringToNumber(endColStr)

        const rowspan = endRowNum - startRowNum + 1
        const colspan = endColNum - startColNum + 1

        // Record master cell and merged information
        for (let r = startRowNum; r <= endRowNum; r++) {
          for (let c = startColNum; c <= endColNum; c++) {
            const key = `${r}-${c}`
            mergedCells.set(key, {
              master: { row: startRowNum, col: startColNum },
              rowspan,
              colspan
            })
          }
        }
      }
    }

    return mergedCells
  }

  /**
   * Convert column string to number (A=1, B=2, ..., Z=26, AA=27)
   */
  private columnStringToNumber(colStr: string): number {
    let result = 0
    for (let i = 0; i < colStr.length; i++) {
      result = result * 26 + (colStr.charCodeAt(i) - 64)
    }
    return result
  }
}

