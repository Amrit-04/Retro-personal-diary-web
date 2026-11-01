/**
 * The desktop icons: the programs, then one icon per diary entry from the last seven
 * days, newest first. No placeholders for empty days — a diary is not a grid.
 *
 * The cells are the reference's (`Icons/index.js`): 70px wide, 30px of art, a 10px
 * two-line label, a 30px gap. A single tap opens, on every device, so the selection
 * highlight is only ever momentary.
 */
import { useEffect, useState } from 'preact/hooks';
import { fileName } from '../lib/slug';
import { session } from '../boot/machine';
import { launch } from './launch';
import { loadRecent, recent, recentError, retryRecent } from './recent';
import { XpIcon, type IconName } from './icons';
import './desktop-icons.css';

interface IconItem {
  key: string;
  label: string;
  icon: IconName;
  thumb?: string;
  open: () => void;
}

export function DesktopIcons() {
  const [selected, setSelected] = useState<string | null>(null);

  useEffect(() => {
    void loadRecent();
  }, []);

  const entries = recent.value ?? [];
  const isAdmin = session.value?.hasAdminClaim === true;

  const items: IconItem[] = [
    { key: 'explorer', label: 'File Explorer', icon: 'folder', open: () => launch('explorer') },
    { key: 'minesweeper', label: 'Minesweeper', icon: 'mine', open: () => launch('minesweeper') },
    ...(isAdmin
      ? [{ key: 'editor', label: 'New Entry', icon: 'notepad' as IconName, open: () => launch('editor') }]
      : []),
    ...entries.map((entry) => ({
      key: entry.date,
      label: fileName(entry.title),
      icon: 'text' as IconName,
      thumb: entry.thumbUrl || entry.imageUrl,
      open: () => launch('viewer', { date: entry.date, title: entry.title }),
    })),
  ];

  return (
    <>
      <div
        class="icons"
        onPointerDown={(event) => {
          // Empty desktop deselects; an icon stops propagation itself.
          if ((event.target as HTMLElement).closest('.icon')) return;
          setSelected(null);
        }}
      >
        {items.map((item) => (
          <button
            class={`icon${selected === item.key ? ' is-selected' : ''}`}
            type="button"
            key={item.key}
            onPointerDown={() => setSelected(item.key)}
            onClick={() => {
              setSelected(item.key);
              item.open();
            }}
          >
            <span class="icon__img__container">
              {item.thumb ? (
                <img
                  class="icon__img"
                  src={item.thumb}
                  width={30}
                  height={30}
                  alt=""
                  loading="lazy"
                  decoding="async"
                />
              ) : (
                <XpIcon name={item.icon} size={30} />
              )}
            </span>
            <span class="icon__text__container">
              <span class="icon__text">{item.label}</span>
            </span>
          </button>
        ))}
      </div>

      {recentError.value ? (
        <p class="desk-note">
          {recentError.value}{' '}
          <button class="desk-link" type="button" onClick={retryRecent}>
            Retry
          </button>
        </p>
      ) : recent.value === null ? null : (
        entries.length === 0 && (
          <p class="desk-note">Nothing written in the last seven days. Open New Entry to start one.</p>
        )
      )}
    </>
  );
}
