import React, { useState } from 'react';
import {
  X,
  RotateCcw,
  MapPin,
  Calendar,
  Award,
  DollarSign,
  Users,
} from 'lucide-react';
import { RoomFilterState } from '../../domain/managedRoom';

interface RoomFilterSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initial: RoomFilterState;
  onApply: (filter: RoomFilterState) => void;
}

export const RoomFilterSheet: React.FC<RoomFilterSheetProps> = ({
  isOpen,
  onClose,
  initial,
  onApply,
}) => {
  const [area, setArea] = useState(initial.area);
  const [radius, setRadius] = useState(initial.radius);
  const [date, setDate] = useState<Date | null>(initial.date);
  const [skill, setSkill] = useState<number | null>(initial.skill);
  const [maxFee, setMaxFee] = useState<number | null>(initial.maxFee);
  const [availableOnly, setAvailableOnly] = useState(initial.availableOnly);

  if (!isOpen) return null;

  const areas = [
    'Tất cả',
    'Phú Nhuận',
    'Bình Thạnh',
    'Thủ Đức',
    'Quận 1',
    'Quận 3',
    'Quận 7',
    'Quận 10',
    'Tân Bình',
    'Gò Vấp',
  ];

  const skillOptions = [
    { label: 'Mọi trình độ', value: null },
    { label: 'Yếu (450+)', value: 450 },
    { label: 'TBY (600+)', value: 600 },
    { label: 'TB (750+)', value: 750 },
    { label: 'TBK (950+)', value: 950 },
    { label: 'Khá (1200+)', value: 1200 },
  ];

  const feeOptions = [
    { label: 'Tất cả', value: null },
    { label: 'Miễn phí', value: 0 },
    { label: '≤ 50k', value: 50000 },
    { label: '≤ 80k', value: 80000 },
    { label: '≤ 120k', value: 120000 },
  ];

  const today = new Date();
  const tomorrow = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);

  const isToday =
    date !== null &&
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate();

  const isTomorrow =
    date !== null &&
    date.getFullYear() === tomorrow.getFullYear() &&
    date.getMonth() === tomorrow.getMonth() &&
    date.getDate() === tomorrow.getDate();

  const activeCount = [
    area !== 'Tất cả',
    radius !== 100,
    date !== null,
    skill !== null,
    maxFee !== null,
    availableOnly,
  ].filter(Boolean).length;

  const handleReset = () => {
    setArea('Tất cả');
    setRadius(100);
    setDate(null);
    setSkill(null);
    setMaxFee(null);
    setAvailableOnly(false);
  };

  const handleApply = () => {
    onApply(
      new RoomFilterState({
        area,
        radius,
        date,
        skill,
        maxFee,
        availableOnly,
      })
    );
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/54 transition-opacity animate-fade-in select-none">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="relative w-full max-w-full sm:max-w-[540px] max-h-[88vh] bg-app-surface border-t sm:border border-app-border rounded-t-[24px] sm:rounded-b-[24px] p-5 pb-8 overflow-y-auto z-10 shadow-2xl flex flex-col">
        {/* Drag handle */}
        <div className="w-9 h-1 bg-app-border rounded-full mx-auto mb-3" />

        {/* Header */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-app-border/40">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-extrabold tracking-wide text-app-text uppercase">
              BỘ LỌC PHÒNG CHƠI
            </h3>
            {activeCount > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-app-primary text-app-on-primary text-[10px] font-bold">
                {activeCount}
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {activeCount > 0 && (
              <button
                type="button"
                onClick={handleReset}
                className="flex items-center gap-1 text-xs text-app-loss font-semibold hover:underline"
              >
                <RotateCcw size={12} />
                <span>Đặt lại</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="p-1 text-app-muted hover:text-app-text rounded-full transition-colors"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Filter Content */}
        <div className="flex flex-col gap-5 py-1">
          {/* Section 1: Khu vực & bán kính */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-text mb-2.5">
              <MapPin size={14} className="text-app-primary" />
              <span>KHU VỰC HOẠT ĐỘNG</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {areas.map((a) => (
                <button
                  key={a}
                  type="button"
                  onClick={() => setArea(a)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    area === a
                      ? 'bg-app-primary/15 border-app-primary text-app-primary font-bold'
                      : 'bg-app-background border-app-border text-app-text hover:border-app-muted'
                  }`}
                >
                  {a}
                </button>
              ))}
            </div>
          </div>

          {/* Section 2: Thời gian */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-text mb-2.5">
              <Calendar size={14} className="text-app-primary" />
              <span>THỜI GIAN</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => setDate(isToday ? null : today)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isToday
                    ? 'bg-app-primary/15 border-app-primary text-app-primary font-bold'
                    : 'bg-app-background border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                Hôm nay
              </button>
              <button
                type="button"
                onClick={() => setDate(isTomorrow ? null : tomorrow)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                  isTomorrow
                    ? 'bg-app-primary/15 border-app-primary text-app-primary font-bold'
                    : 'bg-app-background border-app-border text-app-text hover:border-app-muted'
                }`}
              >
                Ngày mai
              </button>
              <input
                type="date"
                value={
                  date
                    ? `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
                    : ''
                }
                onChange={(e) => {
                  if (e.target.value) {
                    const [y, m, d] = e.target.value.split('-').map(Number);
                    setDate(new Date(y, m - 1, d));
                  } else {
                    setDate(null);
                  }
                }}
                className="bg-app-background border border-app-border rounded-xl px-3 py-1.5 text-xs font-semibold text-app-text outline-hidden"
              />
            </div>
          </div>

          {/* Section 3: Trình độ tối thiểu */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-text mb-2.5">
              <Award size={14} className="text-app-primary" />
              <span>TRÌNH ĐỘ TỐI THIỂU</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {skillOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setSkill(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    skill === opt.value
                      ? 'bg-app-primary/15 border-app-primary text-app-primary font-bold'
                      : 'bg-app-background border-app-border text-app-text hover:border-app-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 4: Mức phí tối đa */}
          <div>
            <div className="flex items-center gap-1.5 text-xs font-bold text-app-text mb-2.5">
              <DollarSign size={14} className="text-app-primary" />
              <span>MỨC PHÍ TỐI ĐA</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {feeOptions.map((opt) => (
                <button
                  key={opt.label}
                  type="button"
                  onClick={() => setMaxFee(opt.value)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                    maxFee === opt.value
                      ? 'bg-app-primary/15 border-app-primary text-app-primary font-bold'
                      : 'bg-app-background border-app-border text-app-text hover:border-app-muted'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          {/* Section 5: Trạng thái còn chỗ */}
          <div className="flex items-center justify-between py-2 border-t border-app-border/40">
            <div className="flex items-center gap-2">
              <Users size={16} className="text-app-primary" />
              <span className="text-xs font-bold text-app-text">
                Chỉ hiển thị phòng còn chỗ trống
              </span>
            </div>
            <input
              type="checkbox"
              checked={availableOnly}
              onChange={(e) => setAvailableOnly(e.target.checked)}
              className="w-5 h-5 accent-app-primary rounded cursor-pointer"
            />
          </div>
        </div>

        {/* Apply CTA Button */}
        <button
          type="button"
          onClick={handleApply}
          className="w-full h-12 mt-4 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-sm tracking-wide flex items-center justify-center hover:brightness-105 active:scale-[0.99] transition-all shadow-xs"
        >
          ÁP DỤNG BỘ LỌC
        </button>
      </div>
    </div>
  );
};

