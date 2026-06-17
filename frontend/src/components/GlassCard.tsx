import React from 'react';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  interactive?: boolean;
  style?: React.CSSProperties;
}

export const GlassCard: React.FC<GlassCardProps> = ({ 
  children, 
  className = '', 
  interactive = false, 
  style 
}) => {
  const baseClass = interactive ? 'glass-card glass-card-interactive' : 'glass-card';
  return (
    <div className={`${baseClass} ${className}`} style={style}>
      {children}
    </div>
  );
};
