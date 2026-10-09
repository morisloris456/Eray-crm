import { useState, useMemo } from "react";
import { Target, Plus, TrendingUp } from "lucide-react";
import { useData } from "../../context/DataContext";
import { useAuth } from "../../context/AuthContext";
import { useNavigate } from "react-router-dom";

interface SalesPipelineWidgetProps {
  isMinimized?: boolean;
  config?: any;
  onEdit?: () => void;
}

const SalesPipelineWidget = ({
  isMinimized = false,
}: SalesPipelineWidgetProps) => {
  const { deals } = useData();
  const { user } = useAuth();

  const isAdmin = !!user?.roles?.includes("ROLE_ADMIN");

  const displayDeals = useMemo(() => {
    if (isAdmin) return deals;
    return deals.filter(
      (d) => d.createdBy?.id === user?.id || d.assignedTo === user?.name,
    );
  }, [deals, user, isAdmin]);
  const navigate = useNavigate();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newDeal, setNewDeal] = useState({
    title: "",
    client: "",
    amount: "",
    stage: "lead" as "lead" | "contact" | "proposal" | "won" | "lost",
  });

  // Configuration des étapes
  const STAGES = [
    { id: "lead", name: "Prospects", color: "#6b7280" },
    { id: "contact", name: "Contacté", color: "#3b82f6" },
    { id: "proposal", name: "Proposition", color: "#8b5cf6" },
    { id: "won", name: "Gagné", color: "#10b981" },
    { id: "lost", name: "Perdu", color: "#ef4444" },
  ];

  // Calculer les deals par étape
  const dealsByStage = STAGES.map((stage) => ({
    name: stage.name,
    value: displayDeals.filter((d) => d.stage === stage.id).length,
    color: stage.color,
  }));

  // Statistiques
  const totalDeals = displayDeals.length;
  const activeDeals = displayDeals.filter(
    (d) => d.stage !== "won" && d.stage !== "lost",
  );
  const wonDeals = displayDeals.filter((d) => d.stage === "won");
  const lostDeals = displayDeals.filter((d) => d.stage === "lost");
  const conversionRate =
    totalDeals > 0 ? Math.round((wonDeals.length / totalDeals) * 100) : 0;

  const handleAddDeal = () => {
    if (newDeal.title && newDeal.client && newDeal.amount) {
      // Naviguer vers la page pipeline avec les données pré-remplies
      const params = new URLSearchParams({
        new: "true",
        title: newDeal.title,
        client: newDeal.client,
        amount: newDeal.amount,
        stage: newDeal.stage,
      });
      navigate(`/pipeline?${params.toString()}`);
      setShowAddForm(false);
      setNewDeal({ title: "", client: "", amount: "", stage: "lead" });
    }
  };

  const handleStageClick = (stageId: string) => {
    navigate(`/pipeline?filter=${stageId}`);
  };

  if (isMinimized) {
    return (
      <div className="flex items-center justify-between p-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          <span className="font-medium text-gray-800">Pipeline</span>
        </div>
        <span className="text-sm text-gray-600">
          {activeDeals.length} actifs
        </span>
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-blue-500" />
          <h3 className="font-bold text-gray-800">Pipeline de Vente</h3>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="p-1.5 rounded-lg bg-purple-50 text-purple-600 hover:bg-purple-100 transition-colors"
          title="Ajouter un deal"
        >
          <Plus className="h-4 w-4" />
        </button>
      </div>

      {/* Formulaire d'ajout rapide */}
      {showAddForm && (
        <div className="mb-4 p-3 bg-purple-50 rounded-xl border border-purple-200">
          <h4 className="text-sm font-medium text-purple-800 mb-2">
            Nouveau Deal
          </h4>
          <div className="space-y-2">
            <input
              type="text"
              placeholder="Titre du projet"
              value={newDeal.title}
              onChange={(e) =>
                setNewDeal({ ...newDeal, title: e.target.value })
              }
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm"
            />
            <input
              type="text"
              placeholder="Client"
              value={newDeal.client}
              onChange={(e) =>
                setNewDeal({ ...newDeal, client: e.target.value })
              }
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm"
            />
            <input
              type="number"
              placeholder="Montant (Ar)"
              value={newDeal.amount}
              onChange={(e) =>
                setNewDeal({ ...newDeal, amount: e.target.value })
              }
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm"
            />
            <select
              value={newDeal.stage}
              onChange={(e) =>
                setNewDeal({ ...newDeal, stage: e.target.value as any })
              }
              className="w-full rounded-lg border border-purple-200 bg-white px-3 py-2 text-sm"
            >
              {STAGES.map((stage) => (
                <option key={stage.id} value={stage.id}>
                  {stage.name}
                </option>
              ))}
            </select>
            <div className="flex gap-2">
              <button
                onClick={handleAddDeal}
                className="flex-1 rounded-lg bg-purple-600 py-2 text-sm font-medium text-white hover:bg-purple-700"
              >
                Créer
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="flex-1 rounded-lg border border-purple-200 bg-white py-2 text-sm font-medium text-purple-600 hover:bg-purple-50"
              >
                Annuler
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pipeline visuel */}
      <div className="space-y-3 mb-4">
        {dealsByStage.map((stage) => (
          <div key={stage.name} className="space-y-2">
            <div
              className="flex items-center justify-between cursor-pointer hover:bg-gray-50 p-1 rounded"
              onClick={() => handleStageClick(stage.name)}
            >
              <div className="flex items-center gap-2">
                <div
                  className="h-3 w-3 rounded-full"
                  style={{ backgroundColor: stage.color }}
                />
                <span className="text-sm font-medium text-gray-700">
                  {stage.name}
                </span>
              </div>
              <span className="text-sm font-bold text-gray-800">
                {stage.value}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="h-2 rounded-full transition-all"
                style={{
                  width: `${Math.min((stage.value / Math.max(...dealsByStage.map((d) => d.value))) * 100, 100)}%`,
                  backgroundColor: stage.color,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-3 gap-2 mb-4 text-center">
        <div className="bg-green-50 rounded-lg p-2">
          <p className="text-lg font-bold text-green-600">{wonDeals.length}</p>
          <p className="text-xs text-gray-500">Gagnés</p>
        </div>
        <div className="bg-blue-50 rounded-lg p-2">
          <p className="text-lg font-bold text-blue-600">
            {activeDeals.length}
          </p>
          <p className="text-xs text-gray-500">Actifs</p>
        </div>
        <div className="bg-red-50 rounded-lg p-2">
          <p className="text-lg font-bold text-red-600">{lostDeals.length}</p>
          <p className="text-xs text-gray-500">Perdus</p>
        </div>
      </div>

      {/* Indicateur de conversion */}
      <div className="bg-purple-50 rounded-lg p-3 mb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-800">
              Taux de conversion
            </span>
          </div>
          <span className="text-lg font-bold text-purple-600">
            {conversionRate}%
          </span>
        </div>
      </div>

      {/* Lien vers le pipeline complet */}
      <button
        onClick={() => navigate("/pipeline")}
        className="w-full text-center text-sm font-medium text-purple-600 hover:text-purple-700"
      >
        Voir le pipeline complet →
      </button>
    </div>
  );
};

export default SalesPipelineWidget;
