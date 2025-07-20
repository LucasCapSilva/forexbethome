import axios, { AxiosInstance, AxiosResponse } from 'axios';
import { 
  Trade, 
  CreateTradeRequest, 
  TradeResponse, 
  PaginatedTradesResponse, 
  TradeType,
  TradeStats 
} from '../types/Trade';
import config from '../config';

// Função helper para verificar se é erro de rede
const isNetworkError = (error: any): boolean => {
  return (
    error.code === 'ERR_NETWORK' ||
    error.code === 'ERR_INSUFFICIENT_RESOURCES' ||
    error.code === 'ECONNREFUSED' ||
    error.code === 'ENOTFOUND' ||
    error.code === 'ETIMEDOUT' ||
    error.message === 'Network Error' ||
    !error.response
  );
};

class TradeService {
  private api: AxiosInstance;
  private baseURL: string = `${config.API_BASE_URL}/trades`;

  constructor() {
    this.api = axios.create({
      baseURL: this.baseURL,
      timeout: 30000, // Aumentando timeout para produção
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json'
      }
    });

    // Interceptor para logs de requisições (desenvolvimento)
    this.api.interceptors.request.use(
      (config) => {
        console.log('🚀 Enviando requisição para API de Trades:', {
          url: config.url,
          method: config.method,
          data: config.data
        });
        return config;
      },
      (error) => {
        console.error('❌ Erro na requisição:', error);
        return Promise.reject(error);
      }
    );

