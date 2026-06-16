# Chess-Deco

Turn a chess game into a poster.

Paste a PGN, pick a palette, export. Each move becomes a Bézier arc connecting its origin and destination squares. Control points are calculated by rotating the move vector 90 degrees, so arcs curve consistently without crossing. Opacity scales with move number — early game fades back, endgame dominates.

**[→ kivilcimlab.org/chess-deco](https://kivilcimlab.org/chess-deco)**

---

## Arc geometry

The naive approach — a fixed offset perpendicular to the move vector — produces arcs that intersect each other unpredictably. Rotating by 90 degrees ensures all arcs curve in the same rotational direction relative to their own trajectory. The result is a legible diagram even on dense, tactical games.

## Editorial filter

Raw PGN contains a lot of quiet pawn pushes. Rendering every move produces visual noise that obscures the game's shape.

The editorial filter retains:
- Captures
- Checks and checkmates
- Major piece moves (Rook, Bishop, Queen, King, Knight)

Routine pawn pushes are thinned. The narrative of the match stays intact; the clutter doesn't.

## Export

GIF and poster export run entirely client-side. The GIF encoder is loaded as a Blob URL to avoid browser origin restrictions on Worker imports — no external CDN, no cross-origin issues.

## Sample games

- **Game of the Century** 
- **Kobayashi Maru** 
- **Wabi-Sabi** 

## Stack

- Vanilla JS
- HTML5 Canvas
- Client-side GIF encoding (Web Worker + Blob URL)
