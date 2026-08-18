import React, { useMemo } from 'react';
import { DndContext, closestCorners, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { useTaskStore } from '@/services/store';
import { Column } from './Column';

export const Board: React.FC<any> = () => {
  const { tasks, updateTaskStatus } = useTaskStore();
  
  const columns = ['TODO', 'IN_PROGRESS', 'DONE'] as const;

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      updateTaskStatus(Number(active.id), over.id as any);
    }
  };

  return (
    <DndContext collisionDetection={closestCorners} onDragEnd={handleDragEnd}>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8">
        {columns.map((status) => (
          <Column 
            key={status} 
            status={status} 
            tasks={tasks.filter(t => t.status === status)} 
          />
        ))}
      </div>
    </DndContext>
  );
};
export default Board;