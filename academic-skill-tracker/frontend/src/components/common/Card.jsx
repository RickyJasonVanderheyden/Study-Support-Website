import React from 'react';
import clsx from 'clsx';

const Card = ({ children, title, className = '' }) => {
  return (
    <div className={clsx('card', className)}>
      {title && <h3 className="text-xl font-semibold mb-4">{title}</h3>}
      {children}
    </div>
  );
};

export default Card;
