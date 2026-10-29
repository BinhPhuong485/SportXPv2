import React, { useEffect } from 'react';
import { X } from 'lucide-react';

interface ModalSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const ModalSheet: React.FC<ModalSheetProps> = ({
  isOpen,
  onClose,
  title,
  children,
  maxWidth = 'max-w-full sm:max-w-[540px]',
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/54 transition-opacity animate-fade-in">
      {/* Backdrop click */}
      <div className="absolute inset-0" onClick={onClose} />

      {/* Sheet panel */}
      <div
        className={`relative w-full ${maxWidth} max-h-[90vh] bg-app-surface border-t sm:border border-app-border rounded-t-[24px] sm:rounded-b-[24px] p-6 pb-8 overflow-y-auto z-10 shadow-2xl flex flex-col`}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 bg-app-border rounded-full mx-auto mb-4" />

        {title && (
          <div className="flex items-center justify-between pb-3 mb-2 border-b border-app-border/40">
            <h3 className="text-sm font-bold tracking-wider text-app-muted uppercase">
              {title}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-full text-app-muted hover:text-app-text transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        )}

        {children}
      </div>
    </div>
  );
};

