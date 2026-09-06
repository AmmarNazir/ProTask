import { Router, type Response } from 'express';
import mongoose from 'mongoose';
import { Board } from '../models/Board.ts';
import { Column } from '../models/Column.ts';
import { Task } from '../models/Task.ts';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

// Protect all board routes with JWT authentication
router.use(authenticate);

/**
 * @route   GET /api/boards
 * @desc    Get all boards owned by the authenticated user
 */
router.get('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const boards = await Board.find({ owner: req.userId }).sort({ updatedAt: -1 });
    res.json({
      success: true,
      count: boards.length,
      boards,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/boards
 * @desc    Create a new board (optionally seed default columns)
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title, seedDefaultColumns = true } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      res.status(400).json({ success: false, message: 'Board title is required.' });
      return;
    }

    const board = await Board.create({
      title: title.trim(),
      owner: req.userId,
      columnOrder: [],
    });

    // Optionally create standard starter columns
    if (seedDefaultColumns) {
      const defaultTitles = ['Backlog', 'In Progress', 'In Review', 'Done'];
      const createdColumns = await Promise.all(
        defaultTitles.map((colTitle) =>
          Column.create({
            boardId: board._id,
            title: colTitle,
            taskIds: [],
          })
        )
      );

      board.columnOrder = createdColumns.map((col) => col._id as any);
      await board.save();
    }

    res.status(201).json({
      success: true,
      message: 'Board created successfully.',
      board,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/boards/:id
 * @desc    Get full board details with ordered columns and populated tasks
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const board = await Board.findOne({ _id: id, owner: req.userId });

    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found or access denied.' });
      return;
    }

    // Fetch all columns for this board
    const columns = await Column.find({ boardId: board._id });

    // Fetch all tasks for this board's columns
    const columnIds = columns.map((col) => col._id);
    const tasks = await Task.find({ columnId: { $in: columnIds } });

    // Map tasks by string ID for quick O(1) lookup
    const taskMap = new Map<string, any>();
    tasks.forEach((t) => taskMap.set(t._id.toString(), t));

    // Construct ordered columns with their populated task objects in taskIds sequence
    const columnMap = new Map<string, any>();
    columns.forEach((col) => {
      const orderedTasks = (col.taskIds || [])
        .map((tId) => taskMap.get(tId.toString()))
        .filter(Boolean);

      columnMap.set(col._id.toString(), {
        ...col.toJSON(),
        tasks: orderedTasks,
      });
    });

    // Order columns according to board.columnOrder
    const orderedColumns = (board.columnOrder || [])
      .map((colId) => columnMap.get(colId.toString()))
      .filter(Boolean);

    // Any column that might not be in columnOrder gets appended
    columns.forEach((col) => {
      const colIdStr = col._id.toString();
      if (!board.columnOrder.some((c) => c.toString() === colIdStr)) {
        orderedColumns.push(columnMap.get(colIdStr));
      }
    });

    res.json({
      success: true,
      board: {
        ...board.toJSON(),
        columns: orderedColumns,
      },
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/boards/:id
 * @desc    Update board title
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Board title is required.' });
      return;
    }

    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { title: title.trim() },
      { new: true }
    );

    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found or access denied.' });
      return;
    }

    res.json({ success: true, board });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/boards/:id/reorder-columns
 * @desc    Atomic update of columnOrder for a board
 */
router.put('/:id/reorder-columns', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { columnOrder } = req.body;
    if (!Array.isArray(columnOrder)) {
      res.status(400).json({ success: false, message: 'columnOrder must be an array of column IDs.' });
      return;
    }

    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, owner: req.userId },
      { columnOrder },
      { new: true }
    );

    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found or access denied.' });
      return;
    }

    res.json({ success: true, message: 'Column order updated successfully.', columnOrder: board.columnOrder });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/boards/:id
 * @desc    Delete board and cascade delete its columns and tasks
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const board = await Board.findOneAndDelete({ _id: req.params.id, owner: req.userId });
    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found or access denied.' });
      return;
    }

    // Cascade delete columns
    const columns = await Column.find({ boardId: board._id });
    const columnIds = columns.map((c) => c._id);
    await Column.deleteMany({ boardId: board._id });

    // Cascade delete tasks
    await Task.deleteMany({ columnId: { $in: columnIds } });

    res.json({ success: true, message: 'Board and all associated columns & tasks deleted successfully.' });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
