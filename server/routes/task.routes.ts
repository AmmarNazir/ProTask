import { Router, type Response } from 'express';
import mongoose from 'mongoose';
import { Task, type TaskPriority } from '../models/Task.ts';
import { Column } from '../models/Column.ts';
import { Board } from '../models/Board.ts';
import { authenticate, type AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

router.use(authenticate);

/**
 * Helper to check if the user is authorized to interact with a column's board
 */
async function verifyColumnOwnership(columnId: string | mongoose.Types.ObjectId, userId: string) {
  const column = await Column.findById(columnId);
  if (!column) return null;

  const board = await Board.findOne({ _id: column.boardId, owner: userId });
  if (!board) return null;

  return { column, board };
}

/**
 * @route   POST /api/tasks
 * @desc    Create a task and push its ID into the target column's taskIds
 */
router.post('/', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { columnId, title, description = '', priority = 'Medium', subtasks = [], dueDate = null } = req.body;

    if (!columnId || !title || !title.trim()) {
      res.status(400).json({ success: false, message: 'columnId and title are required.' });
      return;
    }

    const authCheck = await verifyColumnOwnership(columnId, req.userId!);
    if (!authCheck) {
      res.status(403).json({ success: false, message: 'Column not found or unauthorized.' });
      return;
    }

    const task = await Task.create({
      columnId: new mongoose.Types.ObjectId(columnId),
      title: title.trim(),
      description: typeof description === 'string' ? description.trim() : '',
      priority: ['Low', 'Medium', 'High'].includes(priority) ? (priority as TaskPriority) : 'Medium',
      subtasks: Array.isArray(subtasks) ? subtasks : [],
      dueDate: dueDate ? new Date(dueDate) : null,
    });

    // Atomically push task ID to column's taskIds array
    await Column.findByIdAndUpdate(columnId, {
      $push: { taskIds: task._id },
    });

    res.status(201).json({
      success: true,
      message: 'Task created successfully.',
      task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   GET /api/tasks/:id
 * @desc    Get a single task by ID
 */
router.get('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const authCheck = await verifyColumnOwnership(task.columnId, req.userId!);
    if (!authCheck) {
      res.status(403).json({ success: false, message: 'Unauthorized to view this task.' });
      return;
    }

    res.json({ success: true, task });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   PUT /api/tasks/:id
 * @desc    Update task attributes (title, description, priority, subtasks, dueDate)
 */
router.put('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const authCheck = await verifyColumnOwnership(task.columnId, req.userId!);
    if (!authCheck) {
      res.status(403).json({ success: false, message: 'Unauthorized to update this task.' });
      return;
    }

    const { title, description, priority, subtasks, dueDate } = req.body;

    if (title !== undefined) {
      if (!title || !title.trim()) {
        res.status(400).json({ success: false, message: 'Task title cannot be empty.' });
        return;
      }
      task.title = title.trim();
    }

    if (description !== undefined) {
      task.description = String(description).trim();
    }

    if (priority !== undefined && ['Low', 'Medium', 'High'].includes(priority)) {
      task.priority = priority as TaskPriority;
    }

    if (subtasks !== undefined && Array.isArray(subtasks)) {
      task.subtasks = subtasks.map((s: any) => ({
        title: String(s.title || '').trim(),
        completed: Boolean(s.completed),
      }));
    }

    if (dueDate !== undefined) {
      task.dueDate = dueDate ? new Date(dueDate) : undefined;
    }

    await task.save();

    res.json({
      success: true,
      message: 'Task updated successfully.',
      task,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   DELETE /api/tasks/:id
 * @desc    Delete a task and atomically pull its ID from the parent column
 */
router.delete('/:id', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const task = await Task.findById(req.params.id);
    if (!task) {
      res.status(404).json({ success: false, message: 'Task not found.' });
      return;
    }

    const authCheck = await verifyColumnOwnership(task.columnId, req.userId!);
    if (!authCheck) {
      res.status(403).json({ success: false, message: 'Unauthorized to delete this task.' });
      return;
    }

    // Atomically remove taskId from the column
    await Column.findByIdAndUpdate(task.columnId, {
      $pull: { taskIds: task._id },
    });

    // Delete task document
    await Task.findByIdAndDelete(task._id);

    res.json({
      success: true,
      message: 'Task deleted successfully.',
      deletedTaskId: task._id,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message });
  }
});

/**
 * @route   POST /api/tasks/reorder
 * @desc    Dedicated atomic reorder endpoint using MongoDB $pull and $push/$position
 *          Handles moving tasks within the same column or across columns
 */
router.post('/reorder', async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { taskId, sourceColumnId, destinationColumnId, destinationIndex } = req.body;

    if (!taskId || !sourceColumnId || !destinationColumnId || typeof destinationIndex !== 'number') {
      res.status(400).json({
        success: false,
        message: 'Missing required parameters: taskId, sourceColumnId, destinationColumnId, destinationIndex.',
      });
      return;
    }

    const taskIdObj = new mongoose.Types.ObjectId(taskId);
    const sourceColObj = new mongoose.Types.ObjectId(sourceColumnId);
    const destColObj = new mongoose.Types.ObjectId(destinationColumnId);

    // Verify ownership of both columns
    const sourceAuth = await verifyColumnOwnership(sourceColumnId, req.userId!);
    if (!sourceAuth) {
      res.status(403).json({ success: false, message: 'Source column not found or unauthorized.' });
      return;
    }

    const destAuth = sourceColumnId === destinationColumnId
      ? sourceAuth
      : await verifyColumnOwnership(destinationColumnId, req.userId!);

    if (!destAuth) {
      res.status(403).json({ success: false, message: 'Destination column not found or unauthorized.' });
      return;
    }

    // Clamp destinationIndex to valid positive range
    const targetIndex = Math.max(0, destinationIndex);

    if (sourceColumnId === destinationColumnId) {
      // 1. Reordering within the SAME column
      // Atomic step 1: Pull task from column taskIds array
      await Column.findByIdAndUpdate(sourceColObj, {
        $pull: { taskIds: taskIdObj },
      });

      // Atomic step 2: Push task back at the destination position
      const updatedSourceCol = await Column.findByIdAndUpdate(
        sourceColObj,
        {
          $push: {
            taskIds: {
              $each: [taskIdObj],
              $position: targetIndex,
            },
          },
        },
        { new: true }
      );

      res.json({
        success: true,
        message: 'Task reordered within same column successfully.',
        reorderType: 'SAME_COLUMN',
        column: updatedSourceCol,
      });
      return;
    }

    // 2. Moving ACROSS different columns
    // Atomic step 1: Pull task from source column
    const updatedSourceCol = await Column.findByIdAndUpdate(
      sourceColObj,
      {
        $pull: { taskIds: taskIdObj },
      },
      { new: true }
    );

    // Atomic step 2: Push task into destination column at target position
    const updatedDestCol = await Column.findByIdAndUpdate(
      destColObj,
      {
        $push: {
          taskIds: {
            $each: [taskIdObj],
            $position: targetIndex,
          },
        },
      },
      { new: true }
    );

    // Atomic step 3: Update task's columnId reference
    const updatedTask = await Task.findByIdAndUpdate(
      taskIdObj,
      { columnId: destColObj },
      { new: true }
    );

    res.json({
      success: true,
      message: 'Task moved to new column successfully.',
      reorderType: 'CROSS_COLUMN',
      task: updatedTask,
      sourceColumn: updatedSourceCol,
      destinationColumn: updatedDestCol,
    });
  } catch (error: any) {
    console.error('Task reorder failure:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

export default router;
