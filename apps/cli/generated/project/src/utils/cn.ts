export function cn(...inputs: any[]): string {
  return inputs.filter(Boolean).join(" ");
}
export default cn;