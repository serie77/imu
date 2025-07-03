import { Connection, PublicKey } from '@solana/web3.js';
import { NextRequest, NextResponse } from 'next/server';

// This is now a private, server-side environment variable
const SOLANA_RPC_HOST = process.env.SOLANA_RPC_HOST;

export async function POST(req: NextRequest) {
  if (!SOLANA_RPC_HOST) {
    return NextResponse.json({ success: false, error: "RPC host not configured" }, { status: 500 });
  }

  try {
    const { owner, mint } = await req.json();

    if (!owner || !mint) {
      return NextResponse.json({ success: false, error: "Owner and mint are required" }, { status: 400 });
    }

    const connection = new Connection(SOLANA_RPC_HOST, 'confirmed');
    const ownerPublicKey = new PublicKey(owner);
    const mintPublicKey = new PublicKey(mint);

    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(ownerPublicKey, { mint: mintPublicKey });
    
    let totalBalance = 0;
    if (tokenAccounts.value.length > 0) {
      totalBalance = tokenAccounts.value.reduce((acc, account) => acc + (account.account.data.parsed.info.tokenAmount.uiAmount || 0), 0);
    }

    return NextResponse.json({ success: true, balance: totalBalance });

  } catch (error) {
    console.error('Error checking balance via proxy:', error);
    let errorMessage = "An unknown error occurred";
    if (error instanceof Error) errorMessage = error.message;
    return NextResponse.json({ success: false, error: errorMessage }, { status: 500 });
  }
} 