import React from 'react';
import { iconPaths } from './IconPaths';

interface ReactIconProps {
  icon: keyof typeof iconPaths;
  className?: string;
}

const ReactIcon: React.FC<ReactIconProps> = ({ icon, className = '' }) => {
  const iconPath = iconPaths[icon];
  
  if (!iconPath) {
    console.warn(`Icon '${icon}' not found`);
    return null;
  }

  return (
    <svg 
      className={`icon ${className}`} 
      viewBox="0 0 256 256" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="16"
      strokeLinecap="round" 
      strokeLinejoin="round"
      dangerouslySetInnerHTML={{ __html: iconPath }}
    />
  );
};

export default ReactIcon;
