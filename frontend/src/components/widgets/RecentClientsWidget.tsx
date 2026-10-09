import { Client } from '../../context/DataContext';
import { useNavigate } from 'react-router-dom';
import { Users, Building2, Mail, Star } from 'lucide-react';

interface RecentClientsWidgetProps {
  clients: Client[];
  isMinimized?: boolean;
  onEdit?: () => void;
  config?: { limit?: number };
}

const RecentClientsWidget = ({ clients, isMinimized = false, onEdit, config }: RecentClientsWidgetProps) => {
  const navigate = useNavigate();
  const displayClients = clients.slice(0, config?.limit || 5);

  if (isMinimized) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Clients Récents</h3>
          <div className="flex items-center gap-1 text-blue-600">
            <Users className="h-4 w-4" />
            <span className="text-xs font-medium">{displayClients.length}</span>
          </div>
        </div>
      </div>
    );
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Actif': return 'bg-green-100 text-green-700';
      case 'Prospect': return 'bg-blue-100 text-blue-700';
      case 'Inactif': return 'bg-gray-100 text-gray-700';
      case 'Ancien': return 'bg-orange-100 text-orange-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Users className="h-5 w-5 text-blue-600" />
          <h3 className="text-lg font-bold text-gray-800">Clients Récents</h3>
          <span className="text-xs text-gray-500 bg-blue-50 px-2 py-1 rounded-full">
            {displayClients.length} derniers
          </span>
        </div>
        {onEdit && (
          <button
            onClick={onEdit}
            className="rounded-lg p-2 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
            </svg>
          </button>
        )}
      </div>

      <div className="space-y-3">
        {displayClients.map((client) => (
          <div
            key={client.id}
            onClick={() => navigate(`/clients?search=${client.id}`)}
            className="group flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50/50 p-4 transition-all hover:border-blue-200 hover:bg-blue-50/30 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-sm font-bold text-white shadow-sm">
                {client.name.charAt(0)}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-800 truncate">{client.name}</p>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                  <Building2 className="h-3 w-3" />
                  <span className="truncate">{client.company}</span>
                </div>
                {client.email && (
                  <div className="flex items-center gap-1 text-xs text-gray-400 mt-1">
                    <Mail className="h-3 w-3" />
                    <span className="truncate">{client.email}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className={`rounded-lg px-2 py-1 text-[10px] font-semibold ${getStatusColor(client.status)}`}>
                {client.status}
              </span>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                <Star className="h-4 w-4 text-yellow-500" />
              </div>
            </div>
          </div>
        ))}

        {displayClients.length === 0 && (
          <div className="text-center py-8">
            <Users className="h-12 w-12 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">Aucun client récent</p>
          </div>
        )}
      </div>

      {clients.length > displayClients.length && (
        <div className="mt-4 text-center">
          <button 
            onClick={() => navigate('/clients')}
            className="text-sm font-medium text-blue-600 hover:text-blue-700"
          >
            Voir tous les clients →
          </button>
        </div>
      )}
    </div>
  );
};

export default RecentClientsWidget;
