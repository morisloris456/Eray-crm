import { useState } from 'react';
import { WidgetConfig } from '../types/dashboard';
import { useDashboardWidgets } from '../hooks/useDashboardWidgets';
import { useKeyboardShortcuts, getCRMShortcuts } from '../hooks/useKeyboardShortcuts';
import { useNavigate } from 'react-router-dom';
import KPICardsWidget from './widgets/KPICardsWidget';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import RecentClientsWidget from './widgets/RecentClientsWidget';
import UniversalSearch from './UniversalSearch';
import { Settings, Plus, Save, RotateCcw, Grid3X3 } from 'lucide-react';

const MobileDashboardGrid = () => {
  const navigate = useNavigate();
  
  const {
    widgets,
    isEditMode,
    kpiData,
    revenueChartData,
    recentClients,
    setIsEditMode,
    toggleWidgetMinimized,
    addWidget,
    removeWidget,
    resetLayout,
    saveLayout
  } = useDashboardWidgets();

  // Activer les raccourcis clavier
  const shortcuts = getCRMShortcuts(navigate);
  useKeyboardShortcuts(shortcuts);

  const [showAddWidgetMenu, setShowAddWidgetMenu] = useState(false);

  const renderWidgetContent = (widget: WidgetConfig) => {
    switch (widget.type) {
      case 'kpi-cards':
        return (
          <KPICardsWidget
            data={kpiData}
            isMinimized={widget.isMinimized}
            onEdit={() => console.log('Edit KPI widget')}
          />
        );
      
      case 'revenue-chart':
        return (
          <RevenueChartWidget
            data={revenueChartData}
            isMinimized={widget.isMinimized}
            config={widget.config}
            onEdit={() => console.log('Edit revenue chart')}
          />
        );
      
      case 'recent-clients':
        return (
          <RecentClientsWidget
            clients={recentClients}
            isMinimized={widget.isMinimized}
            config={widget.config}
            onEdit={() => console.log('Edit recent clients')}
          />
        );
      
      default:
        return (
          <div className="flex items-center justify-center h-full text-gray-500">
            Widget "{widget.type}" non implémenté
          </div>
        );
    }
  };

  const availableWidgets = [
    { type: 'kpi-cards', name: 'Indicateurs Clés', description: 'Cartes KPI principales' },
    { type: 'revenue-chart', name: 'Graphique Revenus', description: 'Évolution des revenus' },
    { type: 'recent-clients', name: 'Clients Récents', description: 'Derniers clients ajoutés' },
    { type: 'upcoming-deadlines', name: 'Échéances', description: 'Prochaines échéances' },
    { type: 'quick-actions', name: 'Actions Rapides', description: 'Raccourcis utiles' }
  ];

  return (
    <div className="space-y-4 pb-20">
      {/* Header mobile optimisé */}
      <div className="flex flex-col gap-3 px-4 pt-16">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-800">Tableau de Bord</h2>
          
          {isEditMode && (
            <div className="flex items-center gap-2 text-xs text-gray-600 bg-blue-50 px-2 py-1 rounded-lg">
              <Grid3X3 className="h-3 w-3" />
              <span>Mode édition</span>
            </div>
          )}
        </div>

        {/* Recherche mobile */}
        <UniversalSearch 
          placeholder="Rechercher..."
          className="w-full"
        />
      </div>

      {/* Boutons d'action mobile */}
      <div className="px-4">
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors whitespace-nowrap ${
              isEditMode 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-4 w-4" />
            {isEditMode ? 'Quitter' : 'Personnaliser'}
          </button>

          {isEditMode && (
            <>
              <button
                onClick={() => setShowAddWidgetMenu(!showAddWidgetMenu)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>
              
              <button
                onClick={() => saveLayout('Mobile Layout')}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-green-700 whitespace-nowrap"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>
              
              <button
                onClick={resetLayout}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 whitespace-nowrap"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
            </>
          )}
        </div>

        {/* Menu d'ajout de widget mobile */}
        {showAddWidgetMenu && (
          <div className="mt-3 rounded-2xl border border-gray-200 bg-white shadow-xl p-4">
            <h3 className="text-sm font-semibold text-gray-800 mb-3">Ajouter un widget</h3>
            <div className="grid grid-cols-1 gap-2">
              {availableWidgets.map((widgetOption) => (
                <button
                  key={widgetOption.type}
                  onClick={() => {
                    addWidget(widgetOption.type as any);
                    setShowAddWidgetMenu(false);
                  }}
                  className="w-full rounded-xl border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50 hover:border-blue-200"
                >
                  <div className="font-medium text-gray-800 text-sm">{widgetOption.name}</div>
                  <div className="text-xs text-gray-500">{widgetOption.description}</div>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Grille de widgets mobile optimisée */}
      <div className="px-4 space-y-4">
        {widgets
          .filter(widget => widget.isVisible)
          .sort((a, b) => {
            // Sur mobile, on trie par importance puis par position
            const priority = { 'kpi-cards': 1, 'revenue-chart': 2, 'recent-clients': 3 };
            const priorityA = priority[a.type as keyof typeof priority] || 999;
            const priorityB = priority[b.type as keyof typeof priority] || 999;
            
            if (priorityA !== priorityB) {
              return priorityA - priorityB;
            }
            
            return a.position.y - b.position.y;
          })
          .map((widget) => (
            <div key={widget.id} className="space-y-2">
              {/* Header du widget mobile */}
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-800">{widget.title}</h3>
                
                {isEditMode && (
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleWidgetMinimized(widget.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                      </svg>
                    </button>
                    <button
                      onClick={() => removeWidget(widget.id)}
                      className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-50 hover:text-red-600"
                    >
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                  </div>
                )}
              </div>

              {/* Contenu du widget */}
              {renderWidgetContent(widget)}
            </div>
          ))}
      </div>

      {/* Message si aucun widget */}
      {widgets.filter(w => w.isVisible).length === 0 && (
        <div className="px-4">
          <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center">
            <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <Grid3X3 className="h-8 w-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 mb-2">Personnalisez votre tableau de bord</h3>
            <p className="text-gray-500 mb-6 text-sm">Ajoutez des widgets pour voir vos informations importantes</p>
            <button
              onClick={() => setIsEditMode(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
            >
              <Plus className="h-4 w-4" />
              Commencer
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default MobileDashboardGrid;
