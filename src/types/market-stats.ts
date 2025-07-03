export interface VolumeData {
  date: string;
  volume_usd: number;
  volume_sol: number;
}

export interface TokenData {
  date: string;
  tokens_launched: number;
  addresses_creating: number;
}

export interface TransactionData {
  date: string;
  total_transactions: number;
}

export interface ProcessedData {
  dailyVolume: {
    usd: number;
    sol: number;
    change: number;
  };
  tokensLaunched: {
    today: number;
    yesterday: number;
    change: number;
  };
  addressesCreating: {
    today: number;
    yesterday: number;
    change: number;
  };
  totalTransactions: {
    today: number;
    yesterday: number;
    change: number;
  };
  volumeHistory: VolumeData[];
  tokenHistory: TokenData[];
} 