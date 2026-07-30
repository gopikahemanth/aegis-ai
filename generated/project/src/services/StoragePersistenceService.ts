import { Transaction, AssetHolding, BudgetGoal, NotificationItem, Currency } from '../types/finance';

const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-1',
    title: 'Monthly Salary Deposit',
    amount: 8500.00,
    currency: 'USD',
    category: 'Income',
    type: 'income',
    date: '2025-05-01',
    account: 'Primary Checking (Chase)',
    merchant: 'Tech Corp Global',
    notes: 'Base monthly payroll direct deposit',
    tags: ['salary', 'income']
  },
  {
    id: 'tx-2',
    title: 'Vanguard Index Fund Buy',
    amount: 1500.00,
    currency: 'USD',
    category: 'Investment',
    type: 'expense',
    date: '2025-05-02',
    account: 'Vanguard Brokerage',
    merchant: 'Vanguard',
    notes: 'VTI & VXUS automatic portfolio contribution',
    tags: ['investment', 'stocks']
  },
  {
    id: 'tx-3',
    title: 'Luxury Apartment Rent',
    amount: 2800.00,
    currency: 'USD',
    category: 'Housing',
    type: 'expense',
    date: '2025-05-03',
    account: 'Primary Checking (Chase)',
    merchant: 'Skyline Residential',
    notes: 'May rent payment',
    tags: ['housing', 'rent']
  },
  {
    id: 'tx-4',
    title: 'Whole Foods Market',
    amount: 215.50,
    currency: 'USD',
    category: 'Food & Dining',
    type: 'expense',
    date: '2025-05-04',
    account: 'Amex Gold Card',
    merchant: 'Whole Foods',
    notes: 'Weekly organic groceries & supplies',
    tags: ['food', 'groceries']
  },
  {
    id: 'tx-5',
    title: 'Tesla Supercharging',
    amount: 42.00,
    currency: 'USD',
    category: 'Transport',
    type: 'expense',
    date: '2025-05-05',
    account: 'Apple Card',
    merchant: 'Tesla Supercharger',
    notes: 'Fast charge on highway 101',
    tags: ['transport', ' EV']
  },
  {
    id: 'tx-6',
    title: 'Stripe Consulting Retainer',
    amount: 3200.00,
    currency: 'USD',
    category: 'Income',
    type: 'income',
    date: '2025-05-06',
    account: 'Primary Checking (Chase)',
    merchant: 'Stripe Inc',
    notes: 'Frontend Architecture Advisory',
    tags: ['freelance', 'consulting']
  },
  {
    id: 'tx-7',
    title: 'Equinox Elite Membership',
    amount: 310.00,
    currency: 'USD',
    category: 'Health',
    type: 'expense',
    date: '2025-05-07',
    account: 'Amex Gold Card',
    merchant: 'Equinox',
    notes: 'Monthly club access',
    tags: ['health', 'fitness']
  },
  {
    id: 'tx-8',
    title: 'Nobu Fine Dining',
    amount: 480.00,
    currency: 'USD',
    category: 'Food & Dining',
    type: 'expense',
    date: '2025-05-08',
    account: 'Amex Gold Card',
    merchant: 'Nobu Restaurant',
    notes: 'Client celebration dinner',
    tags: ['dining', 'entertainment']
  }
];

const INITIAL_HOLDINGS: AssetHolding[] = [
  {
    id: 'h-1',
    name: 'Apple Inc.',
    symbol: 'AAPL',
    assetClass: 'Stocks',
    amount: 150,
    averageBuyPrice: 165.50,
    currentPrice: 189.20,
    currency: 'USD',
    allocationPercentage: 35.4,
    dailyChangePercent: 1.85,
  },
  {
    id: 'h-2',
    name: 'NVIDIA Corporation',
    symbol: 'NVDA',
    assetClass: 'Stocks',
    amount: 80,
    averageBuyPrice: 420.00,
    currentPrice: 885.50,
    currency: 'USD',
    allocationPercentage: 42.1,
    dailyChangePercent: 3.42,
  },
  {
    id: 'h-3',
    name: 'Ethereum',
    symbol: 'ETH',
    assetClass: 'Crypto',
    amount: 3.5,
    averageBuyPrice: 2400.00,
    currentPrice: 3120.00,
    currency: 'USD',
    allocationPercentage: 12.8,
    dailyChangePercent: -0.92,
  },
  {
    id: 'h-4',
    name: 'Vanguard S&P 500 ETF',
    symbol: 'VOO',
    assetClass: 'Stocks',
    amount: 25,
    averageBuyPrice: 430.00,
    currentPrice: 495.00,
    currency: 'USD',
    allocationPercentage: 9.7,
    dailyChangePercent: 0.64,
  }
];

