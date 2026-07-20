// ============================================================
// audio-engine.tsx - محرك الصوت المتقدم (SpeechSynthesis + Google Translate)
// ============================================================

interface AudioSettings {
  rate: number;
  pitch: number;
  volume: number;
  voice: SpeechSynthesisVoice | null;
  language: string;
  lang?: string; // Added to prevent TypeScript errors when using options.lang
}

interface AudioState {
  isSpeaking: boolean;
  currentText: string;
  queue: string[];
  isPaused: boolean;
  isInitialized: boolean;
  queueLength?: number; // Added to prevent TypeScript errors in getStatus()
}

interface AudioEngineType {
  settings: AudioSettings;
  state: AudioState;
  _globalAudio: HTMLAudioElement | null;
  _speechSynth: SpeechSynthesis | null;
  _currentUtterance: SpeechSynthesisUtterance | null;
  init(): boolean;
  _speakWithSpeechSynthesis(text: string, options: Partial<AudioSettings>): Promise<boolean>;
  _fallbackToGoogleTranslate(text: string, options: Partial<AudioSettings>): void;
  speak(text: string, options?: Partial<AudioSettings>): boolean;
  _cleanText(text: string): string;
  speakQueue(texts: string[], options?: Partial<AudioSettings>): boolean;
  processQueue(options?: Partial<AudioSettings>): boolean;
  stop(): boolean;
  pause(): boolean;
  resume(): boolean;
  speakSlow(text: string): boolean;
  speakFast(text: string): boolean;
  speakWithRepeat(text: string, times?: number): boolean;
  speakWordList(words: string[], options?: Partial<AudioSettings>): boolean;
  updateStatus(text: string, status: 'active' | 'ready' | 'paused' | 'error' | 'stopped'): void;
  showToast(msg: string): void;
  getStatus(): AudioState;
  grantPermissionAndTest(): boolean;
}