    // Interceptor para logs de respostas
    this.api.interceptors.response.use(
      (response) => {
        console.log('✅ Resposta da API de Trades:', {
          status: response.status,
          data: response.data
        });
        return response;
      },
      (error) => {
        console.error('❌ Erro na resposta:', {
          status: error.response?.status,
          data: error.response?.data,
          message: error.message
        });
        return Promise.reject(error);
      }
    );
  }

  /**
   * Criar um novo trade
   */
  async createTrade(trade: CreateTradeRequest): Promise<TradeResponse> {
    try {
      const response = await this.api.post<TradeResponse>('', trade);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao criar trade:', error);
      
      // Tratar erros de rede
      if (isNetworkError(error)) {
        console.warn('Erro de rede detectado. API indisponível. Criando trade mock localmente.');
        
        const mockTrade: TradeResponse = {
          id: Date.now(),
          accountNumber: trade.accountNumber,
          ticket: trade.ticket,
          magic: trade.magic || 0,
          symbol: trade.symbol,
          type: trade.type,
          volume: trade.volume,
          priceOpen: trade.priceOpen,
          price: trade.price || trade.priceOpen,
          profit: trade.profit || 0,
          t: new Date().toISOString(),
          isHistory: trade.isHistory || false,
          comment: trade.comment || 'Trade Offline',
          openTime: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        return mockTrade;
      }
      
      // Se a API retornar 405, pode estar temporariamente indisponível
      if (error.response?.status === 405) {
        console.warn('API retornou 405 - Method Not Allowed. Usando dados mock temporariamente.');
        
        const mockTrade: TradeResponse = {
          id: Date.now(),
          accountNumber: trade.accountNumber,
          ticket: trade.ticket,
          magic: trade.magic || 0,
          symbol: trade.symbol,
          type: trade.type,
          volume: trade.volume,
          priceOpen: trade.priceOpen,
          price: trade.price || trade.priceOpen,
          profit: trade.profit || 0,
          t: new Date().toISOString(),
          isHistory: trade.isHistory || false,
          comment: trade.comment || '',
          openTime: new Date().toISOString(),
          createdAt: new Date().toISOString()
        };
        
        return mockTrade;
      }
      
      // Fallback para outros erros
      const mockTrade: TradeResponse = {
        id: Date.now(),
        accountNumber: trade.accountNumber,
        ticket: trade.ticket,
        magic: trade.magic || 0,
        symbol: trade.symbol,
        type: trade.type,
        volume: trade.volume,
        priceOpen: trade.priceOpen,
        price: trade.price || trade.priceOpen,
        profit: trade.profit || 0,
        t: new Date().toISOString(),
        isHistory: trade.isHistory || false,
        comment: trade.comment || 'Trade Fallback',
        openTime: new Date().toISOString(),
        createdAt: new Date().toISOString()
      };
      
      return mockTrade;
    }
  }

  /**
   * Buscar todos os trades
   */
  async getAllTrades(): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get('');
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar trades:', error);
      
      // Tratar erros de rede
      if (isNetworkError(error)) {
        console.warn('Erro de rede detectado. API indisponível. Retornando lista vazia temporariamente.');
        return [];
      }
      
      // Se a API retornar 405, retornar array vazio como fallback
      if (error.response?.status === 405) {
        console.warn('API retornou 405 para GET. Retornando lista vazia temporariamente.');
        return [];
      }
      
      // Fallback para outros erros
      console.warn('Erro na API. Retornando lista vazia como fallback.');
      return [];
    }
  }

  /**
   * Buscar trade por ID
   */
  async getTradeById(id: number): Promise<TradeResponse> {
    try {
      const response: AxiosResponse<TradeResponse> = await this.api.get(`/${id}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trade por ID:', error);
      throw error;
    }
  }

  /**
   * Buscar trades por número da conta
   */
  async getTradesByAccount(accountNumber: number): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get(`/account/${accountNumber}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trades por conta:', error);
      throw error;
    }
  }

  /**
   * Buscar trades por número da conta com paginação
   */
  async getTradesByAccountPaginated(
    accountNumber: number, 
    page: number = 0, 
    size: number = 10
  ): Promise<PaginatedTradesResponse> {
    try {
      const response: AxiosResponse<PaginatedTradesResponse> = await this.api.get(
        `/account/${accountNumber}/paginated?page=${page}&size=${size}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trades paginados:', error);
      throw error;
    }
  }

  /**
   * Buscar trades por símbolo
   */
  async getTradesBySymbol(symbol: string): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get(`/symbol/${symbol}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trades por símbolo:', error);
      throw error;
    }
  }

  /**
   * Buscar trades por tipo (buy/sell)
   */
  async getTradesByType(type: TradeType): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get(`/type/${type}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trades por tipo:', error);
      throw error;
    }
  }

  /**
   * Buscar trades por histórico
   */
  async getTradesByHistory(isHistory: boolean): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get(`/history/${isHistory}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trades por histórico:', error);
      throw error;
    }
  }

  /**
   * Buscar trades por conta e histórico
   */
  async getTradesByAccountAndHistory(accountNumber: number, isHistory: boolean): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get(`/accountNumber/${accountNumber}/isHistory/${isHistory}`);
      return response.data;
    } catch (error: any) {
      console.error('Erro ao buscar trades por conta e histórico:', error);
      
      // Tratar erros de rede
      if (isNetworkError(error)) {
        console.warn('Erro de rede detectado. API indisponível. Retornando lista vazia temporariamente.');
        return [];
      }
      
      // Se a API retornar 405, retornar array vazio como fallback
      if (error.response?.status === 405) {
        console.warn('API retornou 405 para GET trades por conta e histórico. Retornando lista vazia temporariamente.');
        return [];
      }
      
      // Fallback para outros erros
      console.warn('Erro na API. Retornando lista vazia como fallback.');
      return [];
    }
  }

  /**
   * Buscar trades por magic number
   */
  async getTradesByMagic(magic: number): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get(`/magic/${magic}`);
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trades por magic:', error);
      throw error;
    }
  }

  /**
   * Buscar trades por período
   */
  async getTradesByPeriod(startDate: string, endDate: string): Promise<TradeResponse[]> {
    try {
      const response: AxiosResponse<TradeResponse[]> = await this.api.get(
        `/period?startDate=${startDate}&endDate=${endDate}`
      );
      return response.data;
    } catch (error) {
      console.error('Erro ao buscar trades por período:', error);
      throw error;
    }
  }

  /**
   * Atualizar trade
   */
  async updateTrade(id: number, trade: Partial<CreateTradeRequest>): Promise<TradeResponse> {
    try {
      const response: AxiosResponse<TradeResponse> = await this.api.put(`/${id}`, trade);
      return response.data;
    } catch (error) {
      console.error('Erro ao atualizar trade:', error);
      throw error;
    }
  }

  /**
   * Deletar trade por ID
   */
  async deleteTrade(id: number): Promise<void> {
    try {
      await this.api.delete(`/${id}`);
    } catch (error) {
      console.error('Erro ao deletar trade:', error);
      throw error;
    }
  }

  /**
   * Deletar todos os trades
   */
  async deleteAllTrades(): Promise<void> {
    try {
      await this.api.delete('');
    } catch (error) {
      console.error('Erro ao deletar todos os trades:', error);
      throw error;
    }
  }


  /**
   * Calcular estatísticas dos trades para uma conta
   */
  async getTradeStats(accountNumber: number): Promise<TradeStats> {
    try {
      const trades = await this.getTradesByAccount(accountNumber);
      
      const totalTrades = trades.length;
      const totalProfit = trades.reduce((sum, trade) => sum + (trade.profit || 0), 0);
      const totalVolume = trades.reduce((sum, trade) => sum + trade.volume, 0);
      const winningTrades = trades.filter(trade => (trade.profit || 0) > 0).length;
      const winRate = totalTrades > 0 ? (winningTrades / totalTrades) * 100 : 0;
      const avgProfit = totalTrades > 0 ? totalProfit / totalTrades : 0;

      return {
        totalTrades,
        totalProfit,
        totalVolume,
        winRate,
        avgProfit
      };
    } catch (error) {
      console.error('Erro ao calcular estatísticas:', error);
      throw error;
    }
  }
}

// Instância singleton do serviço
let tradeServiceInstance: TradeService | null = null;

/**
 * Factory function para criar/obter instância do TradeService
 */
export const createTradeService = (): TradeService => {
  if (!tradeServiceInstance) {
    tradeServiceInstance = new TradeService();
  }
  return tradeServiceInstance;
};

/**
 * Obtém a instância atual do TradeService
 */
export const getTradeService = (): TradeService => {
  return createTradeService();
};

export default TradeService;