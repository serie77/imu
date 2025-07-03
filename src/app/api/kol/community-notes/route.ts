import { NextRequest, NextResponse } from 'next/server';
import { connectToDatabase } from '@/lib/mongodb';

export async function POST(request: NextRequest) {
  try {
    const { kol_address, submitter_wallet, note } = await request.json();

    // Validation
    if (!kol_address || !submitter_wallet || !note) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (note.length > 200) {
      return NextResponse.json({ error: 'Note must be 200 characters or less' }, { status: 400 });
    }

    const { db } = await connectToDatabase();
    const collection = db.collection('community_notes');

    // Check if user has already submitted a note for this KOL
    const existingNote = await collection.findOne({
      kol_address,
      submitter_wallet
    });

    if (existingNote) {
      return NextResponse.json({ error: 'You have already submitted a note for this KOL' }, { status: 400 });
    }

    // Insert the new note submission
    const noteSubmission = {
      kol_address,
      submitter_wallet,
      note: note.trim(),
      status: 'pending', // pending, approved, rejected
      submitted_at: new Date(),
      reviewed_at: null,
      reviewed_by: null
    };

    await collection.insertOne(noteSubmission);

    return NextResponse.json({ 
      success: true, 
      message: 'Community note submitted for review' 
    });

  } catch (error) {
    console.error('Error submitting community note:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 