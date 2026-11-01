# Attributions

## ShizukuIchi/winXP — MIT

The Luna chrome in this project is transcribed from [ShizukuIchi/winXP](https://github.com/ShizukuIchi/winXP)
(MIT). The reference is a React application; here the same values are written as
plain CSS and Preact components, with the nested styled-components selectors
flattened into real class names. No React code is imported.

Files that carry the transcription:

- `src/shell/window.css` — window frame, title bar gradients, caption buttons, app content
- `src/shell/footer.css` — taskbar, Start button, taskbar buttons, tray
- `src/shell/footer-menu.css` — Start menu columns, header, items, footer, orange rule
- `src/shell/desktop-icons.css` — desktop icon and selection styling
- `src/shell/dialog.css` — Luna message box

The MIT licence of that project:

> MIT License
>
> Copyright (c) 2019 Shizuku Ichi
>
> Permission is hereby granted, free of charge, to any person obtaining a copy
> of this software and associated documentation files (the "Software"), to deal
> in the Software without restriction, including without limitation the rights
> to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
> copies of the Software, and to permit persons to whom the Software is
> furnished to do so, subject to the following conditions:
>
> The above copyright notice and this permission notice shall be included in all
> copies or substantial portions of the Software.
>
> THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
> IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
> FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
> AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
> LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
> OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
> SOFTWARE.

## win32.run — BIOS structure

The POST screen follows the structure and pacing of [win32.run](https://win32.run):
the lead-in, memory test, IDE channel lines, and "Verifying DMI Pool Data ...".
Brand names and the copyright lines are reworded; the text is written for this
project, not copied as a code file.

## mitchivin.com — logon screen

The two-tone logon screen (navy page, inset blue field, hairline rules, centred
split, user tile, footer with Restart) takes its layout and measurements from
[mitchivin.com](https://mitchivin.com). No code or image assets were copied.

## Brand marks

Brief §3 forbids the literal "Windows XP" wordmark and the Windows flag logo.
Both are replaced by original drawings in `src/shell/marks.tsx`: an open book with
a ribbon (`LogoMark`) and the "Diary" + small "XP" wordmark (`Wordmark`). They sit
in the positions the reference uses for its marks.

## Other assets

- Wallpapers: generated for this project, then encoded with `scripts/optimize-assets.mjs`.
- Startup sound: synthesised by `scripts/make-chime.mjs`.
- Desktop, taskbar, Start menu and dialog icons: original SVG drawings in
  `src/shell/icons.tsx` and `src/shell/marks.tsx`.
- Fonts: system fonts only (`Tahoma`, `Verdana`, `"Trebuchet MS"`, `"Franklin Gothic Medium"`);
  no font files are shipped.
