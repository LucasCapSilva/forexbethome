import { useState, useCallback } from 'react';
import { Portfolio, Investment, CreateInvestmentRequest, CreatePortfolioRequest, UpdatePortfolioRequest } from '../types/Investment';
import { portfolioService, investmentService } from '../services/investmentService';

export interface UseInvestmentServiceReturn {
  portfolios: Portfolio[];
  userPortfolio: Portfolio | null;
  loading: boolean;
  error: string | null;
  
  // Portfolio operations
  refreshPortfolios: () => Promise<void>;
  getUserPortfolio: (userId: number) => Promise<Portfolio | null>;
  getPortfoliosByUser: (userId: number) => Promise<Portfolio[]>;
  createPortfolio: (portfolio: CreatePortfolioRequest) => Promise<Portfolio>;
  updatePortfolio: (id: number, portfolio: UpdatePortfolioRequest) => Promise<Portfolio>;
  deletePortfolio: (id: number) => Promise<void>;
  
  // Investment operations
  createInvestment: (investmentData: { date: string; amount: number; returnValue: number; returnPercentage: number }) => Promise<Investment>;
  getInvestmentsByPortfolio: (portfolioName: string) => Promise<Investment[]>;
  
  
}

export const useInvestmentService = (): UseInvestmentServiceReturn => {
  const [portfolios, setPortfolios] = useState<Portfolio[]>([]);
  const [userPortfolio, setUserPortfolio] = useState<Portfolio | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refreshPortfolios = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getAll();
      setPortfolios(data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar portfólios';
      setError(errorMessage);
      console.error('Erro ao carregar portfólios:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getUserPortfolio = useCallback(async (userId: number): Promise<Portfolio | null> => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getByUserId(userId);
      setUserPortfolio(data);
      return data;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar portfólio do usuário';
      setError(errorMessage);
      console.error('Erro ao carregar portfólio do usuário:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const getPortfoliosByUser = useCallback(async (userId: number): Promise<Portfolio[]> => {
    setLoading(true);
    setError(null);
    try {
      const data = await portfolioService.getByUserId(userId);
      // Como agora retorna um único portfólio, vamos convertê-lo em array
      const portfolioArray = data ? [data] : [];
      setPortfolios(portfolioArray);
      setUserPortfolio(data);
      return portfolioArray;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar portfólios do usuário';
      setError(errorMessage);
      console.error('Erro ao carregar portfólios do usuário:', err);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const createPortfolio = useCallback(async (portfolio: CreatePortfolioRequest): Promise<Portfolio> => {
    setLoading(true);
    setError(null);
    try {
      const newPortfolio = await portfolioService.create(portfolio);
      setPortfolios(prev => [...prev, newPortfolio]);
      return newPortfolio;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar portfólio';
      setError(errorMessage);
      console.error('Erro ao criar portfólio:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updatePortfolio = useCallback(async (id: number, portfolio: UpdatePortfolioRequest): Promise<Portfolio> => {
    setLoading(true);
    setError(null);
    try {
      const updatedPortfolio = await portfolioService.update(id, portfolio);
      setPortfolios(prev => prev.map(p => p.id === id ? updatedPortfolio : p));
      return updatedPortfolio;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao atualizar portfólio';
      setError(errorMessage);
      console.error('Erro ao atualizar portfólio:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const deletePortfolio = useCallback(async (id: number): Promise<void> => {
    setLoading(true);
    setError(null);
    try {
      await portfolioService.delete(id);
      setPortfolios(prev => prev.filter(p => p.id !== id));
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao deletar portfólio';
      setError(errorMessage);
      console.error('Erro ao deletar portfólio:', err);
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const createInvestment = useCallback(async (investmentData: { date: string; amount: number; returnValue: number; returnPercentage: number }): Promise<Investment> => {
    setError(null);
    try {
      const newInvestment = await investmentService.create(investmentData);
      return newInvestment;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao criar investimento';
      setError(errorMessage);
      console.error('Erro ao criar investimento:', err);
      throw err;
    }
  }, []);

  const getInvestmentsByPortfolio = useCallback(async (portfolioName: string): Promise<Investment[]> => {
    setError(null);
    try {
      const investments = await investmentService.getByPortfolio(portfolioName);
      return investments;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Erro ao carregar investimentos';
      setError(errorMessage);
      console.error('Erro ao carregar investimentos:', err);
      return [];
    }
  }, []);

  

  return {
    portfolios,
    userPortfolio,
    loading,
    error,
    refreshPortfolios,
    getUserPortfolio,
    getPortfoliosByUser,
    createPortfolio,
    updatePortfolio,
    deletePortfolio,
    createInvestment,
    getInvestmentsByPortfolio,
    
  };
};