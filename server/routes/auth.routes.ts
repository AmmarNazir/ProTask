import { Router, type Request, type Response } from 'express';
import mongoose from 'mongoose';
import { User } from '../models/User.ts';
import { Board } from '../models/Board.ts';
import { Column } from '../models/Column.ts';
import { Task } from '../models/Task.ts';
import { generateToken, authenticate, type AuthenticatedRequest } from '../middleware/auth.ts';

const router = Router();

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account & return JWT
 * @access  Public
 */
router.post('/register', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, email, password } = req.body;

    // Basic request payload validations
    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters long.',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
      return;
    }

    if (!password || typeof password !== 'string' || password.length < 6) {
      res.status(400).json({
        success: false,
        message: 'Password is required and must be at least 6 characters long.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already registered
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      res.status(409).json({
        success: false,
        message: 'An account with this email address already exists.',
      });
      return;
    }

    // Hash password with bcrypt
    const passwordHash = await User.hashPassword(password);

    // Create and save user
    const newUser = await User.create({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
    });

    // Generate JWT token
    const token = generateToken(newUser);

    res.status(201).json({
      success: true,
      message: 'User registered successfully.',
      token,
      user: {
        id: newUser._id.toString(),
        name: newUser.name,
        email: newUser.email,
        createdAt: newUser.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Auth Error] /register failure:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error while creating user account.',
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate existing user credentials & return JWT
 * @access  Public
 */
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({
        success: false,
        message: 'Please provide both email and password.',
      });
      return;
    }

    const normalizedEmail = (email as string).trim().toLowerCase();

    // Find user by email
    const user = await User.findOne({ email: normalizedEmail });
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Verify password match
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({
        success: false,
        message: 'Invalid email or password.',
      });
      return;
    }

    // Generate JWT token
    const token = generateToken(user);

    res.status(200).json({
      success: true,
      message: 'Login successful.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Auth Error] /login failure:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Internal server error during authentication.',
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged-in user details from verified JWT
 * @access  Private (Requires Bearer token)
 */
router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    res.status(200).json({
      success: true,
      user: req.user,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve user profile.',
    });
  }
});

/**
 * @route   PUT /api/auth/profile
 * @desc    Update authenticated user's name & email
 * @access  Private
 */
router.put('/profile', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email } = req.body;
    const userId = req.userId;

    if (!name || typeof name !== 'string' || name.trim().length < 2) {
      res.status(400).json({
        success: false,
        message: 'Name is required and must be at least 2 characters.',
      });
      return;
    }

    if (!email || typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      res.status(400).json({
        success: false,
        message: 'A valid email address is required.',
      });
      return;
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check if email already taken by another user
    const existingOther = await User.findOne({ email: normalizedEmail, _id: { $ne: userId } });
    if (existingOther) {
      res.status(409).json({
        success: false,
        message: 'This email is already registered to another account.',
      });
      return;
    }

    const user = await User.findById(userId);
    if (!user) {
      res.status(404).json({
        success: false,
        message: 'User account not found.',
      });
      return;
    }

    user.name = name.trim();
    user.email = normalizedEmail;
    await user.save();

    const token = generateToken(user);

    res.json({
      success: true,
      message: 'Profile updated successfully.',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
      },
    });
  } catch (error: any) {
    console.error('[Auth Error] /profile failure:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to update profile.',
    });
  }
});

/**
 * @route   GET /api/auth/stats
 * @desc    Get productivity statistics for authenticated user
 * @access  Private
 */
router.get('/stats', authenticate, async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const userId = req.userId;
    const boards = await Board.find({ owner: userId });
    const boardIds = boards.map((b) => b._id);
    const columns = await Column.find({ boardId: { $in: boardIds } });
    const columnIds = columns.map((c) => c._id);
    const tasks = await Task.find({ columnId: { $in: columnIds } });

    // Identify 'done' / 'completed' column IDs
    const doneColIds = new Set(
      columns
        .filter((col) => {
          const t = col.title.toLowerCase();
          return t.includes('done') || t.includes('complete') || t.includes('closed');
        })
        .map((c) => c._id.toString())
    );

    let completedTasks = 0;
    let pendingTasks = 0;
    let highPriorityTasks = 0;
    let mediumPriorityTasks = 0;
    let lowPriorityTasks = 0;

    tasks.forEach((task) => {
      const isColDone = doneColIds.has(task.columnId.toString());
      if (isColDone) {
        completedTasks++;
      } else {
        pendingTasks++;
      }

      if (task.priority === 'High') highPriorityTasks++;
      else if (task.priority === 'Medium') mediumPriorityTasks++;
      else if (task.priority === 'Low') lowPriorityTasks++;
    });

    res.json({
      success: true,
      stats: {
        totalBoards: boards.length,
        totalColumns: columns.length,
        totalTasks: tasks.length,
        completedTasks,
        pendingTasks,
        highPriorityTasks,
        mediumPriorityTasks,
        lowPriorityTasks,
      },
    });
  } catch (error: any) {
    console.error('[Auth Error] /stats failure:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Failed to calculate user task statistics.',
    });
  }
});

/**
 * @route   GET /api/auth/health
 * @desc    Health check for auth service & MongoDB status
 * @access  Public
 */
router.get('/health', async (_req: Request, res: Response): Promise<void> => {
  const dbState = mongoose.connection.readyState;
  const states = ['Disconnected', 'Connected', 'Connecting', 'Disconnecting'];
  const userCount = dbState === 1 ? await User.countDocuments() : 0;
  const boardCount = dbState === 1 ? await Board.countDocuments() : 0;
  const columnCount = dbState === 1 ? await Column.countDocuments() : 0;
  const taskCount = dbState === 1 ? await Task.countDocuments() : 0;

  res.status(200).json({
    status: 'ok',
    database: {
      status: states[dbState] || 'Unknown',
      connected: dbState === 1,
      totalUsers: userCount,
      totalBoards: boardCount,
      totalColumns: columnCount,
      totalTasks: taskCount,
    },
    timestamp: new Date().toISOString(),
  });
});

export default router;
