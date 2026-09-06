import React, { useState } from 'react';
import { Plus, Trash2, Edit2, Check, GripVertical } from 'lucide-react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import { Column, TaskPriority, Task } from '../types.js';
import { TaskCard } from './TaskCard.js';
import { useKanbanStore } from '../store/kanbanStore.js';

interface ColumnViewProps {
  column: Column;
  allColumns: Column[];
  columnDragHandleProps?: any;
  isDraggingColumn?: boolean;
}

export const ColumnView: React.FC<ColumnViewProps> = ({
  column,
  allColumns,
  columnDragHandleProps,
  isDraggingColumn = false,
}) => {
  const {
    createTask,
    deleteColumn,
    updateColumnTitle,
    deleteTask,
    reorderTaskOptimistically,
    toggleSubtask,
    updateTask,
    searchQuery,
    priorityFilter,
    dueDateFilter,
    subtaskFilter,
    sortBy,
    sortDirection,
    setSelectedTaskId,
  } = useKanbanStore();

  const [isAdding, setIsAdding] = useState(false);
  const [taskTitle, setTaskTitle] = useState('');
  const [taskDesc, setTaskDesc] = useState('');
  const [priority, setPriority] = useState<TaskPriority>('Medium');

  // Column renaming state
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [colTitle, setColTitle] = useState(column.title);

  const rawTasks: Task[] = column.tasks || [];

  // Filter tasks based on search, priority, due date, and subtask status (Step 5)
  const filteredTasks = rawTasks.filter((task) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const titleMatch = task.title.toLowerCase().includes(q);
      const descMatch = (task.description || '').toLowerCase().includes(q);
      const subtaskMatch = (task.subtasks || []).some((s) => s.title.toLowerCase().includes(q));
      if (!titleMatch && !descMatch && !subtaskMatch) return false;
    }

    // 2. Priority Filter
    if (priorityFilter !== 'All' && task.priority !== priorityFilter) {
      return false;
    }

    // 3. Due Date Filter
    if (dueDateFilter !== 'All') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (dueDateFilter === 'NoDate') {
        if (task.dueDate) return false;
      } else if (dueDateFilter === 'HasDate') {
        if (!task.dueDate) return false;
      } else {
        if (!task.dueDate) return false;
        const target = new Date(task.dueDate);
        target.setHours(0, 0, 0, 0);
        const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        if (dueDateFilter === 'Overdue' && diffDays >= 0) return false;
        if (dueDateFilter === 'Today' && diffDays !== 0) return false;
        if (dueDateFilter === 'Upcoming' && diffDays <= 0) return false;
      }
    }

    // 4. Subtasks Filter
    if (subtaskFilter !== 'All') {
      const st = task.subtasks || [];
      if (subtaskFilter === 'HasSubtasks' && st.length === 0) return false;
      if (subtaskFilter === 'Completed' && (st.length === 0 || !st.every((s) => s.completed))) return false;
      if (subtaskFilter === 'Incomplete' && (st.length === 0 || st.every((s) => s.completed))) return false;
    }

    return true;
  });

  // Apply sorting if not manual
  if (sortBy !== 'manual') {
    filteredTasks.sort((a, b) => {
      let comparison = 0;
      if (sortBy === 'title') {
        comparison = a.title.localeCompare(b.title);
      } else if (sortBy === 'priority') {
        const pWeight: Record<TaskPriority, number> = { High: 3, Medium: 2, Low: 1 };
        comparison = (pWeight[b.priority] || 0) - (pWeight[a.priority] || 0);
      } else if (sortBy === 'dueDate') {
        const timeA = a.dueDate ? new Date(a.dueDate).getTime() : Infinity;
        const timeB = b.dueDate ? new Date(b.dueDate).getTime() : Infinity;
        comparison = timeA - timeB;
      } else if (sortBy === 'subtasks') {
        const compA = a.subtasks?.length ? a.subtasks.filter((s) => s.completed).length / a.subtasks.length : 0;
        const compB = b.subtasks?.length ? b.subtasks.filter((s) => s.completed).length / b.subtasks.length : 0;
        comparison = compB - compA;
      }
      return sortDirection === 'desc' ? -comparison : comparison;
    });
  }

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!taskTitle.trim()) return;
    await createTask(column._id, taskTitle.trim(), priority, taskDesc.trim());
    setTaskTitle('');
    setTaskDesc('');
    setPriority('Medium');
    setIsAdding(false);
  };

  const handleSaveTitle = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (colTitle.trim() && colTitle.trim() !== column.title) {
      await updateColumnTitle(column._id, colTitle.trim());
    }
    setIsEditingTitle(false);
  };

  const handleAddSubtask = async (taskId: string, title: string) => {
    const task = rawTasks.find((t) => t._id === taskId);
    if (!task) return;
    const updatedSubtasks = [...(task.subtasks || []), { title, completed: false }];
    await updateTask(taskId, { subtasks: updatedSubtasks });
  };

  return (
    <div
      id={`column-container-${column._id}`}
      className={`w-80 shrink-0 bg-[#0d0d0f]/95 rounded-2xl flex flex-col max-h-[750px] backdrop-blur-sm transition-all duration-200 ${
        isDraggingColumn
          ? 'border-2 border-indigo-500 shadow-[0_25px_50px_rgba(0,0,0,0.8)] ring-2 ring-indigo-500/50 scale-[1.01] rotate-1 z-40'
          : 'border border-zinc-800/80 shadow-xl'
      }`}
    >
      {/* Column Header */}
      <div className="p-4 border-b border-zinc-800/60 flex items-center justify-between">
        <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
          {/* Column Drag Grip Handle */}
          <div
            {...columnDragHandleProps}
            className="p-1 -ml-1 text-zinc-600 hover:text-zinc-300 cursor-grab active:cursor-grabbing rounded hover:bg-zinc-800/60 transition-colors shrink-0"
            title="Drag to reorder column position"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <span className="w-2 h-2 rounded-full bg-indigo-500 shadow-[0_0_8px_#6366f1] shrink-0" />

          {isEditingTitle ? (
            <form onSubmit={handleSaveTitle} className="flex items-center gap-1 flex-1">
              <input
                type="text"
                value={colTitle}
                onChange={(e) => setColTitle(e.target.value)}
                autoFocus
                onBlur={() => handleSaveTitle()}
                className="bg-zinc-950 border border-indigo-500 rounded px-1.5 py-0.5 text-xs text-zinc-100 focus:outline-none w-full"
              />
              <button type="submit" className="p-1 text-emerald-400">
                <Check className="w-3 h-3" />
              </button>
            </form>
          ) : (
            <div
              onDoubleClick={() => setIsEditingTitle(true)}
              className="flex items-center gap-2 group cursor-pointer truncate"
              title="Double click to rename column"
            >
              <h3 className="text-xs font-bold uppercase tracking-wider text-zinc-200 truncate">
                {column.title}
              </h3>
              <Edit2 className="w-2.5 h-2.5 text-zinc-600 group-hover:text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
          )}

          <span className="px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 text-[10px] font-mono font-medium shrink-0">
            {filteredTasks.length}
          </span>
        </div>

        <div className="flex items-center gap-1 shrink-0" onMouseDown={(e) => e.stopPropagation()}>
          <button
            id={`btn-toggle-add-task-${column._id}`}
            onClick={() => setIsAdding(!isAdding)}
            className="p-1 rounded-lg text-zinc-400 hover:text-indigo-400 hover:bg-zinc-800 transition-colors"
            title="Add task to column"
          >
            <Plus className="w-4 h-4" />
          </button>
          <button
            id={`btn-del-col-${column._id}`}
            onClick={() => deleteColumn(column._id)}
            className="p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-zinc-800 transition-colors"
            title="Delete column"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Creation Inline Form */}
      {isAdding && (
        <form
          onSubmit={handleCreateTask}
          className="p-3.5 m-2.5 rounded-xl bg-[#151518] border border-indigo-500/30 space-y-2.5 animate-fadeIn"
        >
          <input
            id={`input-task-title-${column._id}`}
            type="text"
            value={taskTitle}
            onChange={(e) => setTaskTitle(e.target.value)}
            placeholder="Task title..."
            required
            autoFocus
            className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <textarea
            id={`input-task-desc-${column._id}`}
            value={taskDesc}
            onChange={(e) => setTaskDesc(e.target.value)}
            placeholder="Optional description..."
            rows={2}
            className="w-full bg-[#09090b] border border-zinc-800 rounded-lg px-2.5 py-1.5 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-none"
          />
          <div className="flex items-center justify-between">
            <select
              id={`select-task-priority-${column._id}`}
              value={priority}
              onChange={(e) => setPriority(e.target.value as TaskPriority)}
              className="bg-[#09090b] text-[11px] text-zinc-300 border border-zinc-800 rounded px-2 py-1 focus:outline-none"
            >
              <option value="Low">Low Priority</option>
              <option value="Medium">Medium Priority</option>
              <option value="High">High Priority</option>
            </select>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setIsAdding(false)}
                className="px-2.5 py-1 rounded text-[11px] text-zinc-400 hover:text-zinc-200"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-3 py-1 rounded bg-indigo-600 hover:bg-indigo-500 text-white text-[11px] font-medium shadow-[0_0_10px_rgba(79,70,229,0.3)]"
              >
                Add
              </button>
            </div>
          </div>
        </form>
      )}

      {/* Task List Droppable Zone */}
      <Droppable droppableId={column._id} type="TASK">
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex-1 overflow-y-auto p-3 space-y-2.5 custom-scrollbar min-h-[140px] transition-colors rounded-b-2xl ${
              snapshot.isDraggingOver
                ? 'bg-indigo-950/20 ring-1 ring-indigo-500/30'
                : ''
            }`}
          >
            {filteredTasks.length === 0 ? (
              <div className="py-8 text-center border-2 border-dashed border-zinc-800/60 rounded-xl">
                <p className="text-[11px] text-zinc-500">
                  {rawTasks.length > 0 ? 'No tasks match current filter' : 'No tasks in this column'}
                </p>
                <button
                  onClick={() => setIsAdding(true)}
                  className="text-[11px] text-indigo-400 hover:underline mt-1 inline-block"
                >
                  + Create first task
                </button>
              </div>
            ) : (
              filteredTasks.map((task, idx) => {
                const DraggableItem = Draggable as any;
                return (
                  <DraggableItem key={task._id} draggableId={task._id} index={idx}>
                    {(dragProvided: any, dragSnapshot: any) => (
                      <div
                        ref={dragProvided.innerRef}
                        {...dragProvided.draggableProps}
                      >
                        <TaskCard
                          task={task}
                          index={idx}
                          totalInColumn={filteredTasks.length}
                          columnId={column._id}
                          allColumns={allColumns}
                          isDragging={dragSnapshot.isDragging}
                          dragHandleProps={dragProvided.dragHandleProps}
                          onMoveWithinColumn={(taskId, colId, fromIdx, toIdx) => {
                            reorderTaskOptimistically(taskId, colId, colId, fromIdx, toIdx);
                          }}
                          onMoveAcrossColumns={(taskId, fromColId, toColId, toIdx) => {
                            reorderTaskOptimistically(taskId, fromColId, toColId, 0, toIdx);
                          }}
                          onDeleteTask={(taskId, colId) => {
                            deleteTask(taskId, colId);
                          }}
                          onToggleSubtask={(taskId, subtaskId) => {
                            toggleSubtask(taskId, subtaskId);
                          }}
                          onAddSubtask={handleAddSubtask}
                          onOpenDetail={(taskId) => setSelectedTaskId(taskId)}
                        />
                      </div>
                    )}
                  </DraggableItem>
                );
              })
            )}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

