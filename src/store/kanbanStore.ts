import { create } from 'zustand';
import {
  API_BASE,
  Board,
  Column,
  Task,
  TaskPriority,
  User,
  UserStats,
  DueDateFilter,
  SubtaskFilter,
  SortOption,
  SortDirection,
} from '../types.js';

const DEFAULT_FALLBACK_BOARD: Board = {
  _id: 'demo-board-default',
  title: 'Sprint Roadmap (Demo)',
  owner: 'demo-user',
  columnOrder: ['col-backlog', 'col-in-progress', 'col-review', 'col-done'],
  columns: [
    {
      _id: 'col-backlog',
      boardId: 'demo-board-default',
      title: 'Backlog',
      taskIds: ['task-1', 'task-2'],
      tasks: [
        {
          _id: 'task-1',
          columnId: 'col-backlog',
          title: 'Explore Drag & Drop Architecture',
          description: 'Evaluate smooth reordering across columns with optimistic updates.',
          priority: 'Medium',
          subtasks: [
            { _id: 'sub-1', title: 'Test touch events', completed: true },
            { _id: 'sub-2', title: 'Verify drop animation', completed: false },
          ],
          dueDate: new Date(Date.now() + 86400000 * 4).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
        {
          _id: 'task-2',
          columnId: 'col-backlog',
          title: 'Design Dark Mode Elevation Cards',
          description: 'Maintain strict high contrast and accessible WCAG AA standards.',
          priority: 'Low',
          subtasks: [],
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'col-in-progress',
      boardId: 'demo-board-default',
      title: 'In Progress',
      taskIds: ['task-3'],
      tasks: [
        {
          _id: 'task-3',
          columnId: 'col-in-progress',
          title: 'Multi-Board Workspace Switcher',
          description: 'Manage independent project workflows in dedicated boards.',
          priority: 'High',
          subtasks: [
            { _id: 'sub-3', title: 'Implement slide-out drawer', completed: true },
            { _id: 'sub-4', title: 'Add board deletion safeguard', completed: true },
          ],
          dueDate: new Date(Date.now() + 86400000 * 2).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'col-review',
      boardId: 'demo-board-default',
      title: 'Review',
      taskIds: ['task-4'],
      tasks: [
        {
          _id: 'task-4',
          columnId: 'col-review',
          title: 'JWT Token Security Validation',
          description: 'Ensure Bearer token headers and salted bcrypt hashes are verified.',
          priority: 'High',
          subtasks: [],
          dueDate: new Date(Date.now() + 86400000).toISOString(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
    {
      _id: 'col-done',
      boardId: 'demo-board-default',
      title: 'Done',
      taskIds: ['task-5'],
      tasks: [
        {
          _id: 'task-5',
          columnId: 'col-done',
          title: 'Vite Relative Asset Configuration',
          description: 'Set base: ./ to prevent 404 errors on GitHub Pages subpaths.',
          priority: 'Medium',
          subtasks: [
            { _id: 'sub-5', title: 'Verify ./assets path resolution', completed: true },
          ],
          dueDate: null,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        },
      ],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    },
  ],
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

export interface OptimisticAction {
  id: string;
  type: string;
  status: 'optimistic' | 'confirmed' | 'rolled_back';
  message: string;
  timestamp: string;
  payload?: any;
}

interface KanbanState {
  // Auth state
  token: string;
  currentUser: User | null;
  userStats: UserStats | null;
  setAuth: (token: string, user: User) => void;
  updateProfile: (name: string, email: string) => Promise<boolean>;
  fetchUserStats: () => Promise<void>;
  logout: () => void;

  // Boards & Columns state
  boards: Board[];
  activeBoardId: string | null;
  activeBoard: Board | null;
  isLoading: boolean;
  isActionLoading: boolean;
  error: string | null;
  recentAction: OptimisticAction | null;

  // Search, Filter & Sort state (Step 5)
  searchQuery: string;
  priorityFilter: 'All' | TaskPriority;
  dueDateFilter: DueDateFilter;
  subtaskFilter: SubtaskFilter;
  sortBy: SortOption;
  sortDirection: SortDirection;
  selectedTaskId: string | null;

  setSearchQuery: (query: string) => void;
  setPriorityFilter: (priority: 'All' | TaskPriority) => void;
  setDueDateFilter: (filter: DueDateFilter) => void;
  setSubtaskFilter: (filter: SubtaskFilter) => void;
  setSortBy: (sort: SortOption) => void;
  setSortDirection: (dir: SortDirection) => void;
  setSelectedTaskId: (id: string | null) => void;
  resetFilters: () => void;

  // Board Actions
  fetchBoards: () => Promise<void>;
  setActiveBoardId: (boardId: string) => void;
  fetchActiveBoard: (boardId?: string) => Promise<void>;
  createBoard: (title: string, seedColumns?: boolean) => Promise<Board | null>;
  deleteBoard: (boardId: string) => Promise<void>;

  // Column Actions
  createColumn: (title: string) => Promise<void>;
  updateColumnTitle: (columnId: string, title: string) => Promise<void>;
  deleteColumn: (columnId: string) => Promise<void>;

  // Task Actions (Optimistic)
  createTask: (columnId: string, title: string, priority: TaskPriority, description?: string) => Promise<void>;
  updateTask: (taskId: string, updates: Partial<Task>) => Promise<void>;
  toggleSubtask: (taskId: string, subtaskId: string) => Promise<void>;
  deleteTask: (taskId: string, columnId: string) => Promise<void>;

  // Core Step 3 & 4 Optimistic Reorder Actions
  reorderTaskOptimistically: (
    taskId: string,
    sourceColumnId: string,
    destinationColumnId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => Promise<boolean>;

  reorderColumnOptimistically: (
    boardId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => Promise<boolean>;

  clearError: () => void;
}

// Helper to deep clone board state for reliable snapshots
const cloneBoard = (board: Board): Board => {
  return JSON.parse(JSON.stringify(board));
};

export const useKanbanStore = create<KanbanState>((set, get) => ({
  token: localStorage.getItem('kanban_jwt_token') || '',
  currentUser: (() => {
    try {
      const saved = localStorage.getItem('kanban_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  })(),

  userStats: null,

  setAuth: (token, user) => {
    localStorage.setItem('kanban_jwt_token', token);
    localStorage.setItem('kanban_user', JSON.stringify(user));
    set({ token, currentUser: user, error: null });
    get().fetchBoards();
    get().fetchUserStats();
  },

  updateProfile: async (name: string, email: string) => {
    const { token, currentUser } = get();
    if (!token) return false;

    set({ isActionLoading: true, error: null });

    if (token.startsWith('demo-')) {
      const updated = { ...(currentUser || { id: 'demo-user', createdAt: new Date().toISOString() }), name, email };
      localStorage.setItem('kanban_user', JSON.stringify(updated));
      set({ currentUser: updated, isActionLoading: false });
      return true;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name, email }),
      });
      if (!res.ok) {
        set({ error: 'Failed to update profile.' });
        return false;
      }
      const data = await res.json();

      if (data.success && data.user) {
        localStorage.setItem('kanban_jwt_token', data.token);
        localStorage.setItem('kanban_user', JSON.stringify(data.user));
        set({ token: data.token, currentUser: data.user });
        return true;
      } else {
        set({ error: data.message || 'Failed to update profile.' });
        return false;
      }
    } catch (err: any) {
      set({ error: err.message || 'Network error updating profile.' });
      return false;
    } finally {
      set({ isActionLoading: false });
    }
  },

  fetchUserStats: async () => {
    const { token, activeBoard, boards } = get();
    if (!token) return;

    if (token.startsWith('demo-')) {
      const boardToCount = activeBoard || boards[0] || DEFAULT_FALLBACK_BOARD;
      let totalTasks = 0;
      let completedTasks = 0;
      let highPriorityTasks = 0;
      let mediumPriorityTasks = 0;
      let lowPriorityTasks = 0;

      for (const col of boardToCount.columns || []) {
        for (const task of col.tasks || []) {
          totalTasks++;
          if (col.title.toLowerCase().includes('done')) completedTasks++;
          if (task.priority === 'High') highPriorityTasks++;
          if (task.priority === 'Medium') mediumPriorityTasks++;
          if (task.priority === 'Low') lowPriorityTasks++;
        }
      }

      set({
        userStats: {
          totalBoards: boards.length || 1,
          totalColumns: boardToCount.columns?.length || 4,
          totalTasks,
          completedTasks,
          pendingTasks: totalTasks - completedTasks,
          highPriorityTasks,
          mediumPriorityTasks,
          lowPriorityTasks,
        },
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/auth/stats`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const data = await res.json();
      if (data.success && data.stats) {
        set({ userStats: data.stats });
      }
    } catch (err) {
      console.error('Failed to fetch user stats:', err);
    }
  },

  logout: () => {
    localStorage.removeItem('kanban_jwt_token');
    localStorage.removeItem('kanban_user');
    set({
      token: '',
      currentUser: null,
      userStats: null,
      boards: [],
      activeBoardId: null,
      activeBoard: null,
      recentAction: null,
      error: null,
    });
  },

  boards: [],
  activeBoardId: null,
  activeBoard: null,
  isLoading: false,
  isActionLoading: false,
  error: null,
  recentAction: null,

  searchQuery: '',
  priorityFilter: 'All',
  dueDateFilter: 'All',
  subtaskFilter: 'All',
  sortBy: 'manual',
  sortDirection: 'asc',
  selectedTaskId: null,

  setSearchQuery: (query) => set({ searchQuery: query }),
  setPriorityFilter: (priority) => set({ priorityFilter: priority }),
  setDueDateFilter: (filter) => set({ dueDateFilter: filter }),
  setSubtaskFilter: (filter) => set({ subtaskFilter: filter }),
  setSortBy: (sort) => set({ sortBy: sort }),
  setSortDirection: (dir) => set({ sortDirection: dir }),
  setSelectedTaskId: (id) => set({ selectedTaskId: id }),
  resetFilters: () =>
    set({
      searchQuery: '',
      priorityFilter: 'All',
      dueDateFilter: 'All',
      subtaskFilter: 'All',
      sortBy: 'manual',
      sortDirection: 'asc',
    }),
  clearError: () => set({ error: null }),

  fetchBoards: async () => {
    const { token } = get();
    if (!token) return;

    set({ isLoading: true, error: null });

    if (token.startsWith('demo-')) {
      const current = get().boards;
      const boardsList = current.length > 0 ? current : [DEFAULT_FALLBACK_BOARD];
      const activeId = boardsList[0]._id || boardsList[0].id;
      set({ boards: boardsList, activeBoardId: activeId, activeBoard: boardsList[0], isLoading: false });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/boards`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        // Fallback for static GitHub Pages hosting
        const boardsList = [DEFAULT_FALLBACK_BOARD];
        const activeId = boardsList[0]._id || boardsList[0].id;
        set({ boards: boardsList, activeBoardId: activeId, activeBoard: boardsList[0] });
        return;
      }
      const data = await res.json();

      if (data.success && data.boards) {
        const boardsList = data.boards;
        set({ boards: boardsList });

        // Auto-select first board if none selected
        const currentActive = get().activeBoardId;
        if (boardsList.length > 0 && (!currentActive || !boardsList.some((b: Board) => (b._id || b.id) === currentActive))) {
          const firstId = boardsList[0]._id || boardsList[0].id;
          set({ activeBoardId: firstId });
          get().fetchActiveBoard(firstId);
        }
      }
    } catch {
      // Fallback for static preview
      const boardsList = [DEFAULT_FALLBACK_BOARD];
      const activeId = boardsList[0]._id || boardsList[0].id;
      set({ boards: boardsList, activeBoardId: activeId, activeBoard: boardsList[0] });
    } finally {
      set({ isLoading: false });
    }
  },

  setActiveBoardId: (boardId) => {
    set({ activeBoardId: boardId });
    get().fetchActiveBoard(boardId);
  },

  fetchActiveBoard: async (boardId) => {
    const { token, activeBoardId, boards } = get();
    const targetId = boardId || activeBoardId;
    if (!token || !targetId) return;

    if (token.startsWith('demo-')) {
      const found = boards.find((b) => (b._id || b.id) === targetId);
      if (found) set({ activeBoard: found });
      return;
    }

    set({ isLoading: true, error: null });
    try {
      const res = await fetch(`${API_BASE}/api/boards/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const found = boards.find((b) => (b._id || b.id) === targetId);
        if (found) set({ activeBoard: found });
        return;
      }
      const data = await res.json();

      if (data.success && data.board) {
        set({ activeBoard: data.board });
      } else {
        set({ error: data.message || 'Failed to load board.' });
      }
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch board details.' });
    } finally {
      set({ isLoading: false });
    }
  },

  createBoard: async (title, seedColumns = true) => {
    const { token, boards } = get();
    if (!token) return null;

    set({ isActionLoading: true });

    if (token.startsWith('demo-')) {
      const newBoard: Board = {
        _id: `board-${Date.now()}`,
        title,
        owner: 'demo-user',
        columnOrder: seedColumns ? ['c1', 'c2', 'c3'] : [],
        columns: seedColumns ? [
          { _id: 'c1', boardId: `board-${Date.now()}`, title: 'To Do', taskIds: [], tasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { _id: 'c2', boardId: `board-${Date.now()}`, title: 'In Progress', taskIds: [], tasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
          { _id: 'c3', boardId: `board-${Date.now()}`, title: 'Done', taskIds: [], tasks: [], createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }
        ] : [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({
        boards: [...boards, newBoard],
        activeBoardId: newBoard._id,
        activeBoard: newBoard,
        isActionLoading: false,
        recentAction: {
          id: String(Date.now()),
          type: 'CREATE_BOARD',
          status: 'confirmed',
          message: `Created board "${title}"`,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      return newBoard;
    }

    try {
      const res = await fetch(`${API_BASE}/api/boards`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title, seedDefaultColumns: seedColumns }),
      });
      if (!res.ok) {
        set({ error: 'Failed to create board.' });
        return null;
      }
      const data = await res.json();

      if (data.success && data.board) {
        await get().fetchBoards();
        const newBoardId = data.board._id || data.board.id;
        get().setActiveBoardId(newBoardId);
        set({
          recentAction: {
            id: String(Date.now()),
            type: 'CREATE_BOARD',
            status: 'confirmed',
            message: `Created board "${title}"`,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
        return data.board;
      }
      return null;
    } catch (err: any) {
      set({ error: err.message });
      return null;
    } finally {
      set({ isActionLoading: false });
    }
  },

  deleteBoard: async (boardId) => {
    const { token } = get();
    if (!token) return;

    set({ isActionLoading: true });
    const remaining = get().boards.filter((b) => (b._id || b.id) !== boardId);
    set({
      boards: remaining,
      activeBoardId: remaining.length > 0 ? (remaining[0]._id || remaining[0].id) : null,
      activeBoard: remaining.length > 0 ? remaining[0] : null,
      recentAction: {
        id: String(Date.now()),
        type: 'DELETE_BOARD',
        status: 'confirmed',
        message: 'Board deleted.',
        timestamp: new Date().toLocaleTimeString(),
      },
    });

    if (token.startsWith('demo-')) {
      set({ isActionLoading: false });
      return;
    }

    try {
      await fetch(`${API_BASE}/api/boards/${boardId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isActionLoading: false });
    }
  },

  createColumn: async (title) => {
    const { token, activeBoardId, activeBoard } = get();
    if (!token || !activeBoardId) return;

    set({ isActionLoading: true });

    if (token.startsWith('demo-')) {
      if (activeBoard) {
        const newCol = {
          _id: `col-${Date.now()}`,
          boardId: activeBoardId,
          title,
          taskIds: [],
          tasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        set({
          activeBoard: {
            ...activeBoard,
            columns: [...(activeBoard.columns || []), newCol],
          },
          isActionLoading: false,
          recentAction: {
            id: String(Date.now()),
            type: 'CREATE_COLUMN',
            status: 'confirmed',
            message: `Created column "${title}"`,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
      }
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/columns`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ boardId: activeBoardId, title }),
      });
      const data = await res.json();

      if (data.success && data.column) {
        if (activeBoard) {
          const newCol = { ...data.column, tasks: [] };
          set({
            activeBoard: {
              ...activeBoard,
              columns: [...(activeBoard.columns || []), newCol],
            },
            recentAction: {
              id: String(Date.now()),
              type: 'CREATE_COLUMN',
              status: 'confirmed',
              message: `Created column "${title}"`,
              timestamp: new Date().toLocaleTimeString(),
            },
          });
        }
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isActionLoading: false });
    }
  },

  updateColumnTitle: async (columnId, title) => {
    const { token, activeBoard } = get();
    if (!token || !activeBoard) return;

    // Optimistic column update
    const prevBoard = cloneBoard(activeBoard);
    set({
      activeBoard: {
        ...activeBoard,
        columns: (activeBoard.columns || []).map((col) =>
          col._id === columnId ? { ...col, title } : col
        ),
      },
    });

    if (token.startsWith('demo-')) return;

    try {
      const res = await fetch(`${API_BASE}/api/columns/${columnId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title }),
      });
      const data = await res.json();

      if (!data.success) {
        set({ activeBoard: prevBoard, error: data.message || 'Failed to update column title.' });
      }
    } catch (err: any) {
      set({ activeBoard: prevBoard, error: err.message });
    }
  },

  deleteColumn: async (columnId) => {
    const { token, activeBoard } = get();
    if (!token || !activeBoard) return;

    const prevBoard = cloneBoard(activeBoard);
    // Optimistic column removal
    set({
      activeBoard: {
        ...activeBoard,
        columns: (activeBoard.columns || []).filter((col) => col._id !== columnId),
      },
      recentAction: {
        id: String(Date.now()),
        type: 'DELETE_COLUMN',
        status: 'optimistic',
        message: 'Deleted column',
        timestamp: new Date().toLocaleTimeString(),
      },
    });

    if (token.startsWith('demo-')) {
      set((state) => ({
        recentAction: state.recentAction
          ? { ...state.recentAction, status: 'confirmed' }
          : null,
      }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/columns/${columnId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        set((state) => ({
          recentAction: state.recentAction
            ? { ...state.recentAction, status: 'confirmed' }
            : null,
        }));
      } else {
        // Rollback
        set({
          activeBoard: prevBoard,
          error: data.message || 'Failed to delete column.',
          recentAction: {
            id: String(Date.now()),
            type: 'DELETE_COLUMN',
            status: 'rolled_back',
            message: 'Column deletion rolled back',
            timestamp: new Date().toLocaleTimeString(),
          },
        });
      }
    } catch (err: any) {
      set({
        activeBoard: prevBoard,
        error: err.message,
        recentAction: {
          id: String(Date.now()),
          type: 'DELETE_COLUMN',
          status: 'rolled_back',
          message: 'Column deletion rolled back',
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    }
  },

  createTask: async (columnId, title, priority, description = '') => {
    const { token, activeBoard } = get();
    if (!token || !activeBoard) return;

    set({ isActionLoading: true });

    if (token.startsWith('demo-')) {
      const newTask: Task = {
        _id: `task-${Date.now()}`,
        columnId,
        title,
        description,
        priority,
        subtasks: [],
        dueDate: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      set({
        activeBoard: {
          ...activeBoard,
          columns: (activeBoard.columns || []).map((col) => {
            if (col._id === columnId) {
              return {
                ...col,
                tasks: [...(col.tasks || []), newTask],
                taskIds: [...(col.taskIds || []), newTask._id],
              };
            }
            return col;
          }),
        },
        isActionLoading: false,
        recentAction: {
          id: String(Date.now()),
          type: 'CREATE_TASK',
          status: 'confirmed',
          message: `Added task "${title}"`,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tasks`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ columnId, title, priority, description }),
      });
      const data = await res.json();

      if (data.success && data.task) {
        const newTask: Task = data.task;
        set({
          activeBoard: {
            ...activeBoard,
            columns: (activeBoard.columns || []).map((col) => {
              if (col._id === columnId) {
                return {
                  ...col,
                  tasks: [...(col.tasks || []), newTask],
                  taskIds: [...(col.taskIds || []), newTask._id],
                };
              }
              return col;
            }),
          },
          recentAction: {
            id: String(Date.now()),
            type: 'CREATE_TASK',
            status: 'confirmed',
            message: `Added task "${title}"`,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
      }
    } catch (err: any) {
      set({ error: err.message });
    } finally {
      set({ isActionLoading: false });
    }
  },

  updateTask: async (taskId, updates) => {
    const { token, activeBoard } = get();
    if (!token || !activeBoard) return;

    const prevBoard = cloneBoard(activeBoard);

    // Optimistically apply task updates
    set({
      activeBoard: {
        ...activeBoard,
        columns: (activeBoard.columns || []).map((col) => ({
          ...col,
          tasks: (col.tasks || []).map((t) => (t._id === taskId ? { ...t, ...updates } : t)),
        })),
      },
    });

    if (token.startsWith('demo-')) return;

    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(updates),
      });
      const data = await res.json();

      if (!data.success) {
        // Rollback
        set({ activeBoard: prevBoard, error: data.message || 'Failed to update task.' });
      }
    } catch (err: any) {
      set({ activeBoard: prevBoard, error: err.message });
    }
  },

  toggleSubtask: async (taskId, subtaskId) => {
    const { activeBoard } = get();
    if (!activeBoard) return;

    // Find the current task
    let targetTask: Task | null = null;
    for (const col of activeBoard.columns || []) {
      const found = (col.tasks || []).find((t) => t._id === taskId);
      if (found) {
        targetTask = found;
        break;
      }
    }

    if (!targetTask) return;

    const updatedSubtasks = (targetTask.subtasks || []).map((st) => {
      const stId = (st as any)._id || st.id;
      if (stId === subtaskId) {
        return { ...st, completed: !st.completed };
      }
      return st;
    });

    await get().updateTask(taskId, { subtasks: updatedSubtasks });
  },

  deleteTask: async (taskId, columnId) => {
    const { token, activeBoard } = get();
    if (!token || !activeBoard) return;

    const prevBoard = cloneBoard(activeBoard);

    // Optimistic removal of task
    set({
      activeBoard: {
        ...activeBoard,
        columns: (activeBoard.columns || []).map((col) => {
          if (col._id === columnId) {
            return {
              ...col,
              tasks: (col.tasks || []).filter((t) => t._id !== taskId),
              taskIds: (col.taskIds || []).filter((id) => id !== taskId),
            };
          }
          return col;
        }),
      },
      recentAction: {
        id: String(Date.now()),
        type: 'DELETE_TASK',
        status: 'optimistic',
        message: 'Deleted task',
        timestamp: new Date().toLocaleTimeString(),
      },
    });

    if (token.startsWith('demo-')) {
      set((state) => ({
        recentAction: state.recentAction
          ? { ...state.recentAction, status: 'confirmed' }
          : null,
      }));
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/api/tasks/${taskId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();

      if (data.success) {
        set((state) => ({
          recentAction: state.recentAction
            ? { ...state.recentAction, status: 'confirmed' }
            : null,
        }));
      } else {
        // Rollback
        set({
          activeBoard: prevBoard,
          error: data.message || 'Failed to delete task.',
          recentAction: {
            id: String(Date.now()),
            type: 'DELETE_TASK',
            status: 'rolled_back',
            message: 'Task deletion rolled back',
            timestamp: new Date().toLocaleTimeString(),
          },
        });
      }
    } catch (err: any) {
      set({
        activeBoard: prevBoard,
        error: err.message,
        recentAction: {
          id: String(Date.now()),
          type: 'DELETE_TASK',
          status: 'rolled_back',
          message: 'Task deletion rolled back',
          timestamp: new Date().toLocaleTimeString(),
        },
      });
    }
  },

  // -------------------------------------------------------------
  // Step 3 Core Action: reorderTaskOptimistically
  // -------------------------------------------------------------
  reorderTaskOptimistically: async (
    taskId,
    sourceColumnId,
    destinationColumnId,
    sourceIndex,
    destinationIndex
  ) => {
    const { token, activeBoard } = get();
    if (!token || !activeBoard) return false;

    // 1. Take snapshot for atomic rollback in case of network/server failure
    const snapshotBoard = cloneBoard(activeBoard);

    // 2. Compute the optimistic new board state
    const newColumns = (activeBoard.columns || []).map((col) => ({
      ...col,
      tasks: [...(col.tasks || [])],
      taskIds: [...(col.taskIds || [])],
    }));

    const sourceCol = newColumns.find((c) => c._id === sourceColumnId);
    const destCol = newColumns.find((c) => c._id === destinationColumnId);

    if (!sourceCol || !destCol) return false;

    // Find the task object to move
    const taskToMove = sourceCol.tasks.find((t) => t._id === taskId);
    if (!taskToMove) return false;

    const actionId = String(Date.now());

    if (sourceColumnId === destinationColumnId) {
      // Reorder within the same column
      sourceCol.tasks.splice(sourceIndex, 1);
      sourceCol.tasks.splice(destinationIndex, 0, taskToMove);

      sourceCol.taskIds = sourceCol.tasks.map((t) => t._id);

      set({
        activeBoard: {
          ...activeBoard,
          columns: newColumns,
        },
        recentAction: {
          id: actionId,
          type: 'OPTIMISTIC_REORDER_SAME_COLUMN',
          status: 'optimistic',
          message: `Moved "${taskToMove.title}" (pos ${sourceIndex} → ${destinationIndex})`,
          timestamp: new Date().toLocaleTimeString(),
          payload: { taskId, sourceColumnId, destinationIndex },
        },
      });
    } else {
      // Reorder across different columns
      sourceCol.tasks.splice(sourceIndex, 1);
      sourceCol.taskIds = sourceCol.tasks.map((t) => t._id);

      const updatedMovedTask: Task = {
        ...taskToMove,
        columnId: destinationColumnId,
      };

      destCol.tasks.splice(destinationIndex, 0, updatedMovedTask);
      destCol.taskIds = destCol.tasks.map((t) => t._id);

      set({
        activeBoard: {
          ...activeBoard,
          columns: newColumns,
        },
        recentAction: {
          id: actionId,
          type: 'OPTIMISTIC_REORDER_CROSS_COLUMN',
          status: 'optimistic',
          message: `Moved "${taskToMove.title}" to ${destCol.title}`,
          timestamp: new Date().toLocaleTimeString(),
          payload: { taskId, sourceColumnId, destinationColumnId, destinationIndex },
        },
      });
    }

    if (token.startsWith('demo-')) {
      set((state) => ({
        recentAction: state.recentAction
          ? {
              ...state.recentAction,
              status: 'confirmed',
              message: `Demo mode: ${state.recentAction.message}`,
            }
          : null,
      }));
      return true;
    }

    // 3. Fire the backend API call asynchronously
    try {
      const res = await fetch(`${API_BASE}/api/tasks/reorder`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          taskId,
          sourceColumnId,
          destinationColumnId,
          sourceIndex,
          destinationIndex,
        }),
      });

      const data = await res.json();

      if (data.success) {
        // Confirmed by server and MongoDB atomic operation
        set((state) => ({
          recentAction: state.recentAction
            ? {
                ...state.recentAction,
                status: 'confirmed',
                message: `Server confirmed: ${state.recentAction.message}`,
              }
            : null,
        }));
        return true;
      } else {
        // Rollback to snapshot
        set({
          activeBoard: snapshotBoard,
          error: data.message || 'Server rejected reorder. State rolled back.',
          recentAction: {
            id: actionId,
            type: 'REORDER_ROLLBACK',
            status: 'rolled_back',
            message: `Rollback triggered: ${data.message || 'Server error'}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
        return false;
      }
    } catch (err: any) {
      // Network failure -> Rollback
      set({
        activeBoard: snapshotBoard,
        error: `Network error: ${err.message}. Rolled back to previous state.`,
        recentAction: {
          id: actionId,
          type: 'REORDER_ROLLBACK',
          status: 'rolled_back',
          message: `Network error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      return false;
    }
  },

  reorderColumnOptimistically: async (
    boardId: string,
    sourceIndex: number,
    destinationIndex: number
  ) => {
    const { token, activeBoard } = get();
    if (!token || !activeBoard || sourceIndex === destinationIndex) return false;

    // 1. Take snapshot for atomic rollback
    const snapshotBoard = cloneBoard(activeBoard);

    // 2. Compute optimistic new columns arrangement
    const newColumns = [...(activeBoard.columns || [])];
    const [movedCol] = newColumns.splice(sourceIndex, 1);
    if (!movedCol) return false;
    newColumns.splice(destinationIndex, 0, movedCol);

    const newColumnOrder = newColumns.map((c) => c._id);
    const actionId = String(Date.now());

    set({
      activeBoard: {
        ...activeBoard,
        columns: newColumns,
        columnOrder: newColumnOrder,
      },
      recentAction: {
        id: actionId,
        type: 'OPTIMISTIC_REORDER_COLUMN',
        status: 'optimistic',
        message: `Reordered column "${movedCol.title}" (${sourceIndex} → ${destinationIndex})`,
        timestamp: new Date().toLocaleTimeString(),
        payload: { boardId, sourceIndex, destinationIndex, columnOrder: newColumnOrder },
      },
    });

    if (token.startsWith('demo-')) {
      set((state) => ({
        recentAction: state.recentAction
          ? {
              ...state.recentAction,
              status: 'confirmed',
              message: `Demo mode: ${state.recentAction.message}`,
            }
          : null,
      }));
      return true;
    }

    // 3. Fire backend API call asynchronously
    try {
      const res = await fetch(`${API_BASE}/api/boards/${boardId}/reorder-columns`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ columnOrder: newColumnOrder }),
      });
      const data = await res.json();

      if (data.success) {
        set((state) => ({
          recentAction: state.recentAction
            ? {
                ...state.recentAction,
                status: 'confirmed',
                message: `Server confirmed column reorder: "${movedCol.title}"`,
              }
            : null,
        }));
        return true;
      } else {
        set({
          activeBoard: snapshotBoard,
          error: data.message || 'Failed to reorder columns. State rolled back.',
          recentAction: {
            id: actionId,
            type: 'COLUMN_REORDER_ROLLBACK',
            status: 'rolled_back',
            message: `Rollback: ${data.message || 'Server error'}`,
            timestamp: new Date().toLocaleTimeString(),
          },
        });
        return false;
      }
    } catch (err: any) {
      set({
        activeBoard: snapshotBoard,
        error: `Network error: ${err.message}`,
        recentAction: {
          id: actionId,
          type: 'COLUMN_REORDER_ROLLBACK',
          status: 'rolled_back',
          message: `Network error: ${err.message}`,
          timestamp: new Date().toLocaleTimeString(),
        },
      });
      return false;
    }
  },
}));
