import React from 'react';
import { DndContext, closestCorners, KeyboardSensor, PointerSensor, useSensor, useSensors } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates } from '@dnd-kit/sortable';

export const BoardContainer: React.FC<any> = () => {
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  return (
    <DndContext sensors={sensors} collisionDetection={closestCorners}>
      <div className="flex gap-6 p-8 h-full overflow-x-auto">
        {/* Columns will be mapped here from fetched data */}
        <div className="w-80 bg-slate-100 dark:bg-slate-900 rounded-xl p-4">
          <h2 className="font-semibold text-sm mb-4">To Do</h2>
          {/* TaskCards rendered via SortableContext */}
        </div>
      </div>
    </DndContext>
  );
};
export default BoardContainer;
