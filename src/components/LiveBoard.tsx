import React, { useState, useEffect } from 'react';
import {
  Plus,
  Layout,
  RefreshCw,
  FolderPlus,
  AlertCircle,
  Kanban,
  Trash2,
  SlidersHorizontal,
  Move
} from 'lucide-react';
import {
  DragDropContext,
  Droppable,
  Draggable,
  DropResult,
} from '@hello-pangea/dnd';
import { useKanbanStore } from '../store/kanbanStore.js';
import { ColumnView } from './ColumnView.js';
import { TaskPriority } from '../types.js';
import { BoardFilters } from './BoardFilters.js';
import { TaskDetailModal } from './TaskDetailModal.js';

export const LiveBoard: React.FC = () => {
  const {
    token,
    boards,
    activeBoardId,
    activeBoard,
    isLoading,
    isActionLoading,
    fetchBoards,
    setActiveBoardId,
    fetchActiveBoard,
    createBoard,
    deleteBoard,
    createColumn,
    reorderTaskOptimistically,
    reorderColumnOptimistically,
    searchQuery,
    priorityFilter,
    dueDateFilter,
    subtaskFilter,
    selectedTaskId,
    setSelectedTaskId,
  } = useKanbanStore();

  // Creation states
  const [newBoardTitle, setNewBoardTitle] = useState('');
  const [isCreatingBoard, setIsCreatingBoard] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState('');
  const [isAddingColumn, setIsAddingColumn] = useState(false);

  useEffect(() => {
    if (token && boards.length === 0) {
      fetchBoards();
    }
  }, [token]);

  const handleCreateBoard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBoardTitle.trim()) return;
    await createBoard(newBoardTitle.trim(), true);
    setNewBoardTitle('');
    setIsCreatingBoard(false);
  };

  const handleCreateColumn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newColumnTitle.trim()) return;
    await createColumn(newColumnTitle.trim());
    setNewColumnTitle('');
    setIsAddingColumn(false);
  };

  const columns = activeBoard?.columns || [];

  const handleDragEnd = async (result: DropResult) => {
    const { source, destination, draggableId, type } = result;

    if (!destination) {
      return;
    }

    if (
      source.droppableId === destination.droppableId &&
      source.index === destination.index
    ) {
      return;
    }

    // 1. Column reordering
    if (type === 'COLUMN') {
      if (!activeBoard) return;
      await reorderColumnOptimistically(activeBoard._id, source.index, destination.index);
      return;
    }

    // 2. Task reordering (within column or across columns)
    const sourceCol = columns.find((c) => c._id === source.droppableId);
    const destCol = columns.find((c) => c._id === destination.droppableId);
    if (!sourceCol || !destCol) return;

    const matchesFilter = (task: any) => {
      const matchesSearch =
        !searchQuery ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority =
        priorityFilter === 'All' || task.priority === priorityFilter;
      return matchesSearch && matchesPriority;
    };

    const isFiltered = Boolean(searchQuery || priorityFilter !== 'All');

    let trueSourceIndex = source.index;
    let trueDestIndex = destination.index;

    if (isFiltered) {
      const filteredSourceTasks = (sourceCol.tasks || []).filter(matchesFilter);
      const sourceTask = filteredSourceTasks[source.index];
      if (sourceTask) {
        trueSourceIndex = (sourceCol.tasks || []).findIndex((t) => t._id === sourceTask._id);
      }

      const filteredDestTasks = (destCol.tasks || []).filter(matchesFilter);
      if (destination.index < filteredDestTasks.length) {
        const targetTask = filteredDestTasks[destination.index];
        const rawIdx = (destCol.tasks || []).findIndex((t) => t._id === targetTask._id);
        trueDestIndex = rawIdx !== -1 ? rawIdx : (destCol.tasks || []).length;
      } else {
        trueDestIndex = (destCol.tasks || []).length;
      }
    }

    await reorderTaskOptimistically(
      draggableId,
      source.droppableId,
      destination.droppableId,
      trueSourceIndex,
      trueDestIndex
    );
  };

  // Compute task statistics for Filter Bar
  const allTasksInBoard = columns.flatMap((col) => col.tasks || []);
  const totalTasks = allTasksInBoard.length;

  const filteredTasksCount = allTasksInBoard.filter((task) => {
    // 1. Search Query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const match =
        task.title.toLowerCase().includes(q) ||
        (task.description || '').toLowerCase().includes(q) ||
        (task.subtasks || []).some((s) => s.title.toLowerCase().includes(q));
      if (!match) return false;
    }

    // 2. Priority Filter
    if (priorityFilter !== 'All' && task.priority !== priorityFilter) return false;

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
  }).length;

  return (
    <div className="space-y-5">
      {/* Board Top Action Bar */}
      <div className="p-4 rounded-2xl bg-zinc-900/50 border border-zinc-800/80 backdrop-blur-md space-y-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          {/* Left: Board Selector & Creator */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <Layout className="w-4 h-4 text-indigo-400" />
              <span className="text-xs font-semibold text-zinc-300">Board:</span>
            </div>

            {boards.length > 0 ? (
              <select
                id="select-active-board"
                value={activeBoardId || ''}
                onChange={(e) => setActiveBoardId(e.target.value)}
                className="bg-[#0d0d0f] text-zinc-100 text-xs font-medium border border-zinc-800 rounded-xl px-3 py-2 focus:outline-none focus:border-indigo-500 cursor-pointer shadow-inner"
              >
                {boards.map((b) => (
                  <option key={b._id || b.id} value={b._id || b.id}>
                    {b.title}
                  </option>
                ))}
              </select>
            ) : (
              <span className="text-xs text-zinc-500 italic">No boards created yet</span>
            )}

            <button
              id="btn-open-create-board"
              onClick={() => setIsCreatingBoard(!isCreatingBoard)}
              className="px-3 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <FolderPlus className="w-3.5 h-3.5 text-indigo-400" />
              <span>New Board</span>
            </button>

            {activeBoardId && (
              <button
                id="btn-delete-active-board"
                onClick={() => {
                  if (window.confirm('Are you sure you want to delete this board and its contents?')) {
                    deleteBoard(activeBoardId);
                  }
                }}
                className="p-2 rounded-xl text-zinc-500 hover:text-rose-400 hover:bg-zinc-800/60 transition-colors"
                title="Delete Board"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            )}

            <button
              onClick={() => fetchActiveBoard()}
              className="p-2 rounded-xl text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors"
              title="Refresh Board"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-indigo-400' : ''}`} />
            </button>
          </div>

          {/* Right: Add Column Trigger */}
          <div className="flex items-center gap-2">
            {activeBoard && (
              <button
                id="btn-open-create-col"
                onClick={() => setIsAddingColumn(!isAddingColumn)}
                className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium flex items-center gap-1.5 shadow-[0_0_15px_rgba(79,70,229,0.3)] transition-all cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Column</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Step 5: Advanced Filters & Search Component */}
      {activeBoard && (
        <BoardFilters
          totalTasks={totalTasks}
          filteredTasksCount={filteredTasksCount}
        />
      )}

      {/* New Board Inline Form */}
      {isCreatingBoard && (
        <form
          onSubmit={handleCreateBoard}
          className="p-4 rounded-xl bg-[#0d0d0f] border border-indigo-500/30 flex flex-wrap items-center gap-3 animate-fadeIn"
        >
          <input
            id="input-new-board-title"
            type="text"
            value={newBoardTitle}
            onChange={(e) => setNewBoardTitle(e.target.value)}
            placeholder="Board title (e.g. Q4 Sprint Roadmap)..."
            required
            autoFocus
            className="flex-1 min-w-[240px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsCreatingBoard(false)}
              className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-[0_0_12px_rgba(79,70,229,0.3)]"
            >
              Create Board & Seed 4 Columns
            </button>
          </div>
        </form>
      )}

      {/* New Column Inline Form */}
      {isAddingColumn && (
        <form
          onSubmit={handleCreateColumn}
          className="p-4 rounded-xl bg-[#0d0d0f] border border-indigo-500/30 flex flex-wrap items-center gap-3 animate-fadeIn"
        >
          <input
            id="input-new-column-title"
            type="text"
            value={newColumnTitle}
            onChange={(e) => setNewColumnTitle(e.target.value)}
            placeholder="Column title (e.g. Quality Assurance)..."
            required
            autoFocus
            className="flex-1 min-w-[240px] bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
          />
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setIsAddingColumn(false)}
              className="px-3 py-2 rounded-lg text-xs text-zinc-400 hover:text-zinc-200"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isActionLoading}
              className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-[0_0_12px_rgba(79,70,229,0.3)]"
            >
              Add Column to Board
            </button>
          </div>
        </form>
      )}

      {/* Horizontal Kanban Columns Board Area with @hello-pangea/dnd */}
      {activeBoard ? (
        <div className="relative">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="board-columns" direction="horizontal" type="COLUMN">
              {(provided, snapshot) => (
                <div
                  ref={provided.innerRef}
                  {...provided.droppableProps}
                  className={`flex gap-5 overflow-x-auto pb-4 pt-1 custom-scrollbar min-h-[450px] transition-colors ${
                    snapshot.isDraggingOver ? 'bg-indigo-950/10 rounded-2xl' : ''
                  }`}
                >
                  {columns.length === 0 ? (
                    <div className="w-full text-center py-16 bg-zinc-900/30 border border-dashed border-zinc-800 rounded-2xl">
                      <Kanban className="w-8 h-8 text-zinc-600 mx-auto mb-2" />
                      <p className="text-xs text-zinc-400">No columns in this board yet.</p>
                      <button
                        onClick={() => setIsAddingColumn(true)}
                        className="mt-2 text-xs text-indigo-400 hover:underline inline-block font-medium"
                      >
                        + Add first column
                      </button>
                    </div>
                  ) : (
                    columns.map((col, index) => {
                      const DraggableItem = Draggable as any;
                      return (
                        <DraggableItem key={col._id} draggableId={col._id} index={index}>
                          {(dragProvided: any, dragSnapshot: any) => (
                            <div
                              ref={dragProvided.innerRef}
                              {...dragProvided.draggableProps}
                            >
                              <ColumnView
                                column={col}
                                allColumns={columns}
                                columnDragHandleProps={dragProvided.dragHandleProps}
                                isDraggingColumn={dragSnapshot.isDragging}
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
          </DragDropContext>
        </div>
      ) : (
        <div className="text-center py-16 bg-zinc-900/30 border border-zinc-800/80 rounded-2xl p-6 space-y-3">
          <AlertCircle className="w-8 h-8 text-amber-400 mx-auto" />
          <h4 className="text-sm font-semibold text-zinc-200">No Active Board Selected</h4>
          <p className="text-xs text-zinc-400 max-w-md mx-auto">
            Click &quot;New Board&quot; above to create your first board with Mongoose Schemas (seeded with Backlog, In Progress, In Review, and Done columns).
          </p>
          <button
            onClick={() => setIsCreatingBoard(true)}
            className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium shadow-[0_0_15px_rgba(79,70,229,0.3)]"
          >
            Create First Board
          </button>
        </div>
      )}

      {/* Step 5: Full Task Details Modal */}
      {selectedTaskId && (
        <TaskDetailModal
          taskId={selectedTaskId}
          onClose={() => setSelectedTaskId(null)}
        />
      )}
    </div>
  );
};
