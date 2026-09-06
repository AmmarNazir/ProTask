import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  CheckSquare,
  Square,
  Trash2,
  AlertTriangle,
  ArrowRightLeft,
  Tag,
  AlignLeft,
  Plus,
  Save,
  CheckCircle2,
  CalendarDays
} from 'lucide-react';
import { Task, TaskPriority, Column, Subtask } from '../types.js';
import { useKanbanStore } from '../store/kanbanStore.js';

interface TaskDetailModalProps {
  taskId: string;
  onClose: () => void;
}

export const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ taskId, onClose }) => {
  const {
    activeBoard,
    updateTask,
    deleteTask,
    reorderTaskOptimistically,
  } = useKanbanStore();

  // Find task and its column in activeBoard
  let currentTask: Task | null = null;
  let currentColumn: Column | null = null;

  if (activeBoard?.columns) {
    for (const col of activeBoard.columns) {
      const found = (col.tasks || []).find((t) => t._id === taskId);
      if (found) {
        currentTask = found;
        currentColumn = col;
        break;
      }
    }
  }

  // Local form state for draft edits
  const [title, setTitle] = useState(currentTask?.title || '');
  const [description, setDescription] = useState(currentTask?.description || '');
  const [priority, setPriority] = useState<TaskPriority>(currentTask?.priority || 'Medium');
  const [dueDate, setDueDate] = useState<string>(
    currentTask?.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : ''
  );
  const [subtasks, setSubtasks] = useState<Subtask[]>(currentTask?.subtasks || []);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Sync if task changes externally
  useEffect(() => {
    if (currentTask) {
      setTitle(currentTask.title);
      setDescription(currentTask.description || '');
      setPriority(currentTask.priority);
      setDueDate(currentTask.dueDate ? new Date(currentTask.dueDate).toISOString().split('T')[0] : '');
      setSubtasks(currentTask.subtasks || []);
    }
  }, [currentTask?._id]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  if (!currentTask || !currentColumn) {
    return null;
  }

  // Subtask calculations
  const totalSubtasks = subtasks.length;
  const completedSubtasks = subtasks.filter((s) => s.completed).length;
  const progressPercent = totalSubtasks === 0 ? 0 : Math.round((completedSubtasks / totalSubtasks) * 100);

  // Due Date calculation
  let dueDateStatus: { label: string; color: string; overdue: boolean } | null = null;
  if (dueDate) {
    const target = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    target.setHours(0, 0, 0, 0);

    const diffDays = Math.round((target.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) {
      dueDateStatus = {
        label: `Overdue by ${Math.abs(diffDays)} day${Math.abs(diffDays) === 1 ? '' : 's'}`,
        color: 'bg-rose-500/10 text-rose-400 border-rose-500/30',
        overdue: true,
      };
    } else if (diffDays === 0) {
      dueDateStatus = {
        label: 'Due Today',
        color: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
        overdue: false,
      };
    } else if (diffDays === 1) {
      dueDateStatus = {
        label: 'Due Tomorrow',
        color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/30',
        overdue: false,
      };
    } else {
      dueDateStatus = {
        label: `Due in ${diffDays} days`,
        color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
        overdue: false,
      };
    }
  }

  // Add subtask
  const handleAddSubtask = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSubtaskTitle.trim()) return;

    const updated: Subtask[] = [
      ...subtasks,
      {
        id: String(Date.now()),
        title: newSubtaskTitle.trim(),
        completed: false,
      },
    ];
    setSubtasks(updated);
    setNewSubtaskTitle('');
  };

  // Toggle subtask
  const handleToggleSubtask = (index: number) => {
    const updated = subtasks.map((st, i) => (i === index ? { ...st, completed: !st.completed } : st));
    setSubtasks(updated);
  };

  // Delete subtask
  const handleDeleteSubtask = (index: number) => {
    const updated = subtasks.filter((_, i) => i !== index);
    setSubtasks(updated);
  };

  // Save all task updates
  const handleSave = async () => {
    if (!title.trim() || !currentTask) return;
    setIsSaving(true);
    await updateTask(currentTask._id, {
      title: title.trim(),
      description: description.trim(),
      priority,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      subtasks,
    });
    setIsSaving(false);
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2000);
  };

  // Move to another column
  const handleMoveColumn = async (targetColId: string) => {
    if (!currentTask || !currentColumn || targetColId === currentColumn._id) return;
    await reorderTaskOptimistically(currentTask._id, currentColumn._id, targetColId, 0, 0);
  };

  // Delete task
  const handleDeleteTask = async () => {
    if (!currentTask || !currentColumn) return;
    setIsDeleting(true);
    await deleteTask(currentTask._id, currentColumn._id);
    setIsDeleting(false);
    onClose();
  };

  const priorityConfigs = {
    Low: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', border: 'border-emerald-500/30' },
    Medium: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30' },
    High: { bg: 'bg-rose-500/10', text: 'text-rose-400', border: 'border-rose-500/30' },
  };

  return (
    <div
      id="task-detail-modal-backdrop"
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto animate-fadeIn"
    >
      <div
        id="task-detail-modal-container"
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-2xl bg-[#0e0e11] border border-zinc-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col my-8"
      >
        {/* Modal Header */}
        <div className="p-5 border-b border-zinc-800/80 bg-zinc-900/40 flex items-start justify-between gap-4">
          <div className="space-y-1.5 flex-1 min-w-0">
            {/* Top breadcrumb / column selector */}
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="text-zinc-500 flex items-center gap-1">
                <Tag className="w-3.5 h-3.5 text-indigo-400" />
                <span>Column:</span>
              </span>
              <select
                value={currentColumn._id}
                onChange={(e) => handleMoveColumn(e.target.value)}
                className="bg-[#121215] text-indigo-300 font-medium text-xs rounded-lg px-2.5 py-1 border border-zinc-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
              >
                {(activeBoard?.columns || []).map((col) => (
                  <option key={col._id} value={col._id}>
                    {col.title}
                  </option>
                ))}
              </select>

              <span
                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wider ${
                  priorityConfigs[priority].bg
                } ${priorityConfigs[priority].text} ${priorityConfigs[priority].border}`}
              >
                {priority} Priority
              </span>

              {dueDateStatus && (
                <span
                  className={`text-[10px] font-medium px-2 py-0.5 rounded-full border ${dueDateStatus.color}`}
                >
                  {dueDateStatus.label}
                </span>
              )}
            </div>

            {/* Editable Title */}
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Task title..."
              className="w-full text-base font-semibold text-zinc-100 bg-transparent border-b border-transparent hover:border-zinc-700 focus:border-indigo-500 focus:outline-none py-1 transition-colors"
            />
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/80 rounded-xl transition-colors cursor-pointer"
            title="Close (Esc)"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
          {/* Priority & Due Date Row */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-4 rounded-xl bg-zinc-900/30 border border-zinc-800/80">
            {/* Priority Selector */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                <span>Priority Level</span>
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['Low', 'Medium', 'High'] as TaskPriority[]).map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPriority(p)}
                    className={`py-1.5 px-2 rounded-lg text-xs font-medium border text-center transition-all ${
                      priority === p
                        ? `${priorityConfigs[p].bg} ${priorityConfigs[p].text} ${priorityConfigs[p].border} ring-1 ring-indigo-500/50`
                        : 'bg-zinc-950/60 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    {p}
                  </button>
                ))}
              </div>
            </div>

            {/* Due Date Picker */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-zinc-400 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-indigo-400" />
                <span>Target Due Date</span>
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="date"
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                  className="flex-1 bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-zinc-200 focus:outline-none focus:border-indigo-500"
                />
                {dueDate && (
                  <button
                    type="button"
                    onClick={() => setDueDate('')}
                    className="px-2 py-1.5 rounded-lg text-[11px] text-zinc-500 hover:text-rose-400 bg-zinc-900 border border-zinc-800 hover:border-zinc-700"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Description Section */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
              <AlignLeft className="w-4 h-4 text-indigo-400" />
              <span>Description</span>
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Add details, acceptance criteria, or notes about this task..."
              rows={4}
              className="w-full bg-[#0d0d0f] border border-zinc-800 rounded-xl p-3 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 resize-y transition-colors leading-relaxed"
            />
          </div>

          {/* Subtasks / Checklist Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <CheckSquare className="w-4 h-4 text-indigo-400" />
                <span>Subtasks & Checklist</span>
                <span className="text-[11px] font-normal text-zinc-500 font-mono">
                  ({completedSubtasks}/{totalSubtasks})
                </span>
              </label>

              {totalSubtasks > 0 && (
                <span className="text-[11px] font-mono text-zinc-400">
                  {progressPercent}% completed
                </span>
              )}
            </div>

            {/* Progress bar */}
            {totalSubtasks > 0 && (
              <div className="h-1.5 w-full bg-zinc-800/80 rounded-full overflow-hidden">
                <div
                  className="h-full bg-emerald-500 shadow-[0_0_8px_#10b981] transition-all duration-300"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            )}

            {/* Subtask list */}
            <div className="space-y-1.5">
              {subtasks.map((st, idx) => (
                <div
                  key={st.id || idx}
                  className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-zinc-900/40 border border-zinc-800/70 hover:border-zinc-700/80 group transition-all"
                >
                  <button
                    type="button"
                    onClick={() => handleToggleSubtask(idx)}
                    className="flex items-center gap-2.5 flex-1 min-w-0 text-left"
                  >
                    {st.completed ? (
                      <CheckSquare className="w-4 h-4 text-emerald-400 shrink-0" />
                    ) : (
                      <Square className="w-4 h-4 text-zinc-500 hover:text-zinc-300 shrink-0" />
                    )}
                    <span
                      className={`text-xs ${
                        st.completed
                          ? 'line-through text-zinc-500'
                          : 'text-zinc-200'
                      }`}
                    >
                      {st.title}
                    </span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeleteSubtask(idx)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-zinc-600 hover:text-rose-400 transition-opacity"
                    title="Delete subtask"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>

            {/* Add new subtask form */}
            <form onSubmit={handleAddSubtask} className="flex items-center gap-2 pt-1">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                placeholder="Add a new subtask (press Enter)..."
                className="flex-1 bg-[#0d0d0f] border border-zinc-800 rounded-xl px-3 py-2 text-xs text-zinc-200 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={!newSubtaskTitle.trim()}
                className="px-3 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 disabled:opacity-40 text-xs font-medium text-zinc-200 flex items-center gap-1 transition-colors"
              >
                <Plus className="w-3.5 h-3.5 text-indigo-400" />
                <span>Add</span>
              </button>
            </form>
          </div>

          {/* Timestamps & Technical Details */}
          <div className="pt-4 border-t border-zinc-800/60 flex flex-wrap items-center justify-between text-[11px] text-zinc-500 font-mono">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-zinc-600" />
                <span>Created: {new Date(currentTask.createdAt).toLocaleString()}</span>
              </span>
              <span>Updated: {new Date(currentTask.updatedAt).toLocaleTimeString()}</span>
            </div>
            <span>ID: {currentTask._id}</span>
          </div>
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/40 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={handleDeleteTask}
            disabled={isDeleting}
            className="px-3.5 py-2 rounded-xl text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 border border-rose-500/20 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{isDeleting ? 'Deleting...' : 'Delete Task'}</span>
          </button>

          <div className="flex items-center gap-2.5">
            {saveFeedback && (
              <span className="text-xs text-emerald-400 flex items-center gap-1 font-medium animate-fadeIn">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>Changes saved!</span>
              </span>
            )}

            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium transition-colors cursor-pointer"
            >
              Close
            </button>

            <button
              type="button"
              onClick={handleSave}
              disabled={isSaving || !title.trim()}
              className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 text-white text-xs font-medium flex items-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
