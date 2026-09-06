import { Router, Response } from 'express';
import mongoose from 'mongoose';
import { Column } from '../models/Column.js';
import { Board } from '../models/Board.js';
import { Task } from '../models/Task.js';
import { authenticate, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.use(authenticate);

/**
 * @route   POST /api/columns
 * @desc    Create a new column and push it into the board's columnOrder
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { boardId, title } = req.body;

    if (!boardId || !title || !title.trim()) {
      res.status(400).json({ success: false, message: 'boardId and title are required.' });
      return;
    }

    // Verify board exists and belongs to user
    const board = await Board.findOne({ _id: boardId, owner: req.userId });
    if (!board) {
      res.status(404).json({ success: false, message: 'Board not found or access denied.' });
      return;
    }

    const column = await Column.create({
      boardId: board._id,
      title: title.trim(),
      taskIds: [],
    });

    // Atomically append column to board's columnOrder
    await Board.findByIdAndUpdate(board._id, {
      $push: { columnOrder: column._id },
    });

    res.status(201).json({
      success: true,
      message: 'Column created successfully.',
      column,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/columns/:id
 * @desc    Update column title
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { title } = req.body;
    if (!title || !title.trim()) {
      res.status(400).json({ success: false, message: 'Column title is required.' });
      return;
    }

    const column = await Column.findById(req.params.id);
    if (!column) {
      res.status(404).json({ success: false, message: 'Column not found.' });
      return;
    }

    // Verify user owns the parent board
    const board = await Board.findOne({ _id: column.boardId, owner: req.userId });
    if (!board) {
      res.status(403).json({ success: false, message: 'Not authorized to modify this column.' });
      return;
    }

    column.title = title.trim();
    await column.save();

    res.json({
      success: true,
      message: 'Column updated successfully.',
      column,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/columns/:id
 * @desc    Delete a column, remove from board's columnOrder, and cascade delete tasks
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const column = await Column.findById(req.params.id);
    if (!column) {
      res.status(404).json({ success: false, message: 'Column not found.' });
      return;
    }

    // Verify user owns the parent board
    const board = await Board.findOne({ _id: column.boardId, owner: req.userId });
    if (!board) {
      res.status(403).json({ success: false, message: 'Not authorized to delete this column.' });
      return;
    }

    // Atomically remove column ID from board.columnOrder
    await Board.findByIdAndUpdate(column.boardId, {
      $pull: { columnOrder: column._id },
    });

    // Delete all tasks in this column
    await Task.deleteMany({ columnId: column._id });

    // Delete column
    await Column.findByIdAndDelete(column._id);

    res.json({
      success: true,
      message: 'Column and its tasks deleted successfully.',
      deletedColumnId: column._id,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
