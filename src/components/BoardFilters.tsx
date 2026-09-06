import React from 'react';
import {
  Search,
  Filter,
  X,
  Calendar,
  CheckSquare,
  ArrowUpDown,
  RotateCcw,
  SlidersHorizontal,
  ChevronDown
} from 'lucide-react';
import {
  TaskPriority,
  DueDateFilter,
  SubtaskFilter,
  SortOption,
  SortDirection,
} from '../types.js';
import { useKanbanStore } from '../store/kanbanStore.js';

interface BoardFiltersProps {
  totalTasks: number;
  filteredTasksCount: number;
}

export const BoardFilters: React.FC<BoardFiltersProps> = ({
  totalTasks,
  filteredTasksCount,
}) => {
  const {
    searchQuery,
    setSearchQuery,
    priorityFilter,
    setPriorityFilter,
    dueDateFilter,
    setDueDateFilter,
    subtaskFilter,
    setSubtaskFilter,
    sortBy,
    setSortBy,
    sortDirection,
    setSortDirection,
    resetFilters,
  } = useKanbanStore();

  const isAnyFilterActive =
    Boolean(searchQuery.trim()) ||
    priorityFilter !== 'All' ||
    dueDateFilter !== 'All' ||
    subtaskFilter !== 'All' ||
    sortBy !== 'manual';

  return (
    <div className="p-4 rounded-2xl bg-[#0e0e12] border border-zinc-800/80 space-y-3.5 shadow-lg">
      {/* Top Filter Row: Search + Quick Priority Filters + Reset */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
        {/* Real-time Search Box */}
        <div className="relative flex-1 max-w-md">
          <Search className="w-3.5 h-3.5 text-zinc-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            id="input-filter-search"
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search tasks, descriptions, or subtasks..."
            className="w-full bg-[#141418] border border-zinc-800/90 rounded-xl pl-9 pr-8 py-2 text-xs text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-zinc-200"
              title="Clear search"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Priority Filter Buttons */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          <span className="text-zinc-500 text-[11px] mr-1 flex items-center gap-1 font-medium">
            <Filter className="w-3 h-3 text-indigo-400" />
            <span>Priority:</span>
          </span>
          {(['All', 'High', 'Medium', 'Low'] as const).map((p) => {
            const isSelected = priorityFilter === p;
            let badgeClass = 'bg-zinc-800/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800';

            if (isSelected) {
              if (p === 'High') badgeClass = 'bg-rose-500/20 text-rose-300 border border-rose-500/40 shadow-[0_0_10px_rgba(244,63,94,0.2)]';
              else if (p === 'Medium') badgeClass = 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-[0_0_10px_rgba(245,158,11,0.2)]';
              else if (p === 'Low') badgeClass = 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-[0_0_10px_rgba(16,185,129,0.2)]';
              else badgeClass = 'bg-indigo-600 text-white shadow-[0_0_10px_rgba(79,70,229,0.3)]';
            }

            return (
              <button
                key={p}
                id={`filter-priority-${p.toLowerCase()}`}
                onClick={() => setPriorityFilter(p as any)}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition-all ${badgeClass}`}
              >
                {p}
              </button>
            );
          })}
        </div>

        {/* Reset Filters */}
        {isAnyFilterActive && (
          <button
            id="btn-reset-filters"
            onClick={resetFilters}
            className="px-2.5 py-1.5 rounded-lg bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 hover:text-white text-xs font-medium flex items-center gap-1.5 transition-colors self-start md:self-auto"
            title="Reset all active filters"
          >
            <RotateCcw className="w-3 h-3 text-indigo-400" />
            <span>Reset</span>
          </button>
        )}
      </div>

      {/* Second Filter Row: Due Date Filter, Subtask Filter & Sorting */}
      <div className="pt-3 border-t border-zinc-800/60 flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          {/* Due Date Filter Dropdown */}
          <div className="flex items-center gap-1.5">
            <Calendar className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-500 text-[11px]">Due Date:</span>
            <select
              id="select-filter-due-date"
              value={dueDateFilter}
              onChange={(e) => setDueDateFilter(e.target.value as DueDateFilter)}
              className="bg-[#141418] text-zinc-200 text-xs rounded-lg px-2 py-1 border border-zinc-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Dates</option>
              <option value="Overdue">⚠️ Overdue Only</option>
              <option value="Today">📅 Due Today</option>
              <option value="Upcoming">⏳ Upcoming (Future)</option>
              <option value="HasDate">Has Due Date</option>
              <option value="NoDate">No Due Date Set</option>
            </select>
          </div>

          {/* Subtask Status Filter */}
          <div className="flex items-center gap-1.5">
            <CheckSquare className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-500 text-[11px]">Subtasks:</span>
            <select
              id="select-filter-subtasks"
              value={subtaskFilter}
              onChange={(e) => setSubtaskFilter(e.target.value as SubtaskFilter)}
              className="bg-[#141418] text-zinc-200 text-xs rounded-lg px-2 py-1 border border-zinc-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">All Subtasks</option>
              <option value="HasSubtasks">Has Subtasks</option>
              <option value="Completed">All Completed</option>
              <option value="Incomplete">Incomplete Left</option>
            </select>
          </div>

          {/* Sort By Dropdown */}
          <div className="flex items-center gap-1.5">
            <ArrowUpDown className="w-3.5 h-3.5 text-indigo-400" />
            <span className="text-zinc-500 text-[11px]">Sort By:</span>
            <select
              id="select-sort-by"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-[#141418] text-zinc-200 text-xs rounded-lg px-2 py-1 border border-zinc-800 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="manual">Manual (Custom Drag Order)</option>
              <option value="dueDate">Due Date (Soonest first)</option>
              <option value="priority">Priority (High to Low)</option>
              <option value="title">Title (Alphabetical)</option>
              <option value="subtasks">Subtask Progress</option>
            </select>

            {sortBy !== 'manual' && (
              <button
                type="button"
                onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                className="px-2 py-1 rounded-lg bg-zinc-800 text-[11px] text-zinc-300 hover:text-white border border-zinc-700"
                title={`Toggle direction (Currently ${sortDirection.toUpperCase()})`}
              >
                {sortDirection === 'asc' ? '▲ Asc' : '▼ Desc'}
              </button>
            )}
          </div>
        </div>

        {/* Filter Stats Indicator */}
        <div className="flex items-center gap-2 font-mono text-[11px] text-zinc-400">
          <span>
            Showing <strong className="text-indigo-400">{filteredTasksCount}</strong> of{' '}
            <strong className="text-zinc-200">{totalTasks}</strong> tasks
          </span>
          {isAnyFilterActive && (
            <span className="px-1.5 py-0.5 rounded bg-indigo-500/10 text-indigo-400 text-[10px] font-sans border border-indigo-500/20">
              Filtered
            </span>
          )}
        </div>
      </div>
    </div>
  );
};
