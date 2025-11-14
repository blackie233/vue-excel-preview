import type {ICellData, ICellStyle} from "./types.ts";

/**
 * Cell - Represents a single cell in the spreadsheet
 * Supports Decorator Pattern for style composition
 */
export class Cell {
  private data: ICellData
  private decorators: CellDecorator[] = []

  constructor(data: ICellData) {
    this.data = { ...data }
  }

  /**
   * Get cell data
   */
  getData(): ICellData {
    return { ...this.data }
  }

  /**
   * Get cell value
   */
  getValue(): any {
    return this.data.value
  }

  /**
   * Set cell value
   */
  setValue(value: any): void {
    this.data.value = value
  }

  /**
   * Get cell type
   */
  getType(): string {
    return this.data.type
  }

  /**
   * Get cell style (with decorators applied)
   */
  getStyle(): ICellStyle {
    let style = { ...this.data.style } as ICellStyle

    // Apply all decorators
    for (const decorator of this.decorators) {
      style = decorator.apply(style)
    }

    return style
  }

  /**
   * Add a style decorator
   */
  addDecorator(decorator: CellDecorator): this {
    this.decorators.push(decorator)
    return this
  }

  /**
   * Remove all decorators
   */
  clearDecorators(): this {
    this.decorators = []
    return this
  }

  /**
   * Check if cell is merged
   */
  isMerged(): boolean {
    return !!this.data.isMerged
  }

  /**
   * Check if cell is hidden (part of merge)
   */
  isHidden(): boolean {
    return !!this.data.hidden
  }

  /**
   * Get formula if exists
   */
  getFormula(): string | undefined {
    return this.data.formula
  }

  /**
   * Clone cell
   */
  clone(): Cell {
    const clonedData = JSON.parse(JSON.stringify(this.data))
    const clonedCell = new Cell(clonedData)
    clonedCell.decorators = [...this.decorators]
    return clonedCell
  }
}

/**
 * Cell Decorator - Base class for decorating cells with styles
 * Decorator Pattern
 */
export abstract class CellDecorator {
  /**
   * Apply decoration to style
   */
  abstract apply(style: ICellStyle): ICellStyle
}