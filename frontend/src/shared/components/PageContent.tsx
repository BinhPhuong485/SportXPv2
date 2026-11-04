import React from 'react';

interface PageContentProps {
  children: React.ReactNode;
  className?: string;
}

export const PageContent: React.FC<PageContentProps> = ({ children, className = '' }) => {
  return (
    <div className="w-full flex justify-center">
      <div
        className={`w-full max-w-content md:max-w-4xl lg:max-w-6xl xl:max-w-7xl px-4 md:px-6 pt-4 md:pt-6 pb-28 md:pb-24 flex flex-col gap-4 md:gap-5 ${className}`}
      >
        {children}
      </div>
    </div>
  );
};

