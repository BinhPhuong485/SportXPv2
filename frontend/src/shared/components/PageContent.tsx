import React from 'react';

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContent: React.FC<PageContentProps> = ({ children, className = '' }) => {
  return (
    <div className="w-full flex justify-center">
      <div className={`w-full max-w-content px-4 pt-4 pb-28 flex flex-col gap-4 ${className}`}>
        {children}
      </div>
    </div>
  );
};

