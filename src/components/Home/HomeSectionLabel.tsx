import React from 'react';

interface HomeSectionLabelProps {
  children: React.ReactNode;
  className?: string;
  id?: string;
}

const HomeSectionLabel: React.FC<HomeSectionLabelProps> = ({ children, className = '', id }) => (
  <h2 id={id} className={`mb-2 text-base font-bold tracking-tight text-slate-900 ${className}`.trim()}>
    {children}
  </h2>
);

export default HomeSectionLabel;
