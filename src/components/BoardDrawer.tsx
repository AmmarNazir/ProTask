import React, { useState } from 'react';
import {
  X,
  Plus,
  Layout,
  Trash2,
  Columns3,
  Layers,
  AlertCircle
} from 'lucide-react';
import { useKanbanStore } from '../store/kanbanStore.js';

interface BoardDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export const BoardDrawer: React.FC<BoardDrawerProps> = ({ isOpen, onClose }) => {
  const {
    boards,
    activeBoardId,
    setActiveBoardId,
    createBoard,
    deleteBoard,
    fetchUserStats,
    isActionLoading,
  } = useKanbanStore();

  const [isCreating, setIsCreating] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [seedColumns, setSeedColumns] = useState(true);
  const [boardToDelete, setBoardToDelete] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;

    setErrorMsg(null);
    const created = await createBoard(newTitle.trim(), seedColumns);
    if (created) {
      setNewTitle('');
      setIsCreating(false);
      fetchUserStats();
    } else {
      setErrorMsg('Failed to create board. Please check your title.');
    }
  };

  const handleDelete = async (boardId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (boards.length <= 1) {
      setErrorMsg('You cannot delete your only board. Please create another board first.');
      return;
    }
    setErrorMsg(null);
    await deleteBoard(boardId);
    setBoardToDelete(null);
    fetchUserStats();
  };

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/65 backdrop-blur-sm transition-opacity duration-200"
        onClick={onClose}
      />

      {/* Slide-out Drawer Panel */}
      <div className="relative w-84 max-w-[88vw] h-full bg-[#0d0d10] border-r border-zinc-800 shadow-2xl flex flex-col z-10 animate-in slide-in-from-left duration-200">
        {/* Drawer Header */}
        <div className="h-16 px-5 border-b border-zinc-800/80 flex items-center justify-between bg-zinc-900/40">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-zinc-100 flex items-center gap-2">
                <span>Board Switcher</span>
                <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-md bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                  {boards.length}
                </span>
              </h2>
              <p className="text-[11px] text-zinc-500">Switch workspace or create boards</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/60 transition-colors cursor-pointer"
            title="Close Drawer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Error notification if any */}
        {errorMsg && (
          <div className="mx-4 mt-3 p-2.5 rounded-xl bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Board List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5">
          <div className="text-[11px] font-semibold text-zinc-400 uppercase tracking-wider px-1">
            Your Boards ({boards.length})
          </div>

          {boards.map((board) => {
            const bId = board._id || board.id;
            const isActive = bId === activeBoardId;
            const colCount = (board.columnOrder || []).length || (board.columns || []).length;
            const isDeletingThis = boardToDelete === bId;

            return (
              <div
                key={bId}
                onClick={() => {
                  setActiveBoardId(bId);
                  onClose();
                }}
                className={`group relative p-3.5 rounded-xl border transition-all cursor-pointer ${
                  isActive
                    ? 'bg-indigo-950/40 border-indigo-500/60 shadow-[0_0_15px_rgba(79,70,229,0.2)] ring-1 ring-indigo-500/40'
                    : 'bg-zinc-900/40 border-zinc-800/80 hover:bg-zinc-800/50 hover:border-zinc-700'
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div
                      className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${
                        isActive
                          ? 'bg-indigo-600 text-white'
                          : 'bg-zinc-800 text-zinc-400 group-hover:text-zinc-200'
                      }`}
                    >
                      <Layout className="w-3.5 h-3.5" />
                    </div>

                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-zinc-100 truncate flex items-center gap-1.5">
                        <span className="truncate">{board.title}</span>
                        {isActive && (
                          <span className="shrink-0 w-2 h-2 rounded-full bg-indigo-400 shadow-[0_0_6px_rgba(99,102,241,0.8)]" />
                        )}
                      </div>
                      <div className="text-[11px] text-zinc-500 flex items-center gap-2 mt-0.5">
                        <span className="flex items-center gap-1">
                          <Columns3 className="w-3 h-3 text-zinc-600" />
                          <span>{colCount} cols</span>
                        </span>
                        <span>•</span>
                        <span>
                          {board.updatedAt
                            ? new Date(board.updatedAt).toLocaleDateString('en-US', {
                                month: 'short',
                                day: 'numeric',
                              })
                            : 'Active'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Actions: Delete board (if more than 1) */}
                  {boards.length > 1 && (
                    <div className="shrink-0">
                      {isDeletingThis ? (
                        <div
                          className="flex items-center gap-1 bg-zinc-900 border border-rose-800/80 p-1 rounded-lg"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={(e) => handleDelete(bId, e)}
                            className="px-1.5 py-0.5 rounded bg-rose-600 hover:bg-rose-500 text-[10px] font-bold text-white transition-colors cursor-pointer"
                          >
                            Delete
                          </button>
                          <button
                            onClick={() => setBoardToDelete(null)}
                            className="px-1 py-0.5 text-zinc-400 hover:text-zinc-200 text-[10px] cursor-pointer"
                          >
                            ✕
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setBoardToDelete(bId);
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 rounded-lg text-zinc-500 hover:text-rose-400 hover:bg-rose-950/30 transition-all cursor-pointer"
                          title="Delete this board"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {/* Inline Create Board Form */}
          {isCreating ? (
            <form
              onSubmit={handleCreate}
              className="p-3.5 rounded-xl bg-zinc-900/80 border border-indigo-500/40 space-y-3 animate-in fade-in duration-150"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-zinc-200">New Board</span>
                <button
                  type="button"
                  onClick={() => setIsCreating(false)}
                  className="text-zinc-500 hover:text-zinc-300 text-xs cursor-pointer"
                >
                  Cancel
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Board Title (e.g. Q4 Sprint, Launch)"
                  autoFocus
                  required
                  className="w-full bg-[#121216] border border-zinc-700/80 rounded-xl px-3 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500"
                />
              </div>

              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-zinc-400">
                <input
                  type="checkbox"
                  checked={seedColumns}
                  onChange={(e) => setSeedColumns(e.target.checked)}
                  className="rounded border-zinc-700 bg-zinc-800 text-indigo-600 focus:ring-0"
                />
                <span>Include starter columns (Backlog, Done)</span>
              </label>

              <button
                type="submit"
                disabled={isActionLoading || !newTitle.trim()}
                className="w-full py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold shadow-md flex items-center justify-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isActionLoading ? 'Creating...' : 'Create Board'}</span>
              </button>
            </form>
          ) : (
            <button
              onClick={() => {
                setIsCreating(true);
                setErrorMsg(null);
              }}
              className="w-full py-3 px-3.5 rounded-xl border border-dashed border-zinc-700/80 hover:border-indigo-500/80 hover:bg-indigo-950/20 text-xs font-medium text-zinc-400 hover:text-indigo-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4 text-indigo-400" />
              <span>Create New Board</span>
            </button>
          )}
        </div>

        {/* Drawer Footer info */}
        <div className="p-4 border-t border-zinc-800/80 bg-zinc-900/30 text-[11px] text-zinc-500 flex items-center justify-between">
          <span>ProTask Boards</span>
          <span className="text-emerald-400 font-mono text-[10px]">Cloud Synced</span>
        </div>
      </div>
    </div>
  );
};
