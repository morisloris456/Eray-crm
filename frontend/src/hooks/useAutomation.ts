import { useState, useCallback, useEffect } from 'react';
import { useData } from '../context/DataContext';
import { 
  AutomationRule, 
  AutomationExecution,
  AutomationInsight,
  AutomationTemplate
} from '../types/automation';

// Templates d'automatisation prédéfinis
const AUTOMATION_TEMPLATES: AutomationTemplate[] = [
  {
    id: 'follow-up-inactive-clients',
    name: 'Suivi des clients inactifs',
    description: 'Envoyer un email de suivi automatique aux clients inactifs depuis 30 jours',
    category: 'client_care',
    trigger: 'new_client_inactive',
    conditions: [
      { field: 'daysInactive', operator: 'greater_than', value: 30 }
    ],
    actions: [
      { 
        type: 'send_email', 
        config: { 
          template: 'follow-up-inactive',
          delay: 0 
        } 
      },
      { 
        type: 'create_task', 
        config: { 
          title: 'Contacter client inactif',
          priority: 'medium',
          assignTo: 'sales-team'
        } 
      }
    ],
    isPopular: true
  },
  {
    id: 'project-deadline-warning',
    name: 'Alerte échéance projet',
    description: 'Notifier l\'équipe 7 jours avant la fin d\'un projet',
    category: 'project_management',
    trigger: 'date_approaching',
    conditions: [
      { field: 'daysUntilDeadline', operator: 'less_than', value: 7 },
      { field: 'projectStatus', operator: 'equals', value: 'en_cours' }
    ],
    actions: [
      { 
        type: 'notify_team', 
        config: { 
          message: 'Le projet {projectName} arrive à échéance dans 7 jours',
          channels: ['email', 'notification']
        } 
      },
      { 
        type: 'create_reminder', 
        config: { 
          title: 'Échéance projet',
          date: 'deadline-3-days'
        } 
      }
    ],
    isPopular: true
  },
  {
    id: 'deal-stalled-alert',
    name: 'Alerte deal bloqué',
    description: 'Détecter les deals qui n\'ont pas bougé depuis 14 jours',
    category: 'sales',
    trigger: 'low_activity',
    conditions: [
      { field: 'daysSinceLastUpdate', operator: 'greater_than', value: 14 },
      { field: 'stage', operator: 'in', value: ['contacted', 'proposal', 'negotiation'] }
    ],
    actions: [
      { 
        type: 'escalate_issue', 
        config: { 
          escalateTo: 'sales-manager',
          reason: 'Deal inactif depuis plus de 14 jours'
        } 
      },
      { 
        type: 'create_task', 
        config: { 
          title: 'Relancer deal {dealTitle}',
          priority: 'high',
          assignTo: 'deal-owner'
        } 
      }
    ],
    isPopular: false
  },
  {
    id: 'budget-exceeded-warning',
    name: 'Alerte budget dépassé',
    description: 'Alerter quand un projet dépasse 90% de son budget',
    category: 'project_management',
    trigger: 'budget_exceeded',
    conditions: [
      { field: 'budgetUsage', operator: 'greater_than', value: 90 }
    ],
    actions: [
      { 
        type: 'notify_team', 
        config: { 
          message: 'Attention : Le projet {projectName} a dépassé 90% du budget',
          channels: ['email'],
          recipients: ['project-manager', 'finance-team']
        } 
      },
      { 
        type: 'update_status', 
        config: { 
          status: 'budget-warning',
          addNote: 'Budget dépassé - nécessite une attention particulière'
        } 
      }
    ],
    isPopular: true
  }
];

