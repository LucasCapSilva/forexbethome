export type TradeType = 'buy' | 'sell';

export interface Trade {
  id?: number;
  accountNumber: number;
  ticket: number;
  magic?: number;
  symbol: string;
  type: TradeType;
  volume: number;
  priceOpen: number;
  price?: number;
  profit?: number;
  t?: string; // LocalDateTime as ISO string
  isHistory?: boolean;
  comment?: string;
  openTime?: string; // LocalDateTime as ISO string
  createdAt?: string; // LocalDateTime as ISO string
}

export interface CreateTradeRequest {
  accountNumber: number;
  ticket: number;
  magic?: number;
  symbol: string;
  type: TradeType;
  volume: number;
  priceOpen: number;
  price?: number;
  profit?: number;
  isHistory?: boolean;
  comment?: string;
  openTime?: string;
}

export interface TradeResponse {
  id: number;
  accountNumber: number;
  ticket: number;
  magic?: number;
  symbol: string;
  type: TradeType;
  volume: number;
  priceOpen: number;
  price?: number;
  profit?: number;
  loteSize?: number;
  t?: string;
  isHistory?: boolean;
  comment?: string;
  openTime?: string;
  createdAt: string;
}

export interface PaginatedTradesResponse {
  content: TradeResponse[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}

export interface TradeStats {
  totalTrades: number;
  totalProfit: number;
  totalVolume: number;
  winRate: number;
  avgProfit: number;
}