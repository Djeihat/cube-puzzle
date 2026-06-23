// Shared flag — set by Scene.tsx when the user is actively dragging the ghost
// piece. Container.tsx reads it to gate hoveredCell updates on mobile so that
// rotation touches don't move the ghost.
export const ghost = { dragging: false }
