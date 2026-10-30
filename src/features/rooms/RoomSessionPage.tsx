import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  RefreshCw,
  Plus,
  AlertCircle,
  HelpCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { managedRoomRepository, roomFailure } from './data/managedRoomRepository';
import { ManagedRoomData } from './domain/managedRoom';

interface MatchItem {
  id: string;
  author_id?: string;
  team_a: string[];
  team_b: string[];
  score: string;
  winner: 'A' | 'B';
  status: 'PENDING' | 'CONFIRMED' | 'DISPUTED' | 'VOIDED';
  version: number;
  reason?: string;
}

interface AttendanceRecord {
  outcome: 'PRESENT' | 'ABSENT';
  status: 'RECORDED' | 'DISPUTED' | 'RESOLVED';
  reason?: string;
  version: number;
}

interface PlayerOption {
  id: string;
  name: string;
  role: string;
}

interface SessionData {
  matches: MatchItem[];
  attendance: Record<string, AttendanceRecord>;
  booking_status?: string;
  audit: Array<{ action: string; actor_id: string; at: string }>;
}

export const RoomSessionPage: React.FC = () => {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [room, setRoom] = useState<ManagedRoomData | null>(null);
  const [session, setSession] = useState<SessionData>({
    matches: [],
    attendance: {},
    audit: [],
  });

  // Dialogs state
  const [isMatchDialogOpen, setIsMatchDialogOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState<MatchItem | null>(null);
  const [isDoubles, setIsDoubles] = useState(false);
  const [teamAChoice1, setTeamAChoice1] = useState<string>('');
  const [teamAChoice2, setTeamAChoice2] = useState<string>('');
  const [teamBChoice1, setTeamBChoice1] = useState<string>('');
  const [teamBChoice2, setTeamBChoice2] = useState<string>('');
  const [scoreText, setScoreText] = useState('21-19');
  const [winnerTeam, setWinnerTeam] = useState<'A' | 'B'>('A');
  const [matchDialogError, setMatchDialogError] = useState<string | null>(null);

  // Reason prompt modal state
  const [reasonModal, setReasonModal] = useState<{
    isOpen: boolean;
    title: string;
    action: string;
    payload: Record<string, unknown>;
  } | null>(null);
  const [reasonInput, setReasonInput] = useState('');

  // Expand audit trail
  const [auditExpanded, setAuditExpanded] = useState(false);

  // Summary dialog state for completed session
  const [showSummaryDialog, setShowSummaryDialog] = useState(false);

  const loadData = useCallback(async () => {
    if (!roomId) return;
    try {
      setError(null);
      const [roomData, sessionData] = await Promise.all([
        managedRoomRepository.get(roomId),
        managedRoomRepository.session(roomId),
      ]);
      setRoom(roomData);

      const rawAttendance = (sessionData.attendance || {}) as Record<string, unknown>;
      const typedAttendance: Record<string, AttendanceRecord> = {};
      for (const [k, v] of Object.entries(rawAttendance)) {
        if (v && typeof v === 'object') {
          const rec = v as Record<string, unknown>;
          typedAttendance[k] = {
            outcome: (rec.outcome as 'PRESENT' | 'ABSENT') || 'PRESENT',
            status: (rec.status as 'RECORDED' | 'DISPUTED' | 'RESOLVED') || 'RECORDED',
            reason: rec.reason ? String(rec.reason) : undefined,
            version: Number(rec.version || 0),
          };
        }
      }

      setSession({
        matches: (sessionData.matches || []) as MatchItem[],
        attendance: typedAttendance,
        audit: (sessionData.audit || []) as Array<{ action: string; actor_id: string; at: string }>,
      });
    } catch (e) {
      setError(roomFailure(e));
    } finally {
      setLoading(false);
    }
  }, [roomId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const sendCommand = async (action: string, payload: Record<string, unknown>) => {
    if (busy || !roomId) return;
    setBusy(true);
    setError(null);
    try {
      await managedRoomRepository.execute({
        requestId: `cmd-${Date.now()}`,
        action,
        roomId,
        payload,
      });
      await loadData();
    } catch (e) {
      setError(roomFailure(e));
    } finally {
      setBusy(false);
    }
  };

  const openReasonModal = (
    title: string,
    action: string,
    payload: Record<string, unknown>
  ) => {
    setReasonInput('');
    setReasonModal({ isOpen: true, title, action, payload });
  };

  const handleReasonSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reasonModal) return;
    const text = reasonInput.trim();
    if (!text) return;
    const payload = { ...reasonModal.payload, reason: text };
    const action = reasonModal.action;
    setReasonModal(null);
    await sendCommand(action, payload);
  };

  // Players eligible for matches (registered & playing)
  const players: PlayerOption[] = (room?.members || [])
    .filter((m) => {
      const status = String(m.status || '');
      const isPlaying = m.is_playing ?? m.isPlaying ?? true;
      return status === 'REGISTERED' && Boolean(isPlaying);
    })
    .map((m) => ({
      id: String(m.user_id || m.id || ''),
      name: String(m.display_name || m.name || m.user_id || 'Người chơi'),
      role: m.is_host ? 'HOST' : String(m.role || 'MEMBER'),
    }));

  const openCreateMatch = () => {
    setEditingMatch(null);
    setIsDoubles(false);
    setTeamAChoice1(players[0]?.id || '');
    setTeamBChoice1(players[1]?.id || '');
    setTeamAChoice2('');
    setTeamBChoice2('');
    setScoreText('21-19');
    setWinnerTeam('A');
    setMatchDialogError(null);
    setIsMatchDialogOpen(true);
  };

  const openEditMatch = (m: MatchItem) => {
    setEditingMatch(m);
    const doubles = m.team_a.length === 2;
    setIsDoubles(doubles);
    setTeamAChoice1(m.team_a[0] || '');
    setTeamBChoice1(m.team_b[0] || '');
    setTeamAChoice2(doubles ? m.team_a[1] || '' : '');
    setTeamBChoice2(doubles ? m.team_b[1] || '' : '');
    setScoreText(m.score || '21-19');
    setWinnerTeam(m.winner || 'A');
    setMatchDialogError(null);
    setIsMatchDialogOpen(true);
  };

  const handleMatchFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const teamA = isDoubles ? [teamAChoice1, teamAChoice2] : [teamAChoice1];
    const teamB = isDoubles ? [teamBChoice1, teamBChoice2] : [teamBChoice1];
    const allSelected = [...teamA, ...teamB];

    if (allSelected.some((id) => !id)) {
      setMatchDialogError('Vui lòng chọn đủ người chơi cho 2 đội.');
      return;
    }
    if (new Set(allSelected).size !== allSelected.length) {
      setMatchDialogError('Người chơi không được trùng nhau.');
      return;
    }

    const payload: Record<string, unknown> = {
      team_a: teamA,
      team_b: teamB,
      score: scoreText.trim(),
      winner: winnerTeam,
      ...(editingMatch
        ? {
            match_id: editingMatch.id,
            expected_version: editingMatch.version,
          }
        : {}),
    };

    setIsMatchDialogOpen(false);
    await sendCommand(editingMatch ? 'match_edit' : 'match_create', payload);
  };

  const getPlayerName = (id: string): string => {
    const member = players.find((p) => p.id === id);
    return member?.name || id.substring(0, 8);
  };

  const formatTeamNames = (ids: string[]): string => {
    return ids.map(getPlayerName).join(' + ');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-app-background flex items-center justify-center">
        <div className="w-8 h-8 border-3 border-app-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-app-background flex flex-col items-center justify-center p-4">
        <p className="text-sm font-semibold text-app-muted">Không có quyền xem buổi này.</p>
        <button
          onClick={() => navigate(-1)}
          className="mt-4 px-4 py-2 rounded-xl bg-app-surface border border-app-border text-xs font-bold"
        >
          Quay lại
        </button>
      </div>
    );
  }

  const viewerId = room.viewerId || '';

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col antialiased text-app-text">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 w-full bg-app-surface/90 backdrop-blur-md border-b border-app-border">
        <div className="w-full max-w-[720px] mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate(-1)}
              disabled={busy}
              className="w-9 h-9 rounded-full flex items-center justify-center text-app-text hover:bg-app-background transition-colors"
            >
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-base font-extrabold tracking-tight">Trận đấu & điểm danh</h1>
          </div>
          <button
            onClick={loadData}
            disabled={busy}
            title="Tải lại"
            className="w-9 h-9 rounded-full flex items-center justify-center text-app-muted hover:text-app-text hover:bg-app-background transition-colors"
          >
            <RefreshCw size={17} className={busy ? 'animate-spin' : ''} />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="w-full max-w-[720px] mx-auto px-4 py-4 flex flex-col gap-4">
        {/* Room Header Info */}
        <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-1.5 shadow-xs">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-black tracking-tight">{room.title}</h2>
            <span className="px-2.5 py-0.5 rounded-full text-[11px] font-extrabold bg-app-primary/15 text-app-primary">
              {room.statusLabel}
            </span>
          </div>
          <p className="text-[11px] text-app-muted leading-relaxed">
            Kết thúc buổi không tự xác nhận trận hoặc điểm danh. Trận chờ/tranh chấp vẫn cần xử lý. Elo và Trust thật giữ nguyên.
          </p>
          {room.status === 'COMPLETED' && (
            <button
              type="button"
              onClick={() => setShowSummaryDialog(true)}
              className="mt-1 w-full h-9 rounded-xl border border-app-primary text-app-primary text-xs font-bold hover:bg-app-primary/10 transition-colors flex items-center justify-center gap-1.5"
            >
              <span>Xem tổng kết buổi chơi</span>
            </button>
          )}
        </section>

        {busy && (
          <div className="w-full h-1 bg-app-primary/20 overflow-hidden rounded-full">
            <div className="w-full h-full bg-app-primary animate-pulse" />
          </div>
        )}

        {/* Error notification */}
        {error && (
          <div className="p-3.5 rounded-xl bg-app-loss/10 border border-app-loss/40 flex items-start gap-2.5 text-app-loss text-xs font-semibold">
            <AlertCircle size={17} className="shrink-0 mt-0.5" />
            <div className="flex flex-col gap-1">
              <span>{error}</span>
              <button
                type="button"
                onClick={loadData}
                className="text-[11px] font-bold text-app-primary underline text-left"
              >
                Gửi lại cùng yêu cầu
              </button>
            </div>
          </div>
        )}

        {/* MATCHES SECTION */}
        <section className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-extrabold text-app-muted uppercase tracking-wider">
              DANH SÁCH SET ĐẤU ({session.matches.length})
            </span>
            {room.status === 'IN_PROGRESS' && (
              <button
                type="button"
                onClick={openCreateMatch}
                disabled={busy}
                className="h-8 px-3 rounded-xl bg-app-primary text-app-on-primary text-xs font-extrabold flex items-center gap-1.5 hover:brightness-105 active:scale-95 transition-all shadow-xs"
              >
                <Plus size={15} />
                <span>+ Ghi trận đơn / đôi</span>
              </button>
            )}
          </div>

          {session.matches.length === 0 ? (
            <div className="p-6 rounded-2xl bg-app-surface border border-app-border text-center flex flex-col items-center gap-2">
              <HelpCircle size={28} className="text-app-muted/60" />
              <p className="text-xs text-app-muted">Chưa có trận đấu nào được ghi nhận.</p>
            </div>
          ) : (
            session.matches.map((m) => {
              const isPending = m.status === 'PENDING';
              const isOpponent =
                isPending &&
                (m.team_a.includes(m.author_id || '')
                  ? m.team_b.includes(viewerId)
                  : m.team_a.includes(viewerId));
              const isParticipant =
                isPending && [...m.team_a, ...m.team_b].includes(viewerId);
              const isAuthor = m.author_id === viewerId;

              return (
                <div
                  key={m.id}
                  className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-2.5 shadow-xs"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-black text-app-text">
                      {formatTeamNames(m.team_a)} — {formatTeamNames(m.team_b)}
                    </span>
                    <span
                      className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                        m.status === 'CONFIRMED'
                          ? 'bg-app-primary/15 text-app-primary'
                          : m.status === 'DISPUTED'
                          ? 'bg-app-loss/15 text-app-loss'
                          : 'bg-app-streak/15 text-app-streak'
                      }`}
                    >
                      {m.status}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-app-text">
                    Tỉ số: <span className="tabular-nums font-mono text-app-primary">{m.score}</span> · Đội{' '}
                    <span className="font-extrabold text-app-primary">{m.winner}</span> thắng
                  </div>

                  <div className="text-[11px] text-app-muted">
                    Bản {m.version} · Elo: chưa tính
                  </div>

                  {m.reason && (
                    <div className="p-2 rounded-lg bg-app-background border border-app-border text-xs text-app-muted">
                      Lý do: {m.reason}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-app-border/40">
                    {isOpponent && (
                      <button
                        type="button"
                        onClick={() =>
                          sendCommand('match_confirm', {
                            match_id: m.id,
                            expected_version: m.version,
                          })
                        }
                        disabled={busy}
                        className="px-3 py-1.5 rounded-xl border border-app-primary text-app-primary text-xs font-bold hover:bg-app-primary/10 transition-colors"
                      >
                        Xác nhận từ đội đối thủ
                      </button>
                    )}

                    {isParticipant && (
                      <button
                        type="button"
                        onClick={() =>
                          openReasonModal('Phản hồi kết quả', 'match_dispute', {
                            match_id: m.id,
                            expected_version: m.version,
                          })
                        }
                        disabled={busy}
                        className="px-3 py-1.5 rounded-xl border border-app-loss text-app-loss text-xs font-bold hover:bg-app-loss/10 transition-colors"
                      >
                        Không đồng ý kết quả
                      </button>
                    )}

                    {['PENDING', 'DISPUTED'].includes(m.status) && (
                      <>
                        {room.status === 'IN_PROGRESS' && isAuthor && (
                          <button
                            type="button"
                            onClick={() => openEditMatch(m)}
                            disabled={busy}
                            className="px-2.5 py-1 text-xs font-bold text-app-primary hover:underline"
                          >
                            Tác giả sửa kết quả
                          </button>
                        )}
                        {(room.isHost || isAuthor) && (
                          <button
                            type="button"
                            onClick={() =>
                              openReasonModal(
                                'Hủy bản ghi trận',
                                'match_void',
                                {
                                  match_id: m.id,
                                  expected_version: m.version,
                                }
                              )
                            }
                            disabled={busy}
                            className="px-2.5 py-1 text-xs font-bold text-app-loss hover:underline"
                          >
                            Host / tác giả hủy bản ghi
                          </button>
                        )}
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </section>

        {/* ATTENDANCE SECTION */}
        <section className="bg-app-surface rounded-[20px] p-4 border border-app-border flex flex-col gap-3 shadow-xs">
          <div className="flex flex-col gap-0.5">
            <span className="text-xs font-extrabold text-app-muted uppercase tracking-wider">
              ĐIỂM DANH · HOST GHI NHẬN, NGƯỜI CHƠI CÓ QUYỀN PHẢN HỒI
            </span>
            <p className="text-[11px] text-app-muted">
              Host chưa được tự đánh giá điểm danh. Không trừ/cộng Trust tự động.
            </p>
          </div>

          <div className="flex flex-col gap-2">
            {players.map((player) => {
              const record = session.attendance[player.id];
              const isRecorded = record?.status === 'RECORDED';
              const isDisputed = record?.status === 'DISPUTED';

              return (
                <div
                  key={player.id}
                  className="p-3 rounded-xl bg-app-background border border-app-border flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-black text-app-text">{player.name}</span>
                      {player.role === 'HOST' && (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-app-primary/15 text-app-primary">
                          HOST
                        </span>
                      )}
                    </div>
                    <span className="text-xs text-app-muted">
                      {record
                        ? `${record.outcome} · ${record.status} ${
                            record.reason ? `· ${record.reason}` : ''
                          }`
                        : 'Chưa điểm danh'}
                    </span>
                  </div>

                  {/* Actions for Host or Player */}
                  <div className="flex flex-wrap items-center gap-2 pt-1">
                    {room.isHost && !record && player.role !== 'HOST' && (
                      <>
                        <button
                          type="button"
                          onClick={() =>
                            openReasonModal('Ghi chú điểm danh', 'attendance_mark', {
                              player_id: player.id,
                              expected_version: 0,
                              outcome: 'PRESENT',
                            })
                          }
                          disabled={busy}
                          className="h-8 px-3 rounded-lg border border-app-primary text-app-primary text-xs font-bold hover:bg-app-primary/10 transition-colors"
                        >
                          Có mặt
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openReasonModal('Ghi chú điểm danh', 'attendance_mark', {
                              player_id: player.id,
                              expected_version: 0,
                              outcome: 'ABSENT',
                            })
                          }
                          disabled={busy}
                          className="h-8 px-3 rounded-lg border border-app-loss text-app-loss text-xs font-bold hover:bg-app-loss/10 transition-colors"
                        >
                          Vắng
                        </button>
                      </>
                    )}

                    {player.id === viewerId && !room.isHost && isRecorded && (
                      <button
                        type="button"
                        onClick={() =>
                          openReasonModal(
                            'Phản hồi điểm danh',
                            'attendance_dispute',
                            {
                              player_id: player.id,
                              expected_version: record.version,
                              outcome: record.outcome,
                            }
                          )
                        }
                        disabled={busy}
                        className="text-xs font-bold text-app-streak underline"
                      >
                        Phản hồi điểm danh của tôi
                      </button>
                    )}

                    {room.isHost && isDisputed && (
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            openReasonModal('Chốt điểm danh', 'attendance_resolve', {
                              player_id: player.id,
                              expected_version: record.version,
                              outcome: 'PRESENT',
                            })
                          }
                          disabled={busy}
                          className="text-xs font-bold text-app-primary hover:underline"
                        >
                          Chốt: PRESENT
                        </button>
                        <button
                          type="button"
                          onClick={() =>
                            openReasonModal('Chốt điểm danh', 'attendance_resolve', {
                              player_id: player.id,
                              expected_version: record.version,
                              outcome: 'ABSENT',
                            })
                          }
                          disabled={busy}
                          className="text-xs font-bold text-app-loss hover:underline"
                        >
                          Chốt: ABSENT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </section>

        {/* AUDIT LOG ACCORDION */}
        <section className="bg-app-surface rounded-[20px] border border-app-border overflow-hidden shadow-xs">
          <button
            type="button"
            onClick={() => setAuditExpanded(!auditExpanded)}
            className="w-full p-4 flex items-center justify-between text-left hover:bg-app-background/50 transition-colors"
          >
            <span className="text-xs font-extrabold text-app-muted uppercase tracking-wider">
              LỊCH SỬ THAO TÁC MÔ PHỎNG ({session.audit.length})
            </span>
            {auditExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
          </button>

          {auditExpanded && (
            <div className="p-4 pt-0 border-t border-app-border/40 flex flex-col gap-2">
              {session.audit.length === 0 ? (
                <p className="text-xs text-app-muted py-2">Chưa có bản ghi lịch sử.</p>
              ) : (
                [...session.audit].reverse().map((entry, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 rounded-xl bg-app-background border border-app-border flex items-center justify-between text-xs"
                  >
                    <span className="font-bold text-app-text">
                      {entry.action} · {entry.actor_id.substring(0, 8)}
                    </span>
                    <span className="text-[11px] text-app-muted font-mono">{entry.at}</span>
                  </div>
                ))
              )}
            </div>
          )}
        </section>

        <div className="h-10" />
      </main>

      {/* MATCH DIALOG MODAL */}
      {isMatchDialogOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-app-surface border border-app-border rounded-[24px] p-5 flex flex-col gap-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-app-text">
                {editingMatch ? 'Sửa kết quả và xin xác nhận lại' : 'Ghi trận mới'}
              </h3>
              <button
                type="button"
                onClick={() => setIsMatchDialogOpen(false)}
                className="w-8 h-8 rounded-full flex items-center justify-center text-app-muted hover:text-app-text"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleMatchFormSubmit} className="flex flex-col gap-3.5">
              {/* Doubles Switch */}
              <label className="p-3 rounded-xl bg-app-background border border-app-border flex items-center justify-between cursor-pointer">
                <span className="text-xs font-bold text-app-text">Đánh đôi</span>
                <input
                  type="checkbox"
                  checked={isDoubles}
                  onChange={(e) => setIsDoubles(e.target.checked)}
                  className="w-5 h-5 accent-app-primary rounded cursor-pointer"
                />
              </label>

              {/* Team A selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Đội A · người 1</label>
                <select
                  value={teamAChoice1}
                  onChange={(e) => setTeamAChoice1(e.target.value)}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-app-text"
                >
                  <option value="">-- Chọn người chơi --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {isDoubles && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-app-muted">Đội A · người 2</label>
                  <select
                    value={teamAChoice2}
                    onChange={(e) => setTeamAChoice2(e.target.value)}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-app-text"
                  >
                    <option value="">-- Chọn người chơi --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Team B selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Đội B · người 1</label>
                <select
                  value={teamBChoice1}
                  onChange={(e) => setTeamBChoice1(e.target.value)}
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-app-text"
                >
                  <option value="">-- Chọn người chơi --</option>
                  {players.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {isDoubles && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-xs font-semibold text-app-muted">Đội B · người 2</label>
                  <select
                    value={teamBChoice2}
                    onChange={(e) => setTeamBChoice2(e.target.value)}
                    className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-xs font-semibold text-app-text"
                  >
                    <option value="">-- Chọn người chơi --</option>
                    {players.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              {/* Score text */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">
                  Tỉ số (A-B): 21-19 21-16
                </label>
                <input
                  type="text"
                  value={scoreText}
                  onChange={(e) => setScoreText(e.target.value)}
                  placeholder="21-19"
                  className="w-full bg-app-background border border-app-border rounded-xl px-3.5 py-2.5 text-xs font-bold text-app-text"
                />
              </div>

              {/* Winner Selector */}
              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-semibold text-app-muted">Đội chiến thắng</label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setWinnerTeam('A')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      winnerTeam === 'A'
                        ? 'bg-app-primary text-app-on-primary border-app-primary'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội A thắng
                  </button>
                  <button
                    type="button"
                    onClick={() => setWinnerTeam('B')}
                    className={`py-2 rounded-xl text-xs font-bold border transition-colors ${
                      winnerTeam === 'B'
                        ? 'bg-app-primary text-app-on-primary border-app-primary'
                        : 'bg-app-background border-app-border text-app-muted'
                    }`}
                  >
                    Đội B thắng
                  </button>
                </div>
              </div>

              {matchDialogError && (
                <div className="text-xs font-bold text-app-loss">{matchDialogError}</div>
              )}

              <p className="text-[11px] text-app-muted">
                Cần một người bên đối thủ xác nhận. Chưa tính Elo.
              </p>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsMatchDialogOpen(false)}
                  className="px-4 py-2.5 rounded-xl bg-app-background border border-app-border text-xs font-bold text-app-muted hover:text-app-text"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-app-primary text-app-on-primary text-xs font-black hover:brightness-105"
                >
                  Gửi kết quả
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* REASON PROMPT MODAL */}
      {reasonModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-app-surface border border-app-border rounded-[24px] p-5 flex flex-col gap-4 shadow-2xl">
            <h3 className="text-base font-black text-app-text">{reasonModal.title}</h3>
            <form onSubmit={handleReasonSubmit} className="flex flex-col gap-3">
              <textarea
                value={reasonInput}
                onChange={(e) => setReasonInput(e.target.value)}
                placeholder="Lý do / ghi chú (tối đa 500 ký tự)"
                rows={3}
                maxLength={500}
                required
                className="w-full bg-app-background border border-app-border rounded-xl p-3 text-xs text-app-text outline-hidden focus:border-app-primary resize-none"
              />
              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setReasonModal(null)}
                  className="px-4 py-2.5 rounded-xl bg-app-background border border-app-border text-xs font-bold text-app-muted hover:text-app-text"
                >
                  Quay lại
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-app-primary text-app-on-primary text-xs font-black hover:brightness-105"
                >
                  Xác nhận
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUMMARY DIALOG FOR FINISHED STATE */}
      {showSummaryDialog && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
          onClick={() => setShowSummaryDialog(false)}
        >
          <div
            className="w-full max-w-sm bg-app-surface rounded-[24px] p-5 border border-app-border shadow-2xl flex flex-col gap-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between border-b border-app-border/40 pb-2.5">
              <h3 className="text-sm font-extrabold text-app-text">Tổng kết buổi chơi</h3>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-app-primary/15 text-app-primary uppercase">
                {room.statusLabel}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2 text-center">
              <div className="p-3 rounded-2xl bg-app-background border border-app-border">
                <span className="text-[10px] font-bold text-app-muted uppercase">Tổng set đấu</span>
                <p className="text-xl font-black text-app-primary mt-1">{session.matches.length}</p>
              </div>
              <div className="p-3 rounded-2xl bg-app-background border border-app-border">
                <span className="text-[10px] font-bold text-app-muted uppercase">Điểm danh</span>
                <p className="text-xl font-black text-app-streak mt-1">
                  {Object.values(session.attendance).filter((a) => a.outcome === 'PRESENT').length} có mặt
                </p>
              </div>
            </div>

            <p className="text-[11px] text-app-muted leading-relaxed">
              Kết thúc buổi không tự xác nhận trận hoặc điểm danh. Trận chờ/tranh chấp vẫn cần xử lý. Elo và Trust thật giữ nguyên.
            </p>

            <button
              type="button"
              onClick={() => setShowSummaryDialog(false)}
              className="w-full h-11 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-xs uppercase hover:brightness-105 transition-all"
            >
              Đóng
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
