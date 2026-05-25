/**
 * Shared drag-state flag.
 * The turntable in Scene.tsx sets `occurred = true` once a pointer-drag
 * exceeds the threshold.  Container.tsx reads and clears it in cell-click
 * handlers so that releasing a drag over a cell doesn't also place a piece.
 */
export const drag = { occurred: false }
