export class Logger {
  info(message: string) {
    console.log(`ℹ ${message}`);
  }

  success(message: string) {
    console.log(`✅ ${message}`);
  }

  warn(message: string) {
    console.log(`⚠ ${message}`);
  }

  error(message: string) {
    console.log(`❌ ${message}`);
  }
}
