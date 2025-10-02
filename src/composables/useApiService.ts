export interface AccountResponse {
  success: boolean;
  account: Account;
}

export interface Account {
  _id?: string;
  id?: string;
  name: string;
  created: string;
  tokens?: Record<string, number>;
  nfts: Record<string, unknown>;
  totalVoteWeight?: {
    amount: string;
    rawAmount: string;
  };
  votedWitnesses: string[];
  witnessPublicKey?: string;
  balances?: Record<string, {
    amount: string;
    rawAmount: string;
  }>;
}

export interface AccountList {
  data: Account[];
  total: number;
  limit: number;
  skip: number;
}
export interface AccountHistory { /* ... */ }
export interface TokenSupply { /* ... */ }
export interface TokenHolders { /* ... */ }
export interface TokenDistribution { /* ... */ }
export interface NFTCollection { /* ... */ }
export interface NFTInstance { /* ... */ }



export interface StakingPool { /* ... */ }
export interface StakingDetails { /* ... */ }

export interface Transaction {
  type: number,
  sender: string,
  ts: number,
  ref: string,
  hash: string,
  data: object
}


export interface TransactionDetails {
  success: boolean;
  block: BlockDetails;
}
export interface BlockDetails {
  success: boolean;
  block: {
    blockNum: number;
    dist: string;
    hash: string;
    missedBy: string;
    phash: string;
    signature: string;
    steemBlockNum: number;
    steemBlockTimestamp: number;
    sync: boolean;
    timestamp: number;
    witness: string;
    id: string;
    txs: Array<Transaction>;
  };
}
export interface BlockCount { /* ... */ }
export interface Peers { /* ... */ }
export interface LeaderInfo { /* ... */ }
export interface Schedule { /* ... */ }
export interface TokenList { /* ... */ }



export interface Token {
  symbol: string;
  name: string;
  precision: number;
  issuer: string;
  description?: string;
  logo?: string;
  totalSupply?: string; // in smallest units
  rawTotalSupply?: string; // in smallest units
  createdAt?: string; // ISO date string
  updatedAt?: string; // ISO date string
}

// Block interface returned by /blocks/latest and related endpoints
export interface Block {
  blockNum: number;
  phash?: string;
  timestamp: number; // epoch ms
  steemBlockNum?: number;
  steemBlockTimestamp?: number;
  txs?: any[];
  witness?: string;
  missedBy?: string;
  dist?: string;
  sync?: boolean;
  signature?: string;
  hash?: string;
  id?: string | number;
}

// Block interface returned by /blocks/latest and related endpoints
export interface LatestBlock {
  success: boolean;
  block: Block;
}




// Use globalThis.$fetch if available (Nuxt 3), otherwise fallback to fetch
const fetcher = typeof globalThis !== 'undefined' && typeof (globalThis as any).$fetch === 'function'
  ? (url: string) => (globalThis as any).$fetch(url)
  : async (url: string) => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        // For 404 responses, we want to handle them gracefully as "not found"
        if (res.status === 404 && url.includes('/accounts/')) {
          console.log('[ApiService] Account not found in API:', url);
          return { success: false, account: null };
        }
        throw new Error(`API error: ${res.status}`);
      }
      const data = await res.json();
      return data;
    } catch (error) {
      console.error('[ApiService] Fetch error:', error);
      throw error;
    }
  };

