import { useState } from 'react';
import { WidgetConfig } from '../types/dashboard';
import { useDashboardWidgets } from '../hooks/useDashboardWidgets';
import { useKeyboardShortcuts, getCRMShortcuts } from '../hooks/useKeyboardShortcuts';
import { useNavigate } from 'react-router-dom';
import KPICardsWidget from './widgets/KPICardsWidget';
import RevenueChartWidget from './widgets/RevenueChartWidget';
import RecentClientsWidget from './widgets/RecentClientsWidget';
import UpcomingDeadlinesWidget from './widgets/UpcomingDeadlinesWidget';
import SalesPipelineWidget from './widgets/SalesPipelineWidget';
import QuickActionsWidget from './widgets/QuickActionsWidget';
import CalendarWidget from './widgets/CalendarWidget';
import WidgetContainer from './widgets/WidgetContainer';
import UniversalSearch from './UniversalSearch';
import { Settings, Plus, Save, RotateCcw, Grid3X3 } from 'lucide-react';

const DashboardGrid = () => {
  const navigate = useNavigate();
  
  const {
    widgets,
    isEditMode,
    selectedWidget,
    kpiData,
    revenueChartData,
    upcomingDeadlines,
    recentClients,
    setIsEditMode,
    setSelectedWidget,
    moveWidget,
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
            onEdit={() => {
              if (isEditMode) {
                console.log('Edit KPI widget - Mode édition activé');
              }
            }}
          />
        );
      
      case 'revenue-chart':
        return (
          <RevenueChartWidget
            data={revenueChartData}
            isMinimized={widget.isMinimized}
            config={widget.config}
            onEdit={() => {
              if (isEditMode) {
                console.log('Edit revenue chart - Mode édition activé');
              }
            }}
          />
        );
      
      case 'recent-clients':
        return (
          <RecentClientsWidget
            clients={recentClients}
            isMinimized={widget.isMinimized}
            config={widget.config}
            onEdit={() => {
              if (isEditMode) {
                console.log('Edit recent clients - Mode édition activé');
              }
            }}
          />
        );
      
        case 'upcoming-deadlines':
          return (
            <UpcomingDeadlinesWidget
              deadlines={upcomingDeadlines}   
              isMinimized={widget.isMinimized}
              config={widget.config}
              onEdit={() => {
                if (isEditMode) {
                  console.log('Edit upcoming deadlines - Mode édition activé');
                }
              }}
            />
          );
      
      case 'pipeline-chart':
        return (
          <SalesPipelineWidget
            isMinimized={widget.isMinimized}
            config={widget.config}
            onEdit={() => {
              if (isEditMode) {
                console.log('Edit sales pipeline - Mode édition activé');
              }
            }}
          />
        );
      
      case 'quick-actions':
        return (
          <QuickActionsWidget
            isMinimized={widget.isMinimized}
            config={widget.config}
            onEdit={() => {
              if (isEditMode) {
                console.log('Edit quick actions - Mode édition activé');
              }
            }}
          />
        );
      
      case 'calendar-widget':
        return (
          <CalendarWidget
            isMinimized={widget.isMinimized}
            config={widget.config}
            onEdit={() => {
              if (isEditMode) {
                console.log('Edit calendar - Mode édition activé');
              }
            }}
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
    { type: 'quick-actions', name: 'Actions Rapides', description: 'Raccourcis utiles' },
    { type: 'calendar-widget', name: 'Calendrier', description: 'Vue calendrier' },
    { type: 'activity-feed', name: 'Fil d\'activité', description: 'Dernières activités' }
  ];

  return (
    <div className="space-y-6">
      {/* Barre d'outils du dashboard */}
      <div className="flex items-center justify-between rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-4">
          <h2 className="text-lg font-bold text-gray-800">Tableau de Bord</h2>
          
          {isEditMode && (
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Grid3X3 className="h-4 w-4" />
              <span>Mode édition</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Recherche universelle */}
          <UniversalSearch 
            placeholder="Rechercher dans tout le CRM..."
            className="w-80"
          />
          {/* Boutons de mode édition */}
          <button
            onClick={() => setIsEditMode(!isEditMode)}
            className={`flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium transition-colors ${
              isEditMode 
                ? 'bg-blue-600 text-white' 
                : 'border border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            <Settings className="h-4 w-4" />
            {isEditMode ? 'Quitter l\'édition' : 'Personnaliser'}
          </button>

          {/* Menu d'ajout de widget */}
          {isEditMode && (
            <div className="relative">
              <button
                onClick={() => setShowAddWidgetMenu(!showAddWidgetMenu)}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <Plus className="h-4 w-4" />
                Ajouter
              </button>

              {showAddWidgetMenu && (
                <div className="absolute right-0 top-full z-50 mt-2 w-80 rounded-2xl border border-gray-200 bg-white shadow-xl">
                  <div className="p-4">
                    <h3 className="text-sm font-semibold text-gray-800 mb-3">Ajouter un widget</h3>
                    <div className="space-y-2 max-h-64 overflow-y-auto">
                      {availableWidgets.map((widgetOption) => (
                        <button
                          key={widgetOption.type}
                          onClick={() => {
                            addWidget(widgetOption.type as any);
                            setShowAddWidgetMenu(false);
                          }}
                          className="w-full rounded-xl border border-gray-100 p-3 text-left transition-colors hover:bg-gray-50 hover:border-blue-200"
                        >
                          <div className="font-medium text-gray-800">{widgetOption.name}</div>
                          <div className="text-xs text-gray-500">{widgetOption.description}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Actions de sauvegarde */}
          {isEditMode && (
            <>
              <button
                onClick={() => {
                saveLayout('Mon tableau de bord');
                // console.log('Layout sauvegardé avec succès');
              }}
                className="flex items-center gap-2 rounded-xl bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700"
              >
                <Save className="h-4 w-4" />
                Sauvegarder
              </button>
              
              <button
                onClick={() => {
                resetLayout();
                // console.log('Layout réinitialisé avec succès');
              }}
                className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                <RotateCcw className="h-4 w-4" />
                Réinitialiser
              </button>
            </>
          )}
        </div>
      </div>

      {/* Grille de widgets */}
      <div className="grid grid-cols-12 gap-4 auto-rows-min">
        {widgets
          .filter(widget => widget.isVisible)
          .sort((a, b) => {
            // Tri par position Y puis X
            if (a.position.y !== b.position.y) {
              return a.position.y - b.position.y;
            }
            return a.position.x - b.position.x;
          })
          .map((widget) => (
            <WidgetContainer
              key={widget.id}
              widget={widget}
              isEditMode={isEditMode}
              isSelected={selectedWidget === widget.id}
              onSelect={setSelectedWidget}
              onEdit={(widgetId) => {
                // console.log('Edit widget:', widgetId);
                // Implémenter la logique d'édition du widget
                setSelectedWidget(widgetId);
              }}
              onRemove={removeWidget}
              onToggleMinimize={toggleWidgetMinimized}
              onMove={moveWidget}
            >
              {renderWidgetContent(widget)}
            </WidgetContainer>
          ))}
      </div>

      {/* Message si aucun widget */}
      {widgets.filter(w => w.isVisible).length === 0 && (
        <div className="rounded-2xl border border-gray-200 bg-white p-12 text-center">
          <div className="mx-auto h-16 w-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
            <Grid3X3 className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Personnalisez votre tableau de bord</h3>
          <p className="text-gray-500 mb-6">Ajoutez des widgets pour voir vos informations importantes</p>
          <button
            onClick={() => setIsEditMode(true)}
            className="inline-flex items-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-sm font-medium text-white hover:bg-blue-700"
          >
            <Plus className="h-4 w-4" />
            Commencer
          </button>
        </div>
      )}
    </div>
  );
};

export default DashboardGrid;
