import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { connectDB } from './db/connect.ts';
import authRoutes from './routes/auth.routes.ts';
import boardRoutes from './routes/board.routes.ts';
import columnRoutes from './routes/column.routes.ts';
import taskRoutes from './routes/task.routes.ts';

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Body parser middleware
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Request logger for API calls
  app.use((req, _res, next) => {
    if (req.path.startsWith('/api')) {
      console.log(`📡 [${req.method}] ${req.path}`);
    }
    next();
  });

  // Connect to MongoDB
  try {
    await connectDB();
  } catch (dbErr) {
    console.error('⚠️ [Server] Failed to connect to MongoDB initially:', dbErr);
  }

  // --- API Routes (Mounted first) ---
  app.use('/api/auth', authRoutes);
  app.use('/api/boards', boardRoutes);
  app.use('/api/columns', columnRoutes);
  app.use('/api/tasks', taskRoutes);

  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      app: 'Interactive Task Kanban Board API',
      version: '1.0.0',
      timestamp: new Date().toISOString(),
    });
  });

  // Catch unhandled API routes with 404 JSON
  app.all('/api/*', (_req, res) => {
    res.status(404).json({
      success: false,
      message: 'API endpoint not found',
    });
  });

  // Global error handler for API
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error('💥 Unhandled Server Error:', err);
    res.status(err.status || 500).json({
      success: false,
      message: err.message || 'Internal Server Error',
    });
  });

  // --- Vite Frontend Middleware / Static Serving ---
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      root: process.cwd(),
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log('\n======================================================');
    console.log('🚀 ProTask Application is running successfully!');
    console.log(`👉 Local Frontend URL:  http://localhost:${PORT}`);
    console.log(`👉 Local Network URL:   http://127.0.0.1:${PORT}`);
    console.log(`🌐 Public / Container:  http://0.0.0.0:${PORT}`);
    console.log(`🔐 API Endpoints:       http://localhost:${PORT}/api/auth`);
    console.log('======================================================\n');
  });
}

startServer().catch((err) => {
  console.error('Fatal Server Startup Failure:', err);
  process.exit(1);
});
