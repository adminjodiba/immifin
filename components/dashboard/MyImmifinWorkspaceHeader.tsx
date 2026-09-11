export function formatWelcomeBack(welcomeName: string): string {
  if (!welcomeName.trim() || welcomeName.trim() === "Welcome") {
    return "Welcome back";
  }

  return `Welcome back, ${welcomeName.trim()}`;
}