const AudioEngine: AudioEngineType = {
  settings: { rate: 1, pitch: 1, volume: 1, voice: null, language: 'en-US' },
  state: { isSpeaking: false, currentText: '', queue: [], isPaused: false, isInitialized: false },
  
  _globalAudio: null,
  _speechSynth: typeof window !== 'undefined' && window.speechSynthesis ? window.speechSynthesis : null,
  _currentUtterance: null,

  init: function(): boolean {
    if (this.state.isInitialized) return true;
    try {
      if (typeof window !== 'undefined') {
        this._globalAudio = new Audio();
        this._speechSynth = window.speechSynthesis;
      }
      this.state.isInitialized = true;
      console.log('✅ AudioEngine تم تهيئته بنجاح');
      this.updateStatus('🔊 جاهز للتشغيل', 'ready');
      return true;
    } catch (e) {
      console.error('❌ خطأ في التهيئة:', e);
      this.updateStatus('❌ فشل التهيئة', 'error');
      return false;
    }
  },

  _speakWithSpeechSynthesis: function(text: string, options: Partial<AudioSettings>): Promise<boolean> {
    return new Promise((resolve, reject) => {
      try {
        if (!window.speechSynthesis) {
          reject(new Error('SpeechSynthesis غير مدعوم'));
          return;
        }
        window.speechSynthesis.cancel();

        const utterance = new SpeechSynthesisUtterance(text);
        this._currentUtterance = utterance;

        const hasArabic = /[\u0600-\u06FF]/.test(text);
        utterance.lang = options.lang || (hasArabic ? 'ar-SA' : 'en-US');
        utterance.rate = options.rate || 1;
        utterance.pitch = options.pitch || 1;
        utterance.volume = options.volume || 1;

        if (this.settings.voice) {
          utterance.voice = this.settings.voice;
        } else {
          const voices = window.speechSynthesis.getVoices();
          const langPrefix = utterance.lang.split('-')[0];
          const selectedVoice = voices.find(v => v.lang.startsWith(langPrefix));
          if (selectedVoice) utterance.voice = selectedVoice;
        }

        utterance.onstart = () => {
          this.state.isSpeaking = true;
          this.updateStatus('🔊 يتحدث...', 'active');
          resolve(true);
        };
        utterance.onend = () => {
          this.state.isSpeaking = false;
          this.updateStatus('🔊 جاهز', 'ready');
          this.processQueue(options);
          resolve(true);
        };
        utterance.onerror = (e: SpeechSynthesisErrorEvent) => {
          console.warn('SpeechSynthesis error:', e);
          this.state.isSpeaking = false;
          this.updateStatus('⚠️ خطأ في النطق', 'error');
          this._fallbackToGoogleTranslate(text, options);
          reject(e);
        };

        window.speechSynthesis.speak(utterance);
      } catch (e) {
        reject(e);
      }
    });
  },

  _fallbackToGoogleTranslate: function(text: string, options: Partial<AudioSettings>): void {
    try {
      if (this._globalAudio) {
        this._globalAudio.pause();
      }
      const cleanText = this._cleanText(text);
      if (!cleanText) return;
      
      const hasArabic = /[\u0600-\u06FF]/.test(cleanText);
      const lang = options.lang || (hasArabic ? 'ar' : 'en');
      
      const audioUrl = `https://translate.google.com/translate_tts?ie=UTF-8&tl=${lang}&client=tw-ob&q=${encodeURIComponent(cleanText)}`;
      const self = this;
      
      if (this._globalAudio) {
        this._globalAudio.src = audioUrl;
        this._globalAudio.volume = Math.min(Math.max(options.volume || this.settings.volume, 0), 1);
        this._globalAudio.playbackRate = options.rate || 1;
        
        const playPromise = this._globalAudio.play();
        if (playPromise !== undefined) {
          playPromise.then(() => {
            self.state.isSpeaking = true;
            self.updateStatus('🔊 يتحدث... (Google)', 'active');
          }).catch((error: Error) => {
            console.error('Google TTS error:', error);
            self.updateStatus('⚠️ فشل التشغيل', 'error');
            self.showToast('⚠️ تأكد من منح الصلاحية');
          });
        }
        
        this._globalAudio.onended = () => {
          self.state.isSpeaking = false;
          self.updateStatus('🔊 جاهز', 'ready');
          self.processQueue(options);
        };
        
        this._globalAudio.onerror = (e: Event | string) => {
          console.error('Audio global error:', e);
          self.state.isSpeaking = false;
          self.updateStatus('🔊 جاهز', 'ready');
          self.processQueue(options);
        };
      }
    } catch (e) {
      console.error('Fallback error:', e);
    }
  },

  speak: function(text: string, options?: Partial<AudioSettings>): boolean {
    try {
      const opts = options || {};
      if (!text) { this.showToast('⚠️ لا يوجد نص'); return false; }
      if (!this.state.isInitialized) this.init();
      
      this.stop();
      const cleanText = this._cleanText(text);
      if (!cleanText || cleanText.length < 1) { 
        this.showToast('⚠️ النص غير صالح'); 
        return false; 
      }

      this._speakWithSpeechSynthesis(cleanText, opts).catch(() => {
        this._fallbackToGoogleTranslate(cleanText, opts);
      });
      
      this.state.currentText = cleanText;
      return true;
    } catch (e) {
      console.error('❌ خطأ فادح:', e);
      return false;
    }
  },

  _cleanText: function(text: string): string {
    try {
      if (!text) return '';
      let cleaned = text.replace(/\/[^\/]*\//g, '').replace(/https?:\/\/[^\s]+/g, '').replace(/<[^>]*>/g, '');
      cleaned = cleaned.replace(/[^a-zA-Z0-9\u0600-\u06FF\s\.\,\!\?\'\-\"\d]/g, ' ');
      return cleaned.replace(/\s+/g, ' ').trim();
    } catch (e) { return text || ''; }
  },

  speakQueue: function(texts: string[], options?: Partial<AudioSettings>): boolean { 
    try { 
      options = options || {}; 
      if (!Array.isArray(texts) || texts.length === 0) return false; 
      this.state.queue = texts.slice(); 
      return this.processQueue(options); 
    } catch (e) { return false; } 
  },

  processQueue: function(options?: Partial<AudioSettings>): boolean { 
    try { 
      options = options || {}; 
      if (this.state.isSpeaking) return false; 
      if (this.state.queue.length === 0) return true; 
      const nextText = this.state.queue.shift(); 
      if (nextText) {
         this.speak(nextText, options);
         return true;
      }
      return false; 
    } catch (e) { return false; } 
  },

  stop: function(): boolean { 
    try { 
      if (this._speechSynth) {
        this._speechSynth.cancel();
      }
      if (this._globalAudio) { 
        this._globalAudio.pause();
        this._globalAudio.currentTime = 0;
      }
      this.state.isSpeaking = false;
      this.state.isPaused = false;
      this.state.queue = [];
      this._currentUtterance = null;
      this.updateStatus('🔊 متوقف', 'stopped'); 
      return true; 
    } catch (e) { return false; } 
  },

  pause: function(): boolean { 
    try { 
      if (this._speechSynth && this.state.isSpeaking) {
        this._speechSynth.pause();
        this.state.isPaused = true;
        this.updateStatus('⏸️ متوقف مؤقتاً', 'paused');
        return true;
      }
      if (this._globalAudio && this.state.isSpeaking) {
        this._globalAudio.pause();
        this.state.isPaused = true;
        this.updateStatus('⏸️ متوقف مؤقتاً', 'paused');
        return true;
      }
      return false; 
    } catch (e) { return false; } 
  },

  resume: function(): boolean { 
    try { 
      if (this._speechSynth && this.state.isPaused) {
        this._speechSynth.resume();
        this.state.isPaused = false;
        this.updateStatus('🔊 يستأنف...', 'active');
        return true;
      }
      if (this._globalAudio && this.state.isPaused) {
        this._globalAudio.play();
        this.state.isPaused = false;
        this.updateStatus('🔊 يستأنف...', 'active');
        return true;
      }
      return false; 
    } catch (e) { return false; } 
  },

  speakSlow: function(text: string): boolean { return this.speak(text, { rate: 0.7 }); },
  speakFast: function(text: string): boolean { return this.speak(text, { rate: 1.4 }); },
  speakWithRepeat: function(text: string, times?: number): boolean { 
    try { 
      const repeatTimes = times || 2; 
      const texts: string[] = []; 
      for (let i = 0; i < repeatTimes; i++) texts.push(text); 
      return this.speakQueue(texts); 
    } catch (e) { return false; } 
  },

  speakWordList: function(words: string[], options?: Partial<AudioSettings>): boolean { 
    try { 
      options = options || {}; 
      if (!Array.isArray(words) || words.length === 0) return false; 
      const numbered: string[] = []; 
      for (let i = 0; i < words.length; i++) numbered.push(`${i + 1}. ${words[i]}`); 
      return this.speakQueue(numbered, options); 
    } catch (e) { return false; } 
  },

  updateStatus: function(text: string, status: 'active' | 'ready' | 'paused' | 'error' | 'stopped'): void { 
    try { 
      const statusEl = document.getElementById('audioStatus'); 
      if (statusEl) { 
        statusEl.textContent = text; 
        const colors: Record<string, string> = { 
          'active': '#ffd700', 
          'ready': '#2ecc71', 
          'paused': '#64c8ff', 
          'error': '#ff6b6b', 
          'stopped': '#777' 
        }; 
        statusEl.style.background = colors[status] || ''; 
        statusEl.dataset.status = status;
      } 
    } catch (e) {} 
  },

  showToast: function(msg: string): void { 
    try { 
      if (typeof window !== 'undefined' && (window as any).showToast) {
        (window as any).showToast(msg);
      } else { 
        console.log('🔊 ' + msg); 
      } 
    } catch (e) { console.log('🔊 ' + msg); } 
  },

  getStatus: function(): AudioState { 
    return { 
      isSpeaking: this.state.isSpeaking, 
      isPaused: this.state.isPaused, 
      currentText: this.state.currentText, 
      queueLength: this.state.queue.length,
      isInitialized: this.state.isInitialized,
      queue: this.state.queue
    }; 
  },

  grantPermissionAndTest: function(): boolean {
    const self = this;
    if (!this.state.isInitialized) this.init();
    
    const testText = "مرحباً! تم تفعيل الصوت بنجاح.";
    
    if (this._speechSynth) {
      const utterance = new SpeechSynthesisUtterance(testText);
      utterance.lang = 'ar-SA';
      utterance.rate = 0.9;
      utterance.onstart = function() {
        self.showToast('🎯 تم تفعيل الصوت بنجاح!');
        self.updateStatus('🔊 جاهز للتشغيل', 'ready');
        return true;
      };
      utterance.onerror = function() {
        self._fallbackToGoogleTranslate(testText, { lang: 'ar' });
        self.showToast('🎯 تم تفعيل الصوت (Google)');
        self.updateStatus('🔊 جاهز للتشغيل', 'ready');
        return true;
      };
      this._speechSynth.speak(utterance);
    } else {
      this._fallbackToGoogleTranslate(testText, { lang: 'ar' });
      this.showToast('🎯 تم تفعيل الصوت!');
      this.updateStatus('🔊 جاهز للتشغيل', 'ready');
    }
    return true;
  }
};

// ============================================================
// دوال مساعدة للاستدعاء من الواجهة
// ============================================================
export function speakText(text: string): boolean { return AudioEngine.speak(text); }
export function speakSlow(text: string): boolean { return AudioEngine.speakSlow(text); }
export function speakFast(text: string): boolean { return AudioEngine.speakFast(text); }
export function stopSpeaking(): boolean { return AudioEngine.stop(); }
export function speakRepeat(text: string, times?: number): boolean { return AudioEngine.speakWithRepeat(text, times); }
export function speakList(words: string[]): boolean { return AudioEngine.speakWordList(words); }
export function grantAudioPermission(): boolean { return AudioEngine.grantPermissionAndTest(); }

// ============================================================
// ربط الأزرار الصوتية تلقائياً
// ============================================================
export function bindAudioButtons(container?: HTMLElement): void {
  try {
    const elements = container ? 
      container.querySelectorAll<HTMLElement>('.play-btn, [data-play]') : 
      document.querySelectorAll<HTMLElement>('.play-btn, [data-play]');
    elements.forEach((btn: HTMLElement) => {
      const existingClick = btn.dataset._bound;
      if (existingClick) return;
      
      btn.addEventListener('click', function(e: Event) {
        e.preventDefault();
        e.stopPropagation();
        const text = (this as HTMLElement).dataset.text || 
                     (this as HTMLElement).dataset.play || 
                     (this as HTMLElement).textContent?.trim() || '';
        if (text && text.length > 0) {
          const rate = parseFloat((this as HTMLElement).dataset.rate || '0.9');
          AudioEngine.speak(text, { rate });
        }
      });
      btn.dataset._bound = 'true';
    });
  } catch (e) { console.warn('⚠️ خطأ في ربط الأزرار:', e); }
}

// ============================================================
// التهيئة عند تحميل الصفحة
// ============================================================
if (typeof document !== 'undefined') {
  document.addEventListener('DOMContentLoaded', function() {
    AudioEngine.init();
    
    setTimeout(function() {
      bindAudioButtons();
    }, 500);
  });
}

// جعل المحرك متاحاً عالمياً
if (typeof window !== 'undefined') {
  (window as any).AudioEngine = AudioEngine;
  (window as any).speakText = speakText;
  (window as any).speakSlow = speakSlow;
  (window as any).speakFast = speakFast;
  (window as any).stopSpeaking = stopSpeaking;
  (window as any).speakRepeat = speakRepeat;
  (window as any).speakList = speakList;
  (window as any).grantAudioPermission = grantAudioPermission;
  (window as any).bindAudioButtons = bindAudioButtons;
}

export default AudioEngine;
