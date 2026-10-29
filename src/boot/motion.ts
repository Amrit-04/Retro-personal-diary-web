/**
 * One media query, read once per boot.
 *
 * When it matches, every hold gets short and the BIOS types its lines all at once:
 * the sequence still tells the user the machine is starting, it just stops making
 * them wait for it.
 */
export function prefersReducedMotion(): boolean {
  return typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
}

export const reduced = prefersReducedMotion();
