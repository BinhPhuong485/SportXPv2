export interface RoomMember {
  user_id: string;
  status: string;
  id?: string;
  public_id?: string;
  name?: string;
  display_name?: string;
  elo_rating?: number | null;
  tier_name?: string | null;
  avatar_url?: string | null;
  role?: string;
  is_host?: boolean;
  is_playing?: boolean;
  cancellation_kind?: string | null;
  created_at?: string;
  [key: string]: unknown;
}

export interface Court {
  id: string;
  name: string;
  distance_km?: number;
}

export function newRoomRequestId(): string {
  // RFC4122 v4 UUID generator matching Dart
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  const hex = Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
  return `${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}`;
}

export interface RoomCommand {
  action: string;
  roomId?: string;
  payload: Record<string, unknown>;
  requestId: string;
}

export function createRoomCommand(
  action: string,
  options?: {
    roomId?: string;
    payload?: Record<string, unknown>;
    requestId?: string;
  }
): RoomCommand {
  return {
    action,
    roomId: options?.roomId,
    payload: options?.payload ?? {},
    requestId: options?.requestId ?? newRoomRequestId(),
  };
}

export interface ManagedRoomData {
  id: string;
  courtId: string;
  title: string;
  courtName: string;
  address: string;
  startsAt: Date;
  endsAt: Date;
  cancelBy: Date;
  capacity: number;
  reserved: number;
  minElo: number;
  maxElo: number;
  fee: number;
  revision: number;
  visibility: 'PUBLIC' | 'PRIVATE' | string;
  status: 'DRAFT' | 'OPEN' | 'FULL' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED' | string;
  hostPlays: boolean;
  isHost: boolean;
  hostName: string;
  myStatus: string | null;
  cancellationReason: string | null;
  notes: string;
  courtLabel: string;
  bookingStatus: string;
  viewerId: string | null;
  roomCode: string;
  roomType: 'PUBLIC_RECRUIT' | 'PRIVATE_RATED';
  joinCode: string | null;
  isRated: boolean;
  zaloGroupLink: string | null;
  members: RoomMember[];
  canRegister: boolean;
  canEdit: boolean;
  statusLabel: string;
  targetGender?: 'all' | 'male' | 'female';
}

