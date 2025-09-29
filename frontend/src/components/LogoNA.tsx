import React from 'react';
import logoSVG from '../assets/images/logoNA.svg';

interface LogoNAProps {
  height?: string | number;
  width?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

const LogoNA: React.FC<LogoNAProps> = ({ 
  height = '60px', 
  width = 'auto', 
  className, 
  style 
}) => {
  return (
    <img 
      src={logoSVG}
      alt="Nordicos FC Logo"
      width={width}
      height={height}
      className={className}
      style={style}
    />
  );
};

export default LogoNA;