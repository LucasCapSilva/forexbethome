export interface Investment {
  id: number;
  portfolio: string;
  date: string;
  amount: number;
  returnValue: number;
  returnPercentage: number;
  createdAt: string;
}

export interface Portfolio {
  id: number;
  userId: number;
  name: string;
  balance: number;
  profit: number;
  profitPercentage: number;
  createdAt: string;
  investments: string[];
}

export interface CreateInvestmentRequest {
  portfolio: Portfolio;
  date: string;
  amount: number;
  returnValue: number;
  returnPercentage: number;
  createdAt: string;
}

export interface CreatePortfolioRequest {
  userId: number;
  name: string;
  balance: number;
  profit: number;
  profitPercentage: number;
}

export interface UpdatePortfolioRequest {
  balance?: number;
  profit?: number;
  profitPercentage?: number;
}