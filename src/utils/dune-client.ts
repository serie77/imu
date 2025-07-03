const API_KEY = process.env.NEXT_PUBLIC_DUNE_API_KEY!;
const BASE_URL = 'https://api.dune.com/api/v1';

async function fetchDuneResults(queryId: number) {
  try {
    console.log(`Fetching results for query ${queryId}`);
    
    // Get the latest result directly
    const response = await fetch(`/api/dune?queryId=${queryId}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Error fetching query ${queryId}: ${errorText}`);
      throw new Error(`Failed to fetch query ${queryId}: ${errorText}`);
    }
    
    const data = await response.json();
    console.log(`Successfully fetched data for query ${queryId}`, data);
    
    return data;
  } catch (error) {
    console.error(`Error in fetchDuneResults for query ${queryId}:`, error);
    throw error;
  }
}

export async function fetchVolumeData() {
  return fetchDuneResults(3588432);
}

export async function fetchTokenData() {
  return fetchDuneResults(3588183);
}

export async function fetchTransactionData() {
  return fetchDuneResults(3588432);
}

// Add these new functions for PumpSwap data

export async function fetchPumpSwapVolumeData() {
  try {
    console.log("Fetching PumpSwap volume data...");
    
    // Use the API route instead of direct Dune API calls
    const dailyVolumeResponse = await fetch(`/api/dune?queryId=4893899`);
    if (!dailyVolumeResponse.ok) {
      const errorText = await dailyVolumeResponse.text();
      console.error(`API error (${dailyVolumeResponse.status}): ${errorText}`);
      throw new Error(`API returned ${dailyVolumeResponse.status}: ${errorText}`);
    }
    
    const dailyVolumeData = await dailyVolumeResponse.json();
    console.log("Daily volume data received:", dailyVolumeData);
    
    // Fetch volume history with better error handling
    const volumeHistoryResponse = await fetch(`/api/dune?queryId=4893631`);
    if (!volumeHistoryResponse.ok) {
      const errorText = await volumeHistoryResponse.text();
      console.error(`API error (${volumeHistoryResponse.status}): ${errorText}`);
      throw new Error(`API returned ${volumeHistoryResponse.status}: ${errorText}`);
    }
    
    const volumeHistoryData = await volumeHistoryResponse.json();
    console.log("Volume history data received:", volumeHistoryData);
    
    return {
      dailyVolume: dailyVolumeData,
      volumeHistory: volumeHistoryData
    };
  } catch (error) {
    console.error('Error fetching PumpSwap volume data:', error);
    throw error;
  }
}

// Add these new functions for Trading Bot data
export async function fetchTradingBotComparisonData() {
  return fetchDuneResults(4422946);
}

export async function fetchAxiomData() {
  return fetchDuneResults(4870857);
}

export async function fetchPhotonData() {
  return fetchDuneResults(4870869);
}

export async function fetchBullXData() {
  return fetchDuneResults(4870860);
}

export async function fetchTrojanData() {
  return fetchDuneResults(4870897);
}

export async function fetchGMGNData() {
  return fetchDuneResults(4870877);
}

export async function fetchAllTradingBotData() {
  console.log("Fetching all trading bot data...");
  
  try {
    // Fetch data for each bot individually instead of the large query
    const [axiom, photon, bullX, trojan, gmgn] = await Promise.all([
      fetchDuneResults(4870857), // Axiom
      fetchDuneResults(4870869), // Photon
      fetchDuneResults(4870860), // BullX
      fetchDuneResults(4870897), // Trojan
      fetchDuneResults(4870877)  // GMGN
    ]);
    
    return {
      axiom,
      photon,
      bullX,
      trojan,
      gmgn
    };
  } catch (error) {
    console.error("Error fetching trading bot data:", error);
    throw error;
  }
} 