import { rankTierFromElo } from '../../../rankings/domain/rankTier';

export abstract class RoomUiFormatters {
  static dateRange(start: Date, end: Date): string {
    const now = new Date();
    const isToday =
      start.getFullYear() === now.getFullYear() &&
      start.getMonth() === now.getMonth() &&
      start.getDate() === now.getDate();

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const isTomorrow =
      start.getFullYear() === tomorrow.getFullYear() &&
      start.getMonth() === tomorrow.getMonth() &&
      start.getDate() === tomorrow.getDate();

    const weekdayMap = ['Chủ Nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'];
    const weekday = weekdayMap[start.getDay()];

    const startTime = `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`;
    const endTime = `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`;

    const isOvernight =
      end.getFullYear() !== start.getFullYear() ||
      end.getMonth() !== start.getMonth() ||
      end.getDate() !== start.getDate();
    const overnightTag = isOvernight ? ' (+1 ngày)' : '';

    const diffMs = end.getTime() - start.getTime();
    const durationHours = Math.floor(diffMs / (1000 * 60 * 60));
    const durationMins = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    const durationStr =
      durationHours > 0 && durationMins > 0
        ? `${durationHours}h${durationMins}p`
        : durationHours > 0
        ? `${durationHours}h`
        : `${durationMins}p`;

    if (isToday) {
      return `Hôm nay, ${startTime}–${endTime}${overnightTag} (${durationStr})`;
    } else if (isTomorrow) {
      return `Ngày mai, ${startTime}–${endTime}${overnightTag} (${durationStr})`;
    } else {
      return `${weekday}, ${start.getDate()}/${start.getMonth() + 1} • ${startTime}–${endTime}${overnightTag} (${durationStr})`;
    }
  }

  static deadline(dt: Date): string {
    const now = new Date();
    const isToday =
      dt.getFullYear() === now.getFullYear() &&
      dt.getMonth() === now.getMonth() &&
      dt.getDate() === now.getDate();

    const tomorrow = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1);
    const isTomorrow =
      dt.getFullYear() === tomorrow.getFullYear() &&
      dt.getMonth() === tomorrow.getMonth() &&
      dt.getDate() === tomorrow.getDate();

    const timeStr = `${String(dt.getHours()).padStart(2, '0')}:${String(dt.getMinutes()).padStart(2, '0')}`;
    const dateStr = `${String(dt.getDate()).padStart(2, '0')}/${String(dt.getMonth() + 1).padStart(2, '0')}/${dt.getFullYear()}`;

    if (isToday) {
      return `Trước ${timeStr} hôm nay`;
    } else if (isTomorrow) {
      return `Trước ${timeStr} ngày mai`;
    } else {
      return `Trước ${timeStr}, ${dateStr}`;
    }
  }

  static currency(amount: number): string {
    if (amount <= 0) return 'Miễn phí';
    const s = Math.round(amount).toString();
    const parts: string[] = [];
    for (let i = s.length; i > 0; i -= 3) {
      parts.unshift(s.substring(Math.max(0, i - 3), i));
    }
    return `${parts.join('.')}đ`;
  }

  static skillRange(minElo: number, maxElo: number): string {
    if (minElo <= 0 && maxElo >= 2000) return 'Mọi trình độ';
    const minTier = rankTierFromElo(minElo);
    const maxTier = rankTierFromElo(maxElo);
    if (minTier.key === maxTier.key) return `${minTier.label} (${minElo}–${maxElo})`;
    return `${minTier.label} – ${maxTier.label} (${minElo}–${maxElo})`;
  }
}

