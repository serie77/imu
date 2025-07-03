import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { voterWallet } = body;
    
    if (!voterWallet) {
      return NextResponse.json({ 
        success: false, 
        message: 'Voter wallet address is required',
        votes: []
      }, { status: 400 });
    }
    
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Get all votes by this user
    const votes = await db.collection('votes').find({ voter_wallet: voterWallet }).toArray();
    
    return NextResponse.json({
      success: true,
      votes: votes.map((vote: any) => ({
        kol_address: vote.kol_address,
        vote_type: vote.vote_type
      }))
    });
  } catch (error) {
    console.error('Error in check-votes API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error checking votes', 
      error: error instanceof Error ? error.message : 'Unknown error',
      votes: []
    }, { status: 500 });
  }
} 