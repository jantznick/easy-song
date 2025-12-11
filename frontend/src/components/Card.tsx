import type { FC } from 'react';
import type { CardProps } from '../types/components';

const Card: FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-surface border border-border shadow-xl shadow-black/20 rounded-2xl overflow-hidden backdrop-blur-sm ${className}`}>
      {children}
    </div>
  );
};

export default Card;
