import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import { rateLimit } from '@/utils/rate-limit';

// Create a rate limiter that allows 10 requests per minute
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
});

export async function POST(request: NextRequest) {
  try {
    console.log('Vote API called');
    
    // Get client IP for rate limiting
    const ip = request.headers.get('x-forwarded-for') || 'anonymous';
    
    // Apply rate limiting
    await limiter.check(10, ip); // 10 requests per minute per IP
    
    const body = await request.json();
    const { kolAddress, voterWallet, voteType } = body;
    
    console.log('Vote request:', { kolAddress, voterWallet, voteType });
    
    if (!kolAddress || !voterWallet || !voteType) {
      return NextResponse.json({ 
        success: false, 
        message: 'Missing required fields'
      }, { status: 400 });
    }
    
    try {
      // Connect to MongoDB
      console.log('Connecting to MongoDB...');
      const { db } = await connectToDatabase();
      console.log('Connected to MongoDB');
      
      // Check if user has already voted for this KOL
      console.log('Checking for existing vote...');
      const existingVote = await db.collection('votes').findOne({
        kol_address: kolAddress,
        voter_wallet: voterWallet
      });
      
      console.log('Existing vote:', existingVote);
      
      if (existingVote) {
        // Update existing vote if vote type is different
        if (existingVote.vote_type !== voteType) {
          console.log('Updating vote type from', existingVote.vote_type, 'to', voteType);
          await db.collection('votes').updateOne(
            { _id: existingVote._id },
            { $set: { vote_type: voteType, timestamp: new Date() } }
          );
        } else {
          // If same vote type, remove the vote (toggle behavior)
          console.log('Removing vote (toggle)');
          await db.collection('votes').deleteOne({ _id: existingVote._id });
        }
      } else {
        // Insert new vote
        console.log('Inserting new vote');
        await db.collection('votes').insertOne({
          kol_address: kolAddress,
          voter_wallet: voterWallet,
          vote_type: voteType,
          timestamp: new Date()
        });
      }
      
      // Get updated vote counts for this KOL
      console.log('Getting updated vote counts...');
      const voteStats = await db.collection('votes').aggregate([
        { $match: { kol_address: kolAddress } },
        {
          $group: {
            _id: null,
            upvotes: {
              $sum: { $cond: [{ $eq: ["$vote_type", "up"] }, 1, 0] }
            },
            downvotes: {
              $sum: { $cond: [{ $eq: ["$vote_type", "down"] }, 1, 0] }
            }
          }
        }
      ]).toArray();
      
      console.log('Vote stats:', voteStats);
      
      const votes = voteStats.length > 0 ? {
        upvotes: voteStats[0].upvotes,
        downvotes: voteStats[0].downvotes,
        net_votes: voteStats[0].upvotes - voteStats[0].downvotes
      } : {
        upvotes: 0,
        downvotes: 0,
        net_votes: 0
      };
      
      console.log('Returning success response with votes:', votes);
      
      return NextResponse.json({
        success: true,
        message: 'Vote recorded successfully',
        votes
      });
    } catch (dbError) {
      console.error('Database error:', dbError);
      
      // Fallback to mock data if database fails
      console.log('Falling back to mock data');
      return NextResponse.json({
        success: true,
        message: 'Vote recorded (mock)',
        votes: {
          upvotes: voteType === 'up' ? 1 : 0,
          downvotes: voteType === 'down' ? 1 : 0,
          net_votes: voteType === 'up' ? 1 : -1
        }
      });
    }
  } catch (error) {
    if (error.statusCode === 429) {
      return NextResponse.json({ success: false, message: 'Rate limit exceeded' }, { status: 429 });
    }
    
    console.error('Error in vote API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error recording vote', 
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
} 