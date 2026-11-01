/**
 * The entry viewer: the Notepad-style window a desktop icon or a Start menu shortcut
 * opens.
 *
 * Plain text, no markdown, pre-wrap so line breaks are exactly what was typed. Admin
 * controls (Edit, Delete) arrive with the editor; this file stays the read path and
 * nothing else, which is why it can be small.
 */
import { useEffect, useState } from 'preact/hooks';
import { getEntry, type Entry } from '../../firebase/entries';
import { longDate } from '../../lib/dates';
import { fileName } from '../../lib/slug';
import { XpIcon } from '../../shell/icons';
import { setTitle, type WindowBodyProps } from '../../shell/windows';
import './viewer.css';

interface State {
  kind: 'loading' | 'ready' | 'missing' | 'error';
  entry?: Entry;
}

export function Viewer({ win }: WindowBodyProps) {
  const date = win.props.date ?? '';
  const [state, setState] = useState<State>({ kind: 'loading' });

  useEffect(() => {
    if (!date) {
      setState({ kind: 'missing' });
      return;
    }
    let alive = true;
    setState({ kind: 'loading' });
    getEntry(date)
      .then((entry) => {
        if (!alive) return;
        setState(entry ? { kind: 'ready', entry } : { kind: 'missing' });
        // The title bar shows the filename, which the document is the only place that knows.
        if (entry) setTitle(win.id, fileName(entry.title));
      })
      .catch(() => {
        if (alive) setState({ kind: 'error' });
      });
    return () => {
      alive = false;
    };
  }, [date, win.id]);

  if (state.kind === 'loading') {
    return (
      <div class="viewer">
        <div class="viewer-loading">
          <span class="viewer-loading-bar" />
        </div>
      </div>
    );
  }

  if (state.kind !== 'ready') {
    return (
      <div class="viewer">
        <div class="viewer-missing">
          <XpIcon name="error" size={32} />
          <p>
            {state.kind === 'error'
              ? 'Diary XP cannot reach the file right now. Check the connection.'
              : `Diary XP cannot find the entry for ${date}. It may have been deleted.`}
          </p>
        </div>
      </div>
    );
  }

  const entry = state.entry!;

  return (
    <article class="viewer">
      <div class="viewer-scroll">
        <h1 class="viewer-title">{entry.title}</h1>
        <p class="viewer-date">{longDate(entry.date)}</p>
        {entry.imageUrl && (
          <img
            class="viewer-photo"
            src={entry.imageUrl}
            width={800}
            height={600}
            alt=""
            loading="lazy"
            decoding="async"
          />
        )}
        <div class="viewer-text">{entry.content}</div>
      </div>
    </article>
  );
}
