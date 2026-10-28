/**
 * Splash screen: the wordmark and the sliding three-block bar. CSS animation only,
 * transform only. Its job is to cover the loading, so it holds for at least `minMs`,
 * releases as soon as `loaded` resolves, and never exceeds `maxMs`. A skip gesture
 * ends it immediately — the brief says tap/Esc/Enter jumps to the login screen.
 */

export interface SplashOptions {
  minMs: number;
  maxMs: number;
  loaded: Promise<unknown>;
  skip: Promise<void>;
}

export async function runSplash(host: HTMLElement, options: SplashOptions): Promise<void> {
  host.classList.add('is-on');

  const ready = Promise.all([delay(options.minMs), options.loaded.catch(() => null)]);
  await Promise.race([ready, delay(options.maxMs), options.skip]);

  host.classList.remove('is-on');
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
