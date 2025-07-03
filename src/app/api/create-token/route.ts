import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';
import { promisify } from 'util';
import { Keypair } from '@solana/web3.js';
import bs58 from 'bs58';

const execAsync = promisify(exec);

export async function POST(req: NextRequest) {
  try {
    // Get form data
    const formData = await req.formData();
    const tokenName = formData.get('tokenName') as string;
    const tokenSymbol = formData.get('tokenSymbol') as string;
    const tokenDescription = formData.get('tokenDescription') as string || '';
    const solAmount = formData.get('solAmount') as string;
    const slippage = formData.get('slippage') as string;
    const priorityFee = formData.get('priorityFee') as string;
    const imageFile = formData.get('imageFile') as File;

    if (!tokenName || !tokenSymbol || !imageFile) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Create temp directory if it doesn't exist
    const tempDir = path.join(process.cwd(), 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir);
    }

    // Save image to temp directory
    const imagePath = path.join(tempDir, imageFile.name);
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer());
    fs.writeFileSync(imagePath, imageBuffer);

    // Get private key from environment variable or secure storage
    // IMPORTANT: In production, use a secure way to store and access private keys
    const privateKey = process.env.WALLET_PRIVATE_KEY;
    if (!privateKey) {
      return NextResponse.json({ error: 'Wallet private key not configured' }, { status: 500 });
    }

    // Save private key to a temporary file
    const privateKeyPath = path.join(tempDir, 'private-key.txt');
    fs.writeFileSync(privateKeyPath, privateKey);

    // Generate a new keypair for the token mint
    const mintKeypair = Keypair.generate();
    const mintAddress = mintKeypair.publicKey.toString();

    // Create a configuration file for the token creation script
    const configPath = path.join(tempDir, 'token-config.json');
    const config = {
      tokenName,
      tokenSymbol,
      tokenDescription,
      solAmount: parseFloat(solAmount),
      slippage: parseInt(slippage),
      priorityFee: parseFloat(priorityFee),
      imagePath,
      privateKeyPath,
      mintKeypair: bs58.encode(mintKeypair.secretKey)
    };
    fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

    // Execute the token creation script
    const scriptPath = path.join(process.cwd(), 'scripts', 'create-token.js');
    const { stdout, stderr } = await execAsync(`node ${scriptPath} --config ${configPath}`);

    console.log('Token creation output:', stdout);
    if (stderr) {
      console.error('Token creation error:', stderr);
    }

    // Clean up temporary files
    fs.unlinkSync(imagePath);
    fs.unlinkSync(privateKeyPath);
    fs.unlinkSync(configPath);

    return NextResponse.json({ 
      success: true, 
      message: 'Token created successfully',
      contractAddress: mintAddress,
      output: stdout
    });
  } catch (error) {
    console.error('Error creating token:', error);
    return NextResponse.json({ 
      error: error instanceof Error ? error.message : 'An unknown error occurred' 
    }, { status: 500 });
  }
} 