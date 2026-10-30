import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Eye, EyeOff, AlertTriangle, AlertCircle, CheckCircle2, AtSign, Lock, IdCard } from 'lucide-react';
import { supabase, startupError } from '../../core/config/supabase';
import { ForgotPasswordSheet } from './ForgotPasswordSheet';

interface AuthPageProps {
  onSuccess?: () => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onSuccess }) => {
  const navigate = useNavigate();
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [showForgotSheet, setShowForgotSheet] = useState(
    () => window.location.href.includes('forgot=true')
  );

  const toggleMode = (signup: boolean) => {
    if (busy || isSignUp === signup) return;
    setIsSignUp(signup);
    setError(null);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;

    if (!supabase) {
      setError(startupError || 'Chưa cấu hình kết nối Supabase.');
      return;
    }

    // Validation
    const trimmedEmail = email.trim();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setError('Email không hợp lệ.');
      return;
    }

    if (isSignUp) {
      const trimmedName = displayName.trim();
      if (trimmedName.length < 2) {
        setError('Nhập ít nhất 2 ký tự.');
        return;
      }
      if (password.length < 6) {
        setError('Vui lòng nhập mật khẩu ít nhất 6 ký tự.');
        return;
      }
    } else {
      if (password.length < 1) {
        setError('Vui lòng nhập mật khẩu.');
        return;
      }
    }

    setBusy(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: trimmedEmail,
          password,
          options: {
            data: { display_name: displayName.trim() },
          },
        });

        if (signUpError) throw signUpError;

        if (!data.session) {
          setIsSignUp(false);
          setMessage('Kiểm tra email để xác nhận tài khoản, sau đó đăng nhập.');
          setPassword('');
        } else {
          onSuccess?.();
        }
      } else {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: trimmedEmail,
          password,
        });

        if (signInError) throw signInError;
        if (onSuccess) {
          onSuccess();
        } else {
          navigate('/');
        }
      }
    } catch (err: unknown) {
      const authErr = err as { message?: string };
      setError(authErr.message || 'Không thể kết nối. Vui lòng thử lại.');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="min-h-screen w-full flex flex-col bg-app-background antialiased select-none">
        {/* Top Material 3 AppBar matching Flutter */}
        <header className="w-full h-14 bg-app-primary text-white flex items-center justify-center shrink-0 shadow-xs relative z-10">
          <div className="flex items-center gap-2">
            <div className="p-1 rounded-full bg-white/15 flex items-center justify-center">
              <Zap size={16} className="text-white" fill="currentColor" />
            </div>
            <span className="text-[17px] font-black tracking-[0.2em] text-white">SPORTXP</span>
          </div>
        </header>

        {/* Main Form Body */}
        <div className="flex-1 w-full max-w-[460px] mx-auto px-6 py-7 flex flex-col justify-start animate-fade-in">
          {/* Title and Tagline */}
          <div className="text-center mb-7">
            <h2 className="text-2xl font-extrabold text-app-text mb-1.5">
              {isSignUp ? 'Bắt đầu lên sân.' : 'Chào mừng trở lại.'}
            </h2>
            <p className="text-[13px] text-app-muted">
              {isSignUp
                ? 'Tạo tài khoản để ghi nhận set cầu và tính hạng Elo.'
                : 'Mỗi set cầu. Một bước tiến.'}
            </p>
          </div>

          {/* Segmented Switcher */}
          <div className="p-1 bg-app-surface rounded-[14px] border border-app-border flex mb-6">
            <button
              type="button"
              onClick={() => toggleMode(false)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-[10px] transition-all ${
                !isSignUp
                  ? 'bg-app-primary text-app-background shadow-xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Đăng nhập
            </button>
            <button
              type="button"
              onClick={() => toggleMode(true)}
              className={`flex-1 py-2.5 text-[13px] font-bold rounded-[10px] transition-all ${
                isSignUp
                  ? 'bg-app-primary text-app-background shadow-xs'
                  : 'text-app-muted hover:text-app-text'
              }`}
            >
              Đăng ký
            </button>
          </div>

          {/* Missing Supabase Error Banner */}
          {(!supabase || startupError) && (
            <div className="mb-4 p-3 rounded-[10px] bg-app-loss/12 border border-app-loss/30 flex items-center gap-2 text-[13px] text-app-loss">
              <AlertTriangle size={18} className="shrink-0" />
              <span>{startupError || 'Chưa cấu hình kết nối Supabase.'}</span>
            </div>
          )}

          {/* Auth Form */}
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {/* Display Name Field (SignUp only) */}
            {isSignUp && (
              <div className="flex flex-col gap-1 animate-fade-in">
                <label className="text-xs font-medium text-app-muted">Tên hiển thị</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3.5 text-app-muted pointer-events-none">
                    <IdCard size={20} />
                  </span>
                  <input
                    type="text"
                    maxLength={60}
                    disabled={busy}
                    placeholder="Nhập tên của bạn trên sân"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full h-12 bg-app-surface border border-app-border focus:border-app-primary rounded-[14px] pl-11 pr-4 text-sm text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
                  />
                </div>
              </div>
            )}

            {/* Email Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">Email</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-app-muted pointer-events-none">
                  <AtSign size={20} />
                </span>
                <input
                  type="email"
                  disabled={busy}
                  placeholder="name@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full h-12 bg-app-surface border border-app-border focus:border-app-primary rounded-[14px] pl-11 pr-4 text-sm text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
                />
              </div>
            </div>

            {/* Password Field */}
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-app-muted">Mật khẩu</label>
              <div className="relative flex items-center">
                <span className="absolute left-3.5 text-app-muted pointer-events-none">
                  <Lock size={20} />
                </span>
                <input
                  type={showPassword ? 'text' : 'password'}
                  disabled={busy}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full h-12 bg-app-surface border border-app-border focus:border-app-primary rounded-[14px] pl-11 pr-11 text-sm text-app-text placeholder:text-app-muted/60 outline-hidden transition-colors"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3.5 text-app-muted hover:text-app-text transition-colors"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              </div>

              {/* Forgot Password Link (Sign in mode only) */}
              {!isSignUp && (
                <div className="flex justify-end pt-1">
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => setShowForgotSheet(true)}
                    className="text-[13px] font-semibold text-app-primary hover:underline transition-all"
                  >
                    Quên mật khẩu?
                  </button>
                </div>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-3 rounded-[10px] bg-app-loss/12 border border-app-loss/35 flex items-center gap-2.5 text-[13px] text-app-loss animate-shake">
                <AlertCircle size={18} className="shrink-0" />
                <span className="font-medium">{error}</span>
              </div>
            )}

            {/* Confirmation Message */}
            {message && (
              <div className="p-3 rounded-[10px] bg-app-primary/12 border border-app-primary/35 flex items-center gap-2.5 text-[13px] text-app-primary">
                <CheckCircle2 size={18} className="shrink-0" />
                <span className="font-medium">{message}</span>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={busy || !supabase}
              className="w-full h-12 mt-2 rounded-[14px] bg-app-primary text-app-on-primary font-bold tracking-wide text-sm hover:brightness-105 active:scale-[0.99] disabled:opacity-50 disabled:pointer-events-none flex items-center justify-center gap-2 transition-all shadow-xs"
            >
              {busy ? (
                <>
                  <div className="w-4 h-4 border-2 border-app-on-primary border-t-transparent rounded-full animate-spin" />
                  <span>ĐANG XỬ LÝ…</span>
                </>
              ) : (
                <span>{isSignUp ? 'ĐĂNG KÝ NGAY' : 'ĐĂNG NHẬP'}</span>
              )}
            </button>

            {/* Secondary Switcher Button */}
            <button
              type="button"
              disabled={busy}
              onClick={() => toggleMode(!isSignUp)}
              className="text-center text-sm font-medium text-app-muted hover:text-app-text py-2 transition-colors"
            >
              {isSignUp ? 'Đã có tài khoản? Đăng nhập' : 'Chưa có tài khoản? Đăng ký'}
            </button>
          </form>
        </div>
      </div>

      {/* Forgot Password Sheet */}
      <ForgotPasswordSheet
        isOpen={showForgotSheet}
        onClose={() => setShowForgotSheet(false)}
        initialEmail={email}
        onSuccess={() => {
          setIsSignUp(false);
          setMessage('Đổi mật khẩu thành công. Vui lòng đăng nhập với mật khẩu mới.');
        }}
      />
    </>
  );
};
