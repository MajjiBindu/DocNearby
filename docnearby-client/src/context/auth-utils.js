export function safeJsonParse(str) {
  try {
    return str ? JSON.parse(str) : null;
  } catch {
    return null;
  }
}
