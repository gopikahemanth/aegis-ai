import { useMemo } from 'react';
import { Transaction, AssetHolding, Currency } from '../types/finance';

const currencyRates: Record<Currency, number> = {
  USD: 1.0,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 155.0,
  CAD: 1.36
};

export function useFinancialMetrics(
  transactions: Transaction[], 
  holdings: AssetHolding[], 
  selectedCurrency: Currency
) {
  const rate = currencyRates[selectedCurrency] || 1.0;

  const metrics = useMemo(() => {
    // Total investments value in USD
    const totalInvestmentsUSD = holdings.reduce((acc, h) => acc + (h.amount * h.currentPrice), 0);
    
    // Income and expenses in USD
    const totalIncomeUSD = transactions
      .filter(t => t.type === 'income')
      .reduce((acc, t) => acc + t.amount, 0);

    const totalExpenseUSD = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, t) => acc + t.amount, 0);

    const netWorthUSD = totalInvestmentsUSD + (totalIncomeUSD - totalExpenseUSD);
    const monthlySavingsUSD = totalIncomeUSD - totalExpenseUSD;
    const savingsRate = totalIncomeUSD > 0 ? Math.max(0, (monthlySavingsUSD / totalIncomeUSD) * 100) : 0;

    return {
      netWorth: netWorthUSD * rate,
      totalIncome: totalIncomeUSD * rate,
      totalExpense: totalExpenseUSD * rate,
      monthlySavings: monthlySavingsUSD * rate,
      totalInvestments: totalInvestmentsUSD * rate,
      savingsRate: Number(savingsRate.toFixed(1)),
    };
  }, [transactions, holdings, rate]);

  return metrics;
}