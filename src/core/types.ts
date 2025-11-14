/**
 * Core type definitions
 */

export interface ICellData {
  value: any
  type: string
  style?: ICellStyle
  formula?: string
  isMerged?: boolean
  masterCell?: { row: number; col: number }
  rowspan?: number
  colspan?: number
  address?: string
  hidden?: boolean
  originalRowIndex?: number
  originalColIndex?: number
}

export interface ICellStyle {
  font?: {
    bold?: boolean
    italic?: boolean
    underline?: boolean
    strike?: boolean
    size?: number
    name?: string
    color?: {
      argb?: string
      rgb?: string
    }
    vertAlign?: 'superscript' | 'subscript'
  }
  fill?: {
    type?: string
    pattern?: string
    fgColor?: {
      argb?: string
      rgb?: string
    }
    bgColor?: {
      argb?: string
      rgb?: string
    }
    stops?: Array<{
      position?: number
      color?: {
        argb?: string
      }
    }>
  }
  alignment?: {
    horizontal?: 'left' | 'center' | 'right'
    vertical?: 'top' | 'middle' | 'bottom'
    wrapText?: boolean
    indent?: number
  }
  border?: {
    top?: IBorder
    bottom?: IBorder
    left?: IBorder
    right?: IBorder
  }
  numFmt?: string
}

export interface IBorder {
  style?: string
  color?: {
    argb?: string
    rgb?: string
  }
}

export interface IWorksheetData {
  name: string
  data: ICellData[][]
  dimensions?: {
    top: number
    bottom: number
    left: number
    right: number
  }
}

export interface IWorkbookData {
  sheets: IWorksheetData[]
  activeSheetIndex: number
}

export interface IParseResult {
  workbook: IWorkbookData
  metadata: {
    fileName: string
    fileSize: number
    sheetCount: number
    parseTime: number
  }
}

