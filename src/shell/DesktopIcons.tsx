/**
 * The desktop icon column: the programs, then one icon per diary entry from the last
 * seven days, newest first. No placeholders for empty days — a diary is not a grid.
 *
 * A single tap opens, on every device. The thumbnail is the icon and the slugified
 * filename is the label, which is what makes it read like a folder of files rather
 * than a list of posts.
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
    <div class="desk-icons" onPointerDown={(event) => {
      // Empty desktop deselects; an icon stops propagation itself.
      if ((event.target as HTMLElement).closest('.desk-icon')) return;
      setSelected(null);
    }}>
      {items.map((item) => (
        <button
          class={`desk-icon${selected === item.key ? ' is-selected' : ''}`}
          type="button"
          key={item.key}
          onPointerDown={() => setSelected(item.key)}
          onClick={() => {
            setSelected(item.key);
            item.open();
          }}
        >
          <span class="desk-icon-image">
            {item.thumb ? (
              <img src={item.thumb} width={30} height={30} alt="" loading="lazy" decoding="async" />
            ) : (
              <XpIcon name={item.icon} size={30} />
            )}
          </span>
          <span class="desk-icon-label">{item.label}</span>
        </button>
      ))}

      {recentError.value ? (
        <span class="desk-note">
          {recentError.value}{' '}
          <button class="desk-link" type="button" onClick={retryRecent}>
            Retry
          </button>
        </span>
      ) : recent.value === null ? (
        <p class="desk-note">Opening your diary…</p>
      ) : (
        entries.length === 0 && <p class="desk-note">Nothing written in the last seven days.</p>
      )}
    </div>
  );
}
