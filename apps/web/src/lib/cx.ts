/** Join truthy class names. Tiny local helper to avoid a clsx dependency. */
export function cx(
  ...parts: Array<string | false | null | undefined>
): string {
  return parts.filter(Boolean).join(" ");
}