const INITIAL_BUDGETS: BudgetGoal[] = [
  { id: 'b-1', category: 'Food & Dining', allocatedLimit: 800, spentAmount: 695.50, currency: 'USD', period: 'monthly' },
  { id: 'b-2', category: 'Housing', allocatedLimit: 3000, spentAmount: 2800.00, currency: 'USD', period: 'monthly' },
  { id: 'b-3', category: 'Transport', allocatedLimit: 400, spentAmount: 242.00, currency: 'USD', period: 'monthly' },
  { id: 'b-4', category: 'Entertainment', allocatedLimit: 500, spentAmount: 480.00, currency: 'USD', period: 'monthly' },
  { id: 'b-5', category: 'Shopping', allocatedLimit: 600, spentAmount: 410.00, currency: 'USD', period: 'monthly' },
  { id: 'b-6', category: 'Health', allocatedLimit: 400, spentAmount: 310.00, currency: 'USD', period: 'monthly' },
];

const INITIAL_NOTIFICATIONS: NotificationItem[] = [
  {
    id: 'n-1',
    title: 'Unusual Market Activity',
    message: 'NVIDIA (NVDA) surged +3.42% in today s trading session.',
    timestamp: '10 mins ago',
    read: false,
    type: 'success'
  },
  {
    id: 'n-2',
    title: 'Budget Alert',
    message: 'You have spent 87% of your Food & Dining budget for May.',
    timestamp: '2 hours ago',
    read: false,
    type: 'warning'
  },
  {
    id: 'n-3',
    title: 'Salary Deposited',
    message: '$8,500.00 direct deposit received from Tech Corp Global.',
    timestamp: 'May 1',
    read: true,
    type: 'success'
  }
];

export const StoragePersistenceService = {
  getTransactions(): Transaction[] {
    const data = localStorage.getItem('ae_transactions');
    return data ? JSON.parse(data) : INITIAL_TRANSACTIONS;
  },
  saveTransactions(txs: Transaction[]) {
    localStorage.setItem('ae_transactions', JSON.stringify(txs));
  },
  getHoldings(): AssetHolding[] {
    const data = localStorage.getItem('ae_holdings');
    return data ? JSON.parse(data) : INITIAL_HOLDINGS;
  },
  saveHoldings(holdings: AssetHolding[]) {
    localStorage.setItem('ae_holdings', JSON.stringify(holdings));
  },
  getBudgets(): BudgetGoal[] {
    const data = localStorage.getItem('ae_budgets');
    return data ? JSON.parse(data) : INITIAL_BUDGETS;
  },
  saveBudgets(budgets: BudgetGoal[]) {
    localStorage.setItem('ae_budgets', JSON.stringify(budgets));
  },
  getNotifications(): NotificationItem[] {
    const data = localStorage.getItem('ae_notifications');
    return data ? JSON.parse(data) : INITIAL_NOTIFICATIONS;
  },
  saveNotifications(notifs: NotificationItem[]) {
    localStorage.setItem('ae_notifications', JSON.stringify(notifs));
  },
  getCurrency(): Currency {
    return (localStorage.getItem('ae_currency') as Currency) || 'USD';
  },
  saveCurrency(curr: Currency) {
    localStorage.setItem('ae_currency', curr);
  },
  getRiskTolerance(): 'Conservative' | 'Balanced' | 'Aggressive' {
    return (localStorage.getItem('ae_risk') as any) || 'Balanced';
  },
  saveRiskTolerance(risk: 'Conservative' | 'Balanced' | 'Aggressive') {
    localStorage.setItem('ae_risk', risk);
  }
};