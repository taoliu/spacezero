# Ticket 017: Harden mobile gesture suppression (zoom, double/triple tap, selection)

## Context

On mobile browsers, default gestures can interfere with gameplay:

* double/triple tap zoom
* pinch zoom
* text selection/callouts

Ticket 011 added baseline suppression, but zoom still occurs in some cases. We need to harden behavior across iOS Safari and Android Chrome.

## Goal

Disable mobile browser behaviors that break gameplay interaction:

* prevent double/triple tap zoom
* prevent pinch zoom during gameplay
* prevent text selection/callouts

## Scope

### Included

* CSS + meta tags to prevent zoom and selection
* Touch/pointer event handling (`preventDefault`, `{ passive: false }`)
* Ensure suppression applies to gameplay container only

### Excluded

* Accessibility zoom features outside gameplay (menus/settings) unless unavoidable

## Tasks

### 1. Add viewport meta constraints

In `index.html`:

* ensure viewport includes:

  * `width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no`

Note: iOS behavior can vary; this is necessary but not always sufficient.

### 2. CSS hardening

Ensure these are applied to gameplay container and overlay:

* `touch-action: none;`
* `user-select: none;`
* `-webkit-touch-callout: none;`
* `-webkit-tap-highlight-color: transparent;`

### 3. JS event suppression

On the main game container element (and stick/controls surfaces):

* add listeners:

  * `touchstart`, `touchmove`, `touchend`, `touchcancel`
  * call `preventDefault()` where appropriate
  * use `{ passive: false }`

Also consider:

* prevent double-tap zoom by tracking tap timestamps and preventing default when taps are close in time (iOS Safari workaround)

### 4. Verify input still works

* Ensure buttons still respond (may need `touch-action: manipulation` on buttons)

## Acceptance criteria

* Double or triple tapping does not zoom during gameplay.
* Pinch zoom does not zoom during gameplay.
* No text selection or callouts during gameplay.
* Touch controls still work normally.
* Works on iOS Safari and Android Chrome.

## Testing notes

* On phone:

  * double tap rapidly; confirm no zoom
  * triple tap; confirm no zoom
  * pinch; confirm no zoom
  * drag/hold; confirm no selection

## Affected files (expected)

* `index.html`
* main CSS
* input overlay/container wiring code
