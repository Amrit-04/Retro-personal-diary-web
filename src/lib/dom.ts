/**
 * Tiny DOM helpers. Everything here is framework-free: build nodes, append, patch
 * what changed. No virtual DOM, no re-render of a whole screen.
 */

export type Child = Node | string | number | null | undefined | false | Child[];

type AttrValue = unknown;

/**
 * h('button', { class: 'btn', onclick: fn, dataset: { id: '7' } }, ['Save'])
 *
 * Attributes starting with "on" bind a listener; `style`/`dataset` take objects;
 * `innerHTML` is only ever used for constant markup from icons.ts, never for data.
 */
export function h<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  attrs?: Record<string, AttrValue>,
  children?: Child | Child[],
): HTMLElementTagNameMap[K];
export function h(
  tag: string,
  attrs?: Record<string, AttrValue>,
  children?: Child | Child[],
): HTMLElement;
export function h(
  tag: string,
  attrs: Record<string, AttrValue> = {},
  children: Child | Child[] = [],
): HTMLElement {
  const node = document.createElement(tag);

  for (const [key, value] of Object.entries(attrs)) {
    if (value === null || value === undefined || value === false) continue;

    if (key.startsWith('on') && typeof value === 'function') {
      node.addEventListener(key.slice(2).toLowerCase(), value as EventListener);
    } else if (key === 'class') {
      node.className = String(value);
    } else if (key === 'style' && typeof value === 'object') {
      for (const [prop, raw] of Object.entries(value as Record<string, string | number>)) {
        // Custom properties (--dx) need setProperty; assigning them is a silent no-op.
        if (prop.startsWith('--')) node.style.setProperty(prop, String(raw));
        else (node.style as unknown as Record<string, string | number>)[prop] = raw;
      }
    } else if (key === 'dataset' && typeof value === 'object') {
      Object.assign(node.dataset, value as Record<string, string>);
    } else if (key === 'html') {
      node.innerHTML = String(value);
    } else if (key in node) {
      (node as unknown as Record<string, unknown>)[key] = value;
    } else {
      node.setAttribute(key, String(value));
    }
  }

  append(node, children);
  return node;
}

/** Appends in one mutation, flattening nested arrays and skipping empty slots. */
export function append(parent: Node, child: Child | Child[]): void {
  const fragment = document.createDocumentFragment();

  const add = (item: Child): void => {
    if (item === null || item === undefined || item === false) return;
    if (Array.isArray(item)) {
      item.forEach(add);
      return;
    }
    fragment.appendChild(
      typeof item === 'string' || typeof item === 'number'
        ? document.createTextNode(String(item))
        : item,
    );
  };

  add(child);
  parent.appendChild(fragment);
}

/** Replaces the children of a node in one DOM mutation. */
export function replaceChildren(host: HTMLElement, ...children: Child[]): void {
  host.replaceChildren();
  append(host, children);
}

export function clear(host: HTMLElement): void {
  host.replaceChildren();
}

/** One listener per container: runs for the nearest ancestor matching `selector`. */
export function delegate<K extends keyof HTMLElementEventMap>(
  root: HTMLElement,
  type: K,
  selector: string,
  handler: (event: HTMLElementEventMap[K], target: HTMLElement) => void,
): void {
  root.addEventListener(type, (event) => {
    const target = (event.target as Element | null)?.closest(selector);
    if (target && root.contains(target)) {
      handler(event as HTMLElementEventMap[K], target as HTMLElement);
    }
  });
}

/**
 * Sets text only when it differs, so a clock tick or a progress update does not
 * dirty layout it does not need to.
 */
export function setText(node: HTMLElement, value: string): void {
  if (node.textContent !== value) node.textContent = value;
}

export function setVisible(node: HTMLElement, visible: boolean): void {
  node.hidden = !visible;
}

export function show(node: HTMLElement): void {
  node.classList.add('is-on');
}

export function hide(node: HTMLElement): void {
  node.classList.remove('is-on');
}
