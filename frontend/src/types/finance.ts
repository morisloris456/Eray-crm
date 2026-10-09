export interface FinancialMetrics {
  revenue: {
    total: number;
    monthly: number;
    projected: number;
    growth: number;
  };
  costs: {
    total: number;
    monthly: number;
    perProject: number;
    hourly: number;
  };
  profitability: {
    gross: number;
    net: number;
    margin: number;
    roi: number;
  };
  cashFlow: {
    inflow: number;
    outflow: number;
    balance: number;
    forecast: number;
  };
}

export interface ProjectFinancials {
  projectId: string;
  budget: {
    allocated: number;
    spent: number;
    remaining: number;
    variance: number;
  };
  costs: {
    labor: number;
    materials: number;
    overhead: number;
    external: number;
  };
  revenue: {
    billed: number;
    paid: number;
    pending: number;
    writeOff: number;
  };
  profitability: {
    grossProfit: number;
    netProfit: number;
    margin: number;
    roi: number;
  };
  timeTracking: {
    estimatedHours: number;
    actualHours: number;
    billableHours: number;
    efficiency: number;
  };
  invoices: Invoice[];
  expenses: Expense[];
}

export interface Invoice {
  id: string;
  number: string;
  projectId: string;
  clientId: string;
  amount: number;
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled';
  issueDate: string;
  dueDate: string;
  paidDate?: string;
  items: InvoiceItem[];
  taxes: number;
  total: number;
  notes?: string;
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
  category: 'labor' | 'materials' | 'services' | 'other';
}

export interface Expense {
  id: string;
  projectId: string;
  description: string;
  amount: number;
  category: 'labor' | 'materials' | 'software' | 'travel' | 'office' | 'other';
  date: string;
  receipt?: string;
  approvedBy?: string;
  status: 'pending' | 'approved' | 'rejected';
  reimbursable: boolean;
}

export interface FinancialReport {
  id: string;
  type: 'profit-loss' | 'cash-flow' | 'project-analysis' | 'client-analysis';
  period: {
    start: string;
    end: string;
    type: 'monthly' | 'quarterly' | 'yearly';
  };
  data: {
    revenue: number;
    costs: number;
    profit: number;
    margin: number;
    breakdown: Record<string, number>;
  };
  generatedAt: string;
  generatedBy: string;
}

export interface BudgetAlert {
  id: string;
  projectId: string;
  type: 'over-budget' | 'approaching-limit' | 'unusual-spending';
  severity: 'low' | 'medium' | 'high' | 'critical';
  message: string;
  threshold: number;
  currentValue: number;
  createdAt: string;
  acknowledged: boolean;
}

export interface FinancialForecast {
  period: string;
  projectedRevenue: number;
  projectedCosts: number;
  projectedProfit: number;
  confidence: number;
  factors: {
    marketCondition: number;
    seasonalTrend: number;
    projectPipeline: number;
    historicalData: number;
  };
}
