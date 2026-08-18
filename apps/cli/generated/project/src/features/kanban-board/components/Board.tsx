import React from "react";

export function Board(props: any) {
  return (
    <div className="p-4 bg-slate-900 border border-slate-800 rounded-lg text-slate-200">
      <div className="text-xs text-slate-400 font-mono mb-1">src/features/kanban-board/components/Board.tsx</div>
      {props?.children || props?.title || "Board"}
    </div>
  );
}

export default Board;