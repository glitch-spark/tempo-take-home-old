# Tempo take-home assessment

Three parts from the hiring packet: a concurrent-cache review, a hierarchy filter in Kotlin, and a sticky-notes SPA in React/TypeScript.

## Layout

- `simple-cache/` — production review of the provided `SimpleCache` implementation
- `hierarchy-filter/` — `Hierarchy.filter()` plus tests
- `sticky-notes/` — React + TypeScript sticky notes board

## SimpleCache

Read `simple-cache/REVIEW.md`. The original snippet is in `simple-cache/SimpleCache.kt` for reference.

## Hierarchy filter

Requires JDK 17+ and Maven.

```bash
cd hierarchy-filter
mvn test
```

The filter keeps a node only when the node and all of its ancestors pass the predicate. Kept nodes retain their original depths.

## Sticky notes

```bash
cd sticky-notes
npm install
npm run dev
```

Build: `npm run build`

### Architecture

The board owns an array of note objects (`id`, position, size, `zIndex`, color, text) and renders each note as a presentational component. Creation happens on a pointer-down on empty board space; notes are raised by bumping `zIndex` when interaction starts. Persistence is a debounced write to `localStorage` so a refresh restores the board.

Drag and resize use pointer events (not mouse-only) so behavior is consistent in Chrome, Firefox, and Edge. While a gesture is active, geometry is updated on the DOM through refs so the board does not re-render on every pointer move; React state is committed on pointer-up. Delete is a hit-test against a fixed trash zone at drop time.

I skipped a mocked REST backend on purpose to keep the focus on interaction design and typing. Optional features included are in-note editing, bring-to-front, a few note colors, and local persistence.
