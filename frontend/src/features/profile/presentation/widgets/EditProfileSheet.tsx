import React, { useState, useEffect } from 'react';
import { X, User, MapPin, Phone, MessageSquare, ExternalLink, FileText, Calendar } from 'lucide-react';
import { PlayerProfile } from '../../domain/playerProfile';
import { Court } from '../../../rooms/data/managedRoomRepository';
import { Button } from '../../../../shared/components/Button';

interface EditProfileSheetProps {
  isOpen: boolean;
  profile: PlayerProfile;
  loadCourts: () => Promise<Court[]>;
  onClose: () => void;
  onSave: (params: {
    displayName: string;
    homeCourtId: string | null;
    zaloPhone?: string | null;
    zaloLink?: string | null;
    facebookLink?: string | null;
    bio?: string | null;
    district?: string | null;
    gender?: 'male' | 'female' | 'other' | null;
    age?: number | null;
    birthYear?: number | null;
  }) => Promise<void>;
}

export const EditProfileSheet: React.FC<EditProfileSheetProps> = ({
  isOpen,
  profile,
  loadCourts,
  onClose,
  onSave,
}) => {
  const [displayName, setDisplayName] = useState(profile.displayName || '');
  const [homeCourtId, setHomeCourtId] = useState<string | null>(profile.homeCourtId || null);
  const [district, setDistrict] = useState(profile.district || '');
  const [gender, setGender] = useState<'male' | 'female' | 'other' | null>(profile.gender || null);
  const [age, setAge] = useState<string>(profile.age != null ? String(profile.age) : '');
  const [zaloPhone, setZaloPhone] = useState(profile.zaloPhone || '');
  const [zaloLink, setZaloLink] = useState(profile.zaloLink || '');
  const [facebookLink, setFacebookLink] = useState(profile.facebookLink || '');
  const [bio, setBio] = useState(profile.bio || '');

  const [courts, setCourts] = useState<Court[]>([]);
  const [loadingCourts, setLoadingCourts] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setDisplayName(profile.displayName || '');
      setHomeCourtId(profile.homeCourtId || null);
      setDistrict(profile.district || '');
      setGender(profile.gender || null);
      setAge(profile.age != null ? String(profile.age) : '');
      setZaloPhone(profile.zaloPhone || '');
      setZaloLink(profile.zaloLink || '');
      setFacebookLink(profile.facebookLink || '');
      setBio(profile.bio || '');
      setError(null);
      setLoadingCourts(true);
      loadCourts()
        .then((list) => {
          setCourts(list);
          setLoadingCourts(false);
        })
        .catch(() => setLoadingCourts(false));
    }
  }, [isOpen, profile, loadCourts]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = displayName.trim();
    if (!trimmed) {
      setError('Tên hiển thị không được để trống.');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const parsedAge = age.trim() ? parseInt(age.trim(), 10) : null;
      if (parsedAge !== null && (isNaN(parsedAge) || parsedAge < 6 || parsedAge > 100)) {
        setError('Độ tuổi không hợp lệ (từ 6 đến 100 tuổi).');
        setSaving(false);
        return;
      }
      await onSave({
        displayName: trimmed,
        homeCourtId,
        district: district.trim() || null,
        zaloPhone: zaloPhone.trim() || null,
        zaloLink: zaloLink.trim() || null,
        facebookLink: facebookLink.trim() || null,
        bio: bio.trim() || null,
        gender: gender || null,
        age: parsedAge,
        birthYear: parsedAge ? new Date().getFullYear() - parsedAge : null,
      });
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Không thể lưu thay đổi. Vui lòng thử lại.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-xs transition-opacity animate-in fade-in duration-200 p-0 sm:p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-[640px] max-h-[92vh] overflow-y-auto bg-app-surface rounded-t-bento sm:rounded-2xl p-6 pb-9 border border-app-border shadow-2xl flex flex-col gap-4 animate-in slide-in-from-bottom duration-300 ease-out"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drag handle */}
        <div className="w-10 h-1 rounded-full bg-app-border mx-auto -mt-1 mb-1 sm:hidden" />

        {/* Header */}
        <div className="flex items-center justify-between pb-2 border-b border-app-border/40">
          <div>
            <span className="text-[11px] font-black text-app-muted tracking-widest uppercase">
              THIẾT LẬP THÔNG TIN
            </span>
            <h3 className="text-base font-black text-app-text mt-0.5">
              Chỉnh sửa hồ sơ & liên hệ
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Error notification */}
        {error && (
          <div className="p-3 rounded-btn bg-app-loss/10 border border-app-loss/30 text-app-loss text-xs font-bold">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          {/* Display Name field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">Tên hiển thị *</label>
            <div className="relative flex items-center">
              <User size={16} className="absolute left-3.5 text-app-muted" />
              <input
                type="text"
                value={displayName}
                maxLength={40}
                onChange={(e) => setDisplayName(e.target.value)}
                placeholder="Nhập tên hiển thị..."
                className="w-full h-12 pl-10 pr-4 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Gender & Age field */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {/* Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-app-text">Giới tính</label>
              <div className="grid grid-cols-3 gap-1 h-12 p-1 bg-app-background border border-app-border rounded-btn">
                <button
                  type="button"
                  onClick={() => setGender('male')}
                  className={`h-full text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    gender === 'male'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  Nam
                </button>
                <button
                  type="button"
                  onClick={() => setGender('female')}
                  className={`h-full text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    gender === 'female'
                      ? 'bg-rose-500 text-white shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  Nữ
                </button>
                <button
                  type="button"
                  onClick={() => setGender('other')}
                  className={`h-full text-xs font-bold rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                    gender === 'other'
                      ? 'bg-purple-600 text-white shadow-xs'
                      : 'text-app-muted hover:text-app-text'
                  }`}
                >
                  Khác
                </button>
              </div>
            </div>

            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-black text-app-text">Độ tuổi</label>
              <div className="relative flex items-center">
                <Calendar size={16} className="absolute left-3.5 text-app-muted pointer-events-none" />
                <input
                  type="number"
                  min={6}
                  max={100}
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  placeholder="VD: 24"
                  className="w-full h-12 pl-10 pr-4 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all"
                />
              </div>
            </div>
          </div>

          {/* Home Court field */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">
              Sân nhà / Sân quen thuộc (Home Court)
            </label>
            <div className="relative flex items-center">
              <MapPin size={16} className="absolute left-3.5 text-app-muted pointer-events-none" />
              <select
                value={homeCourtId || ''}
                disabled={loadingCourts}
                onChange={(e) => setHomeCourtId(e.target.value || null)}
                className="w-full h-12 pl-10 pr-8 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all appearance-none cursor-pointer"
              >
                <option value="">Chưa chọn sân quen (Tự do)</option>
                {courts.map((court) => (
                  <option key={court.id} value={court.id}>
                    {court.distance_km != null
                      ? `${court.name} (${court.distance_km.toFixed(1)} km)`
                      : court.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* District / Region */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">
              Khu vực / Quận sinh hoạt chính
            </label>
            <input
              type="text"
              value={district}
              maxLength={50}
              onChange={(e) => setDistrict(e.target.value)}
              placeholder="Ví dụ: Quận 10, Tân Bình, TP. Thủ Đức..."
              className="w-full h-12 px-4 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all"
            />
          </div>

          {/* Contact Section Heading */}
          <div className="pt-2 border-t border-app-border/40">
            <span className="text-xs font-black text-app-muted uppercase tracking-wider">
              Kênh liên hệ (Zalo / Facebook)
            </span>
            <p className="text-[11px] text-app-muted mt-0.5">
              Đồng đội trong phòng chơi có thể bấm liên hệ trực tiếp ngoài đời
            </p>
          </div>

          {/* Zalo Phone / Number */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">Số điện thoại Zalo</label>
            <div className="relative flex items-center">
              <Phone size={16} className="absolute left-3.5 text-app-muted" />
              <input
                type="tel"
                value={zaloPhone}
                maxLength={20}
                onChange={(e) => setZaloPhone(e.target.value)}
                placeholder="Ví dụ: 0901234567"
                className="w-full h-12 pl-10 pr-4 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Zalo Link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">Link Zalo cá nhân (tùy chọn)</label>
            <div className="relative flex items-center">
              <MessageSquare size={16} className="absolute left-3.5 text-app-muted" />
              <input
                type="url"
                value={zaloLink}
                maxLength={200}
                onChange={(e) => setZaloLink(e.target.value)}
                placeholder="https://zalo.me/..."
                className="w-full h-12 pl-10 pr-4 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Facebook Link */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">Link Facebook cá nhân</label>
            <div className="relative flex items-center">
              <ExternalLink size={16} className="absolute left-3.5 text-app-muted" />
              <input
                type="url"
                value={facebookLink}
                maxLength={200}
                onChange={(e) => setFacebookLink(e.target.value)}
                placeholder="https://facebook.com/..."
                className="w-full h-12 pl-10 pr-4 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all"
              />
            </div>
          </div>

          {/* Bio / Giới thiệu */}
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-black text-app-text">Giới thiệu ngắn / Thời gian rảnh</label>
            <div className="relative flex items-start">
              <FileText size={16} className="absolute left-3.5 top-3.5 text-app-muted" />
              <textarea
                value={bio}
                maxLength={300}
                rows={3}
                onChange={(e) => setBio(e.target.value)}
                placeholder="Ví dụ: Đánh đơn/đôi đều được. Thường rảnh tối T3, T5, CN..."
                className="w-full pl-10 pr-4 py-3 rounded-btn bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-1 focus:ring-app-primary/30 transition-all resize-none"
              />
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            disabled={saving}
            loading={saving}
            className="w-full uppercase tracking-wider text-xs font-black mt-2 shadow-xs"
          >
            LƯU THAY ĐỔI HỒ SƠ
          </Button>
        </form>
      </div>
    </div>
  );
};
