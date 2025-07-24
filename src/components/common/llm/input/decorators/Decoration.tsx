import React from 'react';

export default ({ types, children }: {
  types: string[];
  children?: React.ReactNode;
}) => (
  <span className={`token ${types.join(' ')}`}>
    {children}
  </span>
);
