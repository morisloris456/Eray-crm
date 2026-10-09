import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { ChartData } from '../../types/dashboard';
import { TrendingUp, Calendar } from 'lucide-react';

interface RevenueChartWidgetProps {
  data: ChartData;
  isMinimized?: boolean;
  onEdit?: () => void;
  config?: { period?: string };
}

const RevenueChartWidget = ({ data, isMinimized = false, onEdit, config }: RevenueChartWidgetProps) => {
  if (isMinimized) {
    return (
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-800">Revenus</h3>
          <div className="flex items-center gap-1 text-green-600">
            <TrendingUp className="h-4 w-4" />
            <span className="text-xs font-medium">
              {data.datasets[0]?.data.length > 0 ? '+' + Math.round((data.datasets[0].data[data.datasets[0].data.length - 1] / data.datasets[0].data[0] - 1) * 100) + '%' : 'N/A'}
            </span>
          </div>
        </div>
      </div>
    );
  }

  const totalRevenue = data.datasets[0]?.data.reduce((sum, val) => sum + val, 0) || 0;
  const averageRevenue = data.datasets[0]?.data.length > 0 ? totalRevenue / data.datasets[0].data.length : 0;

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-600" />
          <h3 className="text-lg font-bold text-gray-800">Évolution des Revenus</h3>
          {config?.period && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
              {config.period}
            </span>
          )}
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

      {/* Statistiques rapides */}
      <div className="mb-6 grid grid-cols-2 gap-4">
        <div className="rounded-xl bg-green-50 p-4">
          <p className="text-sm font-medium text-green-700">Total période</p>
          <p className="text-xl font-bold text-green-900">{totalRevenue.toLocaleString()} Ar</p>
        </div>
        <div className="rounded-xl bg-blue-50 p-4">
          <p className="text-sm font-medium text-blue-700">Moyenne mensuelle</p>
          <p className="text-xl font-bold text-blue-900">{Math.round(averageRevenue).toLocaleString()} Ar</p>
        </div>
      </div>

      {/* Graphique */}
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data.labels.map((label, index) => ({
            month: label,
            revenue: data.datasets[0].data[index] || 0
          }))}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis 
              dataKey="month" 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
            />
            <YAxis 
              stroke="#6b7280" 
              fontSize={12}
              tickLine={false}
              tickFormatter={(value) => `${value}K`}
            />
            <Tooltip 
              contentStyle={{ 
                backgroundColor: '#fff', 
                border: '1px solid #e5e7eb', 
                borderRadius: '8px',
                boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)'
              }}
              formatter={(value) => [`${(value || 0).toLocaleString()} Ar`, 'Revenus']}
              labelStyle={{ color: '#374151', fontWeight: 'bold' }}
            />
            <Line 
              type="monotone" 
              dataKey="revenue" 
              stroke="#10b981" 
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Période affichée */}
      <div className="mt-4 flex items-center justify-center gap-2 text-xs text-gray-500">
        <Calendar className="h-3 w-3" />
        <span>Période : {data.labels[0]} - {data.labels[data.labels.length - 1]}</span>
      </div>
    </div>
  );
};

export default RevenueChartWidget;
