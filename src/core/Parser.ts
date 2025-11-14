import { EventBus, Events } from './EventBus'
import type {IParseResult, IWorkbookData} from "./types.ts";

/**
 * Parser Strategy Pattern
 * Abstract parser interface
 */
export interface IParser {
  parse(arrayBuffer: ArrayBuffer, fileName: string): Promise<IParseResult>
  canParse(fileName: string): boolean
}

/**
 * Parser Context - Template Method Pattern
 */
export abstract class BaseParser implements IParser {
  protected eventBus: EventBus

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
  }

  /**
   * Template method for parsing
   */
  async parse(arrayBuffer: ArrayBuffer, fileName: string): Promise<IParseResult> {
    const startTime = Date.now()
    
    try {
      this.eventBus.emit(Events.PARSE_START, { fileName })

      // Validate before parsing
      await this.validateData(arrayBuffer)

      // Parse the data (strategy-specific)
      const workbook = await this.parseData(arrayBuffer)

      // Post-process the data
      const processedWorkbook = await this.postProcess(workbook)

      const parseTime = Date.now() - startTime

      const result: IParseResult = {
        workbook: processedWorkbook,
        metadata: {
          fileName,
          fileSize: arrayBuffer.byteLength,
          sheetCount: processedWorkbook.sheets.length,
          parseTime
        }
      }

      this.eventBus.emit(Events.PARSE_COMPLETE, result)

      return result
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Parse failed'
      this.eventBus.emit(Events.PARSE_ERROR, { message: errorMessage })
      throw error
    }
  }

  /**
   * Check if this parser can handle the file
   */
  abstract canParse(fileName: string): boolean

  /**
   * Validate data before parsing
   */
  protected async validateData(arrayBuffer: ArrayBuffer): Promise<void> {
    if (!arrayBuffer || arrayBuffer.byteLength === 0) {
      throw new Error('Empty file')
    }
  }

  /**
   * Parse data (strategy-specific implementation)
   */
  protected abstract parseData(arrayBuffer: ArrayBuffer): Promise<IWorkbookData>

  /**
   * Post-process parsed data (hook method)
   */
  protected async postProcess(workbook: IWorkbookData): Promise<IWorkbookData> {
    // Default implementation - can be overridden
    return workbook
  }
}

/**
 * Parser Factory
 * Selects appropriate parser based on file type
 */
export class ParserFactory {
  private parsers: IParser[] = []

  /**
   * Register a parser
   */
  register(parser: IParser): void {
    this.parsers.push(parser)
  }

  /**
   * Get appropriate parser for file
   */
  getParser(fileName: string): IParser | null {
    for (const parser of this.parsers) {
      if (parser.canParse(fileName)) {
        return parser
      }
    }
    return null
  }

  /**
   * Parse file with appropriate parser
   */
  async parse(arrayBuffer: ArrayBuffer, fileName: string): Promise<IParseResult> {
    const parser = this.getParser(fileName)
    
    if (!parser) {
      throw new Error(`No parser found for file: ${fileName}`)
    }

    return parser.parse(arrayBuffer, fileName)
  }
}

