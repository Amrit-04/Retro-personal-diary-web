/**
 * The desktop: wallpaper, icons, windows, taskbar, Start menu and dialogs.
 *
 * Three details the brief asks for and this file is responsible for: the wallpaper
 * arrives after first paint (an Image() decode, then a 120ms opacity fade, so it
 * cannot shift anything), dropping a picture anywhere on the desktop opens New Entry
 * with that file, and the whole surface fades in within 150ms when the welcome screen
 * hands over.
 */
import { useEffect, useState } from 'preact/hooks';
import { WALLPAPER, WALLPAPER_FALLBACK, WALLPAPER_MOBILE } from '../lib/assets';
import { launch } from './launch';
import { clampAllWindows, isMobile, windows } from './windows';
import { MemoWindow } from './Window';
import { DesktopIcons } from './DesktopIcons';
import { DialogLayer } from './DialogLayer';
import { startOpen } from './StartMenu';
import { Taskbar } from './Taskbar';
import './desktop.css';

export function Desktop() {
  const list = windows.value;
  const mobile = isMobile.value;
  const [wallpaper, setWallpaper] = useState<string | null>(null);
  const [offering, setOffering] = useState(false);

  // Loaded after the first paint, from a flat colour, and never blocks anything.
  useEffect(() => {
    const source = mobile ? WALLPAPER_MOBILE : WALLPAPER;
    const image = new Image();
    image.decoding = 'async';
    image.onload = () => setWallpaper(source);
    image.onerror = () => setWallpaper(null);
    image.src = source;
    return () => {
      image.onload = null;
      image.onerror = null;
    };
  }, [mobile]);

  useEffect(() => {
    let queued = 0;
    const onResize = () => {
      if (queued) return;
      queued = requestAnimationFrame(() => {
        queued = 0;
        clampAllWindows();
      });
    };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      if (queued) cancelAnimationFrame(queued);
    };
  }, []);

  const acceptDrop = (event: {
    preventDefault: () => void;
    dataTransfer: DataTransfer | null;
    target: EventTarget | null;
  }) => {
    event.preventDefault();
    setOffering(false);
    // A drop inside a window belongs to that window: the editor is a drop target too.
    if ((event.target as HTMLElement | null)?.closest('.win')) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file || !file.type.startsWith('image/')) return;
    launch('editor', { file });
  };

  return (
    <div
      class={`desk${mobile && list.length > 0 ? ' has-sheet' : ''}`}
      onPointerDown={() => {
        startOpen.value = false;
      }}
      onDragOver={(event) => {
        if (!event.dataTransfer?.types?.includes('Files')) return;
        event.preventDefault();
        if (!offering) setOffering(true);
      }}
      onDragLeave={(event) => {
        if ((event.relatedTarget as HTMLElement | null)?.closest('.desk')) return;
        setOffering(false);
      }}
      onDrop={acceptDrop}
    >
      <div
        class={`xp-wallpaper${wallpaper ? ' is-loaded' : ''}`}
        style={{
          backgroundColor: WALLPAPER_FALLBACK,
          backgroundImage: wallpaper ? `url(${wallpaper})` : undefined,
        }}
      />

      <div class="desk-area">
        <DesktopIcons />
        {list.map((win) => (
          <MemoWindow key={win.id} win={win} />
        ))}
      </div>

      {offering && (
        <div class="desk-offer">
          <span>Drop a picture to start a new entry</span>
        </div>
      )}

      <Taskbar />
      <DialogLayer />
    </div>
  );
}
