export function normalizePhoneNumber(number: string): string {
  if (number.startsWith('549')) {
    return number.replace(/^549/, '54');
  }
  return number;
}