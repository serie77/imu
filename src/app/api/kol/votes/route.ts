import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';
import Vote from '@/lib/models/Vote';
import { rateLimit } from '@/utils/rate-limit';

// Create a limiter that allows 30 requests per minute per IP
const limiter = rateLimit({
  interval: 60 * 1000, // 1 minute
  uniqueTokenPerInterval: 500, // Max 500 users per interval
  limit: 30, // 30 requests per interval per token
});

export async function GET() {
  try {
    // Connect to MongoDB
    const { db } = await connectToDatabase();
    
    // Get vote counts for all KOLs
    const voteCounts = await db.collection('votes').aggregate([
      {
        $group: {
          _id: "$kol_address",
          upvotes: {
            $sum: { $cond: [{ $eq: ["$vote_type", "up"] }, 1, 0] }
          },
          downvotes: {
            $sum: { $cond: [{ $eq: ["$vote_type", "down"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          kol_address: "$_id",
          upvotes: 1,
          downvotes: 1,
          net_votes: { $subtract: ["$upvotes", "$downvotes"] }
        }
      }
    ]).toArray();
    
    return NextResponse.json({
      success: true,
      votes: voteCounts.map(vote => ({
        kol_address: vote.kol_address,
        upvotes: vote.upvotes,
        downvotes: vote.downvotes,
        net_votes: vote.net_votes
      }))
    });
  } catch (error) {
    console.error('Error in votes API:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Error retrieving votes', 
      error: error instanceof Error ? error.message : 'Unknown error',
      votes: []
    }, { status: 500 });
  }
} 