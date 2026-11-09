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
 * Visually displays the court, net, players on Team A (Home) vs Team B (Away),
 * and open slots in a clean, intuitive, clutter-free graphic.
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
                isHost ? 'ring-amber-400 bg-amber-500/20' : 'ring-emerald-400/80 bg-emerald-500/20'
              }`}
            />
            {isHost && (
              <span className="absolute -bottom-1 -right-1 bg-amber-500 text-slate-950 font-black text-[7px] px-1 py-0.2 rounded font-mono shadow-xs">
                HOST
              </span>
            )}
          </div>
          <span className="px-1.5 py-0.5 rounded bg-black/70 backdrop-blur-xs text-white text-[9px] sm:text-[10px] font-bold truncate max-w-[64px] sm:max-w-[76px] shadow-2xs leading-none">
            {name}
          </span>
        </div>
      );
    }

    // Empty slot
    return (
      <div className="flex flex-col items-center gap-1 min-w-0 z-10 group/slot">
        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border-2 border-dashed border-emerald-400/70 bg-emerald-500/15 flex items-center justify-center text-emerald-300 shadow-xs group-hover/slot:border-emerald-300 transition-colors">
          <Plus size={14} className="animate-pulse" />
        </div>
        <span className="px-1.5 py-0.5 rounded bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-[9px] sm:text-[10px] font-bold shadow-2xs leading-none">
          + Trống
        </span>
      </div>
    );
  };

  return (
    <div className="relative w-full h-38 sm:h-44 rounded-2xl overflow-hidden border border-emerald-500/30 shadow-inner flex flex-col justify-between p-2.5 sm:p-3 select-none">
      {/* 1. Deep Athletic Turf Gradient Background */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'linear-gradient(135deg, #062217 0%, #0a3324 50%, #061c13 100%)',
        }}
      />

      {/* 2. SVG Badminton Court Boundaries & Service Lines */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-none"
        preserveAspectRatio="none"
        viewBox="0 0 400 180"
      >
        <g stroke="rgba(255, 255, 255, 0.22)" strokeWidth="1.5" fill="none">
          {/* Outer Boundary Line */}
          <rect x="20" y="16" width="360" height="148" rx="4" />

          {/* Doubles Sideline (Inner margin) */}
          <line x1="20" y1="30" x2="380" y2="30" stroke="rgba(255, 255, 255, 0.12)" />
          <line x1="20" y1="150" x2="380" y2="150" stroke="rgba(255, 255, 255, 0.12)" />

          {/* Short Service Lines (near net) */}
          <line x1="150" y1="16" x2="150" y2="164" stroke="rgba(255, 255, 255, 0.18)" />
          <line x1="250" y1="16" x2="250" y2="164" stroke="rgba(255, 255, 255, 0.18)" />

          {/* Center Service Line (Horizontal) */}
          <line x1="20" y1="90" x2="150" y2="90" stroke="rgba(255, 255, 255, 0.18)" />
          <line x1="250" y1="90" x2="380" y2="90" stroke="rgba(255, 255, 255, 0.18)" />

          {/* Long Service Lines (Back) */}
          <line x1="45" y1="16" x2="45" y2="164" stroke="rgba(255, 255, 255, 0.12)" />
          <line x1="355" y1="16" x2="355" y2="164" stroke="rgba(255, 255, 255, 0.12)" />
        </g>

        {/* Center Net (Thick Vertical Net with Mesh Glow) */}
        <line
          x1="200"
          y1="12"
          x2="200"
          y2="168"
          stroke="#FFFFFF"
          strokeOpacity="0.45"
          strokeWidth="2.5"
          strokeDasharray="4 2"
        />

        {/* Center Ambient Light Beam */}
        <ellipse cx="200" cy="90" rx="70" ry="35" fill="rgba(16, 185, 129, 0.08)" />
      </svg>

      {/* 3. Top Row Overlay Badges: Sport Format & Target Gender */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Left: Sport Format */}
        <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/15 text-white font-mono text-[10px] font-extrabold uppercase tracking-wider shadow-xs">
          <span>🏸</span>
          <span>{is1v1 ? 'Cầu lông đơn (1v1)' : 'Cầu lông đôi (2v2)'}</span>
        </div>

        {/* Center Net VS Pill */}
        <div className="absolute left-1/2 -translate-x-1/2 top-0 px-2 py-0.5 rounded-full bg-white/15 backdrop-blur-xs border border-white/20 text-white font-mono text-[9px] font-black uppercase tracking-widest shadow-xs">
          VS
        </div>

        {/* Right: Target Gender Badge */}
        {room.targetGender === 'female' ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-rose-500/80 backdrop-blur-xs text-white font-mono text-[10px] font-bold border border-rose-300/30 shadow-xs">
            <span>♀</span>
            <span>Kèo Nữ</span>
          </span>
        ) : room.targetGender === 'male' ? (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-blue-600/80 backdrop-blur-xs text-white font-mono text-[10px] font-bold border border-blue-300/30 shadow-xs">
            <span>♂</span>
            <span>Kèo Nam</span>
          </span>
        ) : (
          <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-purple-600/80 backdrop-blur-xs text-white font-mono text-[10px] font-bold border border-purple-300/30 shadow-xs">
            <span>⚥</span>
            <span>Nam & Nữ</span>
          </span>
        )}
      </div>

      {/* 4. Center Court: Players on Left (Team A) vs Right (Team B) */}
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

      {/* 5. Bottom Row Overlay: Elo Skill Range & Slot Status */}
      <div className="relative z-10 flex items-center justify-between gap-2">
        {/* Left: Skill Range */}
        <div className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-xs border border-white/15 text-slate-200 font-mono text-[10px] font-medium shadow-xs truncate max-w-[200px] sm:max-w-none">
          <Shield size={11} className="text-emerald-400 shrink-0" />
          <span className="truncate">
            Elo {room.minElo}–{room.maxElo} ({RoomUiFormatters.skillRange(room.minElo, room.maxElo)})
          </span>
        </div>

        {/* Right: Remaining Slots Status */}
        <div
          className={`flex items-center gap-1 px-2.5 py-1 rounded-full font-mono text-[10px] font-extrabold uppercase tracking-wide shadow-xs ${
            availableSlots > 0
              ? 'bg-emerald-500 text-slate-950 border border-emerald-300/50'
              : 'bg-black/70 text-slate-300 border border-white/20'
          }`}
        >
          {availableSlots > 0 ? (
            <>
              <Flame size={12} className="text-slate-950 fill-slate-950 shrink-0" />
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
  );
};
