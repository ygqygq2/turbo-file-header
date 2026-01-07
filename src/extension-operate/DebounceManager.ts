export class DebounceManager {
  private timers: Map<string, NodeJS.Timeout> = new Map();

  debounce(id: string, fn: () => void, delay: number) {
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
    }
    this.timers.set(
      id,
      setTimeout(() => {
        this.timers.delete(id);
        fn();
      }, delay),
    );
  }

  /**
   * Clear all pending timers
   * Should be called when extension is deactivated
   */
  public dispose() {
    this.timers.forEach((timer) => clearTimeout(timer));
    this.timers.clear();
  }
}
