import React from 'react';
import { Client } from '../../types';
import { cn } from '../../utils/cn';

interface ClientCardProps {
  client: Client;
  onClick?: (client: Client) => void;
  isSelected?: boolean;
  className?: string;
}

const ClientCard = React.memo(({ client, onClick, isSelected, className }: ClientCardProps) => {
  const handleClick = () => {
    onClick?.(client);
  };

  return (
    <div
      className={cn(
        "p-4 border rounded-lg cursor-pointer transition-all hover:shadow-md",
        isSelected ? "border-blue-500 bg-blue-50" : "border-gray-200 bg-white",
        className
      )}
      onClick={handleClick}
    >
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center font-semibold text-gray-600">
          {client.name.charAt(0).toUpperCase()}
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-gray-800">{client.name}</h3>
          <p className="text-sm text-gray-500">{client.company}</p>
        </div>
        <div className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          client.status === 'Actif' ? 'bg-green-100 text-green-700' :
          client.status === 'Prospect' ? 'bg-blue-100 text-blue-700' :
          client.status === 'Inactif' ? 'bg-gray-100 text-gray-700' :
          'bg-orange-100 text-orange-700'
        )}>
          {client.status}
        </div>
      </div>
    </div>
  );
});

ClientCard.displayName = 'ClientCard';

export default ClientCard;
