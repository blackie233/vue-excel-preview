import { EventBus } from './EventBus'
import { FileLoader } from './Loader'
import { ParserFactory } from './Parser'
import { XLSXParserStrategy } from './parsers/XLSXParserStrategy'
import { CSVParserStrategy } from './parsers/CSVParserStrategy'
import { TableRenderer } from './Renderer'
import type {IParseResult, IWorkbookData} from "./types.ts";

/**
 * ExcelViewer - Main facade class
 * Coordinates all components using Facade Pattern
 */
export class ExcelViewer {
  private eventBus: EventBus
  private loader: FileLoader
  private parserFactory: ParserFactory
  private renderer: TableRenderer
  private currentWorkbook: IWorkbookData | null = null
  private currentParseResult: IParseResult | null = null

  constructor() {
    // Initialize EventBus
    this.eventBus = new EventBus()

    // Initialize Loader
    this.loader = new FileLoader(this.eventBus)

    // Initialize Parser Factory and register parsers
    this.parserFactory = new ParserFactory()
    this.parserFactory.register(new XLSXParserStrategy(this.eventBus))
    this.parserFactory.register(new CSVParserStrategy(this.eventBus))

    // Initialize Renderer
    this.renderer = new TableRenderer(this.eventBus)

    this.setupEventListeners()
  }

  /**
   * Setup internal event listeners
   */
  private setupEventListeners(): void {
    // You can add internal event handlers here if needed
  }

  /**
   * Load and parse file
   */
  async loadFile(file: File): Promise<IParseResult> {
    try {
      // Load file
      const arrayBuffer = await this.loader.load(file)

      // Parse file
      const parseResult = await this.parserFactory.parse(arrayBuffer, file.name)

      // Store result
      this.currentWorkbook = parseResult.workbook
      this.currentParseResult = parseResult

      return parseResult
    } catch (error) {
      throw error
    }
  }

  /**
   * Get current workbook
   */
  getWorkbook(): IWorkbookData | null {
    return this.currentWorkbook
  }

  /**
   * Get parse result with metadata
   */
  getParseResult(): IParseResult | null {
    return this.currentParseResult
  }

  /**
   * Get renderer
   */
  getRenderer(): TableRenderer {
    return this.renderer
  }

  /**
   * Get event bus for external subscriptions
   */
  getEventBus(): EventBus {
    return this.eventBus
  }

  /**
   * Subscribe to events
   */
  on(event: string, callback: (...args: any[]) => void): void {
    this.eventBus.on(event, callback)
  }

  /**
   * Unsubscribe from events
   */
  off(event: string, callback: (...args: any[]) => void): void {
    this.eventBus.off(event, callback)
  }

  /**
   * Cleanup
   */
  destroy(): void {
    this.eventBus.clear()
    this.currentWorkbook = null
    this.currentParseResult = null
  }
}

