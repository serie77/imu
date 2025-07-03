'use client';

import { useState } from 'react';

export default function GmgnTest() {
  const [address, setAddress] = useState('Cbhv3FEDR8fbdKYzUHiYxwHMcixXBvTWtqe4yXjnmuB4');
  const [timeframe, setTimeframe] = useState('7d');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [responseText, setResponseText] = useState('');

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    setResponseText('');
    
    try {
      // Use the Pages Router API endpoint instead
      const response = await fetch(`/api/gmgn?address=${address}&timeframe=${timeframe}`);
      
      // Get the raw response text for debugging
      const text = await response.text();
      setResponseText(text);
      
      // Try to parse as JSON
      let result;
      try {
        result = JSON.parse(text);
      } catch (e: any) {
        setError(`Failed to parse response as JSON: ${e.message}`);
        setLoading(false);
        return;
      }
      
      if (response.ok) {
        setData(result);
      } else {
        setError(result.error || 'Failed to fetch data');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">GMGN Scraper Test</h1>
      
      <div className="mb-4">
        <label className="block mb-2">Wallet Address:</label>
        <input 
          type="text" 
          value={address} 
          onChange={(e) => setAddress(e.target.value)}
          className="w-full p-2 border rounded"
        />
      </div>
      
      <div className="mb-4">
        <label className="block mb-2">Timeframe:</label>
        <select 
          value={timeframe} 
          onChange={(e) => setTimeframe(e.target.value)}
          className="w-full p-2 border rounded"
        >
          <option value="24h">24 Hours</option>
          <option value="7d">7 Days</option>
          <option value="30d">30 Days</option>
          <option value="all">All Time</option>
        </select>
      </div>
      
      <button 
        onClick={fetchData}
        disabled={loading}
        className="px-4 py-2 bg-blue-500 text-white rounded disabled:bg-blue-300"
      >
        {loading ? 'Loading...' : 'Fetch Data'}
      </button>
      
      {error && (
        <div className="mt-4 p-3 bg-red-100 text-red-700 rounded">
          <h3 className="font-bold">Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {data && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Results:</h2>
          <pre className="p-3 bg-gray-100 rounded overflow-auto">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      )}
      
      {responseText && !data && (
        <div className="mt-4">
          <h2 className="text-xl font-bold mb-2">Raw Response:</h2>
          <pre className="p-3 bg-gray-100 rounded overflow-auto max-h-96">
            {responseText.substring(0, 1000)}
            {responseText.length > 1000 ? '... (truncated)' : ''}
          </pre>
        </div>
      )}
    </div>
  );
}