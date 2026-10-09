import { useState } from 'react';
import { Activity, Plus, Users, Target, Briefcase, Download, Calendar, FileText, Settings } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface QuickActionsWidgetProps {
  isMinimized?: boolean;
  config?: any;
  onEdit?: () => void;
}

const QuickActionsWidget = ({ 
  isMinimized = false
}: QuickActionsWidgetProps) => {
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAction, setNewAction] = useState({
    title: '',
    icon: 'file',
    url: '',
    color: 'blue'
  });

  // Actions rapides par défaut
  const defaultActions = [
    {
      id: 'new-client',
      title: 'Nouveau Client',
      description: 'Ajouter un client',
      icon: Users,
      color: 'blue',
      url: '/clients'
    },
    {
      id: 'new-deal',
      title: 'Nouveau Deal',
      description: 'Créer une opportunité',
      icon: Target,
      color: 'purple',
      url: '/pipeline'
    },
    {
      id: 'new-project',
      title: 'Nouveau Projet',
      description: 'Démarrer un projet',
      icon: Briefcase,
      color: 'green',
      url: '/projects'
    },
    {
      id: 'export-data',
      title: 'Exporter Données',
      description: 'Télécharger le rapport',
      icon: Download,
      color: 'orange',
      url: '#export'
    }
  ];

  const [customActions, setCustomActions] = useState<any[]>([]);

  const iconOptions = [
    { value: 'users', label: 'Utilisateurs', icon: Users },
    { value: 'target', label: 'Cible', icon: Target },
    { value: 'briefcase', label: 'Projet', icon: Briefcase },
    { value: 'download', label: 'Télécharger', icon: Download },
    { value: 'calendar', label: 'Calendrier', icon: Calendar },
    { value: 'file', label: 'Document', icon: FileText },
    { value: 'settings', label: 'Paramètres', icon: Settings }
  ];

  const colorOptions = [
    { value: 'blue', label: 'Bleu', class: 'bg-blue-100 text-blue-600 hover:bg-blue-200' },
    { value: 'purple', label: 'Violet', class: 'bg-purple-100 text-purple-600 hover:bg-purple-200' },
    { value: 'green', label: 'Vert', class: 'bg-green-100 text-green-600 hover:bg-green-200' },
    { value: 'orange', label: 'Orange', class: 'bg-orange-100 text-orange-600 hover:bg-orange-200' },
    { value: 'red', label: 'Rouge', class: 'bg-red-100 text-red-600 hover:bg-red-200' }
  ];

  const handleActionClick = (action: any) => {
    if (action.url === '#export') {
      // Exporter les données
      const exportData = {
        exportDate: new Date().toISOString(),
        type: 'dashboard-export'
      };
      const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `dashboard-export-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      navigate(action.url);
    }
  };

  const handleAddAction = () => {
    if (newAction.title && newAction.url) {
      const iconData = iconOptions.find(opt => opt.value === newAction.icon);
            
      const action = {
        id: Date.now().toString(),
        title: newAction.title,
        description: 'Action personnalisée',
        icon: iconData?.icon || FileText,
        color: newAction.color,
        url: newAction.url
      };
      
      setCustomActions([...customActions, action]);
      setShowAddForm(false);
      setNewAction({ title: '', icon: 'file', url: '', color: 'blue' });
    }
  };

  const handleRemoveAction = (actionId: string) => {
    setCustomActions(customActions.filter(action => action.id !== actionId));
  };

  const allActions = [...defaultActions, ...customActions];

  if (isMinimized) {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          <span className="font-medium text-gray-800">Actions</span>
        </div>
        <span className="text-sm text-gray-600">{allActions.length} disponibles</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-purple-500" />
          <h3 className="font-bold text-gray-800">Actions Rapides</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 rounded-lg bg-green-50 text-green-600 hover:bg-green-100 transition-colors"
          title="Ajouter une action"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Formulaire d'ajout d'action personnalisée */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-green-50 rounded-xl border border-green-200">
          <h4 className="text-sm font-medium text-green-800 mb-2">Nouvelle Action</h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Titre de l'action"
              value={newAction.title}
              onChange={(e) => setNewAction({...newAction, title: e.target.value})}
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="URL ou chemin (ex: /clients)"
              value={newAction.url}
              onChange={(e) => setNewAction({...newAction, url: e.target.value})}
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={newAction.icon}
              onChange={(e) => setNewAction({...newAction, icon: e.target.value})}
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm"
            >
              {iconOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <select
              value={newAction.color}
              onChange={(e) => setNewAction({...newAction, color: e.target.value})}
              className="w-full rounded-lg border border-green-200 bg-white px-3 py-2 text-sm"
            >
              {colorOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddAction}
                className="flex-1 rounded-lg bg-green-600 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                Ajouter
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-green-200 bg-white py-2 text-sm font-medium text-green-600 hover:bg-green-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Liste des actions */}
      <div className="space-y-2">
        {allActions.map((action) => {
          const colorData = colorOptions.find(opt => opt.value === action.color);
          const IconComponent = action.icon;
          const isCustom = customActions.some(ca => ca.id === action.id);
          
          return (
            <button
              key={action.id}
              onClick={() => handleActionClick(action)}
              className="w-full flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-3 text-left hover:border-gray-300 hover:bg-gray-50 transition-all group"
            >
              <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${colorData?.class || 'bg-gray-100 text-gray-600'}`}>
                <IconComponent className="h-5 w-5" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-gray-800">{action.title}</p>
                <p className="text-xs text-gray-500">{action.description}</p>
              </div>
              {isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRemoveAction(action.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-all"
                >
                  <Plus className="h-3 w-3 rotate-45" />
                </button>
              )}
            </button>
          );
        })}
      </div>

      {allActions.length === 0 && (
        <div className="text-center py-8 text-gray-400">
          <Activity className="h-8 w-8 mx-auto mb-2 text-gray-300" />
          <p className="text-sm">Aucune action rapide</p>
          <button
            onClick={() => setShowAddForm(true)}
            className="mt-2 text-sm text-green-600 hover:text-green-700"
          >
            Ajouter une action
          </button>
        </div>
      )}
    </div>
  );
};

export default QuickActionsWidget;
