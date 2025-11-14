/**
 * EventBus - Observer Pattern
 * Manages event subscriptions and notifications
 */
export type EventCallback = (...args: any[]) => void

export interface IEventBus {
  on(event: string, callback: EventCallback): void
  off(event: string, callback: EventCallback): void
  emit(event: string, ...args: any[]): void
  clear(): void
}

export class EventBus implements IEventBus {
  private events: Map<string, Set<EventCallback>>

  constructor() {
    this.events = new Map()
  }

  /**
   * Subscribe to an event
   */
  on(event: string, callback: EventCallback): void {
    if (!this.events.has(event)) {
      this.events.set(event, new Set())
    }
    this.events.get(event)!.add(callback)
  }

  /**
   * Unsubscribe from an event
   */
  off(event: string, callback: EventCallback): void {
    if (this.events.has(event)) {
      this.events.get(event)!.delete(callback)
    }
  }

  /**
   * Emit an event to all subscribers
   */
  emit(event: string, ...args: any[]): void {
    if (this.events.has(event)) {
      this.events.get(event)!.forEach(callback => {
        try {
          callback(...args)
        } catch (error) {
          console.error(`Error in event handler for ${event}:`, error)
        }
      })
    }
  }

  /**
   * Clear all event listeners
   */
  clear(): void {
    this.events.clear()
  }

  /**
   * Get all registered events
   */
  getEvents(): string[] {
    return Array.from(this.events.keys())
  }

  /**
   * Get subscriber count for an event
   */
  getSubscriberCount(event: string): number {
    return this.events.get(event)?.size || 0
  }
}

export const Events = {
  FILE_LOADED: 'file:loaded',
  FILE_ERROR: 'file:error',
  PARSE_START: 'parse:start',
  PARSE_COMPLETE: 'parse:complete',
  PARSE_ERROR: 'parse:error',
  SHEET_CHANGE: 'sheet:change',
  CELL_SELECT: 'cell:select',
  CELL_HOVER: 'cell:hover',
  SCROLL: 'scroll',
  ZOOM: 'zoom',
  RENDER_START: 'render:start',
  RENDER_COMPLETE: 'render:complete',
} as const

