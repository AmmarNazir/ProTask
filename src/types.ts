export type TaskPriority = 'Low' | 'Medium' | 'High';

export type DueDateFilter = 'All' | 'Overdue' | 'Today' | 'Upcoming' | 'HasDate' | 'NoDate';
export type SubtaskFilter = 'All' | 'HasSubtasks' | 'Completed' | 'Incomplete';
export type SortOption = 'manual' | 'dueDate' | 'priority' | 'title' | 'subtasks';
export type SortDirection = 'asc' | 'desc';

export interface User {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

export interface UserStats {
  totalBoards: number;
  totalColumns: number;
  totalTasks: number;
  completedTasks: number;
  pendingTasks: number;
  highPriorityTasks: number;
  mediumPriorityTasks: number;
  lowPriorityTasks: number;
}

export interface Subtask {
  _id?: string;
  id?: string;
  title: string;
  completed: boolean;
}

export interface Task {
  _id: string;
  id?: string;
  columnId: string;
  title: string;
  description: string;
  priority: TaskPriority;
  subtasks: Subtask[];
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Column {
  _id: string;
  id?: string;
  boardId: string;
  title: string;
  taskIds: string[];
  tasks?: Task[];
  createdAt: string;
  updatedAt: string;
}

export interface Board {
  _id: string;
  id?: string;
  title: string;
  owner: string;
  columnOrder: string[];
  columns?: Column[];
  createdAt: string;
  updatedAt: string;
}

export interface ReorderTaskPayload {
  taskId: string;
  sourceColumnId: string;
  destinationColumnId: string;
  sourceIndex: number;
  destinationIndex: number;
}

export const API_BASE = ((import.meta as any).env?.VITE_API_URL || '').replace(/\/$/, '');
