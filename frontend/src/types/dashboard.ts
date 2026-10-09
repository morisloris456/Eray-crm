export interface WidgetPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface WidgetConfig {
  id: string;
  type: WidgetType;
  title: string;
  position: WidgetPosition;
  isVisible: boolean;
  isMinimized: boolean;
  config: Record<string, any>;
  refreshInterval?: number; // en secondes
}

export type WidgetType = 
  | 'kpi-cards'
  | 'revenue-chart'
  | 'pipeline-chart'
  | 'sales-pipeline'
  | 'recent-clients'
  | 'recent-deals'
  | 'upcoming-deadlines'
  | 'team-performance'
  | 'quick-actions'
  | 'calendar-widget'
  | 'activity-feed';

export interface DashboardLayout {
  id: string;
  name: string;
  widgets: WidgetConfig[];
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface KPICard {
  title: string;
  value: string | number;
  icon: string;
  color: string;
  trend?: {
    value: string;
    positive: boolean;
  };
  onClick?: () => void;
}

export interface ChartData {
  labels: string[];
  datasets: {
    label: string;
    data: number[];
    color: string;
  }[];
}

export interface ActivityItem {
  id: string;
  type: 'client' | 'deal' | 'project' | 'event';
  action: string;
  description: string;
  timestamp: string;
  user?: string;
}
