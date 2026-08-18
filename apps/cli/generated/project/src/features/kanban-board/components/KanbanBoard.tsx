import React from 'react';
import { DragDropContext, Droppable, Draggable } from '@hello-pangea/dnd';
import { useTaskStore, TaskStatus } from '../../state-sync/store';

const COLUMNS: { id: TaskStatus; title: string }[] = [
  { id: 'todo', title: 'To Do' },
  { id: 'in-progress', title: 'In Progress' },
  { id: 'done', title: 'Done' },
];

export const KanbanBoard: React.FC<any> = () => {
  const { tasks, updateTaskStatus } = useTaskStore();

  const onDragEnd = (result: any) => {
    if (!result.destination) return;
    updateTaskStatus(result.draggableId, result.destination.droppableId as TaskStatus);
  };

  return (
    <DragDropContext onDragEnd={onDragEnd}>
      <div className="flex gap-6 p-6 overflow-x-auto min-h-[600px]">
        {COLUMNS.map((col) => (
          <Droppable key={col.id} droppableId={col.id}>
            {(provided) => (
              <div ref={provided.innerRef} {...provided.droppableProps} className="w-80 bg-slate-900/50 p-4 rounded-lg">
                <h3 className="font-semibold text-slate-200 mb-4">{col.title}</h3>
                {tasks.filter(t => t.status === col.id).map((task, index) => (
                  <Draggable key={task.id} draggableId={task.id} index={index}>
                    {(provided) => (
                      <div ref={provided.innerRef} {...provided.draggableProps} {...provided.dragHandleProps} 
                           className="bg-slate-800 p-4 mb-3 rounded shadow-sm border border-slate-700">
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
export default KanbanBoard;