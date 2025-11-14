import { EventBus, Events } from './EventBus'

/**
 * File Loader
 * Handles file loading and validation
 */
export interface ILoader {
  load(file: File): Promise<ArrayBuffer>
  validateFile(file: File): boolean
}

export class FileLoader implements ILoader {
  private eventBus: EventBus
  private supportedExtensions: Set<string>

  constructor(eventBus: EventBus) {
    this.eventBus = eventBus
    this.supportedExtensions = new Set(['.xlsx', '.xls', '.csv'])
  }

  /**
   * Validate if file is supported
   */
  validateFile(file: File): boolean {
    const fileName = file.name.toLowerCase()
    const isSupported = Array.from(this.supportedExtensions).some(ext => 
      fileName.endsWith(ext)
    )

    if (!isSupported) {
      this.eventBus.emit(Events.FILE_ERROR, {
        message: `不支持的文件格式。支持的格式: ${Array.from(this.supportedExtensions).join(', ')}`
      })
      return false
    }

    // Check file size (max 50MB)
    const maxSize = 50 * 1024 * 1024
    if (file.size > maxSize) {
      this.eventBus.emit(Events.FILE_ERROR, {
        message: '文件大小超过限制（最大 50MB）'
      })
      return false
    }

    return true
  }

  /**
   * Load file as ArrayBuffer
   */
  async load(file: File): Promise<ArrayBuffer> {
    if (!this.validateFile(file)) {
      throw new Error('File validation failed')
    }

    try {
      this.eventBus.emit(Events.FILE_LOADED, { file })
      
      const arrayBuffer = await file.arrayBuffer()
      
      return arrayBuffer
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件加载失败'
      this.eventBus.emit(Events.FILE_ERROR, { message: errorMessage })
      throw error
    }
  }

  /**
   * Get file extension
   */
  getFileExtension(file: File): string {
    const parts = file.name.toLowerCase().split('.')
    return parts.length > 1 ? `.${parts[parts.length - 1]}` : ''
  }

  /**
   * Add supported extension
   */
  addSupportedExtension(extension: string): void {
    this.supportedExtensions.add(extension.toLowerCase())
  }
}

