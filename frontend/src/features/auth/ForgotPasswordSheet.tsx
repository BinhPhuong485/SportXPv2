import React, { useState, useEffect } from 'react';
import { KeyRound, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, AtSign } from 'lucide-react';
import { ModalSheet } from '../../shared/components/ModalSheet';
import { supabase } from '../../core/config/supabase';

interface ForgotPasswordSheetProps {
  isOpen: boolean;
  onClose: () => void;
  initialEmail?: string;
  onSuccess?: () => void;
}

type ResetStep = 'requestOtp' | 'verifyAndNewPassword' | 'success';

export const ForgotPasswordSheet: React.FC<ForgotPasswordSheetProps> = ({
  isOpen,
  onClose,
  initialEmail = '',
  onSuccess,
}) => {
  const [step, setStep] = useState<ResetStep>('requestOtp');
  const [email, setEmail] = useState(initialEmail);
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(60);

  useEffect(() => {
    if (isOpen) {
      setEmail(initialEmail);
      setStep('requestOtp');
      setOtp('');
      setNewPassword('');
      setConfirmPassword('');
      setError(null);
      setCountdown(60);
    }
  }, [isOpen, initialEmail]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (step === 'verifyAndNewPassword' && countdown > 0) {
      timer = setInterval(() => {
        setCountdown((c) => (c > 1 ? c - 1 : 0));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [step, countdown]);

  const mapAuthError = (err: unknown): string => {
    const msg = (err as { message?: string })?.message?.toLowerCase() || '';
    if (msg.includes('rate limit')) {
      return 'Bạn đã gửi quá số lần cho phép. Vui lòng đợi ít phút.';
    }
    if (msg.includes('token') || msg.includes('otp') || msg.includes('expired')) {
      return 'Mã xác thực không đúng hoặc đã hết hiệu lực.';
    }
    if (msg.includes('user not found')) {
      return 'Không tìm thấy tài khoản với địa chỉ email này.';
    }
    if (msg.includes('same password')) {
      return 'Mật khẩu mới không được trùng với mật khẩu cũ.';
    }
    return (err as { message?: string })?.message || 'Đã xảy ra lỗi kết nối. Vui lòng kiểm tra lại mạng.';
  };

  const handleRequestOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }

    if (!supabase) {
      setError('Chưa cấu hình Supabase.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      const { error: resetErr } = await supabase.auth.resetPasswordForEmail(trimmed);
      if (resetErr) throw resetErr;
      setCountdown(60);
      setStep('verifyAndNewPassword');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleResendOtp = async () => {
    if (busy || countdown > 0 || !supabase) return;
    setBusy(true);
    setError(null);
    try {
      const { error: resendErr } = await supabase.auth.resetPasswordForEmail(email.trim());
      if (resendErr) throw resendErr;
      setCountdown(60);
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  const handleVerifyAndReset = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedOtp = otp.trim();
    if (trimmedOtp.length < 6) {
      setError('Vui lòng nhập đủ mã OTP 6 số.');
      return;
    }
    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải có ít nhất 6 ký tự.');
      return;
    }
    if (newPassword !== confirmPassword) {
      setError('Xác nhận mật khẩu không trùng khớp.');
      return;
    }

    if (!supabase) {
      setError('Chưa cấu hình Supabase.');
      return;
    }

    setBusy(true);
    setError(null);

    try {
      // 1. Verify OTP for recovery
      const { error: verifyErr } = await supabase.auth.verifyOtp({
        email: email.trim(),
        token: trimmedOtp,
        type: 'recovery',
      });
      if (verifyErr) throw verifyErr;

      // 2. Update user's password
      const { error: updateErr } = await supabase.auth.updateUser({
        password: newPassword,
      });
      if (updateErr) throw updateErr;

      setStep('success');
    } catch (err) {
      setError(mapAuthError(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <ModalSheet
      isOpen={isOpen}
      onClose={onClose}
      title={
        step === 'requestOtp'
          ? 'QUÊN MẬT KHẨU'
          : step === 'verifyAndNewPassword'
          ? 'XÁC THỰC MẬT KHẨU'
          : 'THÀNH CÔNG'
      }
    >
      <div className="flex flex-col gap-4 pb-4">
        {step === 'requestOtp' && (
          <form onSubmit={handleRequestOtp} className="flex flex-col gap-4">
            <p className="text-xs text-app-muted leading-relaxed">
              Nhập email đăng ký tài khoản SportXP của bạn. Hệ thống sẽ gửi mã xác thực OTP 6 số để bạn đặt lại mật khẩu.
            </p>

            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-app-muted">Email đăng ký</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-app-muted pointer-events-none">
                  <AtSign size={18} />
                </span>
                <input
                  type="email"
                  disabled={busy}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-app-surface border border-app-border focus:border-app-primary rounded-[14px] pl-10 pr-4 py-3 text-sm text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-[10px] bg-app-loss/12 border border-app-loss/35 flex items-center gap-2 text-xs text-app-loss">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 rounded-[14px] bg-app-primary text-app-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {busy ? (
                <div className="w-4 h-4 border-2 border-app-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span>GỬI MÃ XÁC THỰC</span>
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        )}

        {step === 'verifyAndNewPassword' && (
          <form onSubmit={handleVerifyAndReset} className="flex flex-col gap-3.5">
            <p className="text-xs text-app-muted leading-relaxed">
              Mã xác thực OTP đã được gửi tới <strong className="text-app-text">{email}</strong>. Vui lòng kiểm tra hộp thư đến (và thư rác).
            </p>

            {/* OTP Code Field */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-app-muted">Mã xác thực (OTP 6 số)</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-app-muted pointer-events-none">
                  <KeyRound size={18} />
                </span>
                <input
                  type="text"
                  maxLength={6}
                  disabled={busy}
                  placeholder="123456"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  className="w-full bg-app-surface border border-app-border focus:border-app-primary rounded-[12px] pl-10 pr-4 py-3 text-base font-mono tracking-widest text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* New Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-app-muted">Mật khẩu mới</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-app-muted pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={busy}
                  placeholder="Tối thiểu 6 ký tự"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-app-surface border border-app-border focus:border-app-primary rounded-[12px] pl-10 pr-11 py-3 text-sm text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-app-muted hover:text-app-text transition-colors"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Confirm Password */}
            <div className="flex flex-col gap-1.5">
              <label className="text-xs font-semibold text-app-muted">Xác nhận mật khẩu mới</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-app-muted pointer-events-none">
                  <Lock size={18} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={busy}
                  placeholder="Nhập lại mật khẩu mới"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-app-surface border border-app-border focus:border-app-primary rounded-[12px] pl-10 pr-4 py-3 text-sm text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
                />
              </div>
            </div>

            {error && (
              <div className="p-3 rounded-[10px] bg-app-loss/12 border border-app-loss/35 flex items-center gap-2 text-xs text-app-loss">
                <AlertCircle size={16} className="shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={busy}
              className="w-full h-12 mt-1 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.99] disabled:opacity-50 flex items-center justify-center gap-2 transition-all"
            >
              {busy ? (
                <div className="w-4 h-4 border-2 border-app-on-primary border-t-transparent rounded-full animate-spin" />
              ) : (
                <span>ĐẶT LẠI MẬT KHẨU</span>
              )}
            </button>

            {/* Resend OTP button */}
            <div className="text-center pt-1">
              <button
                type="button"
                disabled={busy || countdown > 0}
                onClick={handleResendOtp}
                className="text-xs font-semibold text-app-primary disabled:text-app-muted hover:underline transition-colors"
              >
                {countdown > 0
                  ? `Gửi lại mã OTP sau ${countdown}s`
                  : 'Gửi lại mã xác thực mới'}
              </button>
            </div>
          </form>
        )}

        {step === 'success' && (
          <div className="flex flex-col items-center justify-center py-6 text-center gap-3 animate-fade-in">
            <div className="w-14 h-14 rounded-full bg-app-primary/15 flex items-center justify-center text-app-primary mb-1">
              <CheckCircle2 size={36} />
            </div>
            <h3 className="text-lg font-black text-app-text">ĐỔI MẬT KHẨU THÀNH CÔNG!</h3>
            <p className="text-xs text-app-muted max-w-xs leading-relaxed">
              Mật khẩu mới của bạn đã được cập nhật thành công trên hệ thống. Bây giờ bạn có thể đăng nhập bằng mật khẩu này.
            </p>
            <button
              type="button"
              onClick={() => {
                onClose();
                onSuccess?.();
              }}
              className="w-full h-12 mt-4 rounded-[12px] bg-app-primary text-app-on-primary font-bold text-sm hover:brightness-105 active:scale-[0.99] transition-all"
            >
              ĐĂNG NHẬP NGAY
            </button>
          </div>
        )}
      </div>
    </ModalSheet>
  );
};