export function parseManagedRoom(json: Record<string, unknown>): ManagedRoomData {
  const id = String(json.id || '');
  const startsAt = new Date(json.starts_at as string);
  const endsAt = new Date(json.ends_at as string);
  const cancelBy = new Date(json.cancel_by as string);
  const capacity = Number(json.capacity ?? 4);
  const reserved = Number(json.reserved ?? 0);
  const minElo = Number(json.min_elo ?? 0);
  const maxElo = Number(json.max_elo ?? 2000);
  const fee = Number(json.fee ?? 0);
  const revision = Number(json.revision ?? 0);
  const status = String(json.status || 'OPEN');
  const isHost = Boolean(json.is_host);
  const hostPlays = Boolean(json.host_plays ?? true);

  const roomCode =
    (json.room_code as string) ||
    (id.length >= 6
      ? `#XP-${id.replace(/-/g, '').substring(0, 4).toUpperCase()}`
      : '#XP-8888');

  // Robust detection for Flow B Private Rated Match Lobby
  const notesStr = String(json.notes || '');
  const codeMatch = notesStr.match(/\[CODE:([A-Za-z0-9_-]+)\]/);
  const isExplicitPrivate =
    String(json.room_type || '') === 'PRIVATE_RATED' ||
    String(json.visibility || '') === 'PRIVATE' ||
    Boolean(codeMatch) ||
    String(json.title || '').toLowerCase().includes('tính elo') ||
    String(json.title || '').toLowerCase().includes('1vs1') ||
    String(json.title || '').toLowerCase().includes('2vs2');

  const roomType: 'PUBLIC_RECRUIT' | 'PRIVATE_RATED' = isExplicitPrivate
    ? 'PRIVATE_RATED'
    : 'PUBLIC_RECRUIT';
  const joinCode =
    (json.join_code as string) ||
    (codeMatch ? codeMatch[1] : null) ||
    (roomType === 'PRIVATE_RATED' ? roomCode.replace(/^#/, '') : null);
  const isRated =
    json.is_rated !== undefined && json.is_rated !== null
      ? Boolean(json.is_rated)
      : roomType === 'PRIVATE_RATED';
  const zaloGroupLink = (json.zalo_group_link as string) || null;

  const members: RoomMember[] = Array.isArray(json.members)
    ? (json.members as Record<string, unknown>[]).map((m) => {
        const role = String(m.role || '');
        const isHost = Boolean(m.is_host || role === 'HOST');
        let name = String(m.display_name || m.name || '');
        const publicId = m.public_id ? String(m.public_id) : undefined;
        const userId = String(m.user_id || m.id || publicId || '');

        if (!name || name === 'Vận động viên' || name === 'Người chơi' || name === 'VĐV') {
          if (userId === '9ded99f9-af7d-4297-829a-18e213294403' || String(m.id) === '9ded99f9-af7d-4297-829a-18e213294403') {
            name = 'Square';
          }
        }

        return {
          ...m,
          user_id: userId,
          id: String(m.id || userId),
          public_id: publicId,
          display_name: name || undefined,
          name: name || undefined,
          role: role || (isHost ? 'HOST' : 'PLAYER'),
          status: String(m.status || 'REGISTERED'),
          is_host: isHost,
          is_playing: m.is_playing ?? true,
          cancellation_kind: (m.cancellation_kind as string) || null,
          elo_rating: typeof m.elo_rating === 'number' ? m.elo_rating : undefined,
          tier_name: m.tier_name ? String(m.tier_name) : undefined,
          avatar_url: m.avatar_url ? String(m.avatar_url) : undefined,
        } as RoomMember;
      })
    : [];

  const now = new Date();
  const canRegister = ['OPEN', 'FULL'].includes(status) && startsAt > now;
  const canEdit = isHost && ['DRAFT', 'OPEN', 'FULL'].includes(status);

  const statusLabel =
    status === 'DRAFT'
      ? 'Nháp'
      : status === 'OPEN'
      ? 'Đang tuyển'
      : status === 'FULL'
      ? 'Đủ người'
      : status === 'IN_PROGRESS'
      ? 'Đang diễn ra'
      : status === 'COMPLETED'
      ? 'Đã kết thúc'
      : status === 'CANCELLED'
      ? 'Đã hủy'
      : status;

  let hostName = String(json.host_name || '');
  if (!hostName || hostName === 'Vận động viên' || hostName === 'VĐV') {
    const rawHostId = String(json.host_id || '');
    if (rawHostId === '9ded99f9-af7d-4297-829a-18e213294403') {
      hostName = 'Square';
    } else {
      const hostMember = members.find((m) => m.is_host);
      if (hostMember?.display_name && hostMember.display_name !== 'Vận động viên' && hostMember.display_name !== 'VĐV') {
        hostName = hostMember.display_name;
      }
    }
  }

  return {
    id,
    courtId: String(json.court_id || ''),
    title: String(json.title || ''),
    courtName: String(json.court_name || ''),
    address: String(json.court_address || ''),
    startsAt,
    endsAt,
    cancelBy,
    capacity,
    reserved,
    minElo,
    maxElo,
    fee,
    revision,
    visibility: String(json.visibility || 'PUBLIC'),
    status,
    hostPlays,
    isHost,
    hostName,
    myStatus: (json.my_status as string) || null,
    cancellationReason: (json.cancellation_reason as string) || null,
    notes: String(json.notes || ''),
    courtLabel: String(json.court_label || ''),
    bookingStatus: String(json.booking_status || 'UNCONFIRMED'),
    viewerId: (json.viewer_id as string) || null,
    roomCode,
    roomType,
    joinCode,
    isRated,
    zaloGroupLink,
    members,
    canRegister,
    canEdit,
    statusLabel,
    targetGender: (json.target_gender as 'all' | 'male' | 'female') || (json.targetGender as 'all' | 'male' | 'female') || 'all',
  };
}

export class RoomFilterState {
  area: string = 'Tất cả';
  radius: number = 100;
  date: Date | null = null;
  skill: number | null = null;
  maxFee: number | null = null;
  availableOnly: boolean = false;
  gender: 'all' | 'male' | 'female' | null = null;

  constructor(init?: Partial<RoomFilterState>) {
    if (init) Object.assign(this, init);
  }

  get hasActiveFilter(): boolean {
    return (
      this.area !== 'Tất cả' ||
      this.radius !== 100 ||
      this.date !== null ||
      this.skill !== null ||
      this.maxFee !== null ||
      this.availableOnly ||
      this.gender !== null
    );
  }

  reset(): void {
    this.area = 'Tất cả';
    this.radius = 100;
    this.date = null;
    this.skill = null;
    this.maxFee = null;
    this.availableOnly = false;
    this.gender = null;
  }
}

