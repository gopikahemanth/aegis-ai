export class Memory {
  private history: string[] = [];

  add(message: string) {
    this.history.push(message);
  }

  getAll() {
    return this.history;
  }

  clear() {
    this.history = [];
  }
}
