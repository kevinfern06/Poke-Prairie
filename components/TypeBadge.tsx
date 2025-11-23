import React from 'react';
import { TYPE_COLORS } from '../constants';

interface Props {
  type: string;
  size?: 'sm' | 'md' | 'lg';
}

export const TypeBadge: React.FC<Props> = ({ type, size = 'md' }) => {
  const color = TYPE_COLORS[type.toLowerCase()] || '#777';
  
  const sizeClasses = {
    sm: 'px-2 py-0.5 text-[9px] sm:text-[10px]',
    md: 'px-3 py-1 text-xs',
    lg: 'px-4 py-1.5 text-sm'
  };

  return (
    <span 
      className={`${sizeClasses[size]} font-bold text-white uppercase rounded-md shadow-sm inline-block mx-0.5 tracking-wider`}
      style={{ 
        backgroundColor: color, 
        textShadow: '0px 1px 2px rgba(0,0,0,0.2)',
        border: '1px solid rgba(255,255,255,0.2)'
      }}
    >
      {type}
    </span>
  );
};