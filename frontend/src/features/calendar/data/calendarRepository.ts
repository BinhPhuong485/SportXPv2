import { managedRoomRepository } from '../../rooms/data/managedRoomRepository';
import { tournamentRepository } from '../../tournaments/data/tournamentRepository';
import { ManagedRoomData } from '../../rooms/domain/managedRoom';
import {
  CalendarEvent,
  roomToCalendarEvent,
  tournamentToCalendarEvent,
} from '../domain/calendarEvent';

export class CalendarRepository {
  async loadUserCalendarEvents(): Promise<CalendarEvent[]> {
    const allRoomsMap = new Map<string, ManagedRoomData>();

    // 1. Fetch user's active/joined rooms ('mine')
    try {
      const mineRooms = await managedRoomRepository.list('mine', 0);
      for (const r of mineRooms) {
        allRoomsMap.set(r.id, r);
      }
    } catch (e) {
      console.warn('Failed to load mine rooms for calendar:', e);
    }

    // 2. Fetch user's historical rooms ('history')
    try {
      const historyRooms = await managedRoomRepository.list('history', 0);
      for (const r of historyRooms) {
        if (!allRoomsMap.has(r.id)) {
          allRoomsMap.set(r.id, r);
        }
      }
    } catch (e) {
      console.warn('Failed to load history rooms for calendar:', e);
    }

    const roomEvents: CalendarEvent[] = Array.from(allRoomsMap.values()).map(roomToCalendarEvent);

    // 3. Fetch user's registered tournaments
    const tournamentEvents: CalendarEvent[] = [];
    try {
      const [allTournaments, myRegIds] = await Promise.all([
        tournamentRepository.listTournaments(),
        tournamentRepository.getMyRegistrations(),
      ]);

      const registeredTournaments = allTournaments.filter((t) => myRegIds.includes(t.id));
      for (const t of registeredTournaments) {
        tournamentEvents.push(tournamentToCalendarEvent(t));
      }
    } catch (e) {
      console.warn('Failed to load registered tournaments for calendar:', e);
    }

    // Combine and sort by startsAt ascending
    const combined = [...roomEvents, ...tournamentEvents].sort(
      (a, b) => a.startsAt.getTime() - b.startsAt.getTime()
    );

    return combined;
  }
}

export const calendarRepository = new CalendarRepository();
