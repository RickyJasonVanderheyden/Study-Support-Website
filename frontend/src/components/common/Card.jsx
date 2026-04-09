import React from 'react';
import clsx from 'clsx';

const Card = ({ children, title, className = '', icon, ...props }) => {
  return (
    <div
      className={clsx(
        'bg-white rounded-xl shadow-lg border border-gray-100 p-6 transition-all duration-300 hover:shadow-xl hover:border-gray-200 hover:-translate-y-1',
        className
      )}
      {...props}
    >
      {(title || icon) && (
        <div className="flex items-center gap-3 mb-4 pb-3 border-b border-gray-100">
          {icon && <div className="text-2xl text-primary-600">{icon}</div>}
          {title && <h3 className="text-xl font-bold text-gray-800 leading-tight">{title}</h3>}
        </div>
      )}
      <div className="text-gray-700 leading-relaxed">
        {children}
      </div>
    </div>
  );
};

export default Card;
