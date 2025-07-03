import { NextRequest, NextResponse } from 'next/server';

const API_KEY = process.env.NEXT_PUBLIC_DUNE_API_KEY!;
const BASE_URL = 'https://api.dune.com/api/v1';

// Simple in-memory cache with expiration
const cache = new Map<string, { data: any, timestamp: number }>();
const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes in milliseconds

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const queryId = searchParams.get('queryId');
    
    if (!queryId) {
      return NextResponse.json({ error: 'Missing queryId parameter' }, { status: 400 });
    }
    
    const cacheKey = `dune-query-${queryId}`;
    const now = Date.now();
    
    // Never cache the token data query (3588183) - always fetch fresh
    const skipCache = queryId === '3588183';
    
    // Check cache for other queries only
    if (!skipCache && cache.has(cacheKey)) {
      const cachedData = cache.get(cacheKey)!;
      if (now - cachedData.timestamp < CACHE_DURATION) {
        console.log(`Serving cached data for query ${queryId}`);
        return NextResponse.json(cachedData.data);
      }
    }
    
    console.log(`Fetching fresh data for query ${queryId}${skipCache ? ' (no cache)' : ''}`);
    
    // Get the latest result directly from Dune
    const response = await fetch(`${BASE_URL}/query/${queryId}/results`, {
      headers: {
        'x-dune-api-key': API_KEY,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Dune API Error (${response.status}):`, errorText);
      return NextResponse.json(
        { error: `Dune API Error: ${errorText}` }, 
        { status: response.status }
      );
    }

    const data = await response.json();
    
    // Only cache non-token queries
    if (!skipCache) {
      cache.set(cacheKey, { data, timestamp: now });
    }
    
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in Dune API route:', error);
    return NextResponse.json(
      { error: 'Internal Server Error' }, 
      { status: 500 }
    );
  }
} 