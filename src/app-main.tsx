// ============================================================
// app-main.tsx - المتحكم الرئيسي للتطبيق وعموده الفقري (React 19)
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import StoryLoader from './loaders/story-loader';
import GrammarLoader from './loaders/grammar-loader';
import VocabularyLoader from './loaders/vocabulary-loader';
import PhoneticsLoader from './loaders/phonetics-loader';
import AudioEngine from './core/audio-engine';

import { AdsManager } from './components/ads-manager';
import Dashboard from './components/dashboard';
import UserProfile from './components/user-profile';
import SearchEngine from './components/search-engine';
import AudioPlayer from './components/audio-player';
import { AdminDashboard } from './components/admin-dashboard';

import { 
  BookOpen, GraduationCap, LayoutDashboard, Search, 
  User, Volume2, ShieldCheck, ArrowUp, Lock
} from 'lucide-react';
import type { UserProgress, UserPreferences } from './types';

// مكون بسيط للف الجمل ومحملات الـ DOM الفانيلا
const LoaderWrapper: React.FC<{ loader: any; view: 'main' | 'detail' }> = ({ loader, view }) => {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (containerRef.current) {
      loader.currentView = view;
      loader.render(containerRef.current);
    }
  }, [loader, view]);

  return (
    <div 
      ref={containerRef} 
      className="w-full text-slate-100 font-sans" 
      id={`loader-container-${loader.name || 'loader'}`} 
    />
  );
};

