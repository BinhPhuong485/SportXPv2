export interface RoomMember {
  user_id: string;
  status: string;
  display_name?: string;
  elo_rating?: number;
  tier_name?: string;
  is_host?: boolean;
  is_playing?: boolean;
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
  members: RoomMember[];
  canRegister: boolean;
  canEdit: boolean;
  statusLabel: string;
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

  const members = Array.isArray(json.members)
    ? (json.members as RoomMember[])
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
    hostName: String(json.host_name || ''),
    myStatus: (json.my_status as string) || null,
    cancellationReason: (json.cancellation_reason as string) || null,
    notes: String(json.notes || ''),
    courtLabel: String(json.court_label || ''),
    bookingStatus: String(json.booking_status || 'UNCONFIRMED'),
    viewerId: (json.viewer_id as string) || null,
    roomCode,
    members,
    canRegister,
    canEdit,
    statusLabel,
  };
}

export class RoomFilterState {
  area: string = 'Tất cả';
  radius: number = 100;
  date: Date | null = null;
  skill: number | null = null;
  maxFee: number | null = null;
  availableOnly: boolean = false;

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
      this.availableOnly
    );
  }

  reset(): void {
    this.area = 'Tất cả';
    this.radius = 100;
    this.date = null;
    this.skill = null;
    this.maxFee = null;
    this.availableOnly = false;
  }
}

