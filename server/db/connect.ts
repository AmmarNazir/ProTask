import mongoose from 'mongoose';

let memoryServerInstance: any = null;

export async function connectDB(): Promise<string> {
  // If already connected, return
  if (mongoose.connection.readyState === 1) {
    return mongoose.connection.host;
  }

  let mongoUri = process.env.MONGODB_URI;

  if (!mongoUri) {
    console.log('⚡ [Database] MONGODB_URI not set. Bootstrapping MongoDB In-Memory Server...');
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      memoryServerInstance = await MongoMemoryServer.create({
        instance: {
          dbName: 'kanban_board',
        },
      });
      mongoUri = memoryServerInstance.getUri();
      console.log(`✅ [Database] MongoDB In-Memory Server initialized at: ${mongoUri}`);
    } catch (err) {
      console.error('❌ [Database] Failed to launch MongoMemoryServer:', err);
      throw new Error('Failed to initialize local MongoDB database instance.');
    }
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      autoIndex: true,
    });
    console.log(`🚀 [Database] Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return conn.connection.host;
  } catch (error) {
    console.error('❌ [Database] MongoDB connection error:', error);
    throw error;
  }
}

export async function disconnectDB(): Promise<void> {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect();
  }
  if (memoryServerInstance) {
    await memoryServerInstance.stop();
  }
}
