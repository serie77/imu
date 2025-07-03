import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  try {
    console.log('Testing database connection...');
    
    // Try to connect to MongoDB
    const { db } = await connectToDatabase();
    
    // List all collections
    const collections = await db.listCollections().toArray();
    
    // Create votes collection if it doesn't exist
    if (!collections.some(col => col.name === 'votes')) {
      console.log('Creating votes collection...');
      await db.createCollection('votes');
      console.log('Votes collection created');
    }
    
    return NextResponse.json({
      success: true,
      message: 'Database connection successful',
      collections: collections.map(col => col.name)
    });
  } catch (error) {
    console.error('Database test failed:', error);
    return NextResponse.json({
      success: false,
      message: 'Database connection failed',
      error: error.message
    }, { status: 500 });
  }
} 