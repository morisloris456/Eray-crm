import React, { useMemo, useState, useRef } from 'react';

interface VirtualizedListProps<T> {
  items: T[];
  itemHeight: number;
  renderItem: (props: { index: number; item: T; style: React.CSSProperties }) => React.ReactElement;
  className?: string;
  height?: number;
  width?: string | number;
  overscan?: number;
}

function VirtualizedList<T>({ 
  items, 
  itemHeight, 
  renderItem, 
  className,
  height = 400,
  width = '100%',
  overscan = 5
}: VirtualizedListProps<T>) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const memoizedItems = useMemo(() => items, [items]);
  
  const visibleItems = useMemo(() => {
    const containerHeight = height;
    const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
    const endIndex = Math.min(
      memoizedItems.length - 1,
      Math.ceil((scrollTop + containerHeight) / itemHeight) + overscan
    );
    
    return memoizedItems.slice(startIndex, endIndex + 1).map((item, index) => ({
      item,
      index: startIndex + index,
      style: {
        position: 'absolute' as const,
        top: (startIndex + index) * itemHeight,
        height: itemHeight,
        width: '100%',
      }
    }));
  }, [memoizedItems, scrollTop, itemHeight, height, overscan]);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return (
    <div 
      ref={containerRef}
      className={className}
      style={{ 
        height, 
        width, 
        overflow: 'auto',
        position: 'relative'
      }}
      onScroll={handleScroll}
    >
      <div style={{ 
        height: memoizedItems.length * itemHeight, 
        position: 'relative' 
      }}>
        {visibleItems.map(({ item, index, style }) => (
          <div key={index} style={style}>
            {renderItem({ index, item, style })}
          </div>
        ))}
      </div>
    </div>
  );
}

export default React.memo(VirtualizedList) as typeof VirtualizedList;
