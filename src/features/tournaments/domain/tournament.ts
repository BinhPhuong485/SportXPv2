export interface Tournament {
  id: string;
  title: string;
  venueName: string;
  address: string;
  format: 'singles' | 'doubles' | 'mixed' | string;
  entryFee: number;
  prizePool: number;
  maxSlots: number;
  currentSlots: number;
  startDate: string;
  status: 'registering' | 'ongoing' | 'completed' | string;
  minTier?: string | null;
  maxTier?: string | null;
  bannerUrl?: string | null;
}

export function getFormatLabel(format: string): string {
  switch (format) {
    case 'singles':
      return 'Đơn Nam / Nữ';
    case 'mixed':
      return 'Đôi Nam Nữ';
    case 'doubles':
    default:
      return 'Đôi Nam / Đôi Nữ';
  }
}

export function getRankRequirement(minTier?: string | null, maxTier?: string | null): string {
  if (minTier && maxTier) {
    return `${minTier} - ${maxTier}`;
  } else if (minTier) {
    return `Từ ${minTier} trở lên`;
  } else if (maxTier) {
    return `Dưới ${maxTier}`;
  }
  return 'Mọi cấp độ';
}

export function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  const dt = new Date(dateStr);
  if (isNaN(dt.getTime())) return dateStr;
  const day = String(dt.getDate()).padStart(2, '0');
  const month = String(dt.getMonth() + 1).padStart(2, '0');
  const year = dt.getFullYear();
  return `${day}/${month}/${year}`;
}

export function formatPrizeCurrency(amount: number): string {
  if (amount <= 0) return '0đ';
  const millions = amount / 1000000;
  return `${millions.toFixed(1).replace('.0', '')}tr`;
}

export function parseTournament(json: Record<string, unknown>): Tournament {
  return {
    id: String(json.id || ''),
    title: String(json.title || ''),
    venueName: String(json.venue_name || json.venueName || ''),
    address: String(json.address || ''),
    format: String(json.format || 'doubles'),
    entryFee: Number(json.entry_fee ?? json.entryFee ?? 0),
    prizePool: Number(json.prize_pool ?? json.prizePool ?? 0),
    maxSlots: Number(json.max_slots ?? json.maxSlots ?? 16),
    currentSlots: Number(json.current_slots ?? json.currentSlots ?? 0),
    startDate: String(json.start_date || json.startDate || new Date().toISOString()),
    status: String(json.status || 'registering'),
    minTier: json.min_tier != null ? String(json.min_tier) : null,
    maxTier: json.max_tier != null ? String(json.max_tier) : null,
    bannerUrl: json.banner_url != null ? String(json.banner_url) : null,
  };
}

