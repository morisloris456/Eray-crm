export interface AutomationRule {
  id: string;
  name: string;
  description: string;
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationAction[];
  isActive: boolean;
  createdAt: string;
  lastTriggered?: string;
  triggerCount: number;
}

export type AutomationTrigger = 
  | 'project_status_change'
  | 'deal_stage_change' 
  | 'client_created'
  | 'date_approaching'
  | 'deadline_passed'
  | 'budget_exceeded'
  | 'low_activity'
  | 'new_client_inactive';

export interface AutomationCondition {
  field: string;
  operator: 'equals' | 'not_equals' | 'greater_than' | 'less_than' | 'contains' | 'in' | 'not_in';
  value: any;
  logicalOperator?: 'and' | 'or';
}

export type AutomationAction = 
  | 'send_email'
  | 'create_task'
  | 'notify_team'
  | 'update_status'
  | 'assign_project'
  | 'create_reminder'
  | 'escalate_issue'
  | 'generate_report';

export interface AutomationActionConfig {
  type: AutomationAction;
  config: Record<string, any>;
}

export interface AutomationExecution {
  id: string;
  ruleId: string;
  triggerData: any;
  executedAt: string;
  status: 'success' | 'failed' | 'pending';
  actions: {
    type: AutomationAction;
    status: 'success' | 'failed';
    result?: any;
    error?: string;
  }[];
}

export interface AutomationTemplate {
  id: string;
  name: string;
  description: string;
  category: 'productivity' | 'sales' | 'project_management' | 'client_care';
  trigger: AutomationTrigger;
  conditions: AutomationCondition[];
  actions: AutomationActionConfig[];
  isPopular: boolean;
}

export interface AutomationInsight {
  type: 'warning' | 'info' | 'success' | 'error';
  title: string;
  description: string;
  entityId: string;
  entityType: 'client' | 'deal' | 'project';
  suggestedActions: AutomationActionConfig[];
  priority: 'low' | 'medium' | 'high' | 'critical';
}
