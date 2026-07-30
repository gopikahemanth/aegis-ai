import React, { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { SidebarNavigation } from './components/SidebarNavigation';
import { TopbarHeader } from './components/TopbarHeader';
import { AddTransactionModal } from './components/AddTransactionModal';
import { DashboardOverview } from './pages/DashboardOverview';
import { PortfolioManagement } from './pages/PortfolioManagement';
import { AnalyticsAndReports } from './pages/AnalyticsAndReports';
import { TransactionHistory } from './pages/TransactionHistory';
import { AssetAllocation } from './pages/AssetAllocation';
import { RiskAssessment } from './pages/RiskAssessment';
import { SettingsAndPreferences } from './pages/SettingsAndPreferences';
import { StoragePersistenceService } from './services/StoragePersistenceService';
import { Transaction, AssetHolding, Currency } from './types/finance';

export function App() {
  const [currency, setCurrency] = useState<Currency>(StoragePersistenceService.getCurrency());
  const [transactions, setTransactions] = useState<Transaction[]>(StoragePersistenceService.getTransactions());
  const [holdings, setHoldings] = useState<AssetHolding[]>(StoragePersistenceService.getHoldings());
  const [riskTolerance, setRiskTolerance] = useState<'Conservative' | 'Balanced' | 'Aggressive'>(StoragePersistenceService.getRiskTolerance());
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const handleCurrencyChange = (newCurrency: Currency) => {
    setCurrency(newCurrency);
    StoragePersistenceService.saveCurrency(newCurrency);
  };

  const handleAddTransaction = (newTx: Transaction) => {
    const updated = [newTx, ...transactions];
    setTransactions(updated);
    StoragePersistenceService.saveTransactions(updated);
  };

  const handleDeleteTransaction = (id: string) => {
    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    StoragePersistenceService.saveTransactions(updated);
  };

  const handleUpdateHoldings = (updatedHoldings: AssetHolding[]) => {
    setHoldings(updatedHoldings);
    StoragePersistenceService.saveHoldings(updatedHoldings);
  };

  const handleUpdateRisk = (risk: 'Conservative' | 'Balanced' | 'Aggressive') => {
    setRiskTolerance(risk);
    StoragePersistenceService.saveRiskTolerance(risk);
  };

  return (
    <BrowserRouter>
      <div className="flex min-h-screen bg-slate-950 text-slate-100 font-sans antialiased">
        <SidebarNavigation />

        <div className="flex-1 flex flex-col min-w-0">
          <TopbarHeader
            currentCurrency={currency}
            onCurrencyChange={handleCurrencyChange}
            onOpenAddModal={() => setIsAddModalOpen(true)}
          />

          <main className="flex-1 overflow-y-auto">
            <Routes>
              <Route
                path="/"
                element={
                  <DashboardOverview
                    transactions={transactions}
                    holdings={holdings}
                    currency={currency}
                    riskTolerance={riskTolerance}
                  />
                }
              />
              <Route
                path="/portfolio"
                element={
                  <PortfolioManagement
                    holdings={holdings}
                    onUpdateHoldings={handleUpdateHoldings}
                    currency={currency}
                  />
                }
              />
              <Route
                path="/analytics"
                element={
                  <AnalyticsAndReports
                    transactions={transactions}
                    holdings={holdings}
                    currency={currency}
                  />
                }
              />
              <Route
                path="/transactions"
                element={
                  <TransactionHistory
                    transactions={transactions}
                    onAddTransaction={handleAddTransaction}
                    onDeleteTransaction={handleDeleteTransaction}
                    currency={currency}
                  />
                }
              />
              <Route
                path="/allocation"
                element={
                  <AssetAllocation
                    holdings={holdings}
                    currency={currency}
                  />
                }
              />
              <Route
                path="/risk"
                element={
                  <RiskAssessment
                    currentRisk={riskTolerance}
                    onUpdateRisk={handleUpdateRisk}
                  />
                }
              />
              <Route
                path="/settings"
                element={
                  <SettingsAndPreferences
                    currency={currency}
                    onCurrencyChange={handleCurrencyChange}
                  />
                }
              />
            </Routes>
          </main>
        </div>

        <AddTransactionModal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          onAddTransaction={handleAddTransaction}
          defaultCurrency={currency}
        />
      </div>
    </BrowserRouter>
  );
}

export default App;