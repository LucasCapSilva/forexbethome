import { useState, useEffect, useCallback } from 'react';
import { getTradeService } from '../services/tradeService';
import { TradeResponse, TradeStats, CreateTradeRequest, TradeType } from '../types/Trade';

interface UseTradeServiceReturn {
  trades: TradeResponse[];
  stats: TradeStats | null;
  loading: boolean;
  error: string | null;
  refreshTrades: () => Promise<void>;
  createTrade: (trade: CreateTradeRequest) => Promise<void>;
  deleteTrade: (id: number) => Promise<void>;
  getTradesByAccount: (accountNumber: number) => Promise<void>;
  getTradesBySymbol: (symbol: string) => Promise<void>;
  getTradesByType: (type: TradeType) => Promise<void>;
  getTradesByAccountAndHistory: (accountNumber: number, isHistory: boolean) => Promise<TradeResponse[]>;
}

export const useTradeService = (accountNumber?: number): UseTradeServiceReturn => {
  const [trades, setTrades] = useState<TradeResponse[]>([]);
  const [stats, setStats] = useState<TradeStats | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const tradeService = getTradeService();

  const handleError = (error: any, operation: string) => {
    console.error(`Erro em ${operation}:`, error);
    const errorMessage = error.response?.data?.message || error.message || `Erro em ${operation}`;
    setError(errorMessage);
  };

  const refreshTrades = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      let tradesData: TradeResponse[];
      
      if (accountNumber) {
        tradesData = await tradeService.getTradesByAccount(accountNumber);
        // Calcular estatísticas para a conta específica
        const statsData = await tradeService.getTradeStats(accountNumber);
        setStats(statsData);
      } else {
        tradesData = await tradeService.getAllTrades();
        setStats(null);
      }
      
      setTrades(tradesData);
    } catch (error) {
      handleError(error, 'buscar trades');
      setTrades([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [accountNumber, tradeService]);

  const createTrade = useCallback(async (trade: CreateTradeRequest) => {
    setLoading(true);
    setError(null);
    
    try {
      await tradeService.createTrade(trade);
      await refreshTrades(); // Atualizar lista após criar
    } catch (error) {
      handleError(error, 'criar trade');
    } finally {
      setLoading(false);
    }
  }, [tradeService, refreshTrades]);

  const deleteTrade = useCallback(async (id: number) => {
    setLoading(true);
    setError(null);
    
    try {
      await tradeService.deleteTrade(id);
      await refreshTrades(); // Atualizar lista após deletar
    } catch (error) {
      handleError(error, 'deletar trade');
    } finally {
      setLoading(false);
    }
  }, [tradeService, refreshTrades]);

  const getTradesByAccount = useCallback(async (accountNumber: number) => {
    setLoading(true);
    setError(null);
    
    try {
      const tradesData = await tradeService.getTradesByAccount(accountNumber);
      const statsData = await tradeService.getTradeStats(accountNumber);
      setTrades(tradesData);
      setStats(statsData);
    } catch (error) {
      handleError(error, 'buscar trades por conta');
      setTrades([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [tradeService]);

  const getTradesBySymbol = useCallback(async (symbol: string) => {
    setLoading(true);
    setError(null);
    
    try {
      const tradesData = await tradeService.getTradesBySymbol(symbol);
      setTrades(tradesData);
      setStats(null); // Reset stats quando filtrar por símbolo
    } catch (error) {
      handleError(error, 'buscar trades por símbolo');
      setTrades([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [tradeService]);

  const getTradesByType = useCallback(async (type: TradeType) => {
    setLoading(true);
    setError(null);
    
    try {
      const tradesData = await tradeService.getTradesByType(type);
      setTrades(tradesData);
      setStats(null); // Reset stats quando filtrar por tipo
    } catch (error) {
      handleError(error, 'buscar trades por tipo');
      setTrades([]);
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [tradeService]);

  const getTradesByAccountAndHistory = useCallback(async (accountNumber: number, isHistory: boolean): Promise<TradeResponse[]> => {
    try {
      const tradesData = await tradeService.getTradesByAccountAndHistory(accountNumber, isHistory);
      return tradesData;
    } catch (error) {
      handleError(error, 'buscar trades por conta e histórico');
      return [];
    }
  }, [tradeService]);


  // Carregar trades automaticamente quando o hook é inicializado
  useEffect(() => {
    refreshTrades();
  }, [refreshTrades]);

  return {
    trades,
    stats,
    loading,
    error,
    refreshTrades,
    createTrade,
    deleteTrade,
    getTradesByAccount,
    getTradesBySymbol,
    getTradesByType,
    getTradesByAccountAndHistory,
  };
};

export default useTradeService;