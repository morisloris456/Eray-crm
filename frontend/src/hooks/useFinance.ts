import { useState, useCallback, useMemo } from 'react';
import { useData } from '../context/DataContext';
import { 
  FinancialMetrics, 
  ProjectFinancials, 
  Invoice, 
  Expense, 
  FinancialReport,
  BudgetAlert,
  FinancialForecast
} from '../types/finance';

export const useFinance = () => {
  const { projects, deals } = useData();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [reports, setReports] = useState<FinancialReport[]>([]);
  const [alerts, setAlerts] = useState<BudgetAlert[]>([]);

  // Calculer les métriques financières globales
  const financialMetrics = useMemo((): FinancialMetrics => {
    const wonDeals = deals.filter(d => d.stage === 'won');
    
    // Revenus
    const totalRevenue = wonDeals.reduce((sum, deal) => {
      return sum + parseInt(deal.amount.replace(/[^0-9]/g, '') || '0');
    }, 0);

    const monthlyRevenue = totalRevenue / 12; // Simplification
    const projectedRevenue = deals
      .filter(d => d.stage !== 'won' && d.stage !== 'lost')
      .reduce((sum, deal) => {
        const amount = parseInt(deal.amount.replace(/[^0-9]/g, '') || '0');
        const probability = (deal.probability || 50) / 100;
        return sum + (amount * probability);
      }, 0);

    // Coûts (estimation basée sur les projets)
    const totalCosts = projects.reduce((sum, project) => {
      const budget = parseInt(project.budget?.replace(/[^0-9]/g, '') || '0');
      const estimatedCost = budget * 0.7; // 70% du budget comme coût
      return sum + estimatedCost;
    }, 0);

    const monthlyCosts = totalCosts / 12;
    const perProjectCost = projects.length > 0 ? totalCosts / projects.length : 0;
    const hourlyCost = 50; // Taux horaire moyen (à configurer)

    // Rentabilité
    const grossProfit = totalRevenue - totalCosts;
    const netProfit = grossProfit * 0.85; // Après impôts et frais
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;
    const roi = totalCosts > 0 ? (grossProfit / totalCosts) * 100 : 0;

    // Cash flow
    const paidInvoices = invoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
    const pendingInvoices = invoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0);
    
    const cashInflow = paidInvoices;
    const cashOutflow = expenses.reduce((sum, e) => sum + e.amount, 0);
    const cashBalance = cashInflow - cashOutflow;
    const cashForecast = cashBalance + pendingInvoices * 0.8; // 80% de probabilité de paiement

    return {
      revenue: {
        total: totalRevenue,
        monthly: monthlyRevenue,
        projected: projectedRevenue,
        growth: 12.5 // Exemple
      },
      costs: {
        total: totalCosts,
        monthly: monthlyCosts,
        perProject: perProjectCost,
        hourly: hourlyCost
      },
      profitability: {
        gross: grossProfit,
        net: netProfit,
        margin: margin,
        roi: roi
      },
      cashFlow: {
        inflow: cashInflow,
        outflow: cashOutflow,
        balance: cashBalance,
        forecast: cashForecast
      }
    };
  }, [deals, projects, invoices, expenses]);

  // Calculer les finances par projet
  const projectFinancials = useMemo((): Record<string, ProjectFinancials> => {
    const financials: Record<string, ProjectFinancials> = {};

    projects.forEach(project => {
      const budget = parseInt(project.budget?.replace(/[^0-9]/g, '') || '0');
      const spent = budget * (project.progress || 0) / 100; // Estimation basée sur la progression
      const remaining = budget - spent;
      const variance = budget - spent;

      // Coûts détaillés
      const laborCost = spent * 0.6; // 60% pour la main d'œuvre
      const materialsCost = spent * 0.2; // 20% pour les matériaux
      const overheadCost = spent * 0.15; // 15% pour les frais généraux
      const externalCost = spent * 0.05; // 5% pour les services externes

      // Revenus du projet
      const projectInvoices = invoices.filter(i => i.projectId === project.id.toString());
      const billed = projectInvoices.reduce((sum, i) => sum + i.total, 0);
      const paid = projectInvoices.filter(i => i.status === 'paid').reduce((sum, i) => sum + i.total, 0);
      const pending = projectInvoices.filter(i => i.status === 'sent').reduce((sum, i) => sum + i.total, 0);

      // Rentabilité du projet
      const grossProfit = billed - spent;
      const netProfit = grossProfit * 0.85;
      const margin = billed > 0 ? (grossProfit / billed) * 100 : 0;
      const roi = spent > 0 ? (grossProfit / spent) * 100 : 0;

      // Suivi du temps
      const estimatedHours = 160; // Exemple
      const actualHours = estimatedHours * (project.progress || 0) / 100;
      const billableHours = actualHours * 0.9; // 90% billable
      const efficiency = estimatedHours > 0 ? (billableHours / estimatedHours) * 100 : 0;

      financials[project.id.toString()] = {
        projectId: project.id.toString(),
        budget: {
          allocated: budget,
          spent,
          remaining,
          variance
        },
        costs: {
          labor: laborCost,
          materials: materialsCost,
          overhead: overheadCost,
          external: externalCost
        },
        revenue: {
          billed,
          paid,
          pending,
          writeOff: 0
        },
        profitability: {
          grossProfit,
          netProfit,
          margin,
          roi
        },
        timeTracking: {
          estimatedHours,
          actualHours,
          billableHours,
          efficiency
        },
        invoices: projectInvoices,
        expenses: expenses.filter(e => e.projectId === project.id.toString())
      };
    });

    return financials;
  }, [projects, invoices, expenses]);

  // Créer une facture
  const createInvoice = useCallback((invoiceData: Omit<Invoice, 'id' | 'total'>) => {
    const total = invoiceData.items.reduce((sum, item) => sum + item.total, 0) + invoiceData.taxes;
    
    const newInvoice: Invoice = {
      ...invoiceData,
      id: `inv-${Date.now()}-${Math.random()}`,
      total
    };

    setInvoices(prev => [...prev, newInvoice]);
    return newInvoice;
  }, []);

  // Mettre à jour une facture
  const updateInvoice = useCallback((invoiceId: string, updates: Partial<Invoice>) => {
    setInvoices(prev => prev.map(invoice => 
      invoice.id === invoiceId ? { ...invoice, ...updates } : invoice
    ));
  }, []);

  // Supprimer une facture
  const deleteInvoice = useCallback((invoiceId: string) => {
    setInvoices(prev => prev.filter(invoice => invoice.id !== invoiceId));
  }, []);

  // Créer une dépense
  const createExpense = useCallback((expenseData: Omit<Expense, 'id'>) => {
    const newExpense: Expense = {
      ...expenseData,
      id: `exp-${Date.now()}-${Math.random()}`
    };

    setExpenses(prev => [...prev, newExpense]);
    return newExpense;
  }, []);

  // Approuver une dépense
  const approveExpense = useCallback((expenseId: string, approvedBy: string) => {
    setExpenses(prev => prev.map(expense => 
      expense.id === expenseId 
        ? { ...expense, status: 'approved', approvedBy }
        : expense
    ));
  }, []);

  // Générer des alertes budgétaires
  const generateBudgetAlerts = useCallback(() => {
    const newAlerts: BudgetAlert[] = [];

    Object.values(projectFinancials).forEach(financial => {
      const { budget, projectId } = financial;
      const usagePercentage = (budget.spent / budget.allocated) * 100;

      // Alerte si dépassement de budget
      if (usagePercentage > 100) {
        newAlerts.push({
          id: `alert-${projectId}-${Date.now()}`,
          projectId,
          type: 'over-budget',
          severity: 'critical',
          message: `Budget dépassé de ${usagePercentage - 100}%`,
          threshold: 100,
          currentValue: usagePercentage,
          createdAt: new Date().toISOString(),
          acknowledged: false
        });
      }
      // Alerte si approche de la limite
      else if (usagePercentage > 90) {
        newAlerts.push({
          id: `alert-${projectId}-${Date.now()}`,
          projectId,
          type: 'approaching-limit',
          severity: 'high',
          message: `Budget utilisé à ${usagePercentage}%`,
          threshold: 90,
          currentValue: usagePercentage,
          createdAt: new Date().toISOString(),
          acknowledged: false
        });
      }
    });

    setAlerts(prev => [...newAlerts, ...prev].slice(0, 50)); // Garder seulement les 50 dernières alertes
  }, [projectFinancials]);

  // Générer un rapport financier
  const generateReport = useCallback((type: FinancialReport['type'], period: FinancialReport['period']) => {
    const report: FinancialReport = {
      id: `report-${Date.now()}-${Math.random()}`,
      type,
      period,
      data: {
        revenue: financialMetrics.revenue.total,
        costs: financialMetrics.costs.total,
        profit: financialMetrics.profitability.gross,
        margin: financialMetrics.profitability.margin,
        breakdown: {
          labor: Object.values(projectFinancials).reduce((sum, p) => sum + p.costs.labor, 0),
          materials: Object.values(projectFinancials).reduce((sum, p) => sum + p.costs.materials, 0),
          overhead: Object.values(projectFinancials).reduce((sum, p) => sum + p.costs.overhead, 0),
          external: Object.values(projectFinancials).reduce((sum, p) => sum + p.costs.external, 0)
        }
      },
      generatedAt: new Date().toISOString(),
      generatedBy: 'current-user'
    };

    setReports(prev => [...prev, report]);
    return report;
  }, [financialMetrics, projectFinancials]);

  // Calculer les prévisions financières
  const generateForecast = useCallback((months: number = 3): FinancialForecast[] => {
    const forecasts: FinancialForecast[] = [];
    
    for (let i = 1; i <= months; i++) {
      const projectedRevenue = financialMetrics.revenue.monthly * (1 + financialMetrics.revenue.growth / 100) * i;
      const projectedCosts = financialMetrics.costs.monthly * 1.1 * i; // Légère augmentation des coûts
      const projectedProfit = projectedRevenue - projectedCosts;
      
      forecasts.push({
        period: `Month ${i}`,
        projectedRevenue,
        projectedCosts,
        projectedProfit,
        confidence: Math.max(0.7, 0.95 - (i * 0.1)), // Confiance diminue avec le temps
        factors: {
          marketCondition: 1.1,
          seasonalTrend: 1.0,
          projectPipeline: 1.2,
          historicalData: 0.9
        }
      });
    }

    return forecasts;
  }, [financialMetrics]);

  // Exporter les données financières
  const exportFinancialData = useCallback((format: 'csv' | 'json' | 'pdf') => {
    const data = {
      metrics: financialMetrics,
      projectFinancials,
      invoices,
      expenses,
      alerts,
      reports
    };

    switch (format) {
      case 'json':
        return JSON.stringify(data, null, 2);
      case 'csv':
        // Simplification - en réalité, utiliser une librairie CSV
        return `Revenue,Costs,Profit\n${financialMetrics.revenue.total},${financialMetrics.costs.total},${financialMetrics.profitability.gross}`;
      case 'pdf':
        // En réalité, utiliser une librairie PDF
        return 'PDF export not implemented';
      default:
        return data;
    }
  }, [financialMetrics, projectFinancials, invoices, expenses, alerts, reports]);

  // Générer automatiquement les alertes
  useMemo(() => {
    generateBudgetAlerts();
  }, [generateBudgetAlerts]);

  return {
    // État
    financialMetrics,
    projectFinancials,
    invoices,
    expenses,
    reports,
    alerts,
    
    // Actions
    createInvoice,
    updateInvoice,
    deleteInvoice,
    createExpense,
    approveExpense,
    generateReport,
    generateForecast,
    exportFinancialData,
    generateBudgetAlerts
  };
};