const App: React.FC = () => {
  // تتبع التبويب الحالي والواجهة النشطة
  const [currentTab, setCurrentTab] = useState<'story' | 'grammar' | 'vocabulary' | 'phonetics' | 'dashboard' | 'search' | 'profile' | 'audio' | 'admin'>('dashboard');
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [adminPassword, setAdminPassword] = useState('');
  const [currentView, setCurrentView] = useState<'main' | 'detail'>('main');
  const [detailName, setDetailName] = useState<string | null>(null);

  // تتبع الإشعارات المحمولة (Toast)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const toastTimerRef = useRef<NodeJS.Timeout | null>(null);

  // تتبع سجلات ومستويات المستخدم
  const [userProgress, setUserProgress] = useState<UserProgress | null>(null);
  const [userPreferences, setUserPreferences] = useState<UserPreferences | null>(null);

  // تتبع الإحصاءات والأعداد الكلية للبادجات
  const [counts, setCounts] = useState({
    chapters: 3,
    rules: 6,
    words: 50,
    phonetics: 24
  });

  const [scrollVisible, setScrollVisible] = useState<boolean>(false);

  // دالة عرض التنبيهات
  const showToast = (msg: string, type: 'success' | 'error' | 'info' = 'info') => {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setToast({ message: msg, type });
    toastTimerRef.current = setTimeout(() => {
      setToast(null);
    }, 3000);
  };

  // تهيئة التطبيق وجلب البيانات
  useEffect(() => {
    // جلب التحقق من ملكية جوجل ومعلومات الموقع ديناميكياً
    fetch('/api/admin/settings')
      .then(res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          return res.json();
        }
        return fetch('/ads_config.json').then(r => r.json());
      })
      .then(data => {
        if (!data) return;

        // 1. رمز التحقق من ملكية جوجل
        if (data.google_site_verification) {
          let meta = document.querySelector('meta[name="google-site-verification"]');
          if (!meta) {
            meta = document.createElement('meta');
            meta.setAttribute('name', 'google-site-verification');
            document.head.appendChild(meta);
          }
          meta.setAttribute('content', data.google_site_verification);
        }

        // 2. رابط الموقع الكنسي (Canonical URL) وروابط OG
        if (data.site_url) {
          // Canonical link
          let canonical = document.querySelector('link[rel="canonical"]');
          if (!canonical) {
            canonical = document.createElement('link');
            canonical.setAttribute('rel', 'canonical');
            document.head.appendChild(canonical);
          }
          canonical.setAttribute('href', data.site_url);

          // Open Graph URL
          let ogUrl = document.querySelector('meta[property="og:url"]');
          if (!ogUrl) {
            ogUrl = document.createElement('meta');
            ogUrl.setAttribute('property', 'og:url');
            document.head.appendChild(ogUrl);
          }
          ogUrl.setAttribute('content', data.site_url);
        }

        // 3. أيقونة الموقع (Favicon)
        if (data.site_icon_url) {
          // Standard favicon
          let icon = document.querySelector('link[rel="icon"]');
          if (!icon) {
            icon = document.createElement('link');
            icon.setAttribute('rel', 'icon');
            document.head.appendChild(icon);
          }
          icon.setAttribute('href', data.site_icon_url);

          // Shortcut icon
          let shortcutIcon = document.querySelector('link[rel="shortcut icon"]');
          if (!shortcutIcon) {
            shortcutIcon = document.createElement('link');
            shortcutIcon.setAttribute('rel', 'shortcut icon');
            document.head.appendChild(shortcutIcon);
          }
          shortcutIcon.setAttribute('href', data.site_icon_url);

          // Apple touch icon
          let appleIcon = document.querySelector('link[rel="apple-touch-icon"]');
          if (!appleIcon) {
            appleIcon = document.createElement('link');
            appleIcon.setAttribute('rel', 'apple-touch-icon');
            document.head.appendChild(appleIcon);
          }
          appleIcon.setAttribute('href', data.site_icon_url);
        }

        // 4. تحليلات جوجل (Google Analytics gtag.js)
        if (data.google_analytics_id && data.google_analytics_id.trim()) {
          const gaId = data.google_analytics_id.trim();
          
          // Check if already injected
          let gaScript = document.querySelector(`script[src*="googletagmanager.com/gtag/js"]`);
          if (!gaScript) {
            gaScript = document.createElement('script');
            gaScript.setAttribute('async', 'true');
            gaScript.setAttribute('src', `https://www.googletagmanager.com/gtag/js?id=${gaId}`);
            document.head.appendChild(gaScript);

            const inlineScript = document.createElement('script');
            inlineScript.innerHTML = `
              window.dataLayer = window.dataLayer || [];
              function gtag(){dataLayer.push(arguments);}
              gtag('js', new Date());
              gtag('config', '${gaId}');
            `;
            document.head.appendChild(inlineScript);
          }
        }
      })
      .catch(err => console.error('Error fetching site configuration:', err));

    // تحميل تفضيلات وسجلات المستخدم
    const savedProgress = localStorage.getItem('aura_user_progress');
    const savedPrefs = localStorage.getItem('aura_user_preferences');

    if (savedProgress) {
      setUserProgress(JSON.parse(savedProgress));
    } else {
      fetch('/user_progress.json')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUserProgress(data);
            localStorage.setItem('aura_user_progress', JSON.stringify(data));
          }
        });
    }

    if (savedPrefs) {
      const parsedPrefs = JSON.parse(savedPrefs);
      setUserPreferences(parsedPrefs);
      // تفعيل السمة المطلوبة على صفحة الـ DOM
      applyTheme(parsedPrefs.theme);
    } else {
      fetch('/user_preferences.json')
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data) {
            setUserPreferences(data);
            localStorage.setItem('aura_user_preferences', JSON.stringify(data));
            applyTheme(data.theme);
          }
        });
    }



    // جلب أعداد الإحصاءات الإجمالية من المحملات
    const loadAllLoaders = async () => {
      try {
        await Promise.all([
          StoryLoader.load(),
          GrammarLoader.load(),
          VocabularyLoader.load(),
          PhoneticsLoader.load()
        ]);

        // تحديث الأعداد
        setCounts({
          chapters: StoryLoader.data?.chapters.length || 3,
          rules: GrammarLoader.data?.grammar_rules.length || 6,
          words: 45, // قيمة تقديرية مريحة
          phonetics: 26
        });
      } catch (e) {
        console.error("Error loading static loaders:", e);
      }
    };

    loadAllLoaders();

    // ربط مستكشف التمرير لزر العودة للأعلى
    const handleScroll = () => {
      setScrollVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
      if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    };
  }, []);

  // دالة تطبيق السمات
  const applyTheme = (theme: 'dark' | 'light' | 'sepia' | 'high_contrast') => {
    document.body.classList.remove('light-mode', 'sepia-mode', 'high-contrast-mode');
    if (theme === 'light') {
      document.body.classList.add('light-mode');
    } else if (theme === 'sepia') {
      document.body.classList.add('sepia-mode');
    } else if (theme === 'high_contrast') {
      document.body.classList.add('high-contrast-mode');
    }
  };

  // تحديث سجلات المستخدم
  const handleUpdateProgress = (updated: UserProgress) => {
    setUserProgress(updated);
    localStorage.setItem('aura_user_progress', JSON.stringify(updated));
  };

  // تحديث تفضيلات المستخدم
  const handleUpdatePreferences = (updated: UserPreferences) => {
    setUserPreferences(updated);
    localStorage.setItem('aura_user_preferences', JSON.stringify(updated));
    applyTheme(updated.theme);
  };

  // تصدير وتصدير الدوال للنطاق العام لضمان ملاءمتها لمحملات الفانيلا القديمة
  useEffect(() => {
    window.showToast = (msg: string) => showToast(msg, 'info');
    window.updateBreadcrumb = (name: string | null) => {
      setDetailName(name);
      if (name) {
        setCurrentView('detail');
      } else {
        setCurrentView('main');
      }
    };
    window.scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });
    window.goToHome = () => {
      setCurrentTab('dashboard');
      setCurrentView('main');
      setDetailName(null);
    };
    window.goBackToMain = () => {
      setCurrentView('main');
      setDetailName(null);
      if (StoryLoader) StoryLoader.currentView = 'main';
      if (GrammarLoader) GrammarLoader.currentView = 'main';
      if (VocabularyLoader) VocabularyLoader.currentView = 'main';
      if (PhoneticsLoader) PhoneticsLoader.currentView = 'main';
    };
    window.loadAllData = () => {};
    window.updateBadges = () => {};
    window.fixIPADisplay = () => {
      try {
        const ipaElements = document.querySelectorAll('.ipa-symbol, [data-ipa]');
        ipaElements.forEach((el: any) => {
          el.style.fontFamily = "'Noto Sans IPA Extensions', 'Arial Unicode MS', sans-serif";
          el.style.direction = 'ltr';
        });
      } catch (e) {}
    };

    window.StoryLoader = StoryLoader;
    window.GrammarLoader = GrammarLoader;
    window.VocabularyLoader = VocabularyLoader;
    window.PhoneticsLoader = PhoneticsLoader;
    window.AudioEngine = AudioEngine;
  }, []);

  const handleTabChange = (tab: typeof currentTab) => {
    setCurrentTab(tab);
    setCurrentView('main');
    setDetailName(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`📂 انتقلت إلى: ${tab}`, 'info');
  };

  const getTabName = (tab: typeof currentTab): string => {
    const names: Record<string, string> = {
      'story': '📖 القصص اليومية',
      'grammar': '📚 القواعد النحوية',
      'vocabulary': '📝 مستكشف المفردات',
      'phonetics': '🔊 مخارج الصوتيات',
      'dashboard': '💻 لوحة التحكم',
      'search': '🔍 القاموس المساعد',
      'profile': '👤 ملف التعريف',
      'audio': '🎛️ مشغل الصوت',
      'admin': '⚙️ لوحة المدير'
    };
    return names[tab] || tab;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8 space-y-6" id="react-application-root">
      
      {/* 1. ترويسة الصفحة والهيدر المالي والتفاعلي */}
      <header id="permissionBox" className="relative overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-slate-800/80 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-center gap-6 shadow-2xl transition-all duration-300">
        
        {/* توهج خلفي فاخر */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl pointer-events-none" />

        <div className="space-y-3 text-center md:text-right z-10">
          <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-300 to-amber-400">
            أورا التعليمية · Aura Learn
          </h1>
          <p className="text-sm sm:text-base text-slate-300 font-medium">
            بوابتك الشاملة لتعلم اللغة والتحليل الفوري بمساعدة الذكاء الاصطناعي ومخارج الحروف.
          </p>
          <div className="pt-2 flex flex-wrap gap-2 justify-center md:justify-start">
            <button 
              id="grantAudioPermission" 
              onClick={() => {
                if (AudioEngine && typeof AudioEngine.grantPermissionAndTest === 'function') {
                  AudioEngine.grantPermissionAndTest();
                }
              }}
              className="px-4 py-2 text-xs font-bold rounded-xl bg-purple-600 hover:bg-purple-700 text-white shadow transition-all cursor-pointer flex items-center gap-1.5"
            >
              🔊 تفعيل النطق الصوتي
            </button>
            <span id="audioStatus" className="px-3 py-1.5 text-[11px] font-bold rounded-lg bg-slate-800 border border-slate-700 text-slate-300" data-status="ready">
              🔊 جاهز للتشغيل
            </span>
          </div>
        </div>

        {/* إحصاءات البادجات العلوية الفورية */}
        <div className="flex flex-wrap justify-center gap-3 z-10">
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-850 text-center">
            <span id="totalChapters" className="block text-lg font-bold text-amber-400">{counts.chapters}</span>
            <span className="text-[10px] text-slate-400 font-bold">فصل تفاعلي</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-850 text-center">
            <span id="totalRules" className="block text-lg font-bold text-blue-400">{counts.rules}</span>
            <span className="text-[10px] text-slate-400 font-bold">قاعدة نحوية</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-850 text-center">
            <span id="totalWords" className="block text-lg font-bold text-emerald-400">{counts.words}</span>
            <span className="text-[10px] text-slate-400 font-bold">مفردة لغوية</span>
          </div>
          <div className="px-4 py-2.5 rounded-2xl bg-slate-950 border border-slate-850 text-center">
            <span id="totalPhonetics" className="block text-lg font-bold text-purple-400">{counts.phonetics}</span>
            <span className="text-[10px] text-slate-400 font-bold">رمز مخرج صوتي</span>
          </div>
        </div>

        {/* تبديل السمة السريع الفاخر */}
        <button
          id="themeToggle"
          onClick={() => {
            if (userPreferences) {
              const nextTheme = userPreferences.theme === 'dark' ? 'light' : userPreferences.theme === 'light' ? 'sepia' : 'dark';
              handleUpdatePreferences({ ...userPreferences, theme: nextTheme });
              showToast(`🎨 تم تبديل المظهر إلى: ${nextTheme}`, 'info');
            }
          }}
          className="absolute top-4 left-4 p-2.5 rounded-full bg-slate-850 hover:bg-slate-800 text-amber-400 transition cursor-pointer border border-slate-750 shadow-md"
        >
          {userPreferences?.theme === 'light' ? '☀️' : userPreferences?.theme === 'sepia' ? '📜' : '🌙'}
        </button>
      </header>

      {/* 2. مسار التنقل والخبز الفوري (Breadcrumbs) */}
      <div id="breadcrumb" className="flex items-center gap-1.5 px-4 text-xs font-semibold text-slate-400 select-none">
        <span className="crumb cursor-pointer hover:text-white transition-colors" onClick={() => handleTabChange('dashboard')}>🏠 الرئيسية</span>
        <span className="separator"> › </span>
        <span className="crumb text-emerald-400">{getTabName(currentTab)}</span>
        {detailName && (
          <>
            <span className="separator"> › </span>
            <span className="crumb text-amber-400">{detailName}</span>
          </>
        )}
      </div>

      {/* 3. إعلانات Google AdSense العلوية */}
      <AdsManager position="header" />

      {/* 4. شريط تبويبات التنقل الشامل (Navigation Tabs) */}
      <nav id="tabBar" className="flex flex-wrap justify-center gap-2 p-2 rounded-2xl bg-slate-900 border border-slate-800 shadow-lg">
        
        {/* الأقسام الأساسية للتعلم الفوري */}
        <button
          onClick={() => handleTabChange('dashboard')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'dashboard' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <LayoutDashboard className="w-4 h-4" /> لوحة التحكم
        </button>

        <button
          onClick={() => handleTabChange('story')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'story' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <BookOpen className="w-4 h-4" /> القصص اليومية
          <span className="bg-slate-950/40 text-[10px] px-1.5 py-0.5 rounded-full text-slate-300">{counts.chapters}</span>
        </button>

        <button
          onClick={() => handleTabChange('grammar')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'grammar' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <GraduationCap className="w-4 h-4" /> القواعد النحوية
          <span className="bg-slate-950/40 text-[10px] px-1.5 py-0.5 rounded-full text-slate-300">{counts.rules}</span>
        </button>

        <button
          onClick={() => handleTabChange('vocabulary')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'vocabulary' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <BookOpen className="w-4 h-4" /> مستكشف المفردات
        </button>

        <button
          onClick={() => handleTabChange('phonetics')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'phonetics' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <Volume2 className="w-4 h-4" /> مخارج الصوتيات
        </button>

        {/* المكونات والخصائص الحديثة المضافة */}
        <button
          onClick={() => handleTabChange('search')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'search' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <Search className="w-4 h-4" /> القاموس المساعد
        </button>

        <button
          onClick={() => handleTabChange('audio')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'audio' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <Volume2 className="w-4 h-4" /> لوحة الصوت
        </button>

        <button
          onClick={() => handleTabChange('profile')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'profile' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <User className="w-4 h-4" /> ملف المستخدم
        </button>

        <button
          onClick={() => handleTabChange('admin')}
          className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-bold transition flex items-center gap-2 cursor-pointer ${currentTab === 'admin' ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white bg-transparent'}`}
        >
          <Lock className="w-4 h-4" /> لوحة المدير
        </button>
      </nav>

      {/* 5. مساحة عرض المحتوى الديناميكية والشاشات النشطة */}
      <main id="contentArea" className="bg-slate-900/40 border border-slate-800/85 rounded-3xl p-5 sm:p-6 shadow-2xl backdrop-blur-md min-h-[500px] transition-all">
        
        {/* أ. شاشات محملات الفانيلا القديمة (مع لفها بمكون ريأكت مريح) */}
        {currentTab === 'story' && <LoaderWrapper loader={StoryLoader} view={currentView} />}
        {currentTab === 'grammar' && <LoaderWrapper loader={GrammarLoader} view={currentView} />}
        {currentTab === 'vocabulary' && <LoaderWrapper loader={VocabularyLoader} view={currentView} />}
        {currentTab === 'phonetics' && <LoaderWrapper loader={PhoneticsLoader} view={currentView} />}

        {/* ب. الشاشات والأجزاء الحديثة كلياً بالريأكت */}
        {currentTab === 'dashboard' && (
          <Dashboard 
            userProgress={userProgress} 
            onUpdateProgress={handleUpdateProgress} 
            showToast={showToast} 
          />
        )}

        {currentTab === 'admin' && (
          isAdminLoggedIn ? (
            <AdminDashboard onLogout={() => setIsAdminLoggedIn(false)} showToast={showToast} />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-6">
              <Lock className="w-12 h-12 text-slate-500 mb-4" />
              <h2 className="text-xl font-bold text-white mb-2">دخول المدير</h2>
              <input
                type="password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
                    if (adminPassword.trim() === ADMIN_PASSWORD) {
                      setIsAdminLoggedIn(true);
                      showToast('تم تسجيل دخول المدير بنجاح', 'success');
                    } else {
                      showToast('كلمة سر خاطئة', 'error');
                    }
                  }
                }}
                placeholder="كلمة السر"
                className="px-4 py-2 rounded-xl bg-slate-800 text-white border border-slate-700 mb-4 focus:outline-none focus:border-emerald-500"
              />
              <button
                onClick={() => {
                  const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || 'admin123';
                  if (adminPassword.trim() === ADMIN_PASSWORD) {
                    setIsAdminLoggedIn(true);
                    showToast('تم تسجيل دخول المدير بنجاح', 'success');
                  } else {
                    showToast('كلمة سر خاطئة', 'error');
                  }
                }}
                className="px-6 py-2 rounded-xl bg-emerald-500 text-slate-950 font-bold"
              >
                دخول
              </button>
            </div>
          )
        )}

        {currentTab === 'profile' && (
          <UserProfile 
            userProgress={userProgress} 
            userPreferences={userPreferences} 
            onUpdatePreferences={handleUpdatePreferences} 
            showToast={showToast} 
          />
        )}

        {currentTab === 'search' && <SearchEngine showToast={showToast} />}
        
        {currentTab === 'audio' && (
          <AudioPlayer 
            userPreferences={userPreferences} 
            onUpdatePreferences={handleUpdatePreferences} 
            showToast={showToast} 
          />
        )}
      </main>

      {/* إعلانات أسفل المحتوى */}
      <AdsManager position="footer" />

      {/* 6. نافذة الإشعار السريع الطافي (Toast notification) */}
      {toast && (
        <div 
          className={`fixed bottom-6 right-6 p-4 rounded-xl shadow-xl z-50 text-xs font-bold font-sans border flex items-center gap-2 animate-bounce ${toast.type === 'success' ? 'bg-emerald-950 border-emerald-500 text-emerald-400' : toast.type === 'error' ? 'bg-red-950 border-red-500 text-red-400' : 'bg-slate-950 border-slate-800 text-slate-300'}`}
          style={{ transition: 'opacity 0.3s ease-in-out' }}
        >
          <ShieldCheck className={`w-4 h-4 ${toast.type === 'success' ? 'text-emerald-400' : toast.type === 'error' ? 'text-red-400' : 'text-slate-400'}`} />
          {toast.message}
        </div>
      )}

      {/* 7. زر الانتقال السريع للأعلى */}
      {scrollVisible && (
        <button 
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          className="fixed bottom-6 left-6 p-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-full shadow-2xl hover:scale-105 transition-all cursor-pointer z-40 border border-indigo-500/30"
          title="العودة للأعلى"
        >
          <ArrowUp className="w-4 h-4" />
        </button>
      )}

    </div>
  );
};

export default App;
