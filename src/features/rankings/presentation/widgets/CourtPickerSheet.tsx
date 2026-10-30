import React from 'react';
import { CheckCircle, CircleDot, MapPin, X } from 'lucide-react';
import { Court } from '../../../../core/types/database.types';

interface CourtPickerSheetProps {
  courts: Court[];
  selectedCourtId: string;
  onSelectCourt: (courtId: string) => void;
  onClose: () => void;
}

export const CourtPickerSheet: React.FC<CourtPickerSheetProps> = ({
  courts,
  selectedCourtId,
  onSelectCourt,
  onClose,
}) => {
  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] bg-app-surface rounded-t-bento border-t border-app-border p-5 pb-8 flex flex-col gap-3 shadow-2xl max-h-[85vh] overflow-y-auto animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div className="w-10 h-1 bg-app-border rounded-full mx-auto" />

        <div className="flex items-center justify-between px-1 pt-1">
          <div>
            <span className="text-[11px] font-black tracking-widest text-app-muted uppercase">
              CHỌN SÂN XẾP HẠNG
            </span>
            <h2 className="text-base font-extrabold text-app-text mt-0.5">
              Danh sách cụm sân hoạt động
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Court Options */}
        <div className="flex flex-col gap-2 pt-2">
          {courts.map((court) => {
            const isSelected = court.id === selectedCourtId;
            return (
              <button
                key={court.id}
                type="button"
                onClick={() => {
                  onSelectCourt(court.id);
                  onClose();
                }}
                className={`w-full min-h-[52px] p-3.5 rounded-btn flex items-center gap-3.5 transition-all text-left active:scale-[0.99] ${
                  isSelected
                    ? 'bg-app-primary/10 border-2 border-app-primary shadow-xs'
                    : 'bg-app-background/60 border border-app-border hover:border-app-primary/40 hover:bg-app-background'
                }`}
              >
                {/* Court Icon Container */}
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? 'bg-app-primary text-app-on-primary shadow-xs'
                      : 'bg-app-surface text-app-muted border border-app-border'
                  }`}
                >
                  <CircleDot size={20} />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col min-w-0">
                  <span
                    className={`text-sm truncate ${
                      isSelected ? 'font-black text-app-primary' : 'font-bold text-app-text'
                    }`}
                  >
                    {court.name}
                  </span>
                  {(court.distance_km != null || court.distanceKm != null) && (
                    <span className="text-xs text-app-muted mt-0.5 flex items-center gap-1">
                      <MapPin size={12} className="text-app-muted shrink-0" />
                      Cách bạn ~{Number(court.distance_km ?? court.distanceKm).toFixed(1)} km
                    </span>
                  )}
                </div>

                {/* Selected Checkmark */}
                {isSelected && (
                  <CheckCircle size={20} className="text-app-primary shrink-0" />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
