export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD';

export type TransactionType = 'income' | 'expense' | 'transfer';

export type TransactionCategory =
  | 'Income'
  | 'Investment'
  | 'Housing'
  | 'Food & Dining'
  | 'Transport'
  | 'Entertainment'
  | 'Shopping'
  | 'Utilities'
  | 'Health'
  | 'Travel'
  | 'Subscriptions'
  | 'Other';

export interface Transaction {
  id: string;
  title: string;
  amount: number;
  currency: Currency;
  category: TransactionCategory;
  type: TransactionType;
  date: string;
  account: string;
  merchant?: string;
  notes?: string;
  tags?: string[];
}

export type AssetClass = 'Stocks' | 'Crypto' | 'Real Estate' | 'Cash' | 'Commodities' | 'Bonds';

export interface AssetHolding {
  id: string;
  name: string;
  symbol: string;
  assetClass: AssetClass;
  amount: number;
  averageBuyPrice: number;
  currentPrice: number;
  currency: Currency;
  allocationPercentage: number;
  dailyChangePercent: number;
}

export interface BudgetGoal {
  id: string;
  category: TransactionCategory;
  allocatedLimit: number;
  spentAmount: number;
  currency: Currency;
  period: 'monthly' | 'weekly' | 'yearly';
}

export interface NotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  read: boolean;
  type: 'alert' | 'success' | 'info' | 'warning';
}