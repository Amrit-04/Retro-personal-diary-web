/**
 * Entry point: the boot state machine and nothing else.
 *
 * The four boot screens are static imports because they are needed on the first
 * frame. Firebase and the desktop are reached only through src/boot/machine.ts, via
 * dynamic import, so they never sit on the critical path.
 */
import { render } from 'preact';
import { useEffect } from 'preact/hooks';
import './styles/base.css';
import { Bios } from './boot/Bios';
import { Login } from './boot/Login';
import { Splash } from './boot/Splash';
import { Welcome } from './boot/Welcome';
import { phase, renderPhase, skipBoot, start } from './boot/machine';
import { IconSprite } from './shell/icons';

const ANIMATED_PHASES = new Set(['bios', 'splash']);

function App() {
  const current = phase.value;

  useEffect(() => {
    start();
  }, []);

  // Any press during phases 1-2 ends the animation; after that the shell owns input.
  useEffect(() => {
    if (!ANIMATED_PHASES.has(current)) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' || event.key === 'Enter' || event.key === ' ') skipBoot();
    };
    const onPointerDown = () => skipBoot();
    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('pointerdown', onPointerDown, { passive: true });
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('pointerdown', onPointerDown);
    };
  }, [current]);

  const Desktop = renderPhase();

  if (current === 'desktop') return Desktop ? <Desktop /> : <Welcome />;
  if (current === 'login') return <Login />;
  if (current === 'welcome') return <Welcome />;
  if (current === 'splash') return <Splash />;
  if (current === 'bios') return <Bios />;

  // Same tab, already animated: a plain field while the session resolves.
  return <div class="boot" style={{ background: '#003399' }} />;
}

const root = document.getElementById('app');
if (root) {
  render(
    <>
      <IconSprite />
      <App />
    </>,
    root,
  );
}
