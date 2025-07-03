import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';

export async function GET(request: NextRequest) {
  try {
    // Get KOL address from query params
    const { searchParams } = new URL(request.url);
    const kolAddress = searchParams.get('kolAddress');
    
    if (!kolAddress) {
      return NextResponse.json({ 
        success: false, 
        message: 'KOL address is required',
        voters: []
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Get recent voters for this KOL (limit to 10)
    const voters = await db.collection('votes')
      .find({ kol_address: kolAddress })
      .sort({ timestamp: -1 })
      .limit(10)
      .toArray();
    
    return NextResponse.json({
      success: true,
      voters: voters.map((vote: any) => ({
        wallet: vote.voter_wallet.slice(0, 4) + '...' + vote.voter_wallet.slice(-4),
        vote_type: vote.vote_type,
        timestamp: vote.timestamp
      }))
    });
  } catch (error) {
    console.error('Error in voters API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error retrieving voters', 
      error: error instanceof Error ? error.message : 'Unknown error',
      voters: []
    }, { status: 500 });
  }
} 