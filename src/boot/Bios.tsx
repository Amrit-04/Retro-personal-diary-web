/**
 * The power-on self test.
 *
 * Structure and pacing follow the win32.run reference, with the brand names
 * rewritten to fictional ones. Lines are revealed on a timer cut from the same
 * sleep() the machine uses, so a skip stops the typing instantly instead of
 * leaving a half-typed POST behind.
 */
import { useEffect, useState } from 'preact/hooks';
import { reduced } from './motion';
import { sleep } from './machine';

/**
 * Pacing: quick through the POST blocks, then a longer beat on the last two lines so
 * "Verifying DMI Pool Data ..." can actually be read inside the ~1.5 s hold.
 */
const STEP_MS = reduced ? 0 : 64;
const FINAL_STEP_MS = reduced ? 0 : 180;

const LINES: string[] = [
  'Greenleaf Modular BIOS v6.00PG, An Energy Star Ally',
  'Copyright (C) 1984-2003, Greenleaf Software, Inc.',
  '',
  'Meadow 845PE-ME Motherboard',
  'Copyright (C) 1984-2003, Meadow Microdevices, Inc.',
  '',
  'Main Processor : Sable(R) Pentio(TM) 4 CPU  2.40GHz',
  'Memory Testing : 524288K OK',
  '',
  'IDE Channel 0 Device 0 : Wondra WD400BB-00JRA0   40.0GB  Ultra DMA Mode-5',
  'IDE Channel 0 Device 1 : None',
  'IDE Channel 1 Device 0 : Kestrel DVD-E616A3   48x/16x DVD-ROM',
  'IDE Channel 1 Device 1 : None',
  '',
  'Verifying DMI Pool Data ..............',
  'Boot from Hard Disk...',
];

export function Bios() {
  const [shown, setShown] = useState(reduced ? LINES.length : 1);

  useEffect(() => {
    if (reduced) return;
    let stopped = false;
    void (async () => {
      for (let i = 1; i < LINES.length; i++) {
        await sleep(Math.max(i >= 14 ? FINAL_STEP_MS : STEP_MS, 1));
        if (stopped) return;
        setShown(i + 1);
      }
    })();
    return () => {
      stopped = true;
    };
  }, []);

  return (
    <div class="boot boot-bios">
      {LINES.slice(0, shown).map((line, index) => (
        <div class="bios-block" key={index}>
          {line || ' '}
        </div>
      ))}
      {shown >= LINES.length && <span class="bios-cursor" aria-hidden="true" />}
      <div class="bios-bottom">
        <span>F2 for Setup</span>
        <span>F10 for Boot Menu</span>
        <span>F12 for Network Boot</span>
      </div>
    </div>
  );
}
