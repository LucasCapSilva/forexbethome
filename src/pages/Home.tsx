import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { getUserById } from '../services/userService';
import { QRCodeSVG } from 'qrcode.react';
import { useTradeService } from '../hooks/useTradeService';
import { useInvestmentService } from '../hooks/useInvestmentService';
import { TradeResponse, CreateTradeRequest, TradeType } from '../types/Trade';
import { Portfolio as ApiPortfolio, Investment as ApiInvestment } from '../types/Investment';
import { TradesList } from '../components/TradesList';

// Constante da API para logs de debug
const API_BASE_URL = 'http://45.166.15.28:8093/api';

interface Investment {
  date: string;
  amount: number;
  return: number;
  returnPercentage: number;
}

interface Portfolio {
  id: number;
  name: string;
  balance: number;
  profit: number;
  profitPercentage: number;
  history: Investment[];
}

export default function Home() {
  const navigate = useNavigate();
  const { user, loading, isAdmin } = useAuth();
  const [balance, setBalance] = useState(0);
  const [showQRCode, setShowQRCode] = useState(false);
  const [depositAmount, setDepositAmount] = useState('');
  const [selectedPortfolio, setSelectedPortfolio] = useState<Portfolio | null>(null);
  const [investmentAmount, setInvestmentAmount] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // Usando o número da conta do usuário para buscar trades específicos
  const accountNumber = user?.uid ? parseInt(user.uid.slice(-8), 16) : 12345678;
  const userId = 1; // ID fixo do usuário para a API de investimentos
  
  const { 
    trades, 
    stats, 
    loading: tradesLoading, 
    error: tradesError, 
    createTrade, 
    refreshTrades,
    getTradesByAccountAndHistory, 
  } = useTradeService(accountNumber);

  // Hook para gerenciar investimentos na API
  const {
    portfolios: apiPortfolios,
    userPortfolio,
    loading: investmentsLoading,
    error: investmentsError,
    createPortfolio,
    updatePortfolio,
    createInvestment,
    getUserPortfolio,
    getPortfoliosByUser,
    getInvestmentsByPortfolio
    } = useInvestmentService();

  // Estado local para setUserPortfolio
  const [localUserPortfolio, setUserPortfolio] = useState<ApiPortfolio | null>(null);

  // Estados para dados do usuário calculados da API
  const [userWalletData, setUserWalletData] = useState({
    totalBalance: 0,
    totalInvested: 0,
    totalProfit: 0,
    totalValue: 0,
    profitPercentage: 0,
    gainPercentage: 0,
    lossPercentage: 0
  });

  const formatCurrency = (value: string) => {
    const numericValue = value.replace(/\D/g, '');
    const formattedValue = (Number(numericValue) / 100).toLocaleString('pt-BR', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
    return formattedValue;
  };

  const parseCurrency = (value: string) => {
    return Number(value.replace(/\./g, '').replace(',', '.'));
  };

  // Função para calcular retorno do investimento baseado na API
  const calculateInvestmentReturn = async (investedAmount: number): Promise<{ newBalance: number; profit: number; returnPercentage: number }> => {
    try {
      console.log('Calculando retorno do investimento para valor:', investedAmount);
      
      // Usar o accountNumber específico 9924570 conforme solicitado
      const specificAccountNumber = 9924570;
      
      // Buscar trades não históricos da conta específica para calcular retorno baseado em dados reais
      // Usando a fórmula: http://45.166.15.28:8093/api/trades/accountNumber/9924570/isHistory/false
      const apiTrades = await getTradesByAccountAndHistory(specificAccountNumber, false);
      console.log('Trades recebidos da API para cálculo (conta 9924570):', apiTrades);
      
      if (apiTrades.length === 0) {
        console.warn('Nenhum trade encontrado na API para conta 9924570, garantindo ganho positivo');
        // Garantir sempre ganho positivo quando não há trades
        const returnPercentage = Math.random() * 10 + 5; // 5% a 15% de ganho garantido
        
        const profit = investedAmount * (returnPercentage / 100);
        const newBalance = investedAmount + profit;
        
        console.log('Retorno positivo garantido calculado:', {
          investedAmount,
          profit,
          returnPercentage,
          newBalance
        });
        
        return {
          newBalance,
          profit,
          returnPercentage
        };
      }
      
      // Usar o primeiro trade para calcular retorno baseado em dados reais
      const firstTrade = apiTrades[0];
      console.log('Trade usado para cálculo:', firstTrade);
      
      // Aplicar a fórmula: saldo anterior + (profit/lote_size)
      const tradeProfit = Math.abs(firstTrade.profit || 0); // Garantir que o profit seja positivo
      const loteSize = firstTrade.loteSize || firstTrade.volume || 1;
      
      console.log('Dados do trade para cálculo:', {
        tradeProfit,
        loteSize,
        volume: firstTrade.volume
      });
      
      // Calcular o ganho usando a fórmula: profit/lote_size
      const profitPerLot = loteSize > 0 ? tradeProfit / loteSize : tradeProfit;
      
      // Normalizar para o valor investido e garantir ganho positivo
      const baseReturnPercentage = Math.max(5, (profitPerLot / 100) * 100); // Mínimo 5% de ganho
      const profit = investedAmount * (baseReturnPercentage / 100);
      const newBalance = investedAmount + profit;
      
      console.log('Retorno calculado baseado na API (fórmula profit/lote_size):', {
        investedAmount,
        tradeProfit,
        loteSize,
        profitPerLot,
        returnPercentage: baseReturnPercentage,
        profit,
        newBalance
      });
      
      return {
        newBalance,
        profit,
        returnPercentage: baseReturnPercentage
      };
      
    } catch (error) {
      console.error('Erro ao calcular retorno do investimento:', error);
      
      // Fallback para garantir ganho positivo em caso de erro
      const returnPercentage = Math.random() * 8 + 7; // 7% a 15% de ganho garantido
      
      const profit = investedAmount * (returnPercentage / 100);
      const newBalance = investedAmount + profit;
      
      console.log('Retorno de fallback positivo calculado:', {
        investedAmount,
        profit,
        returnPercentage,
        newBalance
      });
      
      return {
        newBalance,
        profit,
        returnPercentage
      };
    }
  };

  // Função para criar um trade na API
  const createTradeFromInvestment = async (portfolio: Portfolio | ApiPortfolio, amount: number, returnValue: number): Promise<void> => {
    // Gerar ticket único usando timestamp + random para evitar conflitos
    const ticket = Date.now() + Math.floor(Math.random() * 1000);
    const symbol = portfolio.name.toUpperCase().substring(0, 16); // Máximo 16 caracteres conforme documentação
    const type: TradeType = returnValue >= 0 ? 'buy' : 'sell';
    const volume = Number((amount / 100).toFixed(2)); // Convertendo para lotes com 2 casas decimais
    const priceOpen = Number((1.0).toFixed(2)); // Preço base
    const magic = portfolio.id;
    const currentPrice = Number((priceOpen + (returnValue / amount)).toFixed(2));

    const tradeData: CreateTradeRequest = {
      accountNumber: Number(accountNumber), // Garantir que é número
      ticket: Number(ticket), // Garantir que é número
      symbol,
      type,
      volume,
      priceOpen,
      price: currentPrice, // Preço atual baseado no retorno
      profit: Number(returnValue.toFixed(2)), // Arredondar para 2 casas decimais
      magic: Number(magic), // Garantir que é número
      comment: `Investimento em ${portfolio.name}`.substring(0, 255), // Máximo 255 caracteres
      isHistory: false,
      openTime: new Date().toISOString()
    };

    console.log('Dados do trade a serem enviados:', tradeData);

    try {
      await createTrade(tradeData);
      console.log('Trade criado com sucesso:', tradeData);
    } catch (error) {
      console.error('Erro ao criar trade:', error);
      // Log detalhado do erro para debug
      if (error.response) {
        console.error('Status:', error.response.status);
        console.error('Data:', error.response.data);
        console.error('Headers:', error.response.headers);
        
        // Tratamento especial para erro 405 (Method Not Allowed)
        if (error.response.status === 405) {
          console.warn('API temporariamente indisponível (405). Processando investimento localmente.');
          return; // Não lançar erro, permitir que o investimento continue
        }
      }
      throw error;
    }
  };
  const [showInvestmentModal, setShowInvestmentModal] = useState(false);
  const [portfolios, setPortfolios] = useState<Portfolio[]>([
    { id: 1, name: 'Milanex', balance: 0, profit: 0, profitPercentage: 0, history: [] },
    { id: 2, name: 'Madrilex', balance: 0, profit: 0, profitPercentage: 0, history: [] },
    { id: 3, name: 'Bayernex', balance: 0, profit: 0, profitPercentage: 0, history: [] },
  ]);

  const mockPixKey = 'forex12345e6';

  // Função para calcular dados do wallet baseados no portfólio do usuário da API
  const calculateWalletData = useCallback((userPortfolio: ApiPortfolio | null) => {
    // Calcular total investido em todas as carteiras (soma dos valores investidos no histórico)
    const totalInvestedInPortfolios = portfolios.reduce((sum, portfolio) => {
      const portfolioInvested = portfolio.history.reduce((histSum, investment) => histSum + investment.amount, 0);
      return sum + portfolioInvested;
    }, 0);

    // Calcular total de lucro real baseado no histórico de investimentos
    const totalProfitFromPortfolios = portfolios.reduce((sum, portfolio) => {
      const portfolioProfit = portfolio.history.reduce((histSum, investment) => histSum + investment.return, 0);
      return sum + portfolioProfit;
    }, 0);

    // Calcular percentuais de ganho e perda usando dados dos portfolios locais
    const allInvestments = portfolios.flatMap(p => p.history || []);
    const positiveInvestments = allInvestments.filter(inv => inv.return > 0);
    const negativeInvestments = allInvestments.filter(inv => inv.return < 0);
    
    const totalPositiveReturns = positiveInvestments.reduce((sum, inv) => sum + inv.return, 0);
    const totalNegativeReturns = Math.abs(negativeInvestments.reduce((sum, inv) => sum + inv.return, 0));
    
    const gainPercentage = totalInvestedInPortfolios > 0 ? (totalPositiveReturns / totalInvestedInPortfolios) * 100 : 0;
    const lossPercentage = totalInvestedInPortfolios > 0 ? (totalNegativeReturns / totalInvestedInPortfolios) * 100 : 0;

    const profitPercentage = totalInvestedInPortfolios > 0 ? (totalProfitFromPortfolios / totalInvestedInPortfolios) * 100 : 0;

    // Calcular apenas lucros positivos para o valor total disponível
    const positiveProfit = Math.max(0, totalProfitFromPortfolios);
    
    setUserWalletData({
      totalBalance: balance, // Saldo atual do usuário
      totalInvested: totalInvestedInPortfolios,
      totalProfit: totalProfitFromPortfolios,
      totalValue: balance + totalInvestedInPortfolios + positiveProfit, // V.Total = saldo + investido + apenas lucros positivos
      profitPercentage,
      gainPercentage,
      lossPercentage
    });

    console.log('Dados do wallet calculados:', {
      userPortfolio,
      totalBalance: balance,
      totalInvested: totalInvestedInPortfolios,
      totalProfit: totalProfitFromPortfolios,
      totalValue: balance + totalInvestedInPortfolios + positiveProfit,
      profitPercentage,
      gainPercentage,
      lossPercentage,
      portfolios
    });
  }, [balance, portfolios]);

  // Recalcular dados do wallet quando o portfólio do usuário mudar
  useEffect(() => {
    calculateWalletData(userPortfolio);
  }, [userPortfolio, calculateWalletData]);

  // Recalcular dados do wallet quando os portfólios locais mudarem
  useEffect(() => {
    calculateWalletData(userPortfolio);
  }, [portfolios, calculateWalletData]);

  const mockQRCodeValue = `00020126580014BR.GOV.BCB.PIX0136${mockPixKey}5204000053039865802BR5913Forex Bet6009Sao Paulo62070503***6304E2CA`;

  // Função para buscar dados reais da API na inicialização
  const loadInitialDataFromAPI = async () => {
    try {
      console.log('Carregando dados iniciais da API...');
      
      // Buscar portfólio do usuário
      const portfolioData = await getUserPortfolio(1); // userId = 1
      
      if (portfolioData) {
        console.log('Portfólio encontrado na API:', portfolioData);
        
        // Atualizar saldo com dados da API
        setBalance(portfolioData.balance);
        
        // Buscar investimentos do portfólio usando o nome
        const investments = await getInvestmentsByPortfolio(portfolioData.name);
        console.log('Investimentos encontrados:', investments);
        
        // Converter investimentos para formato de histórico local
        const history = investments?.map(inv => ({
          id: inv.id,
          date: inv.date,
          amount: inv.amount,
          return: inv.returnValue,
          returnPercentage: inv.returnPercentage
        })) || [];
        
        // Atualizar portfólios locais com dados reais da API
        setPortfolios([
          { 
            id: 1, 
            name: 'Milanex', 
            balance: portfolioData.balance, 
            profit: portfolioData.profit || 0, 
            profitPercentage: portfolioData.profitPercentage || 0, 
            history 
          },
          { id: 2, name: 'Madrilex', balance: 0, profit: 0, profitPercentage: 0, history: [] },
          { id: 3, name: 'Bayernex', balance: 0, profit: 0, profitPercentage: 0, history: [] },
        ]);
        
        // Definir userPortfolio com dados da API
        setUserPortfolio({
          ...portfolioData,
          investments: investments?.map(inv => inv.id.toString()) || []
        });
        
        console.log('Dados iniciais carregados com sucesso da API');
      } else {
        console.log('Nenhum portfólio encontrado, criando um novo...');
        
        // Criar novo portfólio se não existir
        const newPortfolio = await createPortfolio({
          userId: 1,
          name: 'Lucas Capelotto',
          balance: 5000.00, // Saldo inicial padrão
          profit: 0.00,
          profitPercentage: 0.00
        });
        
        console.log('Novo portfólio criado:', newPortfolio);
        setBalance(newPortfolio.balance);
        setUserPortfolio({
          ...newPortfolio,
          investments: []
        });
      }
    } catch (error) {
      console.error('Erro ao carregar dados iniciais da API:', error);
      // Manter dados padrão em caso de erro
      console.log('Usando dados padrão devido ao erro na API');
    }
  };

  // Função para sincronizar dados do usuário com a API
  const syncUserDataWithAPI = async () => {
    try {
      console.log('Sincronizando dados do usuário com a API...');
      
      // Buscar dados atualizados do usuário
      const userData = await getUserPortfolio(1); // userId = 1
      
      if (userData) {
        console.log('Dados do usuário encontrados:', userData);
        
        // Buscar investimentos atualizados usando o nome do portfólio
        const investments = await getInvestmentsByPortfolio(userData.name);
        console.log('Investimentos atualizados:', investments);
        
        // Atualizar saldo local
        setBalance(userData.balance);
        
        // Converter investimentos para formato de histórico local
        const history = investments?.map(inv => ({
          id: inv.id,
          date: inv.date,
          amount: inv.amount,
          return: inv.returnValue,
          returnPercentage: inv.returnPercentage
        })) || [];
        
        // Atualizar portfólios locais
        setPortfolios(prev => prev.map(p => 
          p.id === 1 
            ? { 
                ...p, 
                balance: userData.balance, 
                profit: userData.profit || 0, 
                profitPercentage: userData.profitPercentage || 0, 
                history 
              }
            : p
        ));
        
        // Atualizar userPortfolio
        setUserPortfolio({
          ...userData,
          investments: investments?.map(inv => inv.id.toString()) || []
        });
        
        console.log('Dados sincronizados com sucesso');
      } else {
        console.log('Nenhum dado encontrado para o usuário');
      }
    } catch (error) {
      console.error('Erro ao sincronizar dados do usuário com a API:', error);
      // Manter dados locais em caso de erro
    }
  };

  // Função específica para depósito que envia JSON completo
  const updateDepositInAPI = async (newBalance: number) => {
    try {
      console.log('Iniciando depósito na API...');
      console.log('Novo saldo para depósito:', newBalance);

      // Estrutura baseada no objeto de portfólio fornecido pelo usuário
      const depositData = {
        userId: 1, // ID fixo conforme solicitado
        name: "Lucas Capelotto", // Nome fixo conforme objeto fornecido
        balance: parseFloat(newBalance.toFixed(2)),
        profit: 0.00, // Manter profit zerado no depósito
        profitPercentage: 0.00 // Manter profitPercentage zerado no depósito
      };

      console.log('Dados do depósito sendo enviados:', depositData);
      
      // Tentar usar o hook primeiro
      try {
        const result = await updatePortfolio(1, depositData); // Usar portfolioId = 1
        console.log('Depósito realizado via hook com sucesso:', result);
        return result;
      } catch (hookError) {
        console.warn('Hook falhou, tentando requisição direta:', hookError);
        
        // Fallback para requisição direta
        const API_BASE_URL = 'http://45.166.15.28:8093/api';
        console.log('URL do endpoint:', `${API_BASE_URL}/portfolios/1`);

        const response = await fetch(`${API_BASE_URL}/portfolios/1`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(depositData)
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Erro na resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Resposta da API para depósito:', result);
        console.log('Depósito realizado com sucesso na API');
        
        return result;
      }
    } catch (error) {
      console.error('Erro ao realizar depósito na API:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  // Função específica para salvar investimento no endpoint correto
  // Função específica para salvar investimento no endpoint correto
  const saveInvestmentToCorrectAPI = async (amount: number, returnValue: number, returnPercentage: number, portfolioName: string = "Lucas Capelotto") => {
    try {
      console.log('Salvando investimento no endpoint correto...');
      console.log('Dados do investimento:', { amount, returnValue, returnPercentage, portfolioName });

      // Estrutura simplificada para a nova assinatura do createInvestment
      const investmentData = {
        amount: parseFloat(amount.toFixed(2)),
        returnValue: parseFloat(returnValue.toFixed(2)),
        returnPercentage: parseFloat(returnPercentage.toFixed(2)),
        date: new Date().toISOString().split('T')[0] // Formato YYYY-MM-DD
      };

      console.log('Dados do investimento sendo enviados:', investmentData);
      
      // Tentar usar o hook primeiro
      try {
        const result = await createInvestment(investmentData);
        console.log('Investimento criado via hook com sucesso:', result);
        return result;
      } catch (hookError) {
        console.warn('Hook falhou, tentando requisição direta:', hookError);
        
        // Fallback para requisição direta com estrutura completa
        const API_BASE_URL = 'http://45.166.15.28:8093/api';
        console.log('URL do endpoint:', `${API_BASE_URL}/investments`);

        // Montar JSON completo para fallback
        const fullInvestmentData = {
          portfolio: {
            id: 1, // ID chumbado
            userId: 0,
            name: "Lucas Capelotto",
            balance: 5000,
            profit: 0,
            profitPercentage: 0,
            createdAt: new Date().toISOString(),
            investments: []
          },
          date: investmentData.date,
          amount: investmentData.amount,
          returnValue: investmentData.returnValue,
          returnPercentage: investmentData.returnPercentage,
          createdAt: new Date().toISOString()
        };

        const response = await fetch(`${API_BASE_URL}/investments`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(fullInvestmentData)
        });

        if (!response.ok) {
          const errorData = await response.text();
          console.error('Erro na resposta da API:', {
            status: response.status,
            statusText: response.statusText,
            data: errorData
          });
          throw new Error(`Erro HTTP ${response.status}: ${response.statusText}`);
        }

        const result = await response.json();
        console.log('Resposta da API para investimento:', result);
        console.log('Investimento salvo com sucesso na API');
        
        return result;
      }
    } catch (error) {
      console.error('Erro ao salvar investimento na API:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  // Função específica para investimento que envia JSON completo
  const updateInvestmentInAPI = async (portfolioUpdates: { balance?: number; profit?: number; profitPercentage?: number }) => {
    try {
      console.log('Iniciando atualização de investimento na API...');
      console.log('Updates solicitados:', portfolioUpdates);

      // Usar a função updatePortfolioInAPI que já tem toda a lógica necessária
      const result = await updatePortfolioInAPI(portfolioUpdates);
      
      console.log('Investimento atualizado na API com sucesso');
      return result;
    } catch (error) {
      console.error('Erro ao atualizar investimento na API:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        stack: error.stack
      });
      throw error;
    }
  };

  // Função para atualizar portfólio completo na API
  const updatePortfolioInAPI = async (portfolioUpdates: { balance?: number; profit?: number; profitPercentage?: number }) => {
    try {
      console.log('Iniciando atualização do portfólio na API...');
      console.log('UserPortfolio atual:', userPortfolio);
      console.log('Updates solicitados:', portfolioUpdates);

      // Se não há userPortfolio, tentar buscar ou criar um
      if (!userPortfolio) {
        console.warn('Nenhum portfólio do usuário encontrado, tentando buscar/criar...');
        
        try {
          // Tentar buscar o portfólio do usuário
          const foundPortfolio = await getUserPortfolio(userId);
          if (foundPortfolio) {
            console.log('Portfólio encontrado na API:', foundPortfolio);
            // Usar o portfólio encontrado para a atualização
            const updateData = {
              balance: portfolioUpdates.balance !== undefined ? portfolioUpdates.balance : foundPortfolio.balance,
              profit: portfolioUpdates.profit !== undefined ? portfolioUpdates.profit : (foundPortfolio.profit || 0),
              profitPercentage: portfolioUpdates.profitPercentage !== undefined ? portfolioUpdates.profitPercentage : (foundPortfolio.profitPercentage || 0)
            };

            console.log('Dados sendo enviados para API (portfólio encontrado):', updateData);
            const result = await updatePortfolio(foundPortfolio.id, updateData);
            console.log('Portfólio atualizado na API com sucesso');
            return result;
          } else {
            // Se não encontrou, criar um novo portfólio
            console.log('Criando novo portfólio para o usuário...');
            const newPortfolio = await createPortfolio({
              userId: userId,
              name: 'Portfolio Principal',
              balance: portfolioUpdates.balance || 0,
              profit: portfolioUpdates.profit || 0,
              profitPercentage: portfolioUpdates.profitPercentage || 0
            });
            console.log('Novo portfólio criado:', newPortfolio);
            return newPortfolio;
          }
        } catch (createError) {
          console.error('Erro ao buscar/criar portfólio:', createError);
          throw new Error('Não foi possível encontrar ou criar um portfólio para o usuário');
        }
      }

      console.log('Atualizando portfólio existente na API:', { 
        portfolioId: userPortfolio.id, 
        currentData: userPortfolio,
        updates: portfolioUpdates
      });

      // Preparar dados completos para atualização
      const updateData = {
        balance: portfolioUpdates.balance !== undefined ? portfolioUpdates.balance : userPortfolio.balance,
        profit: portfolioUpdates.profit !== undefined ? portfolioUpdates.profit : (userPortfolio.profit || 0),
        profitPercentage: portfolioUpdates.profitPercentage !== undefined ? portfolioUpdates.profitPercentage : (userPortfolio.profitPercentage || 0)
      };

      console.log('Dados completos sendo enviados para API:', updateData);
      console.log('URL da requisição:', `${API_BASE_URL}/portfolios/${userPortfolio.id}`);

      const result = await updatePortfolio(userPortfolio.id, updateData);

      console.log('Resposta da API:', result);
      console.log('Portfólio atualizado na API com sucesso');
      
      return result;
    } catch (error) {
      console.error('Erro ao atualizar portfólio na API:', error);
      console.error('Detalhes do erro:', {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data,
        config: error.config
      });
      throw error;
    }
  };

  // Função para atualizar saldo na API após depósito
  const updateBalanceInAPI = async (newBalance: number) => {
    return updatePortfolioInAPI({ balance: newBalance });
  };

  useEffect(() => {
    const checkUserData = async () => {
      if (loading) return;
      console.log('Is Admin:', isAdmin);
      console.log('Account Number:', accountNumber);
      console.log('User ID:', userId);

      try {
        // Testar conectividade com a API de trades
  
        // Carregar dados iniciais da API, confiando no tratamento de erros
        console.log('Carregando dados iniciais da API...');
        await loadInitialDataFromAPI();
        console.log('Carregamento inicial concluído');
        
        //Estou verificando se houve commit
        // Use isAdmin from AuthContext, which should be updated on login
        if (isAdmin) {
          navigate('/admin');
        } else {
          // Non-admin users with valid data stay on Home page
        }

      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    checkUserData();
  }, [user, loading, isAdmin, navigate, accountNumber, userId, loadInitialDataFromAPI]);

  // Usar dados calculados da API ou fallback para dados locais
  const displayData = userPortfolio ? userWalletData : {
    totalBalance: balance,
    totalInvested: trades.reduce((sum, trade) => sum + (trade.volume * 100), 0),
    totalProfit: trades.reduce((sum, trade) => sum + (trade.profit || 0), 0),
    totalValue: balance + trades.reduce((sum, trade) => sum + (trade.volume * 100), 0) + Math.max(0, trades.reduce((sum, trade) => sum + (trade.profit || 0), 0)), // Apenas lucros positivos
    profitPercentage: trades.reduce((sum, trade) => sum + (trade.volume * 100), 0) > 0 ? (trades.reduce((sum, trade) => sum + (trade.profit || 0), 0) / trades.reduce((sum, trade) => sum + (trade.volume * 100), 0)) * 100 : 0,
    gainPercentage: trades.filter(t => (t.profit || 0) > 0).length > 0 ? 
      (trades.filter(t => (t.profit || 0) > 0).reduce((sum, t) => sum + (t.profit || 0), 0) / trades.reduce((sum, trade) => sum + (trade.volume * 100), 0)) * 100 : 0,
    lossPercentage: trades.filter(t => (t.profit || 0) < 0).length > 0 ? 
      Math.abs(trades.filter(t => (t.profit || 0) < 0).reduce((sum, t) => sum + (t.profit || 0), 0) / trades.reduce((sum, trade) => sum + (trade.volume * 100), 0)) * 100 : 0
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#12213E] to-[#000000] text-white font-montserrat">
      <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #1a1a1a;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #49A1F2;
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #3B82F6;
        }
      `}</style>
      {/* Navbar Flutuante */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#06284B]/95 backdrop-blur-md shadow-2xl border-b border-[#49A1F2] p-2 sm:p-3 lg:p-2">
        {/* Logo */}
        <div className="flex justify-center mb-2 sm:mb-3 lg:mb-2">
          <img 
            src="https://forexbet.com.br/wp-content/uploads/2025/04/LOGO-FOREX-BET-2-1024x172.png" 
            alt="ForexBet Logo"
            className="h-6 sm:h-8 lg:h-6 w-auto max-w-[150px] sm:max-w-[200px] lg:max-w-[180px]"
          />
        </div>
        
        {/* Wallet Info - Linha única para mobile/tablet */}
        <div className="flex flex-wrap justify-center lg:grid lg:grid-cols-5 gap-1 sm:gap-2 lg:gap-1.5 mb-2 sm:mb-3 lg:mb-2">
          {/* Saldo */}
          <div className="bg-[#0A3A5C]/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 lg:p-1.5 text-center border border-[#49A1F2]/30 min-w-[70px] sm:min-w-[90px] lg:min-w-0 flex-1 lg:flex-none">
            <div className="text-xs sm:text-sm lg:text-xs mb-0.5 lg:mb-0.5">💳</div>
            <h3 className="text-[8px] sm:text-[9px] lg:text-[9px] text-gray-400 mb-0.5 lg:mb-0.5">Saldo</h3>
            <p className="text-[9px] sm:text-[10px] lg:text-[10px] font-bold text-[#49A1F2] truncate">
              {displayData.totalBalance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          
          {/* Valor Total */}
          <div className="bg-[#0A3A5C]/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 lg:p-1.5 text-center border border-[#49A1F2]/30 min-w-[70px] sm:min-w-[90px] lg:min-w-0 flex-1 lg:flex-none">
            <div className="text-xs sm:text-sm lg:text-xs mb-0.5 lg:mb-0.5">💰</div>
            <h3 className="text-[8px] sm:text-[9px] lg:text-[9px] text-gray-400 mb-0.5 lg:mb-0.5">V.Total</h3>
            <p className="text-[9px] sm:text-[10px] lg:text-[10px] font-bold text-white truncate">
              {displayData.totalValue.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          
          {/* Total Investido */}
          <div className="bg-[#0A3A5C]/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 lg:p-1.5 text-center border border-[#49A1F2]/30 min-w-[70px] sm:min-w-[90px] lg:min-w-0 flex-1 lg:flex-none">
            <div className="text-xs sm:text-sm lg:text-xs mb-0.5 lg:mb-0.5">📈</div>
            <h3 className="text-[8px] sm:text-[9px] lg:text-[9px] text-gray-400 mb-0.5 lg:mb-0.5">Investido</h3>
            <p className="text-[9px] sm:text-[10px] lg:text-[10px] font-bold text-white truncate">
              {displayData.totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
            </p>
          </div>
          
          {/* % Ganho */}
          <div className="bg-[#0A3A5C]/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 lg:p-1.5 text-center border border-[#49A1F2]/30 min-w-[60px] sm:min-w-[70px] lg:min-w-0 flex-1 lg:flex-none">
            <div className="text-xs sm:text-sm lg:text-xs mb-0.5 lg:mb-0.5">🟢</div>
            <h3 className="text-[8px] sm:text-[9px] lg:text-[9px] text-gray-400 mb-0.5 lg:mb-0.5">Ganho</h3>
            <p className="text-[9px] sm:text-[10px] lg:text-[10px] font-bold text-green-400">+{displayData.gainPercentage.toFixed(1)}%</p>
          </div>
          
          {/* % Perda */}
          <div className="bg-[#0A3A5C]/90 backdrop-blur-sm rounded-lg p-1.5 sm:p-2 lg:p-1.5 text-center border border-[#49A1F2]/30 min-w-[60px] sm:min-w-[70px] lg:min-w-0 flex-1 lg:flex-none">
            <div className="text-xs sm:text-sm lg:text-xs mb-0.5 lg:mb-0.5">🔴</div>
            <h3 className="text-[8px] sm:text-[9px] lg:text-[9px] text-gray-400 mb-0.5 lg:mb-0.5">Perda</h3>
            <p className="text-[9px] sm:text-[10px] lg:text-[10px] font-bold text-red-400">-{displayData.lossPercentage.toFixed(1)}%</p>
          </div>
        </div>
        
        {/* Histórico e Botão Depositar - Linha única */}
        <div className="flex flex-row justify-between items-center gap-2 sm:gap-3 lg:gap-4">
          <div className="bg-[#0A3A5C] rounded-lg px-2 sm:px-3 lg:px-4 py-1.5 sm:py-2 border border-[#49A1F2]/30 flex-1 lg:flex-none">
            <div className="flex flex-row items-center justify-center lg:justify-start">
              <span className="text-[8px] sm:text-[9px] lg:text-xs text-gray-400 mr-1 sm:mr-2">Histórico:</span>
              <div className="flex items-center gap-1">
                {displayData.totalProfit >= 0 ? (
                  <span className="text-green-400 text-[10px] sm:text-[11px] lg:text-sm">📈</span>
                ) : (
                  <span className="text-red-400 text-[10px] sm:text-[11px] lg:text-sm">📉</span>
                )}
                <span className={`text-[9px] sm:text-[10px] lg:text-sm font-bold ${displayData.totalProfit >= 0 ? 'text-green-400' : 'text-red-400'} truncate`}>
                  {displayData.totalProfit >= 0 ? '+' : ''}{displayData.totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })} 
                  ({displayData.profitPercentage >= 0 ? '+' : ''}{displayData.profitPercentage.toFixed(1)}%)
                </span>
                {displayData.totalProfit >= 0 ? (
                  <span className="text-green-400 text-[8px] sm:text-[9px] lg:text-xs ml-1 hidden sm:inline">Ganho</span>
                ) : (
                  <span className="text-red-400 text-[8px] sm:text-[9px] lg:text-xs ml-1 hidden sm:inline">Perda</span>
                )}
              </div>
            </div>
          </div>
          
          <div className="flex gap-2">
            <button
              onClick={() => setShowQRCode(true)}
              className="bg-[#49A1F2] hover:bg-[#3B82F6] text-white font-bold py-1.5 sm:py-2 px-3 sm:px-4 lg:px-6 rounded text-[10px] sm:text-[11px] lg:text-sm transition-colors duration-200 whitespace-nowrap"
            >
              💳 Depositar
            </button>
          </div>
        </div>
      </header>
      
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* Wallet Summary */}
   

        <div className="text-center mb-2 mt-36">
        <h1 className="text-3xl font-bold mb-2">Dashboard de Investimentos</h1>
        <p className="text-gray-300 mb-2">Gerencie suas carteiras e maximize seus ganhos</p>
          
          
        </div>

        {showQRCode && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Depositar via PIX</h3>
                <input
                  type="text"
                  value={depositAmount}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setDepositAmount(formatted);
                  }}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border rounded-md text-gray-700 mb-4"
                />
                {depositAmount && (
                  <div className="bg-white p-4 rounded-lg flex justify-center mb-4">
                    <QRCodeSVG value={`${mockQRCodeValue}${depositAmount}`} size={200} />
                  </div>
                )}
                <p className="text-sm text-gray-600 mb-4">Chave PIX: {mockPixKey}</p>
                <div className="flex space-x-2 justify-center">
                  <button
                    onClick={async () => {
                      const amount = parseCurrency(depositAmount);
                      if (amount > 0) {
                        const newBalance = balance + amount;
                        
                        // Atualizar saldo local primeiro
                        setBalance(newBalance);
                        
                        // Atualizar saldo na API usando a função específica para depósito
                        try {
                          console.log('Atualizando saldo na API após depósito...');
                          await updateDepositInAPI(newBalance);
                          console.log('Saldo atualizado na API com sucesso');
                        } catch (error) {
                          console.error('Erro ao atualizar saldo na API:', error);
                          // Reverter o saldo local se a API falhar
                          setBalance(prev => prev - amount);
                          alert('Erro ao atualizar saldo na API. Tente novamente.');
                          return;
                        }
                        
                        // Sincronizar dados do usuário após depósito
                        try {
                          console.log('Sincronizando dados do usuário após depósito...');
                          await syncUserDataWithAPI();
                          console.log('Dados do usuário sincronizados após depósito');
                        } catch (error) {
                          console.warn('Erro ao sincronizar dados do usuário após depósito:', error);
                        }
                      }
                      setDepositAmount('');
                      setShowQRCode(false);
                    }}
                    className="bg-[#49A1F2] text-white px-4 py-2 rounded hover:bg-[#3B82F6]"
                    disabled={!depositAmount || parseCurrency(depositAmount) <= 0}
                  >
                    Confirmar Depósito
                  </button>
                  <button
                    onClick={() => {
                      setDepositAmount('');
                      setShowQRCode(false);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {showInvestmentModal && selectedPortfolio && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <div className="bg-white rounded-lg p-6 max-w-sm w-full">
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 mb-4">Investir em {selectedPortfolio.name}</h3>
                <input
                  type="text"
                  value={investmentAmount}
                  onChange={(e) => {
                    const formatted = formatCurrency(e.target.value);
                    setInvestmentAmount(formatted);
                    setErrorMessage("");
                  }}
                  placeholder="0,00"
                  className="w-full px-3 py-2 border rounded-md text-gray-700 mb-4"
                />
                {errorMessage && (
                  <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
                    <p className="text-sm">{errorMessage}</p>
                  </div>
                )}
                {tradesError && (
                  <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 px-4 py-3 rounded mb-4">
                    <p className="text-sm">⚠️ API de Trades: {tradesError}</p>
                    <p className="text-xs mt-1">O investimento será processado localmente se a API estiver indisponível.</p>
                  </div>
                )}
                <div className="flex space-x-2 justify-center">
                  <button
                    onClick={async () => {
                      const amount = parseCurrency(investmentAmount);
                      
                      if (!investmentAmount || amount <= 0) {
                        setErrorMessage('Por favor, insira um valor válido.');
                        return;
                      }
                      
                      if (amount > balance) {
                        setErrorMessage(`Saldo insuficiente. Seu saldo atual é ${balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}.`);
                        return;
                      }
                      
                      try {
                        // Usar a nova função que consome a API
                        const result = await calculateInvestmentReturn(amount);
                        
                        if (!result) {
                          setErrorMessage('Erro ao calcular retorno do investimento');
                          return;
                        }
                        
                        const { newBalance, profit: return_value, returnPercentage } = result;
                        
                        // Enviar dados para API de Trades
                        try {
                          await createTradeFromInvestment(selectedPortfolio, amount, return_value);
                          console.log('Trade criado com sucesso na API');
                          
                        } catch (error) {
                          console.error('Erro ao criar trade na API:', error);
                          
                          // Mensagem de erro mais específica baseada no tipo de erro
                          let errorMsg = 'Erro ao processar investimento. ';
                          
                          if (error.response) {
                            // Erro da API
                            const status = error.response.status;
                            const data = error.response.data;
                            
                            if (status === 405) {
                              // API temporariamente indisponível - continuar com processamento local
                              console.warn('API indisponível (405), processando localmente');
                            } else if (status === 400) {
                              errorMsg += 'Dados inválidos enviados para a API. ';
                              if (data && data.message) {
                                errorMsg += `Detalhes: ${data.message}`;
                              }
                              setErrorMessage(errorMsg);
                              return;
                            } else if (status === 500) {
                              errorMsg += 'Erro interno do servidor da API.';
                              setErrorMessage(errorMsg);
                              return;
                            } else {
                              errorMsg += `Erro HTTP ${status}.`;
                              setErrorMessage(errorMsg);
                              return;
                            }
                          } else if (error.request) {
                            // Erro de rede
                            errorMsg += 'Não foi possível conectar com a API. Verifique sua conexão.';
                            setErrorMessage(errorMsg);
                            return;
                          } else {
                            // Outro tipo de erro
                            errorMsg += error.message || 'Erro desconhecido.';
                            setErrorMessage(errorMsg);
                            return;
                          }
                        }
                        
                        // Atualizar dados locais usando o novo saldo calculado pela API
                        const previousBalance = balance;
                        setBalance(prev => prev - amount);
                        
                        // Atualizar portfólio completo na API (saldo, profit e profitPercentage)
                        try {
                          const newPortfolioBalance = balance - amount;
                          const newProfit = (userPortfolio?.profit || 0) + return_value;
                          const newProfitPercentage = newPortfolioBalance > 0 ? (newProfit / newPortfolioBalance) * 100 : 0;
                          
                          await updateInvestmentInAPI({
                            balance: newPortfolioBalance,
                            profit: newProfit,
                            profitPercentage: newProfitPercentage
                          });
                          console.log('Portfólio atualizado na API após investimento');
                        } catch (balanceError) {
                          console.error('Erro ao atualizar portfólio na API:', balanceError);
                          // Reverter o saldo local se a API falhar
                          setBalance(previousBalance);
                          setErrorMessage('Erro ao atualizar dados na API. Tente novamente.');
                          return;
                        }
                        
                        // Salvar investimento na API usando o endpoint correto
                        try {
                          await saveInvestmentToCorrectAPI(amount, return_value, returnPercentage, "Lucas Capelotto"); // Usar nome do portfólio
                          console.log('Investimento salvo na API com sucesso');
                          
                          // Sincronizar dados do usuário após investimento bem-sucedido
                          try {
                            console.log('Sincronizando dados do usuário após investimento...');
                            await syncUserDataWithAPI();
                            console.log('Dados do usuário sincronizados após investimento');
                          } catch (syncError) {
                            console.warn('Erro ao sincronizar dados do usuário após investimento:', syncError);
                          }
                          
                        } catch (apiError) {
                          console.warn('Erro ao salvar na API, mantendo dados locais:', apiError);
                          // Continuar com atualização local mesmo se a API falhar
                          setPortfolios(prev =>
                            prev.map(p =>
                              p.id === selectedPortfolio.id
                                ? {
                                    ...p,
                                    balance: newBalance, // Usar o novo saldo calculado pela API
                                    profit: p.profit + return_value,
                                    profitPercentage: returnPercentage,
                                    history: [
                                      ...p.history,
                                      {
                                        date: new Date().toLocaleDateString(),
                                        amount: amount,
                                        return: return_value,
                                        returnPercentage: returnPercentage
                                      }
                                    ]
                                  }
                                : p
                            )
                          );
                        }
                        
                        // Atualizar lista de trades
                        try {
                          await refreshTrades();
                        } catch (refreshError) {
                          console.warn('Erro ao atualizar lista de trades:', refreshError);
                          // Não bloquear o fluxo se falhar ao atualizar
                        }
                        
                        setInvestmentAmount('');
                        setErrorMessage('');
                        setShowInvestmentModal(false);
                        setSelectedPortfolio(null);
                        
                      } catch (error) {
                        console.error('Erro geral no investimento:', error);
                        setErrorMessage('Erro inesperado ao processar investimento');
                      }
                    }}
                    className="bg-[#49A1F2] text-white px-4 py-2 rounded hover:bg-[#3B82F6] disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={tradesLoading}
                  >
                    {tradesLoading ? 'Processando...' : 'Confirmar Investimento'}
                  </button>
                  <button
                    onClick={() => {
                      setInvestmentAmount('');
                      setErrorMessage('');
                      setShowInvestmentModal(false);
                      setSelectedPortfolio(null);
                    }}
                    className="bg-gray-300 text-gray-700 px-4 py-2 rounded hover:bg-gray-400"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8 items-start">
          {portfolios.map((portfolio, index) => {
            const portfolioImages = [
              "https://firebasestorage.googleapis.com/v0/b/dojoapp-3a64a.appspot.com/o/assets%2Fmilanex-removebg-preview.png?alt=media&token=890c3d1a-49be-4fc5-a348-d2d513da2eec",
              "https://firebasestorage.googleapis.com/v0/b/dojoapp-3a64a.appspot.com/o/assets%2Fmadrilex-removebg-preview.png?alt=media&token=bd704a88-cc89-4f5f-a418-304624390907",
              "https://firebasestorage.googleapis.com/v0/b/dojoapp-3a64a.appspot.com/o/assets%2Fbayernex-removebg-preview.png?alt=media&token=60aed412-5fd8-408d-ad96-13f4d550483d"
            ];
            
            // Calcular valores reais baseados no histórico
            const totalInvested = portfolio.history.reduce((total, investment) => total + investment.amount, 0);
            const totalProfit = portfolio.history.reduce((total, investment) => total + investment.return, 0);
            const profitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
            
            // Contar investimentos com lucro
            const profitableInvestments = portfolio.history.filter(investment => investment.return > 0).length;
            
            // Função para determinar a imagem baseada no número de investimentos com lucro
            const getPortfolioImage = () => {
              if (profitableInvestments === 0) {
                // Nenhum investimento com lucro
                return "https://firebasestorage.googleapis.com/v0/b/dojoapp-3a64a.appspot.com/o/animacao%20futebol%2Fpartida%20de%20futebol%201.gif?alt=media&token=b749698e-ee7a-46b6-9ef5-ad8d67d20d46";
              } else if (profitableInvestments === 1) {
                // 1 investimento com lucro
                return "https://firebasestorage.googleapis.com/v0/b/dojoapp-3a64a.appspot.com/o/animacao%20futebol%2Fpartida%20de%20futebol%202.gif?alt=media&token=b3ecbe01-a450-41e5-b5ab-89874414f40c";
              } else if (profitableInvestments === 2) {
                // 2 investimentos com lucro
                return "https://firebasestorage.googleapis.com/v0/b/dojoapp-3a64a.appspot.com/o/animacao%20futebol%2Fpartida%20de%20futebol%203.gif?alt=media&token=57c1e0e5-fc6a-4e71-bf64-837175e0077f";
              } else {
                // 3 ou mais investimentos com lucro
                return "https://firebasestorage.googleapis.com/v0/b/dojoapp-3a64a.appspot.com/o/animacao%20futebol%2Fpartida%20de%20futebol%20chutar%20pro%20gol.gif?alt=media&token=7f4e7261-9c50-4b93-bc77-046b9112f971";
              }
            };
            
            return (
              <div key={portfolio.id} className="bg-[#06284B] rounded-lg p-6 shadow-xl transition-all duration-300 flex flex-col">
              <div className="flex justify-center mb-4">
                <img 
                  src={portfolioImages[index]} 
                  alt={`${portfolio.name} Icon`} 
                  className="h-36 w-36 object-contain"
                />
              </div>
              <h3 className="text-xl font-bold mb-4 text-center">{portfolio.name}</h3>
              <div className="flex-1 flex flex-col">
                <div className="mb-4">
                  <p>Investido: {totalInvested.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p>
                  <div className={`flex items-center gap-2 ${totalProfit >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                    <span className="text-sm">
                      {totalProfit >= 0 ? '📈' : '📉'}
                    </span>
                    <span className="font-semibold">
                      {totalProfit >= 0 ? '+' : ''}{profitPercentage.toFixed(2)}% ({totalProfit >= 0 ? '+' : ''}{totalProfit.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })})
                    </span>
                    <span className="text-xs font-normal">
                      {totalProfit >= 0 ? '(Ganho)' : '(Perda)'}
                    </span>
                  </div>
                </div>
               
                <img 
                  src={getPortfolioImage()} 
                  alt={`${portfolio.name} Status`} 
                  className="w-full rounded-t-lg"
                />
                

                <div className="border-t border-gray-600 pt-4 flex-1 flex flex-col">
                  <button
                    onClick={() => setSelectedPortfolio(selectedPortfolio?.id === portfolio.id ? null : portfolio)}
                    className="w-full text-left text-base font-semibold mb-3 focus:outline-none flex items-center justify-between hover:text-[#49A1F2] transition-colors duration-200 p-2 rounded-md hover:bg-[#0A3A5C]"
                  >
                    <span className="flex items-center gap-2">
                      📊 Histórico de Investimentos
                    </span>
                    <span className={`transform transition-transform duration-300 text-[#49A1F2] ${selectedPortfolio?.id === portfolio.id ? 'rotate-180' : 'rotate-0'}`}>
                      ▼
                    </span>
                  </button>
                  <div className={`overflow-hidden transition-all duration-500 ease-in-out ${selectedPortfolio?.id === portfolio.id ? 'opacity-100' : 'opacity-0'}`}>
                    <div className={`overflow-y-auto space-y-3 pr-2 custom-scrollbar transition-all duration-500 ${selectedPortfolio?.id === portfolio.id ? 'max-h-[250px]' : 'max-h-0'}`}>
                      {portfolio.history.length === 0 ? (
                        <div className="text-center py-8">
                          <div className="text-4xl mb-2">📈</div>
                          <p className="text-gray-400 text-sm">Nenhum investimento realizado</p>
                          <p className="text-gray-500 text-xs mt-1">Comece investindo agora!</p>
                        </div>
                      ) : (
                        portfolio.history.map((investment, index) => (
                          <div key={index} className="bg-[#0A3A5C] rounded-lg p-3 border border-gray-700 hover:border-[#49A1F2] transition-colors duration-200">
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex items-center gap-2">
                                <span className="text-xs bg-[#49A1F2] text-white px-2 py-1 rounded-full font-medium">
                                  #{index + 1}
                                </span>
                                <span className="text-xs text-gray-400">📅 {investment.date}</span>
                              </div>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-gray-400 text-xs block">Valor Investido</span>
                                <span className="text-white font-semibold">{investment.amount.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</span>
                              </div>
                              <div>
                                <span className="text-gray-400 text-xs block">Retorno</span>
                                <div className={`font-semibold flex items-center gap-1 ${investment.return >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                                  <span>{investment.return >= 0 ? '📈' : '📉'}</span>
                                  <span>{investment.return >= 0 ? '+' : ''}{investment.returnPercentage.toFixed(2)}%</span>
                                  <span className="text-[10px] font-normal">
                                    {investment.return >= 0 ? '(Ganho)' : '(Perda)'}
                                  </span>
                                </div>
                                <div className={`text-xs ${investment.return >= 0 ? 'text-green-300' : 'text-red-300'}`}>
                                  {investment.return >= 0 ? '+' : ''}{investment.return.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                </div>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>
             
                <div className="mt-auto pt-4">
                  {portfolio.name === 'Milanex' ? (
                    <button
                      onClick={() => {
                        setSelectedPortfolio(portfolio);
                        setShowInvestmentModal(true);
                      }}
                      className="w-full bg-[#49A1F2] hover:bg-[#3B82F6] text-white font-bold py-2 px-4 rounded"
                      disabled={balance <= 0}
                    >
                      Investir
                    </button>
                  ) : (
                    <button
                      className="w-full bg-gray-500 text-gray-300 font-bold py-2 px-4 rounded cursor-not-allowed"
                      disabled={true}
                    >
                      Em Breve
                    </button>
                  )}
                </div>
              </div>
            </div>
          )})}
        </div>
        
        <p className="text-center text-gray-400 text-sm">
          © 2025 ForexBet. Todos os direitos reservados.
        </p>
      </div>
    </div>
  );
}
