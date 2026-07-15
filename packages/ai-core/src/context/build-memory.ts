export interface BuildRecord {
  timestamp: Date;
  success: boolean;
  message: string;
}

export class BuildMemory {
  private readonly history: BuildRecord[] = [];

  add(
    success: boolean,
    message: string,
  ) {
    this.history.push({
      timestamp: new Date(),
      success,
      message,
    });
  }

  latest() {
    return this.history.at(-1);
  }

  failures() {
    return this.history.filter(
      (record) => !record.success,
    );
  }

  clear() {
    this.history.length = 0;
  }
}
