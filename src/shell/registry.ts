/**
 * What each program looks like when it opens: title, icon, default and minimum
 * size, and whether it can be resized. Minesweeper is the one window a user cannot
 * stretch, because its cells are a fixed pixel grid.
 *
 * An app that is not in this map yet has no window: launch() notices and says so
 * instead of opening an empty frame.
 */
import type { ComponentType } from 'preact';
import { fileName } from '../lib/slug';
import type { IconName } from './icons';
import type { AppId, CaptionName, WindowBodyProps, WindowProps } from './windows';

export interface AppSpec {
  icon: IconName;
  title(props: WindowProps): string;
  width: number;
  height: number;
  minWidth: number;
  minHeight: number;
  resizable: boolean;
  /** Which caption buttons to draw. Minesweeper is fixed-size, so it has no maximize. */
  captions?: CaptionName[];
  singleton: boolean;
  load(): Promise<ComponentType<WindowBodyProps>>;
}

const SPECS: Partial<Record<AppId, AppSpec>> = {
  viewer: {
    icon: 'text',
    title: (props) => fileName(props.title ?? props.date ?? 'entry'),
    width: 640,
    /* Tall enough that the 4:3 photo plus the sample text fits at the full content
       width. If it did not, the vertical scrollbar would steal 15px of width, shrink
       the photo, make the content fit again, and leave a bar that is never needed. */
    height: 700,
    minWidth: 320,
    minHeight: 220,
    resizable: true,
    singleton: true,
    load: () => import('../apps/viewer/Viewer').then((m) => m.Viewer),
  },
};

export function getSpec(app: AppId): AppSpec | undefined {
  return SPECS[app];
}

export function hasApp(app: AppId): boolean {
  return SPECS[app] !== undefined;
}

/** Names the user sees on the desktop, in the Start menu, and in messages. */
export const APP_LABEL: Record<AppId, string> = {
  explorer: 'File Explorer',
  viewer: 'Notepad',
  editor: 'New Entry',
  minesweeper: 'Minesweeper',
};
