import { NextResponse } from 'next/server';
import { connectToDatabase } from '../../../../lib/mongodb';

// Create a simple comment schema
interface Comment {
  kol_address: string;
  author_wallet: string;
  message: string;
  timestamp: Date;
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const kolAddress = searchParams.get('kol_address');

    if (!kolAddress) {
      return NextResponse.json({ success: false, error: 'KOL address required' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    
    const comments = await db
      .collection('comments')
      .find({ kol_address: kolAddress })
      .sort({ timestamp: -1 })
      .limit(50)
      .toArray();

    console.log(`[API] Retrieved ${comments.length} comments for KOL: ${kolAddress}`);

    return NextResponse.json({ success: true, comments });
  } catch (error) {
    console.error('[API] Error fetching comments:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to fetch comments' 
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { kol_address, author_wallet, message } = body;

    if (!kol_address || !author_wallet || !message) {
      return NextResponse.json({ 
        success: false, 
        error: 'Missing required fields' 
      }, { status: 400 });
    }

    const { db } = await connectToDatabase();

    // Check rate limit - 3 comments per wallet per KOL
    const existingComments = await db
      .collection('comments')
      .countDocuments({ 
        kol_address, 
        author_wallet 
      });

    if (existingComments >= 3) {
      return NextResponse.json({ 
        success: false, 
        error: 'Comment limit reached (3 per KOL)' 
      }, { status: 429 });
    }

    // Insert comment
    const comment: Comment = {
      kol_address,
      author_wallet,
      message: message.slice(0, 500), // Limit message length
      timestamp: new Date()
    };

    await db.collection('comments').insertOne(comment);
    
    console.log(`[API] Comment created for KOL: ${kol_address} by wallet: ${author_wallet}`);

    return NextResponse.json({ success: true, comment });
  } catch (error) {
    console.error('[API] Error creating comment:', error);
    return NextResponse.json({ 
      success: false, 
      error: 'Failed to create comment' 
    }, { status: 500 });
  }
} 