/**
 * A 12-line stand-in for React's memo(), so the shell does not have to pull
 * preact/compat into the critical bundle.
 *
 * The window manager needs it in two places: a program inside a window must not
 * re-render when another window takes focus, and a window must not re-render when a
 * sibling opens. Both cases pass the same WindowState object, so a shallow prop
 * comparison is enough to skip the work.
 */
import { Component, createElement, type ComponentChildren, type ComponentType } from 'preact';

export function memoize<P extends object>(Child: ComponentType<P>): ComponentType<P> {
  class Memoized extends Component<P> {
    shouldComponentUpdate(nextProps: P): boolean {
      if (nextProps === this.props) return false;
      const next = nextProps as Record<string, unknown>;
      const previous = this.props as Record<string, unknown>;
      for (const key of Object.keys(next)) {
        if (key === 'children') continue;
        if (next[key] !== previous[key]) return true;
      }
      return false;
    }

    render(): ComponentChildren {
      return createElement(Child, this.props);
    }
  }

  return Memoized as unknown as ComponentType<P>;
}
