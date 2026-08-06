import React, { useMemo } from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';

export const KanbanBoard = ({ tasks, onDragEnd }: { tasks: any[], onDragEnd: any }) => {
  const columns = useMemo(() => ['TODO', 'IN_PROGRESS', 'DONE'], []);

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 p-8 overflow-x-auto">
        {columns.map((col) => (
          <Droppable key={col} droppableId={col}>
            {(provided) => (
              <div 
                ref={provided.innerRef} 
                {...provided.droppableProps}
                className="w-80 bg-neutral-100 rounded-lg p-4 min-h-[500px]"
              >
                <h3 className="font-semibold text-neutral-900 mb-4">{col}</h3>
                {tasks.filter(t => t.status === col).map((task, index) => (
                  <Draggable key={task.id} draggableId={String(task.id)} index={index}>
                    {(provided) => (
                      <div
                        ref={provided.innerRef}
                        {...provided.draggableProps}
                        {...provided.dragHandleProps}
                        className="bg-white p-4 mb-3 rounded shadow-sm border border-neutral-200"
                      >
                        {task.title}
                      </div>
                    )}
                  </Draggable>
                ))}
                {provided.placeholder}
              </div>
            )}
          </Droppable>
        ))}
      </div>
    </DragDropContext>
  );
};