import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'white';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
}

const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center font-bold transition-all duration-300 rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed tracking-tight";
  
  const variants = {
    // Gradient Primary
    primary: "bg-brand-gradient text-white shadow-lg shadow-primary-500/20 hover:shadow-primary-500/40 hover:-translate-y-0.5 focus:ring-primary-500",
    // Secondary Pink
    secondary: "bg-secondary-500 text-white hover:bg-secondary-600 focus:ring-secondary-500 shadow-md shadow-secondary-500/20",
    // Outline Dark
    outline: "border-2 border-primary-900 text-primary-900 hover:bg-primary-50 focus:ring-primary-900",
    // White
    white: "bg-white text-primary-900 border border-transparent hover:border-primary-100 hover:shadow-lg focus:ring-white",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const widthClass = fullWidth ? "w-full" : "";

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${widthClass} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export default Button;