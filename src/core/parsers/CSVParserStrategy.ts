import Papa from 'papaparse'
import { BaseParser } from '../Parser'
import { EventBus } from '../EventBus'
import type { IWorkbookData, IWorksheetData, ICellData } from '../types'

/**
 * CSV Parser Strategy
 * Handles .csv files using papaparse
 */
export class CSVParserStrategy extends BaseParser {
  constructor(eventBus: EventBus) {
    super(eventBus)
  }

  /**
   * Check if file is CSV format
   */
  canParse(fileName: string): boolean {
    return fileName.toLowerCase().endsWith('.csv')
  }

  /**
   * Parse CSV data
   */
  protected async parseData(arrayBuffer: ArrayBuffer): Promise<IWorkbookData> {
    // Convert ArrayBuffer to string
    const decoder = new TextDecoder('utf-8')
    const csvString = decoder.decode(arrayBuffer)

    return new Promise((resolve, reject) => {
      Papa.parse(csvString, {
        complete: (results) => {
          try {
            const worksheet = this.convertToWorksheet(results.data as string[][])
            resolve({
              sheets: [worksheet],
              activeSheetIndex: 0
            })
          } catch (error) {
            reject(error)
          }
        },
        error: (error: Error) => {
          reject(error)
        }
      })
    })
  }

  /**
   * Convert parsed CSV data to worksheet format
   */
  private convertToWorksheet(rawData: string[][]): IWorksheetData {
    const data: ICellData[][] = []

    for (let rowIndex = 0; rowIndex < rawData.length; rowIndex++) {
      const rawRow = rawData[rowIndex]
      if (!rawRow) continue
      
      const row: ICellData[] = []

      for (let colIndex = 0; colIndex < rawRow.length; colIndex++) {
        const value = rawRow[colIndex] || ''
        const cellData: ICellData = {
          value: this.inferCellValue(value),
          type: this.inferCellType(value),
          address: this.getAddress(rowIndex + 1, colIndex + 1)
        }

        row.push(cellData)
      }

      data.push(row)
    }

    return {
      name: 'Sheet1',
      data,
      dimensions: data.length > 0 ? {
        top: 1,
        bottom: data.length,
        left: 1,
        right: data[0]?.length || 0
      } : undefined
    }
  }

  /**
   * Infer cell value type
   */
  private inferCellValue(value: string): any {
    if (value === '' || value === null || value === undefined) {
      return ''
    }

    // Try to parse as number
    const num = parseFloat(value)
    if (!isNaN(num) && value.trim() !== '') {
      return num
    }

    // Try to parse as boolean
    if (value.toLowerCase() === 'true') return true
    if (value.toLowerCase() === 'false') return false

    // Return as string
    return value
  }

  /**
   * Infer cell type
   */
  private inferCellType(value: string): string {
    if (value === '' || value === null || value === undefined) {
      return 'string'
    }

    const num = parseFloat(value)
    if (!isNaN(num) && value.trim() !== '') {
      return 'number'
    }

    if (value.toLowerCase() === 'true' || value.toLowerCase() === 'false') {
      return 'boolean'
    }

    return 'string'
  }

  /**
   * Get cell address (e.g., A1, B2)
   */
  private getAddress(row: number, col: number): string {
    let colName = ''
    let colNum = col

    while (colNum > 0) {
      const remainder = (colNum - 1) % 26
      colName = String.fromCharCode(65 + remainder) + colName
      colNum = Math.floor((colNum - 1) / 26)
    }

    return `${colName}${row}`
  }
}

