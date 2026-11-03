import React, { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Camera, AlertCircle } from 'lucide-react';
import { BrowserMultiFormatReader } from '@zxing/browser';
import { PageContent } from '../../shared/components/PageContent';
import { BentoCard } from '../../shared/components/BentoCard';

export const ScanProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [profileInput, setProfileInput] = useState('');
  const [error, setError] = useState<string | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const readerRef = useRef<BrowserMultiFormatReader | null>(null);

  useEffect(() => {
    const codeReader = new BrowserMultiFormatReader();
    readerRef.current = codeReader;

    let active = true;

    if (videoRef.current) {
      codeReader
        .decodeFromVideoDevice(undefined, videoRef.current, (result, err) => {
          if (!active) return;
          if (result) {
            const text = result.getText();
            handleOpenProfile(text);
          }
          if (err && !(err.name === 'NotFoundException')) {
            // normal scanning loop without match
          }
        })
        .catch(() => {
          // Camera permission denied or not available
          setError('Camera chưa khả dụng. Cho phép camera hoặc dán link bên dưới.');
        });
    }

    return () => {
      active = false;
      // Stop scanner
      try {
        const stream = videoRef.current?.srcObject as MediaStream;
        stream?.getTracks().forEach((track) => track.stop());
      } catch {
        // cleanup
      }
    };
  }, []);

  const handleOpenProfile = (value: string) => {
    const trimmed = value.trim();
    if (!trimmed) return;

    // Check if it's a URL or UUID
    const match = trimmed.match(/\/p\/([a-zA-Z0-9-]+)/);
    const id = match ? match[1] : trimmed;

    if (id) {
      navigate(`/p/${id}`);
    } else {
      setError('Đây không phải link hồ sơ SportXP hợp lệ.');
    }
  };

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col">
      <header className="w-full max-w-content mx-auto px-4 h-14 flex items-center justify-between border-b border-app-border/40">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-1.5 text-xs font-bold text-app-muted hover:text-app-text transition-colors"
        >
          <ArrowLeft size={16} />
          <span>QUÉT HỘ CHIẾU</span>
        </button>
      </header>

      <PageContent>
        {/* Camera Scanner Viewfinder */}
        <BentoCard className="p-4 flex flex-col items-center">
          <div className="relative w-full aspect-square max-w-[280px] bg-black rounded-2xl overflow-hidden border border-app-border flex items-center justify-center">
            <video
              ref={videoRef}
              className="w-full h-full object-cover"
              playsInline
              muted
            />
            {/* Viewfinder Overlay Frame */}
            <div className="absolute inset-8 border-2 border-app-primary/60 rounded-xl pointer-events-none animate-pulse flex items-center justify-center">
              <Camera size={28} className="text-app-primary/40" />
            </div>
          </div>
          <p className="text-xs text-app-muted text-center mt-3 leading-relaxed">
            Quét mã chỉ mở hồ sơ. Bạn chủ động gửi lời mời kết bạn.
          </p>
        </BentoCard>

        {/* Manual Link Input */}
        <BentoCard>
          <div className="flex flex-col gap-3">
            <label className="text-xs font-bold text-app-muted">Hoặc dán link hồ sơ</label>
            <input
              type="text"
              placeholder="sportxp://profile/id hoặc https://..."
              value={profileInput}
              onChange={(e) => {
                setProfileInput(e.target.value);
                setError(null);
              }}
              className="w-full bg-app-background border border-app-border focus:border-app-primary rounded-xl px-3.5 py-2.5 text-xs text-app-text outline-hidden transition-colors"
            />

            {error && (
              <div className="flex items-center gap-1.5 text-xs text-app-loss">
                <AlertCircle size={14} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={() => handleOpenProfile(profileInput)}
              className="w-full py-3 rounded-xl bg-app-primary text-app-background font-black text-xs tracking-wider uppercase hover:brightness-105 transition-all"
            >
              MỞ HỒ SƠ
            </button>
          </div>
        </BentoCard>
      </PageContent>
    </div>
  );
};

