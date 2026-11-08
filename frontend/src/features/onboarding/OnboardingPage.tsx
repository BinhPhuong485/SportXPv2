import React, { useState } from 'react';
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  RefreshCw,
  Shield,
  Hourglass,
  Trophy,
  Sparkles,
  User,
  Calendar,
  ArrowRight,
  Lock,
} from 'lucide-react';
import { ONBOARDING_QUESTIONS, calculateRawElo, MAXIMUM_INITIAL_ELO } from './onboardingQuiz';
import { BentoCard } from '../../shared/components/BentoCard';
import { getRankTierFromElo } from '../../core/theme/tokens';

export interface OnboardingState {
  step: number;
  answers: number[];
  displayName: string;
  eloRating: number | null;
  tierName: string | null;
  gender?: 'male' | 'female' | 'other' | null;
  age?: number | null;
}

interface OnboardingPageProps {
  initialState: OnboardingState;
  onSaveAnswer: (questionIndex: number, choiceIndex: number) => Promise<OnboardingState>;
  onSaveDemographics?: (gender: 'male' | 'female' | 'other', age: number) => Promise<void>;
  onComplete: () => void;
  onSignOut: () => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({
  initialState,
  onSaveAnswer,
  onSaveDemographics,
  onComplete,
  onSignOut,
}) => {
  const getForcedStep = (): number | null => {
    if (typeof window === 'undefined') return null;
    const url = new URL(window.location.href);
    const stepStr = url.searchParams.get('step') ?? new URLSearchParams(url.hash.split('?')[1] || '').get('step');
    if (stepStr !== null) {
      const parsed = parseInt(stepStr, 10);
      if (!isNaN(parsed) && parsed >= 0 && parsed <= 5) return parsed;
    }
    return null;
  };

  const forcedStep = getForcedStep();

  const [state, setState] = useState<OnboardingState>(() => {
    if (forcedStep !== null) {
      return {
        ...initialState,
        step: forcedStep,
        answers: forcedStep === 5 ? [1, 2, 1, 2, 1] : initialState.answers,
        eloRating: forcedStep === 5 ? 750 : initialState.eloRating,
        tierName: forcedStep === 5 ? 'TB' : initialState.tierName,
      };
    }
    return initialState;
  });

  const [currentIndex, setCurrentIndex] = useState(() => {
    if (forcedStep !== null && forcedStep < 5) return forcedStep;
    return Math.min(Math.max(initialState.step, 0), 4);
  });
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Demographics step (Age & Gender) shown right after signup and before questions
  const isGenderLocked = Boolean(initialState.gender);
  const [showDemographics, setShowDemographics] = useState<boolean>(() => {
    if (forcedStep !== null) return false;
    return !initialState.gender || !initialState.age;
  });
  const [gender, setGender] = useState<'male' | 'female' | 'other'>(
    initialState.gender || 'male'
  );
  const [age, setAge] = useState<string>(
    initialState.age != null ? String(initialState.age) : ''
  );
  const [demographicsError, setDemographicsError] = useState<string | null>(null);
  const [savingDemographics, setSavingDemographics] = useState(false);

  const handleSubmitDemographics = async () => {
    if (savingDemographics) return;
    const parsedAge = age.trim() ? parseInt(age.trim(), 10) : null;
    if (parsedAge === null || isNaN(parsedAge) || parsedAge < 6 || parsedAge > 100) {
      setDemographicsError('Vui lòng nhập độ tuổi hợp lệ (từ 6 đến 100 tuổi).');
      return;
    }

    setSavingDemographics(true);
    setDemographicsError(null);
    try {
      if (onSaveDemographics) {
        await onSaveDemographics(isGenderLocked ? initialState.gender! : gender, parsedAge);
      }
      setShowDemographics(false);
    } catch {
      setDemographicsError('Không thể lưu thông tin. Vui lòng thử lại.');
    } finally {
      setSavingDemographics(false);
    }
  };

  const isCompleted = state.step === 5;

  const handleSelectChoice = async (choiceIndex: number) => {
    if (saving) return;
    setSaving(true);
    setSelectedChoice(choiceIndex);
    setError(null);

    try {
      const nextState = await onSaveAnswer(currentIndex, choiceIndex);
      // Brief delay to give visual feedback like Flutter
      await new Promise((resolve) => setTimeout(resolve, 160));
      setState(nextState);
      setCurrentIndex(Math.min(Math.max(nextState.step, 0), 4));
      setSelectedChoice(null);
    } catch {
      setError('Chưa lưu được câu trả lời. Kết nối lại và thử tiếp nhé.');
    } finally {
      setSaving(false);
    }
  };

  const handleBack = () => {
    if (saving || currentIndex === 0) return;
    const prevIndex = currentIndex - 1;
    setCurrentIndex(prevIndex);
    setSelectedChoice(state.answers[prevIndex] ?? null);
    setError(null);
  };

  return (
    <div className="min-h-screen w-full bg-app-background flex flex-col items-center">
      {/* Top Header */}
      <header className="w-full max-w-content px-4 py-3.5 flex items-center justify-between border-b border-app-border/40">
        <span className="text-base font-black tracking-widest text-app-text">SPORTXP</span>
        <button
          onClick={onSignOut}
          disabled={saving}
          className="text-xs font-semibold text-app-muted hover:text-app-text disabled:opacity-50 transition-colors"
        >
          Đăng xuất
        </button>
      </header>

      {/* Main Content Area */}
      <div className="w-full max-w-content px-4 py-6 flex-1 flex flex-col justify-start">
        {showDemographics ? (
          /* ATHLETE DEMOGRAPHICS STEP (GENDER & AGE) */
          <div className="flex flex-col gap-6 animate-fade-in py-2">
            {/* Step tag */}
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold tracking-[0.15em] text-app-primary uppercase flex items-center gap-1.5">
                <Sparkles size={13} className="text-app-streak" />
                Bước khởi đầu · Thông tin cá nhân
              </span>
              <span className="text-xs font-semibold text-app-muted">
                1 phút hoàn thành
              </span>
            </div>

            <div>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-app-text leading-tight mb-2">
                Thông tin vận động viên
              </h2>
              <p className="text-xs text-app-muted leading-relaxed">
                Cho SportXP biết giới tính và độ tuổi để tìm đối thủ vừa sức, ghép cặp trận đấu công bằng và chuẩn bị bảng xếp hạng cho bạn.
              </p>
            </div>

            <BentoCard>
              <div className="flex flex-col gap-5">
                {/* Gender field */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-app-text uppercase tracking-wider flex items-center gap-1.5">
                      <User size={14} className="text-app-primary" />
                      Giới tính của bạn
                    </label>
                    {isGenderLocked ? (
                      <span className="text-[10px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                        <Lock size={11} /> Cố định
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold text-amber-600 dark:text-amber-400">
                        Chỉ chọn 1 lần
                      </span>
                    )}
                  </div>
                  <div className={`grid grid-cols-3 gap-2 ${isGenderLocked ? 'opacity-85' : ''}`}>
                    <button
                      type="button"
                      disabled={isGenderLocked}
                      onClick={() => !isGenderLocked && setGender('male')}
                      className={`h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                        isGenderLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        gender === 'male'
                          ? 'bg-blue-600 text-white border-blue-600 shadow-md ring-2 ring-blue-600/30'
                          : 'bg-app-background border-app-border text-app-muted hover:text-app-text hover:border-app-border/80'
                      }`}
                    >
                      <span>Nam</span>
                      {gender === 'male' && <CheckCircle2 size={15} />}
                    </button>
                    <button
                      type="button"
                      disabled={isGenderLocked}
                      onClick={() => !isGenderLocked && setGender('female')}
                      className={`h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                        isGenderLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        gender === 'female'
                          ? 'bg-rose-500 text-white border-rose-500 shadow-md ring-2 ring-rose-500/30'
                          : 'bg-app-background border-app-border text-app-muted hover:text-app-text hover:border-app-border/80'
                      }`}
                    >
                      <span>Nữ</span>
                      {gender === 'female' && <CheckCircle2 size={15} />}
                    </button>
                    <button
                      type="button"
                      disabled={isGenderLocked}
                      onClick={() => !isGenderLocked && setGender('other')}
                      className={`h-12 rounded-xl text-xs font-black uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 border ${
                        isGenderLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                      } ${
                        gender === 'other'
                          ? 'bg-purple-600 text-white border-purple-600 shadow-md ring-2 ring-purple-600/30'
                          : 'bg-app-background border-app-border text-app-muted hover:text-app-text hover:border-app-border/80'
                      }`}
                    >
                      <span>Khác</span>
                      {gender === 'other' && <CheckCircle2 size={15} />}
                    </button>
                  </div>
                  {isGenderLocked ? (
                    <p className="text-[11px] text-app-muted">
                      Giới tính đã được xác thực và không thể thay đổi.
                    </p>
                  ) : (
                    <p className="text-[11px] text-amber-600 dark:text-amber-400 font-medium">
                      Lưu ý: Giới tính không thể thay đổi sau khi xác nhận.
                    </p>
                  )}
                </div>

                {/* Age field */}
                <div className="flex flex-col gap-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-app-text uppercase tracking-wider flex items-center gap-1.5">
                      <Calendar size={14} className="text-app-primary" />
                      Độ tuổi
                    </label>
                    {age && !isNaN(parseInt(age, 10)) && parseInt(age, 10) >= 6 && parseInt(age, 10) <= 100 && (
                      <span className="text-[11px] font-bold text-app-primary">
                        Sinh năm ~{new Date().getFullYear() - parseInt(age, 10)}
                      </span>
                    )}
                  </div>
                  <div className="relative flex items-center">
                    <input
                      type="number"
                      min={6}
                      max={100}
                      value={age}
                      onChange={(e) => {
                        setAge(e.target.value);
                        setDemographicsError(null);
                      }}
                      placeholder="Nhập tuổi của bạn (VD: 24)"
                      className="w-full h-12 px-4 rounded-xl bg-app-background border border-app-border text-app-text text-sm font-semibold focus:outline-hidden focus:border-app-primary focus:ring-2 focus:ring-app-primary/20 transition-all placeholder:text-app-muted/60"
                    />
                  </div>
                  <p className="text-[11px] text-app-muted">
                    Hỗ trợ độ tuổi từ 6 đến 100 tuổi.
                  </p>
                </div>

                {demographicsError && (
                  <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs font-semibold text-rose-600 dark:text-rose-400">
                    {demographicsError}
                  </div>
                )}
              </div>
            </BentoCard>

            {/* Next Button */}
            <div className="pt-2">
              <button
                type="button"
                disabled={savingDemographics}
                onClick={handleSubmitDemographics}
                className="w-full h-12 rounded-xl bg-app-primary text-app-background font-extrabold text-xs tracking-wider uppercase flex items-center justify-center gap-2 hover:brightness-105 active:scale-[0.99] disabled:opacity-50 transition-all shadow-md cursor-pointer"
              >
                {savingDemographics ? (
                  <span>Đang lưu...</span>
                ) : (
                  <>
                    <span>Bắt đầu khảo sát trình độ (5 câu hỏi)</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </div>
          </div>
        ) : isCompleted ? (
          /* RESULT VIEW */
          <div className="flex flex-col gap-6 animate-fade-in py-2">
            <div className="w-12 h-12 rounded-full bg-app-primary/10 flex items-center justify-center text-app-primary">
              <Trophy size={28} />
            </div>

            <div>
              <h2 className="text-2xl font-extrabold text-app-text mb-2">Điểm xuất phát của bạn.</h2>
              <p className="text-xs text-app-muted">
                Kỹ năng được ghi nhận. Hành trình bắt đầu từ sân đấu.
              </p>
            </div>

            <BentoCard doubleBezel courtPattern>
              <div className="flex flex-col gap-5">
                <div className="flex items-center justify-between text-xs font-bold text-app-muted tracking-wider">
                  <span>THẺ VẬN ĐỘNG VIÊN</span>
                  <Shield size={20} className="text-app-muted" />
                </div>

                <div className="text-xl font-bold text-app-text">{state.displayName}</div>

                <div>
                  <div className="text-[52px] font-extrabold text-app-primary leading-none tracking-tight tabular-nums">
                    {state.eloRating ?? 300}
                  </div>
                  <div className="text-xs font-bold tracking-wider text-app-muted mt-2">
                    ELO KHỞI TẠO · TẠM TÍNH
                  </div>
                </div>

                <div className="w-full h-px bg-app-border" />

                <div className="text-base font-bold text-app-text">
                  {state.eloRating ? getRankTierFromElo(state.eloRating).label : 'Chưa xếp hạng'}
                </div>

                <div className="p-3 rounded-xl border border-app-border flex items-center gap-2 bg-app-background/50">
                  <Hourglass size={16} className="text-app-muted shrink-0" />
                  <span className="text-xs text-app-muted font-medium">Unverified · Chưa xác minh</span>
                </div>
              </div>
            </BentoCard>

            <p className="text-sm text-app-text leading-relaxed">
              Hoàn thành 5 trận đấu đầu tiên để mở khóa Huy hiệu Rank chính thức và xuất hiện trên Bảng xếp hạng khu vực!
            </p>

            {state.answers.length === 5 && calculateRawElo(state.answers) > MAXIMUM_INITIAL_ELO && (
              <p className="text-xs text-app-muted leading-relaxed">
                Điểm khởi tạo tối đa là 850 Elo. Hãy chứng minh trình độ qua những trận thắng thực tế để tiến tới mốc 1000+.
              </p>
            )}

            <div className="flex justify-end pt-2">
              <button
                onClick={onComplete}
                className="px-6 py-3 rounded-xl bg-app-primary text-app-background font-extrabold text-xs tracking-wider uppercase hover:brightness-105 active:scale-[0.99] transition-all"
              >
                BẮT ĐẦU LÊN SÂN
              </button>
            </div>
          </div>
        ) : (
          /* QUIZ QUESTIONS VIEW */
          <div className="flex flex-col gap-5 animate-fade-in">
            {/* Step navigation and progress */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-medium text-app-muted">
                  Bước {currentIndex + 1}/5
                </span>
                {currentIndex > 0 ? (
                  <button
                    onClick={handleBack}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs text-app-primary hover:underline font-semibold cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>Câu trước</span>
                  </button>
                ) : (
                  <button
                    onClick={() => setShowDemographics(true)}
                    disabled={saving}
                    className="flex items-center gap-1 text-xs text-app-primary hover:underline font-semibold cursor-pointer"
                  >
                    <ArrowLeft size={14} />
                    <span>{isGenderLocked ? 'Sửa thông tin độ tuổi' : 'Sửa tuổi & giới tính'}</span>
                  </button>
                )}
              </div>
              <div className="w-full h-[3px] bg-app-border rounded-full overflow-hidden">
                <div
                  className="h-full bg-app-primary transition-all duration-300 rounded-full"
                  style={{ width: `${((currentIndex + 1) / 5) * 100}%` }}
                />
              </div>
            </div>

            {/* Category tag */}
            <div className="text-[11px] font-bold tracking-[0.15em] text-app-muted uppercase">
              {ONBOARDING_QUESTIONS[currentIndex].category}
            </div>

            {/* Question title */}
            <h2 className="text-xl sm:text-2xl font-bold text-app-text leading-snug">
              {ONBOARDING_QUESTIONS[currentIndex].title}
            </h2>

            <p className="text-xs text-app-muted -mt-1">
              Chọn câu gần với bạn nhất. Mỗi câu trả lời giúp tìm đối thủ vừa sức.
            </p>

            {/* Choices List */}
            <div className="flex flex-col gap-3 mt-2">
              {ONBOARDING_QUESTIONS[currentIndex].choices.map((choice, i) => {
                const isSelected = selectedChoice === i;
                return (
                  <button
                    key={i}
                    disabled={saving}
                    onClick={() => handleSelectChoice(i)}
                    className={`w-full text-left p-4 rounded-2xl bg-app-surface border transition-all flex items-start gap-4 ${
                      isSelected
                        ? 'border-app-primary bg-app-primary/5 ring-1 ring-app-primary'
                        : 'border-app-border hover:border-app-muted/50'
                    }`}
                  >
                    <span className="text-xs font-bold text-app-muted pt-0.5">
                      {String.fromCharCode(65 + i)}
                    </span>
                    <span className="flex-1 text-sm text-app-text leading-relaxed">
                      {choice.label}
                    </span>
                    <span className="shrink-0 pt-0.5">
                      {isSelected ? (
                        <CheckCircle2 size={18} className="text-app-primary" />
                      ) : (
                        <Circle size={18} className="text-app-muted" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>

            {/* Error & Retry */}
            {error && (
              <div className="flex flex-col items-start gap-2 pt-1 text-app-loss text-xs">
                <span>{error}</span>
                {selectedChoice !== null && (
                  <button
                    onClick={() => handleSelectChoice(selectedChoice)}
                    className="flex items-center gap-1.5 text-app-primary hover:underline font-semibold"
                  >
                    <RefreshCw size={14} />
                    <span>Lưu lại câu trả lời</span>
                  </button>
                )}
              </div>
            )}

            {/* Saving indicator status */}
            <div className="text-xs text-app-muted pt-1">
              {saving ? 'Đang lưu câu trả lời…' : 'Tiến độ được lưu sau mỗi câu trả lời.'}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

