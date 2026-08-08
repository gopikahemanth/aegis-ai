import { create } from 'zustand';

interface BoardState {
  isDragging: boolean;
  setIsDragging: (dragging: boolean) => void;
}

export const useBoardStore = create<BoardState>((set) => ({
  isDragging: false,
  setIsDragging: (isDragging) => set({ isDragging }),
}));
const _hookDef_useBoardStore = (globalThis as any).useBoardStore || (typeof useBoardStore !== 'undefined' ? useBoardStore : (() => ({})));
export default _hookDef_useBoardStore;

export type { BoardState };
