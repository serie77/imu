import { MongoClient, Db } from 'mongodb';

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable');
}

// Extract database name from the URI or use a default
const getDbName = (uri: string): string => {
  try {
    // Try to extract DB name from URI
    const dbName = uri.split('/').pop()?.split('?')[0];
    return dbName || 'kol_database';
  } catch (error) {
    // Default database name
    return 'kol_database';
  }
};

let cachedClient: MongoClient | null = null;
let cachedDb: Db | null = null;

export async function connectToDatabase() {
  try {
    if (cachedClient && cachedDb) {
      console.log('Using cached database connection');
      return { client: cachedClient, db: cachedDb };
    }

    console.log('Creating new database connection');
    console.log('MongoDB URI:', MONGODB_URI!.replace(/:[^:]*@/, ':****@')); // Log URI with password hidden
    
    // Try to connect with more detailed error handling
    let client: MongoClient;
    try {
      client = await MongoClient.connect(MONGODB_URI!, {
        connectTimeoutMS: 10000, // 10 seconds
        socketTimeoutMS: 45000, // 45 seconds
      });
    } catch (connectError: any) {
      console.error('MongoDB connection error details:', {
        name: connectError.name,
        message: connectError.message,
        code: connectError.code,
        stack: connectError.stack
      });
      throw new Error(`Failed to connect to MongoDB: ${connectError.message}`);
    }
    
    const dbName = getDbName(MONGODB_URI!);
    console.log('Using database:', dbName);
    
    const db = client.db(dbName);
    
    // Test the connection by listing collections
    try {
      await db.listCollections().toArray();
      console.log('Database connection successful');
    } catch (testError: any) {
      console.error('Failed to list collections:', testError);
      throw new Error(`Connected to MongoDB but failed to list collections: ${testError.message}`);
    }

    cachedClient = client;
    cachedDb = db;

    return { client, db };
  } catch (error: any) {
    console.error('MongoDB connection error:', error);
    throw error;
  }
} 