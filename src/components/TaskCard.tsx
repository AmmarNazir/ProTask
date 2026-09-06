import React, { useState } from 'react';
import {
  ChevronUp,
  ChevronDown,
  ArrowRightLeft,
  CheckSquare,
  Calendar,
  Trash2,
  Check,
  Plus,
  ChevronRight,
  GripVertical,
  Maximize2,
  AlertCircle
} from 'lucide-react';
import { Task, TaskPriority, Column } from '../types.js';

interface TaskCardProps {
  task: Task;
  index: number;
  totalInColumn: number;
  columnId: string;
  allColumns: Column[];
  isDragging?: boolean;
  dragHandleProps?: any;
  onMoveWithinColumn: (taskId: string, colId: string, fromIndex: number, toIndex: number) => void;
  onMoveAcrossColumns: (taskId: string, fromColId: string, toColId: string, toIndex: number) => void;
  onDeleteTask: (taskId: string, columnId: string) => void;
  onToggleSubtask?: (taskId: string, subtaskId: string) => void;
  onAddSubtask?: (taskId: string, title: string) => void;
  onOpenDetail?: (taskId: string) => void;
}

export const TaskCard: React.FC<TaskCardProps> = ({
  task,
  index,
  totalInColumn,
  columnId,
  allColumns,
  isDragging = false,
  dragHandleProps,
  onMoveWithinColumn,
  onMoveAcrossColumns,
  onDeleteTask,
  onToggleSubtask,
  onAddSubtask,
  onOpenDetail,
}) => {
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isAddingSubtask, setIsAddingSubtask] = useState(false);

  const completedSubtasks = (task.subtasks || []).filter((s) => s.completed).length;
  const totalSubtasks = (task.subtasks || []).length;
  const subtasksPercent = totalSubtasks > 0 ? Math.round((completedSubtasks / totalSubtasks) * 100) : 0;

  // Due Date status calculation
  let dueDateInfo: { label: string; isOverdue: boolean; isToday: boolean; className: string } | null = null;
  if (task.dueDate) {
    const target = new Date(task.dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      dueDateInfo = {
        label: 'Overdue',
        isOverdue: true,
        isToday: false,
        className: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
      };
    } else if (diffDays === 0) {
      dueDateInfo = {
        label: 'Due Today',
        isOverdue: false,
        isToday: true,
        className: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
      };
    } else {
      dueDateInfo = {
        label: target.toLocaleDateString(undefined, { month: 'short', day: 'numeric' }),
        isOverdue: false,
        isToday: false,
        className: 'bg-zinc-900 border-zinc-800/80 text-zinc-400',
      };
    }
  }

  const priorityStyles: Record<TaskPriority, { bg: string; text: string; border: string }> = {
    High: {
      bg: 'bg-rose-500/10',
      text: 'text-rose-400',
      border: 'border-rose-500/30',
    },
    Medium: {
      bg: 'bg-amber-500/10',
      text: 'text-amber-400',
      border: 'border-amber-500/30',
    },
    Low: {
      bg: 'bg-emerald-500/10',
      text: 'text-emerald-400',
      border: 'border-emerald-500/30',
    },
  };

  const currentPriority = priorityStyles[task.priority] || priorityStyles.Medium;

  const handleAddSubtaskSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim() || !onAddSubtask) return;
    onAddSubtask(task._id, newSubtaskTitle.trim());
    setNewSubtaskTitle('');
    setIsAddingSubtask(false);
  };

  return (
    <div
      id={`task-card-${task._id}`}
      onClick={() => onOpenDetail && onOpenDetail(task._id)}
      className={`group relative rounded-xl p-3.5 transition-all space-y-2.5 select-none cursor-pointer ${
        isDragging
          ? 'bg-[#18181f] border-2 border-indigo-500 shadow-[0_20px_40px_rgba(0,0,0,0.7)] ring-2 ring-indigo-500/50 scale-[1.02] rotate-1 z-50'
          : 'bg-[#121215] hover:bg-[#16161a] border border-zinc-800/80 hover:border-indigo-500/40 shadow-md hover:shadow-indigo-500/5'
      }`}
    >
      {/* Header: Drag Grip + Priority + Action Tools */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5">
          {/* Drag Handle Icon */}
          <div
            {...dragHandleProps}
            onClick={(e) => e.stopPropagation()}
            className="p-1 -ml-1 text-zinc-600 hover:text-zinc-300 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing rounded hover:bg-zinc-800/60 transition-colors"
            title="Drag to move card (Keyboard: Space, Arrows, Space)"
          >
            <GripVertical className="w-3.5 h-3.5" />
          </div>

          <span
            className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${currentPriority.bg} ${currentPriority.text} ${currentPriority.border}`}
          >
            {task.priority}
          </span>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail && onOpenDetail(task._id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1 text-zinc-500 hover:text-indigo-400 transition-opacity rounded hover:bg-zinc-800"
            title="Open Task Details Modal"
          >
            <Maximize2 className="w-3 h-3" />
          </button>
        </div>

        {/* Action icons */}
        <div
          className="flex items-center gap-1 opacity-75 group-hover:opacity-100 transition-opacity"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {/* Move Up within column */}
          <button
            id={`btn-task-up-${task._id}`}
            disabled={index === 0}
            onClick={() => onMoveWithinColumn(task._id, columnId, index, index - 1)}
            className="p-1 rounded bg-zinc-800/60 hover:bg-zinc-700 disabled:opacity-20 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Move Up (Optimistic Reorder)"
          >
            <ChevronUp className="w-3.5 h-3.5" />
          </button>

          {/* Move Down within column */}
          <button
            id={`btn-task-down-${task._id}`}
            disabled={index >= totalInColumn - 1}
            onClick={() => onMoveWithinColumn(task._id, columnId, index, index + 1)}
            className="p-1 rounded bg-zinc-800/60 hover:bg-zinc-700 disabled:opacity-20 text-zinc-400 hover:text-zinc-200 transition-colors"
            title="Move Down (Optimistic Reorder)"
          >
            <ChevronDown className="w-3.5 h-3.5" />
          </button>

          {/* Delete Task */}
          <button
            id={`btn-task-del-${task._id}`}
            onClick={() => onDeleteTask(task._id, columnId)}
            className="p-1 rounded bg-zinc-800/60 hover:bg-rose-500/20 text-zinc-400 hover:text-rose-400 transition-colors ml-0.5"
            title="Delete Task"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Task Title */}
      <h4 className="text-xs font-semibold text-zinc-100 leading-snug tracking-tight">
        {task.title}
      </h4>

      {/* Task Description snippet */}
      {task.description && (
        <p className="text-[11px] text-zinc-400 line-clamp-2 leading-relaxed">
          {task.description}
        </p>
      )}

      {/* Mini Subtask Progress Bar (Step 5) */}
      {totalSubtasks > 0 && (
        <div className="space-y-1 pt-0.5">
          <div className="h-1 w-full bg-zinc-800/90 rounded-full overflow-hidden">
            <div
              className={`h-full transition-all duration-300 ${
                subtasksPercent === 100 ? 'bg-emerald-500 shadow-[0_0_6px_#10b981]' : 'bg-indigo-500'
              }`}
              style={{ width: `${subtasksPercent}%` }}
            />
          </div>
        </div>
      )}

      {/* Subtasks and Due Date badges */}
      <div
        className="flex flex-wrap items-center gap-2 pt-1 border-t border-zinc-800/60 text-[10px] text-zinc-400"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {totalSubtasks > 0 && (
          <button
            onClick={() => setShowSubtasks(!showSubtasks)}
            className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-zinc-900 hover:bg-zinc-800 border border-zinc-800/80 transition-colors cursor-pointer text-zinc-300"
            title="Toggle quick subtasks list"
          >
            <CheckSquare className="w-3 h-3 text-indigo-400" />
            <span>
              {completedSubtasks}/{totalSubtasks}
            </span>
            <ChevronRight className={`w-3 h-3 text-zinc-500 transition-transform ${showSubtasks ? 'rotate-90' : ''}`} />
          </button>
        )}

        {dueDateInfo && (
          <div
            className={`flex items-center gap-1 px-2 py-0.5 rounded border text-[10px] font-medium ${dueDateInfo.className}`}
          >
            {dueDateInfo.isOverdue ? (
              <AlertCircle className="w-3 h-3 text-rose-400" />
            ) : (
              <Calendar className="w-3 h-3 text-zinc-500" />
            )}
            <span>{dueDateInfo.label}</span>
          </div>
        )}
      </div>

      {/* Expanded Subtasks List (Interactive Checklist) */}
      {showSubtasks && task.subtasks && task.subtasks.length > 0 && (
        <div
          className="space-y-1.5 p-2 rounded-lg bg-[#09090b] border border-zinc-800/70 text-[11px] animate-fadeIn"
          onClick={(e) => e.stopPropagation()}
          onMouseDown={(e) => e.stopPropagation()}
        >
          {task.subtasks.map((st, sIdx) => {
            const stId = (st as any)._id || st.id || String(sIdx);
            return (
              <div
                key={stId}
                onClick={() => onToggleSubtask && onToggleSubtask(task._id, stId)}
                className="flex items-center gap-2 p-1 rounded hover:bg-zinc-900 cursor-pointer text-zinc-300 group/sub"
              >
                <div
                  className={`w-3.5 h-3.5 rounded border flex items-center justify-center transition-colors ${
                    st.completed
                      ? 'bg-indigo-600 border-indigo-500 text-white'
                      : 'border-zinc-700 bg-zinc-950 group-hover/sub:border-indigo-400'
                  }`}
                >
                  {st.completed && <Check className="w-2.5 h-2.5 stroke-[3]" />}
                </div>
                <span className={`text-[11px] ${st.completed ? 'line-through text-zinc-500' : 'text-zinc-300'}`}>
                  {st.title}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {/* Cross-column quick transfer selector */}
      <div
        className="pt-2 border-t border-zinc-800/40 flex items-center justify-between text-[10px]"
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <span className="text-zinc-500 flex items-center gap-1">
          <ArrowRightLeft className="w-3 h-3 text-indigo-400" />
          <span>Move to:</span>
        </span>
        <select
          id={`select-move-col-${task._id}`}
          value=""
          onChange={(e) => {
            if (e.target.value) {
              onMoveAcrossColumns(task._id, columnId, e.target.value, 0);
            }
          }}
          className="bg-zinc-900 text-zinc-300 text-[10px] border border-zinc-800 rounded px-1.5 py-0.5 hover:border-zinc-700 focus:outline-none focus:border-indigo-500 cursor-pointer"
        >
          <option value="" disabled>
            Select column...
          </option>
          {allColumns
            .filter((col) => col._id !== columnId)
            .map((col) => (
              <option key={col._id} value={col._id}>
                {col.title}
              </option>
            ))}
        </select>
      </div>
    </div>
  );
};
