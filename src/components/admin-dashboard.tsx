import React, { useEffect, useState } from 'react';
import { LogOut, Users, Settings, BarChart, Globe, Save, Sliders, CheckCircle2, Sparkles, Key, FolderOpen } from 'lucide-react';
import { AdsSimulationDashboard } from './ads-manager';
import { FileManager } from './file-manager';
import type { AdsConfig } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
  showToast?: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

interface Statistics {
  total_users: number;
  total_lessons_completed: number;
  daily_active_users: number;
  most_visited_section: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, showToast }) => {
  const [activeTab, setActiveTab] = useState<'stats' | 'settings' | 'files'>('stats');
  const [mockUsers] = useState([
    { id: '1', name: 'Omar', role: 'admin' },
    { id: '2', name: 'Visitor', role: 'visitor' },
  ]);
  const [stats, setStats] = useState<Statistics | null>(null);
  const [isSaving, setIsSaving] = useState<boolean>(false);

  // States for form editing
  const [googleSiteVerification, setGoogleSiteVerification] = useState<string>('');
  const [geminiApiKey, setGeminiApiKey] = useState<string>('');
  const [geminiModel, setGeminiModel] = useState<string>('gemini-3.5-flash');
  const [siteUrl, setSiteUrl] = useState<string>('');
  const [siteIconUrl, setSiteIconUrl] = useState<string>('');
  const [googleAnalyticsId, setGoogleAnalyticsId] = useState<string>('');
  const [publisherId, setPublisherId] = useState<string>('');
  const [adsEnabled, setAdsEnabled] = useState<boolean>(true);
  const [testMode, setTestMode] = useState<boolean>(true);
  const [delayBetweenAds, setDelayBetweenAds] = useState<number>(30);
  const [maxAdsPerSession, setMaxAdsPerSession] = useState<number>(5);
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);
  const [lazyLoad, setLazyLoad] = useState<boolean>(true);
  const [loadOnScroll, setLoadOnScroll] = useState<boolean>(false);
  const [placeholderColor, setPlaceholderColor] = useState<string>('#1a1a24');
  const [blockedCategories, setBlockedCategories] = useState<string>('');

  // Ad slots state
  const [headerId, setHeaderId] = useState<string>('');
  const [headerSize, setHeaderSize] = useState<string>('');
  const [headerResponsive, setHeaderResponsive] = useState<boolean>(true);

  const [sidebarId, setSidebarId] = useState<string>('');
  const [sidebarSize, setSidebarSize] = useState<string>('');
  const [sidebarResponsive, setSidebarResponsive] = useState<boolean>(true);

  const [footerId, setFooterId] = useState<string>('');
  const [footerSize, setFooterSize] = useState<string>('');
  const [footerResponsive, setFooterResponsive] = useState<boolean>(true);

  useEffect(() => {
    // Load config from our server API or fallback to static public file
    fetch('/api/admin/settings')
      .then(res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          return res.json();
        }
        return fetch('/ads_config.json').then(r => r.json());
      })
      .then((data: AdsConfig) => {
        // Initialize form fields
        if (data) {
          setGoogleSiteVerification(data.google_site_verification || '');
          setGeminiApiKey(data.gemini_api_key || '');
          setGeminiModel(data.gemini_model || 'gemini-3.5-flash');
          setSiteUrl(data.site_url || '');
          setSiteIconUrl(data.site_icon_url || '');
          setGoogleAnalyticsId(data.google_analytics_id || '');
          setPublisherId(data.ad_units?.publisher_id || '');
          setAdsEnabled(data.ad_units?.enabled ?? true);
          setTestMode(data.ad_units?.test_mode ?? true);
          setDelayBetweenAds(data.display_settings?.delay_between_ads ?? 30);
          setMaxAdsPerSession(data.display_settings?.max_ads_per_session ?? 5);
          setAutoRefresh(data.display_settings?.auto_refresh ?? true);
          setLazyLoad(data.display_settings?.lazy_load ?? true);
          setLoadOnScroll(data.display_settings?.load_on_scroll ?? false);
          setPlaceholderColor(data.display_settings?.placeholder_color ?? '#1a1a24');
          setBlockedCategories(data.blocked_categories ? data.blocked_categories.join(', ') : 'gambling, adult');

          // Initialize slots
          if (data.ad_slots?.header_banner) {
            setHeaderId(data.ad_slots.header_banner.id);
            setHeaderSize(data.ad_slots.header_banner.size);
            setHeaderResponsive(data.ad_slots.header_banner.responsive);
          }
          if (data.ad_slots?.sidebar_square) {
            setSidebarId(data.ad_slots.sidebar_square.id);
            setSidebarSize(data.ad_slots.sidebar_square.size);
            setSidebarResponsive(data.ad_slots.sidebar_square.responsive);
          }
          if (data.ad_slots?.footer_banner) {
            setFooterId(data.ad_slots.footer_banner.id);
            setFooterSize(data.ad_slots.footer_banner.size);
            setFooterResponsive(data.ad_slots.footer_banner.responsive);
          }
        }
      })
      .catch(err => console.error('Failed to load ads config:', err));
    
    fetch('/statistics.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    const updatedConfig: AdsConfig = {
      google_site_verification: googleSiteVerification,
      gemini_api_key: geminiApiKey,
      gemini_model: geminiModel,
      site_url: siteUrl,
      site_icon_url: siteIconUrl,
      google_analytics_id: googleAnalyticsId,
      ad_slots: {
        header_banner: {
          id: headerId,
          type: 'banner',
          size: headerSize,
          position: 'header',
          responsive: headerResponsive,
          frequency: 1,
          priority: 'high'
        },
        sidebar_square: {
          id: sidebarId,
          type: 'native',
          size: sidebarSize,
          position: 'sidebar',
          responsive: sidebarResponsive,
          frequency: 2,
          priority: 'medium'
        },
        footer_banner: {
          id: footerId,
          type: 'banner',
          size: footerSize,
          position: 'footer',
          responsive: footerResponsive,
          frequency: 1,
          priority: 'low'
        }
      },
      display_settings: {
        delay_between_ads: Number(delayBetweenAds),
        max_ads_per_session: Number(maxAdsPerSession),
        auto_refresh: autoRefresh,
        lazy_load: lazyLoad,
        responsive: true,
        load_on_scroll: loadOnScroll,
        placeholder_color: placeholderColor
      },
      blocked_categories: blockedCategories.split(',').map(item => item.trim()).filter(Boolean),
      ad_units: {
        enabled: adsEnabled,
        test_mode: testMode,
        publisher_id: publisherId
      }
    };

    try {
      const response = await fetch('/api/admin/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updatedConfig)
      });

      const result = await response.json();
      if (response.ok && result.success) {
        if (showToast) {
          showToast('✅ تم حفظ جميع الإعدادات وتحديث ملف التكوين بنجاح!', 'success');
        } else {
          alert('تم حفظ الإعدادات بنجاح!');
        }
      } else {
        throw new Error(result.error || 'فشل الحفظ');
      }
    } catch (err: any) {
      console.error(err);
      if (showToast) {
        showToast(`❌ فشل حفظ الإعدادات: ${err.message}`, 'error');
      } else {
        alert(`فشل حفظ الإعدادات: ${err.message}`);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-1 md:p-6 text-right" dir="rtl">
      {/* رأس لوحة التحكم */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6 pb-4 border-b border-slate-800">
        <div>
          <h2 className="text-2xl font-black text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-emerald-400" /> لوحة تحكم مدير النظام
          </h2>
          <p className="text-xs text-slate-400 mt-1">إدارة الإحصائيات العامة وتخصيص إعدادات AdSense ومساحات الإعلانات وحفظ التعديلات لحظياً.</p>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-950/40 text-red-400 hover:text-red-300 border border-red-900/40 rounded-xl hover:bg-red-900/30 transition-colors"
        >
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </div>

      {/* التبويبات والملاحة الداخلية */}
      <div className="flex overflow-x-auto border-b border-slate-800 mb-6 gap-2">
        <button
          onClick={() => setActiveTab('stats')}
          className={`px-5 py-2.5 font-sans text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${activeTab === 'stats' ? 'bg-slate-900 border-emerald-500 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white border-transparent'}`}
        >
          <BarChart className="w-4 h-4" /> الإحصائيات والمحاكاة
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`px-5 py-2.5 font-sans text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${activeTab === 'settings' ? 'bg-slate-900 border-emerald-500 text-emerald-400 font-bold' : 'text-slate-400 hover:text-white border-transparent'}`}
        >
          <Settings className="w-4 h-4" /> ⚙️ إعدادات النظام والإعلانات
        </button>
        <button
          onClick={() => setActiveTab('files')}
          className={`px-5 py-2.5 font-sans text-xs font-bold rounded-t-xl transition-all flex items-center gap-1.5 border-b-2 shrink-0 ${activeTab === 'files' ? 'bg-slate-900 border-indigo-500 text-indigo-400 font-bold' : 'text-slate-400 hover:text-white border-transparent'}`}
        >
          <FolderOpen className="w-4 h-4" /> 📂 مدير وتعديل ملفات المشروع
        </button>
      </div>

      {activeTab === 'stats' ? (
        /* تبويب الإحصائيات والمحاكاة */
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-900 pb-3">
                <Users className="w-5 h-5 text-emerald-400" /> طاقم الإدارة الحالي
              </h3>
              <ul className="space-y-2">
                {mockUsers.map(user => (
                  <li key={user.id} className="p-3 bg-slate-900/50 border border-slate-800/60 rounded-xl text-slate-300 flex justify-between items-center">
                    <span className="font-sans font-bold text-sm">{user.name}</span>
                    <span className="px-2.5 py-0.5 text-[10px] bg-emerald-950/55 text-emerald-400 border border-emerald-900/40 rounded-full uppercase tracking-wider font-bold">
                      {user.role}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            
            <div className="p-5 bg-slate-950 border border-slate-800 rounded-2xl shadow-xl">
              <h3 className="text-md font-bold text-white mb-4 flex items-center gap-2 border-b border-slate-900 pb-3">
                <Globe className="w-5 h-5 text-blue-400" /> إحصائيات النشاط العام
              </h3>
              {stats ? (
                <div className="text-sm text-slate-300 space-y-3 font-sans">
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">إجمالي المستخدمين:</span>
                    <span className="font-mono font-bold text-white">{stats.total_users.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">الدروس المكتملة:</span>
                    <span className="font-mono font-bold text-white">{stats.total_lessons_completed.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1 border-b border-slate-900">
                    <span className="text-slate-400">مستخدمون نشطون يومياً:</span>
                    <span className="font-mono font-bold text-emerald-400">{stats.daily_active_users.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span className="text-slate-400">القسم الأكثر زيارة:</span>
                    <span className="font-sans font-bold text-indigo-400">{stats.most_visited_section}</span>
                  </div>
                </div>
              ) : (
                <p className="text-slate-500 text-xs py-4">جاري تحميل الإحصائيات اللحظية...</p>
              )}
            </div>
          </div>

          <div className="p-1 bg-slate-950 border border-slate-850 rounded-2xl">
            <AdsSimulationDashboard />
          </div>
        </div>
      ) : activeTab === 'settings' ? (
        /* تبويب إعدادات النظام والإعلانات مع إمكانية التعديل والحفظ الفوري */
        <form onSubmit={handleSaveSettings} className="space-y-6">
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-900 mb-6">
              <div>
                <h3 className="text-md font-bold text-white flex items-center gap-2">
                  <Settings className="w-5 h-5 text-emerald-400" /> التحكم العام بـ Google AdSense
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">تعديل شفرة العميل الأساسية، تمكين وضع المطور، أو الإعلانات الإنتاجية.</p>
              </div>
              <button
                type="submit"
                disabled={isSaving}
                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-lg shadow-emerald-500/10 cursor-pointer disabled:opacity-50 transition-all font-sans text-xs"
              >
                <Save className="w-4 h-4" /> {isSaving ? 'جاري الحفظ...' : 'حفظ التعديلات'}
              </button>
            </div>

            {/* الحقول العامة */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">معرف الناشر (AdSense Publisher ID)</label>
                <input
                  type="text"
                  required
                  value={publisherId}
                  onChange={e => setPublisherId(e.target.value)}
                  placeholder="pub-xxxxxxxxxxxxxxxx"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white"
                />
              </div>

              <div className="flex flex-col justify-end gap-3 p-3 bg-slate-900/30 border border-slate-850 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-bold select-none">
                  <input
                    type="checkbox"
                    checked={adsEnabled}
                    onChange={e => setAdsEnabled(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>تمكين ظهور الإعلانات بالتطبيق</span>
                </label>
              </div>

              <div className="flex flex-col justify-end gap-3 p-3 bg-slate-900/30 border border-slate-850 rounded-xl">
                <label className="flex items-center gap-2.5 cursor-pointer text-xs text-slate-300 font-bold select-none">
                  <input
                    type="checkbox"
                    checked={testMode}
                    onChange={e => setTestMode(e.target.checked)}
                    className="w-4 h-4 accent-emerald-500 rounded"
                  />
                  <span>تفعيل وضع الاختبار والمحاكاة (Test Mode)</span>
                </label>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">تأخير التحميل (بالثواني)</label>
                <input
                  type="number"
                  min="0"
                  value={delayBetweenAds}
                  onChange={e => setDelayBetweenAds(Number(e.target.value))}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">أقصى عدد إعلانات بالجلسة</label>
                <input
                  type="number"
                  min="1"
                  value={maxAdsPerSession}
                  onChange={e => setMaxAdsPerSession(Number(e.target.value))}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white"
                />
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">لون خلفية الإعلان البديل</label>
                <div className="flex gap-2">
                  <input
                    type="color"
                    value={placeholderColor}
                    onChange={e => setPlaceholderColor(e.target.value)}
                    className="w-10 h-10 p-1 rounded-xl bg-slate-900 border border-slate-800 cursor-pointer"
                  />
                  <input
                    type="text"
                    value={placeholderColor}
                    onChange={e => setPlaceholderColor(e.target.value)}
                    className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white flex-grow"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">الفئات المحظورة (مفصولة بفاصلة)</label>
                <input
                  type="text"
                  value={blockedCategories}
                  onChange={e => setBlockedCategories(e.target.value)}
                  placeholder="adult, gambling"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-sans text-white"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6 border-t border-slate-900 pt-6">
              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={autoRefresh}
                  onChange={e => setAutoRefresh(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>تحديث تلقائي ذكي للإعلان (Auto Refresh)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={lazyLoad}
                  onChange={e => setLazyLoad(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>تفعيل التحميل الكسول لتحسين سرعة الموقع (Lazy Load)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 select-none">
                <input
                  type="checkbox"
                  checked={loadOnScroll}
                  onChange={e => setLoadOnScroll(e.target.checked)}
                  className="w-4 h-4 accent-emerald-500 rounded"
                />
                <span>التحميل عند التمرير فقط (Load on Scroll)</span>
              </label>
            </div>
          </div>

          {/* التحقق من ملكية الموقع وإعدادات SEO الفنية */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <h3 className="text-md font-bold text-white pb-4 border-b border-slate-900 mb-6 flex items-center gap-2">
              <Globe className="w-5 h-5 text-emerald-400" /> إعدادات هوية الموقع، الروابط وتحسين محركات البحث (SEO & Identity)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">رابط الموقع الرسمي (Website Canonical URL)</label>
                <input
                  type="url"
                  value={siteUrl}
                  onChange={e => setSiteUrl(e.target.value)}
                  placeholder="https://yourdomain.com"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white text-left"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  الرابط الأساسي لموقعك الإلكتروني. يتم استخدامه لتحديث وسوم الكنسية <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-emerald-400">link rel="canonical"</code> ووسم <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-emerald-400">og:url</code> لمنع تكرار المحتوى في جوجل.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">رابط أيقونة الموقع المفضلة (Favicon URL)</label>
                <input
                  type="text"
                  value={siteIconUrl}
                  onChange={e => setSiteIconUrl(e.target.value)}
                  placeholder="مثال: /favicon.ico أو رابط خارجي للأيقونة"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white text-left"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  مسار الأيقونة التي تظهر في شريط عنوان المتصفح ونتائج بحث الهواتف من جوجل. يمكنك كتابة مسار نسبي أو رابط كامل لملف الأيقونة.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">رمز التحقق من جوجل (Google Site Verification)</label>
                <input
                  type="text"
                  value={googleSiteVerification}
                  onChange={e => setGoogleSiteVerification(e.target.value)}
                  placeholder="مثال: tDq7QK455mI4htnrD4no6LM-fSs8z43jVJqbvmnpFlk"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white text-left"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  كود إثبات الملكية في Google Search Console. سيقوم التطبيق بحقنه ديناميكياً في رأس الصفحة لتمكين جوجل من التحقق الفوري من ملكية النطاق.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">معرف تحليلات جوجل (Google Analytics ID)</label>
                <input
                  type="text"
                  value={googleAnalyticsId}
                  onChange={e => setGoogleAnalyticsId(e.target.value)}
                  placeholder="مثال: G-XXXXXXXXXX"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-emerald-500 focus:outline-none text-xs font-mono text-white text-left"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  مُعرّف القياس لخدمة تحليلات جوجل (Google Analytics 4). سيقوم النظام تلقائياً بتضمين وتفعيل كود التتبع <code className="bg-slate-900 px-1 py-0.5 rounded font-mono text-emerald-400">gtag.js</code> وإرسال الإحصائيات الفورية.
                </p>
              </div>
            </div>
          </div>

          {/* إعدادات الذكاء الاصطناعي ومفتاح Gemini */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <h3 className="text-md font-bold text-white pb-4 border-b border-slate-900 mb-6 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-indigo-400" /> إعدادات المساعد الذكي وتحديد نوع الذكاء (Gemini AI)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" /> مفتاح واجهة برمجة التطبيقات (Gemini API Key)
                </label>
                <input
                  type="password"
                  value={geminiApiKey}
                  onChange={e => setGeminiApiKey(e.target.value)}
                  placeholder="أدخل مفتاح Gemini API هنا (سيتم تجاوزه عن متغيرات البيئة)"
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-mono text-white text-left placeholder:text-right"
                  dir="ltr"
                />
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  سيتم استخدام هذا المفتاح للتواصل مع خوادم Google AI. إذا تُرك فارغاً، فسيقوم النظام بالرجوع تلقائياً إلى مفتاح البيئة الأساسي الموفر في خادم الاستضافة.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-xs text-slate-300 font-bold">نوع الذكاء الاصطناعي وموديل التشغيل (Gemini Model Type)</label>
                <select
                  value={geminiModel}
                  onChange={e => setGeminiModel(e.target.value)}
                  className="p-3 rounded-xl bg-slate-900 border border-slate-800 focus:border-indigo-500 focus:outline-none text-xs font-sans text-white cursor-pointer"
                  dir="ltr"
                >
                  <option value="gemini-3.5-flash">gemini-3.5-flash (السرعة الفائقة والذكاء المتزن - مستحسن للتعلم الفوري)</option>
                  <option value="gemini-3.1-pro-preview">gemini-3.1-pro-preview (أعلى دقة، أعمق تحليل وأكثر شمولية)</option>
                  <option value="gemini-1.5-flash">gemini-1.5-flash (الجيل السابق - سرعة واستجابة سريعة)</option>
                  <option value="gemini-1.5-pro">gemini-1.5-pro (الجيل السابق - استدلال معقد وتصحيح متقدم)</option>
                </select>
                <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                  اختر النموذج الذي يناسب احتياجات تطبيقك من حيث السرعة وتكلفة استهلاك الوحدات وجودة استجابات التدقيق النحوي والترجمة.
                </p>
              </div>
            </div>
          </div>

          {/* مساحات عرض الإعلانات الفرعية */}
          <div className="bg-slate-950 border border-slate-800 rounded-2xl p-5 md:p-6 shadow-xl">
            <h3 className="text-md font-bold text-white pb-4 border-b border-slate-900 mb-6 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-indigo-400" /> تخصيص المساحات الإعلانية الفردية (Ad Slots)
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* المساحة الأولى */}
              <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-white">إعلان رأس الصفحة (Header Banner)</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900/30">نشط</span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400">معرف الوحدة الإعلانية (Slot ID)</label>
                    <input
                      type="text"
                      value={headerId}
                      onChange={e => setHeaderId(e.target.value)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400">حجم الوحدة (Size)</label>
                    <input
                      type="text"
                      value={headerSize}
                      onChange={e => setHeaderSize(e.target.value)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 mt-2 select-none">
                    <input
                      type="checkbox"
                      checked={headerResponsive}
                      onChange={e => setHeaderResponsive(e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span>متجاوب مع الشاشات (Responsive)</span>
                  </label>
                </div>
              </div>

              {/* المساحة الثانية */}
              <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-white">إعلان المربع الجانبي (Sidebar Square)</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900/30">نشط</span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400">معرف الوحدة الإعلانية (Slot ID)</label>
                    <input
                      type="text"
                      value={sidebarId}
                      onChange={e => setSidebarId(e.target.value)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400">حجم الوحدة (Size)</label>
                    <input
                      type="text"
                      value={sidebarSize}
                      onChange={e => setSidebarSize(e.target.value)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 mt-2 select-none">
                    <input
                      type="checkbox"
                      checked={sidebarResponsive}
                      onChange={e => setSidebarResponsive(e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span>متجاوب مع الشاشات (Responsive)</span>
                  </label>
                </div>
              </div>

              {/* المساحة الثالثة */}
              <div className="p-4 bg-slate-900/40 border border-slate-850 rounded-xl space-y-4">
                <div className="flex items-center justify-between border-b border-slate-900 pb-2">
                  <span className="text-xs font-bold text-white">إعلان ذيل الصفحة (Footer Banner)</span>
                  <span className="text-[10px] bg-indigo-950 text-indigo-400 px-2 py-0.5 rounded border border-indigo-900/30">نشط</span>
                </div>
                <div className="space-y-3">
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400">معرف الوحدة الإعلانية (Slot ID)</label>
                    <input
                      type="text"
                      value={footerId}
                      onChange={e => setFooterId(e.target.value)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <div className="flex flex-col gap-1.5">
                    <label className="text-[10px] text-slate-400">حجم الوحدة (Size)</label>
                    <input
                      type="text"
                      value={footerSize}
                      onChange={e => setFooterSize(e.target.value)}
                      className="p-2.5 rounded-lg bg-slate-950 border border-slate-850 text-xs font-mono text-slate-200"
                    />
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-400 mt-2 select-none">
                    <input
                      type="checkbox"
                      checked={footerResponsive}
                      onChange={e => setFooterResponsive(e.target.checked)}
                      className="w-3.5 h-3.5 accent-emerald-500 rounded"
                    />
                    <span>متجاوب مع الشاشات (Responsive)</span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* تنويه الأمان والتحقق */}
          <div className="flex gap-3 bg-indigo-950/20 border border-indigo-900/35 p-4 rounded-2xl items-start">
            <CheckCircle2 className="w-5 h-5 text-indigo-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-bold text-white">إشعار الأمان والدورانية:</p>
              <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">عند الضغط على "حفظ التعديلات"، يتم تحديث ملف التكوين مباشرة على الخادم وتفعيله فورياً لجميع الزوار بدون الحاجة لإعادة تشغيل خوادم التطبيق.</p>
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <button
              type="submit"
              disabled={isSaving}
              className="flex items-center gap-2 px-8 py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-black rounded-xl shadow-xl shadow-emerald-500/10 cursor-pointer disabled:opacity-50 transition-all font-sans text-xs"
            >
              <Save className="w-4 h-4" /> {isSaving ? 'جاري حفظ الإعدادات...' : 'حفظ وتطبيق التغييرات'}
            </button>
          </div>
        </form>
      ) : (
        /* تبويب إدارة وتعديل الملفات */
        <FileManager showToast={showToast} />
      )}
    </div>
  );
};

