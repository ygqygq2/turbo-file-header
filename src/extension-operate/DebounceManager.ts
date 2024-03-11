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
}