export const useAutomation = () => {
  const { clients, deals, projects } = useData();
  const [rules, setRules] = useState<AutomationRule[]>([]);
  const [executions, setExecutions] = useState<AutomationExecution[]>([]);
  const [insights, setInsights] = useState<AutomationInsight[]>([]);
  
  // Analyser les données pour générer des insights
  const generateInsights = useCallback(() => {
    const newInsights: AutomationInsight[] = [];
    const now = new Date();

    // Analyser les clients inactifs
    clients.forEach(client => {
      const lastActivity = new Date(client.createdAt);
      const daysInactive = Math.floor((now.getTime() - lastActivity.getTime()) / (1000 * 60 * 60 * 24));
      
      if (daysInactive > 30 && client.status === 'Actif') {
        newInsights.push({
          type: 'warning',
          title: 'Client inactif détecté',
          description: `${client.name} n'a pas eu d'activité depuis ${daysInactive} jours`,
          entityId: client.id.toString(),
          entityType: 'client',
          suggestedActions: [
            { 
              type: 'send_email', 
              config: { 
                template: 'follow-up-inactive',
                clientName: client.name
              } 
            }
          ],
          priority: daysInactive > 60 ? 'high' : 'medium'
        });
      }
    });

    // Analyser les projets avec échéances proches
    projects.forEach(project => {
      if (project.status === 'en_cours' && project.endDate) {
        const endDate = new Date(project.endDate);
        const daysUntilDeadline = Math.floor((endDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysUntilDeadline <= 7 && daysUntilDeadline >= 0) {
          newInsights.push({
            type: 'warning',
            title: 'Échéance projet imminente',
            description: `Le projet ${project.title} se termine dans ${daysUntilDeadline} jours`,
            entityId: project.id.toString(),
            entityType: 'project',
            suggestedActions: [
              { 
                type: 'notify_team', 
                config: { 
                  message: `Échéance projet : ${project.title}`,
                  projectId: project.id
                } 
              }
            ],
            priority: daysUntilDeadline <= 3 ? 'critical' : 'high'
          });
        }
      }

      // Analyser l'utilisation du budget
      if (project.budget && project.progress) {
        const budgetUsage = project.progress;
        if (budgetUsage > 90) {
          newInsights.push({
            type: 'error',
            title: 'Budget projet dépassé',
            description: `Le projet ${project.title} a utilisé ${budgetUsage}% de son budget`,
            entityId: project.id.toString(),
            entityType: 'project',
            suggestedActions: [
              { 
                type: 'notify_team', 
                config: { 
                  message: `Alerte budget : ${project.title}`,
                  recipients: ['finance-team']
                } 
              }
            ],
            priority: 'critical'
          });
        }
      }
    });

    // Analyser les deals bloqués
    deals.forEach(deal => {
      if (deal.stage !== 'won' && deal.stage !== 'lost') {
        const lastUpdate = new Date(deal.createdAt);
        const daysSinceUpdate = Math.floor((now.getTime() - lastUpdate.getTime()) / (1000 * 60 * 60 * 24));
        
        if (daysSinceUpdate > 14) {
          newInsights.push({
            type: 'info',
            title: 'Deal inactif',
            description: `Le deal ${deal.title} n'a pas évolué depuis ${daysSinceUpdate} jours`,
            entityId: deal.id.toString(),
            entityType: 'deal',
            suggestedActions: [
              { 
                type: 'create_task', 
                config: { 
                  title: `Relancer deal : ${deal.title}`,
                  priority: 'medium'
                } 
              }
            ],
            priority: 'medium'
          });
        }
      }
    });

    setInsights(newInsights);
  }, [clients, deals, projects]);

  // Exécuter les règles d'automatisation
  const executeRules = useCallback(() => {
    const newExecutions: AutomationExecution[] = [];

    rules.filter(rule => rule.isActive).forEach(rule => {
      try {
        const execution: AutomationExecution = {
          id: `exec-${Date.now()}-${Math.random()}`,
          ruleId: rule.id,
          triggerData: {},
          executedAt: new Date().toISOString(),
          status: 'success',
          actions: []
        };

        // Simuler l'exécution des actions
        rule.actions.forEach(action => {
          execution.actions.push({
            type: action,
            status: 'success',
            result: `Action ${action} exécutée avec succès`
          });
        });

        newExecutions.push(execution);
      } catch (error) {
        console.error(`Erreur lors de l'exécution de la règle ${rule.id}:`, error);
      }
    });

    setExecutions(prev => [...newExecutions, ...prev].slice(0, 100)); // Garder seulement les 100 dernières exécutions
  }, [rules]);

  // Créer une nouvelle règle
  const createRule = useCallback((ruleData: Omit<AutomationRule, 'id' | 'createdAt' | 'triggerCount'>) => {
    const newRule: AutomationRule = {
      ...ruleData,
      id: `rule-${Date.now()}-${Math.random()}`,
      createdAt: new Date().toISOString(),
      triggerCount: 0
    };

    setRules(prev => [...prev, newRule]);
    return newRule;
  }, []);

  // Mettre à jour une règle
  const updateRule = useCallback((ruleId: string, updates: Partial<AutomationRule>) => {
    setRules(prev => prev.map(rule => 
      rule.id === ruleId ? { ...rule, ...updates } : rule
    ));
  }, []);

  // Supprimer une règle
  const deleteRule = useCallback((ruleId: string) => {
    setRules(prev => prev.filter(rule => rule.id !== ruleId));
  }, []);

  // Activer/désactiver une règle
  const toggleRule = useCallback((ruleId: string) => {
    updateRule(ruleId, { isActive: !rules.find(r => r.id === ruleId)?.isActive });
  }, [rules, updateRule]);

  // Exécuter manuellement une règle
  const executeRule = useCallback((ruleId: string) => {
    const rule = rules.find(r => r.id === ruleId);
    if (!rule) return;

    const execution: AutomationExecution = {
      id: `manual-${Date.now()}-${Math.random()}`,
      ruleId,
      triggerData: { manual: true },
      executedAt: new Date().toISOString(),
      status: 'success',
      actions: rule.actions.map(action => ({
        type: action,
        status: 'success' as const,
        result: `Action ${action} exécutée manuellement`
      }))
    };

    setExecutions(prev => [execution, ...prev]);
    updateRule(ruleId, { 
      lastTriggered: execution.executedAt, 
      triggerCount: rule.triggerCount + 1 
    });
  }, [rules, updateRule]);

  // Créer une règle à partir d'un template
  const createFromTemplate = useCallback((templateId: string, customizations?: Partial<AutomationRule>) => {
    const template = AUTOMATION_TEMPLATES.find(t => t.id === templateId);
    if (!template) return null;

    return createRule({
      name: template.name,
      description: template.description,
      trigger: template.trigger,
      conditions: template.conditions,
      actions: template.actions.map(a => a.type),
      isActive: true,
      ...customizations
    });
  }, [createRule]);

  // Effacer l'historique d'exécution
  const clearExecutionHistory = useCallback(() => {
    setExecutions([]);
  }, []);

  // Générer les insights automatiquement
  useEffect(() => {
    generateInsights();
  }, [generateInsights]);

  // Exécuter les règles automatiquement (simulation)
  useEffect(() => {
    const interval = setInterval(() => {
      executeRules();
    }, 60000); // Toutes les minutes

    return () => clearInterval(interval);
  }, [executeRules]);

  return {
    // État
    rules,
    executions,
    insights,
    templates: AUTOMATION_TEMPLATES,
    
    // Actions
    createRule,
    updateRule,
    deleteRule,
    toggleRule,
    executeRule,
    executeRules,
    createFromTemplate,
    clearExecutionHistory,
    generateInsights
  };
};
