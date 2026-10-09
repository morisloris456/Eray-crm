import { ReactNode, useState } from 'react';
import { WidgetConfig } from '../../types/dashboard';
import { GripVertical, Minus, Maximize2, X, Edit3 } from 'lucide-react';

interface WidgetContainerProps {
  widget: WidgetConfig;
  children: ReactNode;
  isEditMode: boolean;
  isSelected: boolean;
  onSelect: (widgetId: string) => void;
  onEdit: (widgetId: string) => void;
  onRemove: (widgetId: string) => void;
  onToggleMinimize: (widgetId: string) => void;
  onMove: (widgetId: string, newPosition: { x: number; y: number }) => void;
}

const WidgetContainer = ({ 
  widget, 
  children, 
  isEditMode, 
  isSelected, 
  onSelect, 
  onEdit, 
  onRemove, 
  onToggleMinimize,
  onMove 
}: WidgetContainerProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!isEditMode) return;
    
    setIsDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    onSelect(widget.id);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !isEditMode) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    // Calculer la nouvelle position en fonction de la grille (supposons une grille de 4 colonnes)
    const gridCellWidth = 100; // pixels par cellule de grille
    const gridCellHeight = 80; // pixels par cellule de grille

    const newX = Math.max(0, widget.position.x + Math.round(deltaX / gridCellWidth));
    const newY = Math.max(0, widget.position.y + Math.round(deltaY / gridCellHeight));

    onMove(widget.id, { x: newX, y: newY });
    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const getGridClasses = () => {
    const { width, height } = widget.position;
    
    // Classes basées sur le système de grille CSS (12 colonnes)
    const colSpan = `col-span-${Math.min(width, 12)}`;
    const rowSpan = `row-span-${Math.min(height, 6)}`;
    
    return `${colSpan} ${rowSpan}`;
  };

  return (
    <div
      className={`
        relative rounded-2xl border transition-all duration-200
        ${isSelected ? 'border-blue-500 ring-2 ring-blue-200' : 'border-gray-200'}
        ${isEditMode ? 'cursor-move hover:border-blue-300' : ''}
        ${isDragging ? 'opacity-75 scale-105' : ''}
        ${widget.isMinimized ? 'h-auto' : ''}
        ${getGridClasses()}
      `}
      style={{
        gridColumn: `span ${widget.position.width}`,
        gridRow: `span ${widget.isMinimized ? 1 : widget.position.height}`,
      }}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Header du widget */}
      <div className="flex items-center justify-between p-4 pb-2">
        <div className="flex items-center gap-2">
          {isEditMode && (
            <div className="cursor-grab active:cursor-grabbing">
              <GripVertical className="h-4 w-4 text-gray-400" />
            </div>
          )}
          <h3 className="text-sm font-semibold text-gray-800">{widget.title}</h3>
        </div>
        
        <div className="flex items-center gap-1">
          {/* Boutons d'action */}
          {!isEditMode && !widget.isMinimized && (
            <button
              onClick={() => onToggleMinimize(widget.id)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              title="Minimiser"
            >
              <Minus className="h-3 w-3" />
            </button>
          )}
          
          {!isEditMode && widget.isMinimized && (
            <button
              onClick={() => onToggleMinimize(widget.id)}
              className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
              title="Agrandir"
            >
              <Maximize2 className="h-3 w-3" />
            </button>
          )}
          
          {isEditMode && (
            <>
              <button
                onClick={() => onEdit(widget.id)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-blue-600"
                title="Configurer"
              >
                <Edit3 className="h-3 w-3" />
              </button>
              <button
                onClick={() => onRemove(widget.id)}
                className="rounded-lg p-1 text-gray-400 hover:bg-gray-50 hover:text-red-600"
                title="Supprimer"
              >
                <X className="h-3 w-3" />
              </button>
            </>
          )}
        </div>
      </div>

      {/* Contenu du widget */}
      <div className={`px-4 pb-4 ${widget.isMinimized ? 'hidden' : ''}`}>
        {children}
      </div>

      {/* Indicateur de sélection en mode édition */}
      {isEditMode && isSelected && (
        <div className="absolute inset-0 border-2 border-blue-500 rounded-2xl pointer-events-none">
          <div className="absolute -top-2 -left-2 bg-blue-500 text-white text-xs px-2 py-1 rounded">
            {widget.position.width}×{widget.position.height}
          </div>
        </div>
      )}
    </div>
  );
};

export default WidgetContainer;
