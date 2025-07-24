export function isIdentNameValid(name: string) {
  return (
    name &&
    !name.startsWith(" ") &&
    !name.endsWith(" ") &&
    name.trim().length > 0 &&
    !/[\\'\\"\\‘\\“:;：；、./\\]/g.test(name)
  );
}
