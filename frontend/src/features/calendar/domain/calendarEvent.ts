import { ManagedRoomData } from '../../rooms/domain/managedRoom';
import { Tournament } from '../../tournaments/domain/tournament';

export type CalendarEventType = 'hosting' | 'joined' | 'waitlist' | 'tournament';

export interface CalendarEvent {
  id: string;
  title: string;
  subtitle: string;
  type: CalendarEventType;
  status: string;
  isCancelled: boolean;
  startsAt: Date;
  endsAt: Date;
  isAllDay?: boolean;
  roomCode?: string;
  rawRoom?: ManagedRoomData;
  rawTournament?: Tournament;
}

export function roomToCalendarEvent(room: ManagedRoomData): CalendarEvent {
  const isCancelled = room.status === 'CANCELLED';
  let type: CalendarEventType = 'joined';
  if (room.isHost) {
    type = 'hosting';
  } else if (room.myStatus === 'WAITLIST') {
    type = 'waitlist';
  }

  return {
    id: `room-${room.id}`,
    title: room.title || `Kèo đấu tại ${room.courtName}`,
    subtitle: room.courtName,
    type,
    status: room.status,
    isCancelled,
    startsAt: room.startsAt,
    endsAt: room.endsAt,
    isAllDay: false,
    roomCode: room.roomCode,
    rawRoom: room,
  };
}

export function tournamentToCalendarEvent(t: Tournament): CalendarEvent {
  const start = new Date(t.startDate);
  const validStart = isNaN(start.getTime()) ? new Date() : start;
  return {
    id: `tournament-${t.id}`,
    title: t.title,
    subtitle: t.venueName,
    type: 'tournament',
    status: t.status,
    isCancelled: false,
    startsAt: validStart,
    endsAt: validStart,
    isAllDay: true,
    rawTournament: t,
  };
}
