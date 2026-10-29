import React from 'react';
import { BentoCard } from './BentoCard';
import { PageContent } from './PageContent';

interface AsyncPanelProps {
  loading: boolean;
  error?: string | null;
  onRetry: () => void;
  children: React.ReactNode;
}

export const AsyncPanel: React.FC<AsyncPanelProps> = ({
  loading,
  error,
  onRetry,
  children,
}) => {
  if (loading) {
    return (
      <div className="w-full flex justify-center items-center py-16">
        <div className="w-8 h-8 border-2 border-app-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (error) {
    return (
      <PageContent>
        <BentoCard>
          <div className="flex flex-col gap-3 items-start">
            <p className="text-app-text text-sm">
              {error || 'Không thể tải dữ liệu. Kiểm tra kết nối và thử lại.'}
            </p>
            <button
              onClick={onRetry}
              className="text-app-primary hover:underline text-sm font-semibold"
            >
              Thử lại
            </button>
          </div>
        </BentoCard>
      </PageContent>
    );
  }

  return <>{children}</>;
};

