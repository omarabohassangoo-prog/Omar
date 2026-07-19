// ============================================================
// audio-player.tsx - واجهة مشغل الصوت المتقدم والتحكم بالموجات الصوتية
// ============================================================

import React, { useState, useEffect } from 'react';
import { Play, Pause, Square, Volume2 } from 'lucide-react';
import type { UserPreferences } from '../types';

interface AudioPlayerProps {
  userPreferences: UserPreferences | null;
  onUpdatePreferences: (updated: UserPreferences) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ 
  userPreferences, 
  onUpdatePreferences, 
  showToast 
}) => {
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [currentText, setCurrentText] = useState<string>('');
  const [rate, setRate] = useState<number>(userPreferences?.audio_speed || 1.0);
  const [pitch, setPitch] = useState<number>(1.0);

  // جلب معلومات النطق الحالي من محرك الصوت
  useEffect(() => {
    const checkEngineState = () => {
      try {
        const engine = (window as any).AudioEngine;
        if (engine) {
          const status = engine.getStatus();
          setIsPlaying(status.isSpeaking);
          setIsPaused(status.isPaused);
          setCurrentText(status.currentText || '');
        }
      } catch (err) {
        // تجاهل الصمت
      }
    };

    const interval = setInterval(checkEngineState, 300);
    return () => clearInterval(interval);
  }, []);

  // المزامنة مع تغيير تفضيلات المستخدم للسرعة
  useEffect(() => {
    if (userPreferences) {
      setRate(userPreferences.audio_speed);
    }
  }, [userPreferences]);

  // التحكم بالتشغيل
  const handlePlayPause = () => {
    const engine = (window as any).AudioEngine;
    if (!engine) {
      showToast('⚠️ المحرك الصوتي لم يتم تهيئته بالكامل بعد', 'error');
      return;
    }

    if (isPlaying) {
      if (isPaused) {
        engine.resume();
        setIsPaused(false);
        showToast('🔊 تم استئناف نطق الجمل والقصة', 'success');
      } else {
        engine.pause();
        setIsPaused(true);
        showToast('⏸️ تم إيقاف القراءة مؤقتاً', 'info');
      }
    } else {
      // تشغيل عينة تجريبية ممتازة
      const sampleText = currentText || "Learning English with Aura is interesting and fun!";
      engine.speak(sampleText, { rate, pitch, volume: 1.0 });
      showToast('🔊 جاري تشغيل العينة الصوتية', 'info');
    }
  };

  const handleStop = () => {
    const engine = (window as any).AudioEngine;
    if (engine) {
      engine.stop();
      setIsPlaying(false);
      setIsPaused(false);
      showToast('⏹️ تم إيقاف المشغل والموجات الصوتية بالكامل', 'info');
    }
  };

  // التحكم في تفضيلات السرعة والنبرة
  const handleRateChange = (newRate: number) => {
    setRate(newRate);
    if (userPreferences) {
      onUpdatePreferences({ ...userPreferences, audio_speed: newRate });
    }
  };

  // منح صلاحية الاستماع واختبار النطق
  const handleGrantPermission = () => {
    try {
      if ((window as any).grantAudioPermission) {
        (window as any).grantAudioPermission();
      } else {
        showToast('⚠️ دالة التفعيل المباشر غير متوفرة', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="p-5 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl backdrop-blur-md flex flex-col gap-4" id="audio-player-panel">
      {/* رأس لوحة المشغل */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Volume2 className="w-5 h-5 text-emerald-400" />
          <h4 className="font-sans text-xs font-bold text-white">🎛️ لوحة ومفاتيح التحكم بالصوت</h4>
        </div>
        <button 
          onClick={handleGrantPermission}
          className="text-[10px] bg-emerald-400 hover:bg-emerald-300 text-slate-950 font-bold px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
        >
          🔑 تفعيل وتجربة الصوت
        </button>
      </div>

      {/* نص القراءة الحالي وموجة ترددات الصوت */}
      <div className="p-4 bg-slate-950 rounded-xl border border-slate-900/80 flex items-center justify-between gap-4">
        <div className="flex-grow max-w-[80%]">
          <span className="text-[9px] text-slate-500 font-bold uppercase tracking-wider block">النص الجاري قراءته ونطقه:</span>
          <p className="font-sans text-xs text-slate-300 mt-1 max-w-full truncate font-medium">
            {currentText || 'جاهز للتشغيل... اضغط على أي زر استماع في القصة أو القاموس.'}
          </p>
        </div>

        {/* موجة الترددات الصوتية المتحركة عند نطق المحرك */}
        <div className="flex items-center gap-1 h-6 w-12 flex-shrink-0 justify-end">
          {isPlaying && !isPaused ? (
            <>
              <div className="w-1 bg-emerald-400 rounded-full animate-pulse h-5" style={{ animationDelay: '0ms' }} />
              <div className="w-1 bg-emerald-400 rounded-full animate-pulse h-3" style={{ animationDelay: '150ms' }} />
              <div className="w-1 bg-emerald-400 rounded-full animate-pulse h-6" style={{ animationDelay: '300ms' }} />
              <div className="w-1 bg-emerald-400 rounded-full animate-pulse h-2" style={{ animationDelay: '450ms' }} />
            </>
          ) : (
            <>
              <div className="w-1 bg-slate-800 rounded-full h-2" />
              <div className="w-1 bg-slate-800 rounded-full h-2" />
              <div className="w-1 bg-slate-800 rounded-full h-2" />
              <div className="w-1 bg-slate-800 rounded-full h-2" />
            </>
          )}
        </div>
      </div>

      {/* مفاتيح التحكم السفلية */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-center mt-2">
        {/* أزرار المشغل الرئيسية */}
        <div className="flex items-center gap-2.5 justify-center md:justify-start">
          <button 
            onClick={handlePlayPause}
            className={`p-3 rounded-xl transition-all cursor-pointer shadow-md ${isPlaying && !isPaused ? 'bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-amber-500/10' : 'bg-emerald-400 hover:bg-emerald-300 text-slate-950 shadow-emerald-400/10'}`}
            title={isPlaying && !isPaused ? 'إيقاف مؤقت' : 'تشغيل العينة'}
          >
            {isPlaying && !isPaused ? <Pause className="w-4 h-4 fill-current" /> : <Play className="w-4 h-4 fill-current" />}
          </button>
          <button 
            onClick={handleStop}
            disabled={!isPlaying}
            className="p-3 bg-slate-800 hover:bg-slate-700 disabled:opacity-40 text-slate-300 rounded-xl transition-all cursor-pointer border border-slate-700"
            title="إيقاف كلي"
          >
            <Square className="w-4 h-4 fill-current" />
          </button>
        </div>

        {/* معدل السرعة والطبقة */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Audio Speed (السرعة)</span>
            <span className="text-emerald-400 font-bold">{rate.toFixed(1)}x</span>
          </div>
          <input 
            type="range"
            min="0.6"
            max="1.5"
            step="0.1"
            value={rate}
            onChange={(e) => handleRateChange(parseFloat(e.target.value))}
            className="w-full accent-emerald-400"
          />
        </div>

        {/* نبرة ومستوى الصوت */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center text-[10px] text-slate-400 font-mono">
            <span>Pitch Level (الطبقة)</span>
            <span className="text-indigo-400 font-bold">{pitch.toFixed(1)}</span>
          </div>
          <input 
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full accent-indigo-400"
          />
        </div>
      </div>
    </div>
  );
};

export default AudioPlayer;
