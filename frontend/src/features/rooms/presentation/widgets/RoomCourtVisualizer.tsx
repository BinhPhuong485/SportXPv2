import React from 'react';
import { Users, Plus, Shield, Flame } from 'lucide-react';
import { ManagedRoomData, RoomMember } from '../../domain/managedRoom';
import { Avatar } from '../../../../shared/components/Avatar';
import { RoomUiFormatters } from './roomUiFormatters';

interface RoomCourtVisualizerProps {
  room: ManagedRoomData;
}

/**
 * RoomCourtVisualizer - Atomic Molecule Component
 * Renders an esports-grade tactical badminton court visualizer.
 * Adapts dynamically to both Light and Dark themes, with proportional
 * court aspect ratio to prevent horizontal stretching.
 */
export const RoomCourtVisualizer: React.FC<RoomCourtVisualizerProps> = ({ room }) => {
  const capacity = Math.max(2, room.capacity || 4);
  const is1v1 = capacity <= 2;

  // Find host and members
  const hostMember = room.members.find((m) => m.is_host) || room.members[0];
  const registeredMembers = (room.members || []).filter((m) => {
    const st = String(m.status || '');
    return st === 'REGISTERED' || st === 'RECONFIRM' || m.is_host;
  });
  const nonHostMembers = registeredMembers.filter((m) => m !== hostMember && !m.is_host);

  // Available slots
  const availableSlots = Math.max(0, capacity - room.reserved);

  // Helper to get concise display name
  const getShortName = (m?: RoomMember, fallback = 'VĐV') => {
    if (!m) return fallback;
    const raw = m.display_name || m.name;
    if (!raw || raw === 'Vận động viên' || raw === 'VĐV' || raw === 'Người chơi') {
      if (m.user_id === '9ded99f9-af7d-4297-829a-18e213294403' || m.public_id === 'ba1fd41e-b597-48d3-867a-5735bbc67d41') {
        return 'Square';
      }
      if (m.user_id === 'f7222a03-3cac-4f57-ba30-082423d92542' || m.public_id === '39dd3527-13ed-453a-a85b-abfcc96f8756') {
        return 'Cao Bồ';
      }
      return fallback;
    }
    const parts = raw.trim().split(/\s+/);
    return parts[parts.length - 1] || fallback;
  };

  // Determine players for Team A and Team B
  const teamAPlayers: (RoomMember | undefined)[] = [];
  const teamBPlayers: (RoomMember | undefined)[] = [];

  // Team A slot 1: Host
  teamAPlayers.push(hostMember);

  // Team A slot 2 (if doubles)
  if (!is1v1) {
    teamAPlayers.push(nonHostMembers[0]);
  }

  // Team B slots
  if (is1v1) {
    teamBPlayers.push(nonHostMembers[0]);
  } else {
    teamBPlayers.push(nonHostMembers[1]);
    teamBPlayers.push(nonHostMembers[2]);
  }

  // Render a player on the court
  const renderPlayer = (member: RoomMember | undefined, isHost: boolean) => {
    if (member) {
      const name = isHost ? (room.hostName?.trim().split(/\s+/).pop() || getShortName(member, 'Host')) : getShortName(member);
      return (
        <div className="flex flex-col items-center gap-1 min-w-0 z-10">
          <div className="relative">
            <Avatar
              src={member.avatar_url}
              alt={name}
              size="sm"
              className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full ring-2 shadow-md ${
                isHost ? 'ring-amber-400 bg-amber-500/20' : 'ring-emerald-500/80 bg-emerald-500/20 dark:ring-emerald-400/80'
              }`}
            />
            {isHost && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[7px] px-1 py-0.2 rounded font-mono shadow-xs">
                HOST
              </span>
            )}
          </div>
          <span className="px-1.5 py-0.5 rounded bg-white/95 text-slate-800 border border-emerald-300/70 dark:bg-black/75 dark:text-white dark:border-white/10 text-[9px] sm:text-[10px] font-bold truncate max-w-[64px] sm:max-w-[76px] shadow-2xs leading-none">
            {name}
          </span>
        </div>
      );
    }

    // Empty slot
    return (
      <div className="flex flex-col items-center gap-1 min-w-0 z-10 group/slot">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-emerald-500/80 bg-white/80 dark:border-emerald-400/70 dark:bg-emerald-500/15 flex items-center justify-center text-emerald-600 dark:text-emerald-300 shadow-xs group-hover/slot:border-emerald-600 dark:group-hover/slot:border-emerald-300 transition-colors">
          <Plus size={14} className="animate-pulse" />
        </div>
        <span className="px-1.5 py-0.5 rounded bg-white/95 border border-emerald-400/70 text-emerald-700 dark:bg-emerald-950/80 dark:border-emerald-500/40 dark:text-emerald-300 text-[9px] sm:text-[10px] font-bold shadow-2xs leading-none">
          + Trống
        </span>
      </div>
    );
  };

  return (
    <div className="w-full flex justify-center py-0.5">
      <div className="relative w-full max-w-[420px] sm:max-w-[460px] aspect-[2.15/1] min-h-[168px] sm:min-h-[178px] rounded-2xl overflow-hidden border border-emerald-300/80 dark:border-emerald-500/30 shadow-xs dark:shadow-inner flex flex-col justify-between p-2.5 sm:p-3 select-none bg-gradient-to-b from-[#e3f6ea] via-[#daf3e4] to-[#d2eedb] dark:from-[#062217] dark:via-[#0a3324] dark:to-[#061c13] transition-colors">
        {/* 1. SVG Badminton Court Boundaries & Service Lines */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          preserveAspectRatio="none"
          viewBox="0 0 400 180"
        >
          <g stroke="currentColor" strokeWidth="1.5" fill="none" className="text-emerald-700/35 dark:text-white/20">
            {/* Outer Boundary Line */}
            <rect x="20" y="16" width="360" height="148" rx="4" />

            {/* Doubles Sideline (Inner margin) */}
            <line x1="20" y1="30" x2="380" y2="30" strokeOpacity="0.65" />
            <line x1="20" y1="150" x2="380" y2="150" strokeOpacity="0.65" />

            {/* Short Service Lines (near net) */}
            <line x1="150" y1="16" x2="150" y2="164" strokeOpacity="0.85" />
            <line x1="250" y1="16" x2="250" y2="164" strokeOpacity="0.85" />

            {/* Center Service Line (Horizontal) */}
            <line x1="20" y1="90" x2="150" y2="90" strokeOpacity="0.85" />
            <line x1="250" y1="90" x2="380" y2="90" strokeOpacity="0.85" />

            {/* Long Service Lines (Back) */}
            <line x1="45" y1="16" x2="45" y2="164" strokeOpacity="0.65" />
            <line x1="355" y1="16" x2="355" y2="164" strokeOpacity="0.65" />
          </g>

          {/* Center Net (Thick Vertical Net with Mesh Pattern) */}
          <line
            x1="200"
            y1="12"
            x2="200"
            y2="168"
            stroke="currentColor"
            strokeWidth="2.5"
            strokeDasharray="4 2"
            className="text-emerald-800/60 dark:text-white/45"
          />

          {/* Center Ambient Circle / Court Circle */}
          <ellipse
            cx="200"
            cy="90"
            rx="65"
            ry="32"
            fill="currentColor"
            className="text-emerald-600/10 dark:text-emerald-400/10"
          />
        </svg>

        {/* 2. Top Row Overlay Badges: Sport Format, VS, Target Gender */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Left: Sport Format */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/95 border border-emerald-300/70 text-emerald-900 dark:bg-black/60 dark:border-white/15 dark:text-white font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-xs backdrop-blur-xs">
            <span>🏸</span>
            <span>{is1v1 ? 'Cầu lông đơn (1v1)' : 'Cầu lông đôi (2v2)'}</span>
          </div>

          {/* Center Net VS Pill */}
          <div className="absolute left-1/2 -translate-x-1/2 top-0 px-2 py-0.5 rounded-full bg-white/95 border border-emerald-300/70 text-emerald-800 dark:bg-white/15 dark:border-white/20 dark:text-white font-mono text-[9px] font-black uppercase tracking-widest shadow-xs backdrop-blur-xs">
            VS
          </div>

          {/* Right: Target Gender Badge */}
          {room.targetGender === 'female' ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-100/95 border border-rose-300/80 text-rose-700 dark:bg-rose-500/80 dark:border-rose-300/30 dark:text-white font-mono text-[10px] font-bold shadow-xs backdrop-blur-xs">
              <span>♀</span>
              <span>Kèo Nữ</span>
            </span>
          ) : room.targetGender === 'male' ? (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-100/95 border border-blue-300/80 text-blue-700 dark:bg-blue-600/80 dark:border-blue-300/30 dark:text-white font-mono text-[10px] font-bold shadow-xs backdrop-blur-xs">
              <span>♂</span>
              <span>Kèo Nam</span>
            </span>
          ) : (
            <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-100/95 border border-purple-300/80 text-purple-700 dark:bg-purple-600/80 dark:border-purple-300/30 dark:text-white font-mono text-[10px] font-bold shadow-xs backdrop-blur-xs">
              <span>⚥</span>
              <span>Nam & Nữ</span>
            </span>
          )}
        </div>

        {/* 3. Center Court: Players on Left (Team A) vs Right (Team B) */}
        <div className="relative z-10 grid grid-cols-2 h-full items-center py-1 sm:py-2 px-3 sm:px-6">
          {/* Team A (Home Side) */}
          <div className={`flex items-center justify-around w-full pr-4 sm:pr-8 ${is1v1 ? 'justify-center' : ''}`}>
            {teamAPlayers.map((player, idx) => (
              <React.Fragment key={`team-a-${idx}`}>
                {renderPlayer(player, idx === 0)}
              </React.Fragment>
            ))}
          </div>

          {/* Team B (Away Side) */}
          <div className={`flex items-center justify-around w-full pl-4 sm:pr-2 sm:pl-8 ${is1v1 ? 'justify-center' : ''}`}>
            {teamBPlayers.map((player, idx) => (
              <React.Fragment key={`team-b-${idx}`}>
                {renderPlayer(player, false)}
              </React.Fragment>
            ))}
          </div>
        </div>

        {/* 4. Bottom Row Overlay: Elo Skill Range & Slot Status */}
        <div className="relative z-10 flex items-center justify-between gap-2">
          {/* Left: Skill Range */}
          <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/95 border border-emerald-300/70 text-slate-700 dark:bg-black/60 dark:border-white/15 dark:text-slate-200 font-mono text-[10px] font-medium shadow-xs truncate max-w-[200px] sm:max-w-none backdrop-blur-xs">
            <Shield size={11} className="text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span className="truncate">
              Elo {room.minElo}–{room.maxElo} ({RoomUiFormatters.skillRange(room.minElo, room.maxElo)})
            </span>
          </div>

          {/* Right: Remaining Slots Status */}
          <div
            className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-extrabold uppercase tracking-wide shadow-xs ${
              availableSlots > 0
                ? 'bg-emerald-600 text-white border border-emerald-700/30 dark:bg-emerald-500 dark:text-slate-950 dark:border-emerald-300/50'
                : 'bg-slate-200/95 text-slate-700 border border-slate-300/80 dark:bg-black/70 dark:text-slate-300 dark:border-white/20'
            }`}
          >
            {availableSlots > 0 ? (
              <>
                <Flame size={12} className="text-white fill-white dark:text-slate-950 dark:fill-slate-950 shrink-0" />
                <span>Còn {availableSlots}/{capacity} chỗ</span>
              </>
            ) : (
              <>
                <Users size={12} className="shrink-0" />
                <span>Đã đủ {capacity}/{capacity}</span>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
