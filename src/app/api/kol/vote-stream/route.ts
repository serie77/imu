import { NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function GET() {
  const encoder = new TextEncoder();
  const customReadable = new ReadableStream({
    async start(controller) {
      // Send an initial message
      controller.enqueue(
        encoder.encode(`data: ${JSON.stringify({ type: 'connected' })}\n\n`)
      );
      
      // Set up change stream on MongoDB
      try {
        const { db } = await connectToDatabase();
        
        // Create a change stream on the votes collection
        const changeStream = db.collection('votes').watch();
        
        // Handle changes
        changeStream.on('change', async (change: any) => {
          if (change.operationType === 'insert' || change.operationType === 'update' || change.operationType === 'delete') {
            try {
              // Get the KOL address from the change
              let kolAddress;
              let voteType;
              let voterWallet;
              
              if (change.operationType === 'insert' || change.operationType === 'update') {
                kolAddress = change.fullDocument.kol_address;
                voteType = change.fullDocument.vote_type;
                voterWallet = change.fullDocument.voter_wallet;
              } else if (change.operationType === 'delete' && change.documentKey) {
                // For delete operations, we need to look up the document that was deleted
                const deletedDoc = await db.collection('votes').findOne({ _id: change.documentKey._id });
                if (deletedDoc) {
                  kolAddress = deletedDoc.kol_address;
                  voteType = 'removed';
                  voterWallet = deletedDoc.voter_wallet;
                }
              }
              
              if (kolAddress) {
                // Get updated vote counts for this KOL
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
                
                const votes = voteStats.length > 0 ? {
                  upvotes: voteStats[0].upvotes,
                  downvotes: voteStats[0].downvotes,
                  net_votes: voteStats[0].upvotes - voteStats[0].downvotes
                } : {
                  upvotes: 0,
                  downvotes: 0,
                  net_votes: 0
                };
                
                // Get KOL name if available
                let kolName = null;
                try {
                  const kol = await db.collection('kols').findOne({ solana_address: kolAddress });
                  if (kol) {
                    kolName = kol.name;
                  }
                } catch (error) {
                  console.error('Error getting KOL name:', error);
                }
                
                // Send the vote notification
                controller.enqueue(
                  encoder.encode(`data: ${JSON.stringify({
                    type: 'vote',
                    vote: {
                      kol_address: kolAddress,
                      kol_name: kolName || 'Unknown KOL',
                      wallet: voterWallet,
                      vote_type: voteType,
                      net_votes: votes.net_votes,
                      timestamp: new Date().toISOString()
                    }
                  })}\n\n`)
                );
              }
            } catch (error) {
              console.error('Error processing change stream event:', error);
            }
          }
        });
        
        // Handle errors
        changeStream.on('error', (error: any) => {
          console.error('Change stream error:', error);
          controller.error(error);
        });
        
        // Clean up on close
        changeStream.on('close', () => {
          console.log('Change stream closed');
          controller.close();
        });
      } catch (error) {
        console.error('Error setting up change stream:', error);
        controller.error(error);
      }
    },
    cancel() {
      console.log('Client disconnected');
    }
  });

  return new NextResponse(customReadable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive'
    }
  });
} 