export function useApiService() {
  const API_BASE = import.meta.env.VITE_API_BASE || 'https://api.meeray.com';
  // --- Config Endpoints ---
  const getConfig = () => fetcher(`${API_BASE}/config/current`) as Promise<any>;

  // --- Account Endpoints ---
  const getAccountsList = (params: { limit?: number; offset?: number; hasToken?: string; isWitness?: string; sortBy?: string; sortDirection?: string } = {}) =>
    fetcher(`${API_BASE}/accounts?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<AccountList>;
  const getAccountDetails = (name: string) => {
    return fetcher(`${API_BASE}/accounts/${name}`) as Promise<AccountResponse>;
  };
  const getAccountTransactions = (name: string, params: { limit?: number; offset?: number; type?: number } = {}) =>
    fetcher(`${API_BASE}/accounts/${name}/transactions?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<AccountHistory>;
  const getAccountTokens = (name: string) => fetcher(`${API_BASE}/accounts/${name}/tokens`) as Promise<{ account: string; tokens: { symbol: string; amount: number }[] }>;
  const getUserCount = () =>
    fetcher(`${API_BASE}/accounts/count`) as Promise<{ count: number }>;

  // --- Token Endpoints ---
  const getTokens = (params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/tokens?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Token[]; total: number; limit: number; skip: number }>;
  const getTokenDetails = (symbol: string) =>
    fetcher(`${API_BASE}/tokens/${symbol}`) as Promise<Token>;
  const getTokensByIssuer = (issuerName: string, params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/tokens/issuer/${issuerName}?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Token[]; total: number; limit: number; skip: number }>;
  const searchTokensByName = (searchName: string, params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/tokens/name/${searchName}?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Token[]; total: number; limit: number; skip: number }>;
  const getNewTokens = (params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/tokens/new?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Token[]; total: number; limit: number; skip: number }>;
  const getHotTokens = (params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/tokens/hot?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Token[]; total: number; limit: number; skip: number }>;
  const getTopGainersTokens = (params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/tokens/top-gainers?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Token[]; total: number; limit: number; skip: number }>;
  const getTopVolumeTokens = (params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/tokens/top-volume?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Token[]; total: number; limit: number; skip: number }>;


  const getTokenSupply = () => fetcher(`${API_BASE}/supply`) as Promise<TokenSupply>;
  const getTokenHolders = (symbol: string) => fetcher(`${API_BASE}/holders/${symbol}`) as Promise<TokenHolders>;
  const getTokenDistribution = (symbol: string) => fetcher(`${API_BASE}/distribution/${symbol}`) as Promise<TokenDistribution>;
  const getTokenList = () => fetcher(`${API_BASE}/token/list`) as Promise<{ tokens: any[]; total: number }>;


  // --- Transaction Endpoints ---
  const getTransaction = (txid: string) => fetcher(`${API_BASE}/blocks/transaction/${txid}`) as Promise<TransactionDetails>;

  // --- Events Endpoints ---
  const getEvents = (params: {
    category?: string;
    type?: string;
    actor?: string;
    transactionId?: string;
    poolId?: string;
    startTime?: string;
    endTime?: string;
    sortDirection?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  } = {}) => fetcher(`${API_BASE}/events?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: any[]; total: number; limit: number; offset: number }>;

  // --- Block Endpoints ---
  const getBlocks = (params: { limit?: number; offset?: number; hasTransactionType?: number; minTimestamp?: number; maxTimestamp?: number; sortDirection?: string } = {}) =>
    fetcher(`${API_BASE}/blocks?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`);
  const getLatestBlock = () => fetcher(`${API_BASE}/blocks/latest`) as Promise<LatestBlock>;
  const getBlockByHeight = (height: number) => fetcher(`${API_BASE}/blocks/height/${height}`) as Promise<BlockDetails>;
  const getBlockByHash = (hash: string) => fetcher(`${API_BASE}/blocks/hash/${hash}`);
  const getBlockTransactions = (height: number) => fetcher(`${API_BASE}/blocks/${height}/transactions`);

  // --- Node Endpoints ---
  const getPeers = () => fetcher(`${API_BASE}/peers`) as Promise<{ success: boolean, peers: string[] }>;
  const getSchedule = () => fetcher(`${API_BASE}/schedule`) as Promise<Schedule>;

  const getSteemPrice = () => fetcher(`https://min-api.cryptocompare.com/data/price?fsym=STEEM&tsyms=USD`) as Promise<any>;

  // --- Witnesses Endpoints ---
  const getTopWitnesses = (params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/witnesses?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: Account[]; total: number; limit: number; skip: number }>;
  const getWitnessDetails = (name: string) => fetcher(`${API_BASE}/witnesses/${name}/details`) as Promise<Account>;
  const getWitnessVotesCastBy = (voterName: string) =>
    fetcher(`${API_BASE}/witnesses/votescastby/${voterName}`) as Promise<{ votedWitnesses: string[] }>;
  const getVotersForWitness = (witnessName: string, params: { limit?: number; offset?: number } = {}) =>
    fetcher(`${API_BASE}/witnesses/votersfor/${witnessName}?${new URLSearchParams(Object.entries(params).filter(([_, v]) => v !== undefined) as any).toString()}`) as Promise<{ data: string[]; total: number; limit: number; skip: number }>;


  return {
    getConfig,
    // Account
    getAccountsList,
    getAccountDetails,
    getAccountTransactions,
    getAccountTokens,
    getUserCount,
    // Token
    getTokens,
    getNewTokens,
    getHotTokens,
    getTopGainersTokens,
    getTopVolumeTokens,
    getTokenDetails,
    getTokensByIssuer,
    searchTokensByName,
    getTokenSupply,
    getTokenHolders,
    getTokenDistribution,
    getTokenList,

    getTransaction,
    // Events
    getEvents,
    // Block
    getBlocks,
    getLatestBlock,
    getBlockByHeight,
    getBlockByHash,
    getBlockTransactions,
    // Node
    getPeers,
    getSchedule,

    // Steem
    getSteemPrice,

    // Witnesses
    getTopWitnesses,
    getWitnessDetails,
    getWitnessVotesCastBy,
    getVotersForWitness,

  };
}