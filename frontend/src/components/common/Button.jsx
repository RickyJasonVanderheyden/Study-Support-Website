import React from 'react';
import clsx from 'clsx';

const Button = ({ 
  children, 
  variant = 'primary', 
  size = 'md',
  fullWidth = false,
  disabled = false,
  onClick,
  type = 'button',
  className = ''
}) => {
  const baseStyles = 'font-medium rounded-lg transition-all duration-200 inline-flex items-center justify-center';
  
  const variants = {
    primary: 'bg-primary-600 text-white hover:bg-primary-700 focus:ring-4 focus:ring-primary-300',
    secondary: 'bg-gray-200 text-gray-700 hover:bg-gray-300',
    danger: 'bg-red-600 text-white hover:bg-red-700',
  };
  
  const sizes = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
  };
  
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={disabled}
      className={clsx(
        baseStyles,
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        disabled && 'opacity-50 cursor-not-allowed',
        className
      )}
    >
      {children}
    </button>
  );
};

export default Button;
