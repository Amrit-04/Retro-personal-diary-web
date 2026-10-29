/**
 * BIOS power-on self test, modelled on the shape of a real Award-era POST: our own
 * branding, monospace text, a memory count that runs up, then the pool-data line.
 * Takes about 1.4 s and stops early if `shouldStop` turns true (the user skipped).
 */

const TOTAL_MEMORY_K = 524288;

export async function runBios(host: HTMLElement, shouldStop: () => boolean): Promise<void> {
  host.textContent = '';

  const line = (text: string) => {
    host.appendChild(document.createTextNode(`${text}\n`));
  };

  line('Diary Modular BIOS v1.00, An Energy Star Ally');
  await wait(80, shouldStop);
  if (shouldStop()) return;

  line('Copyright (C) 2026, Diary Software');
  line('Main Processor : Imaginary CPU 2.40GHz');
  await wait(100, shouldStop);
  if (shouldStop()) return;

  await countMemory(host, shouldStop);
  if (shouldStop()) return;

  line('IDE Channel 0 Device 0 : DIARY-HDD 40GB');
  line('IDE Channel 0 Device 1 : None');
  await wait(140, shouldStop);
  if (shouldStop()) return;

  line('Verifying DMI Pool Data .........');
  line('Boot from Hard Disk...');

  const caret = document.createElement('span');
  caret.className = 'caret';
  caret.textContent = ' ';
  host.appendChild(caret);

  await wait(300, shouldStop);
}

/** Counts 0 -> 524288K with requestAnimationFrame, then adds the white "OK". */
async function countMemory(host: HTMLElement, shouldStop: () => boolean): Promise<void> {
  const label = document.createTextNode('Memory Testing : 0K ');
  host.appendChild(label);

  const start = performance.now();
  const duration = 780;

  await new Promise<void>((resolve) => {
    const tick = (now: number) => {
      if (shouldStop()) {
        resolve();
        return;
      }
      const progress = Math.min(1, (now - start) / duration);
      label.nodeValue = `Memory Testing : ${Math.floor(progress * TOTAL_MEMORY_K)}K `;
      if (progress >= 1) resolve();
      else requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });

  const ok = document.createElement('span');
  ok.className = 'ok';
  ok.textContent = 'OK\n';
  host.appendChild(ok);
}

async function wait(ms: number, shouldStop: () => boolean): Promise<void> {
  if (shouldStop()) return;
  await new Promise<void>((resolve) => {
    setTimeout(resolve, ms);
  });
}
