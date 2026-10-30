import React from 'react';
import { CheckCircle, CircleDot } from 'lucide-react';
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
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[720px] bg-app-surface rounded-t-[20px] border-t border-app-border p-4 pb-8 flex flex-col gap-3 shadow-xl max-h-[85vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Handle Bar */}
        <div className="w-9 h-1 bg-app-border rounded-full mx-auto my-1" />

        <div className="px-2 pt-2">
          <span className="text-[12px] font-bold tracking-[0.8px] text-app-muted uppercase">
            CHỌN SÂN XẾP HẠNG
          </span>
        </div>

        {/* Court Options */}
        <div className="flex flex-col gap-2 pt-1">
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
                className={`w-full px-3.5 py-3 rounded-xl flex items-center gap-3 transition-all text-left ${
                  isSelected
                    ? 'bg-app-primary/10 border-1.5 border-app-primary'
                    : 'bg-app-background border border-app-border hover:border-app-primary/50'
                }`}
              >
                {/* Court Icon Container */}
                <div
                  className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                    isSelected ? 'bg-app-primary/20 text-app-primary' : 'bg-app-surface text-app-muted'
                  }`}
                >
                  <CircleDot size={18} />
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col">
                  <span
                    className={`text-sm ${
                      isSelected ? 'font-bold text-app-primary' : 'font-semibold text-app-text'
                    }`}
                  >
                    {court.name}
                  </span>
                  {(court.distance_km != null || court.distanceKm != null) && (
                    <span className="text-[11px] text-app-muted mt-0.5">
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

