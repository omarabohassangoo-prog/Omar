// ============================================================
// user-profile.tsx - ملف تعريف المستخدم، الإنجازات، وتفضيلات النظام
// ============================================================

import React, { useState, useEffect } from 'react';
import { 
  User, Award, Settings2, 
  Trash2, Moon, Volume2, Type, Eye, Bell 
} from 'lucide-react';
import type { UserProgress, UserPreferences, Achievement } from '../types';

interface UserProfileProps {
  userProgress: UserProgress | null;
  userPreferences: UserPreferences | null;
  onUpdatePreferences: (updated: UserPreferences) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ 
  userProgress, 
  userPreferences, 
  onUpdatePreferences,
  showToast 
}) => {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'profile' | 'preferences'>('profile');

  // تحميل تفاصيل الإنجازات
  useEffect(() => {
    fetch('/achievements.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.achievements) {
          // دمج حالة فك القفل مع الإنجازات المسترجعة من الملف
          const merged = data.achievements.map((ach: Achievement) => ({
            ...ach,
            unlocked: userProgress ? userProgress.achievements.includes(ach.id) : ach.unlocked
          }));
          setAchievements(merged);
        }
      })
      .catch(err => console.error("Error fetching achievements:", err));
  }, [userProgress]);

  // حفظ التفضيلات والتحكم بتبديل الخصائص
  const handleTogglePreference = <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => {
    if (!userPreferences) return;
    const updated = { ...userPreferences, [key]: value };
    onUpdatePreferences(updated);
    showToast('💾 تم حفظ التفضيلات الجديدة بنجاح', 'success');
  };

  const handleToggleNotification = (notifKey: keyof UserPreferences['notifications']) => {
    if (!userPreferences) return;
    const updated: UserPreferences = {
      ...userPreferences,
      notifications: {
        ...userPreferences.notifications,
        [notifKey]: !userPreferences.notifications[notifKey]
      }
    };
    onUpdatePreferences(updated);
    showToast('💾 تم تحديث إعدادات التنبيهات', 'success');
  };

  // تفريغ ذاكرة التخزين المؤقت للبدء من جديد
  const handleResetProgress = () => {
    const confirm = window.confirm("هل أنت متأكد من رغبتك في إعادة تعيين كافة درجاتك ومستوى تقدمك للبداية؟");
    if (confirm) {
      localStorage.clear();
      showToast('⚠️ تم مسح السجلات، يرجى إعادة تحميل الصفحة لتفعيل التغييرات.', 'info');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 p-1 md:p-4 text-slate-100" id="user-profile-wrapper">
      {/* التبويب الداخلي لملف التعريف */}
      <div className="md:col-span-1 flex flex-col gap-2 p-2 bg-slate-950/80 border border-slate-900 rounded-2xl h-fit">
        <button 
          onClick={() => setActiveSubTab('profile')}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-right flex items-center justify-between transition-colors ${activeSubTab === 'profile' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <span className="flex items-center gap-2"><User className="w-4 h-4" /> بطاقة الهوية والإنجازات</span>
        </button>
        <button 
          onClick={() => setActiveSubTab('preferences')}
          className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold text-right flex items-center justify-between transition-colors ${activeSubTab === 'preferences' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
        >
          <span className="flex items-center gap-2"><Settings2 className="w-4 h-4" /> تفضيلات وإعدادات النظام</span>
        </button>
      </div>

      {/* تفاصيل الهوية والإنجازات */}
      <div className="md:col-span-3 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md">
        {activeSubTab === 'profile' && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-400" /> لوحة الأوسمة والإنجازات الأكاديمية
              </h3>
              <p className="text-xs text-slate-400 mt-1">تتبع رحلتك وحوافز التميز التي حققتها من خلال ممارستك اليومية.</p>
            </div>

            {/* عرض الأوسمة */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((ach) => (
                <div 
                  key={ach.id}
                  className={`p-4 rounded-xl border flex gap-4 transition-all ${ach.unlocked ? 'bg-slate-950/90 border-amber-500/30 shadow-md shadow-amber-500/5' : 'bg-slate-950/40 border-slate-900 opacity-60'}`}
                >
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${ach.unlocked ? 'bg-amber-500/15 text-amber-400' : 'bg-slate-900 text-slate-600'}`}>
                    <Award className="w-6 h-6 animate-pulse" />
                  </div>

                  <div className="flex-grow">
                    <div className="flex items-center justify-between">
                      <h4 className={`font-sans text-xs font-bold ${ach.unlocked ? 'text-white' : 'text-slate-400'}`}>{ach.name}</h4>
                      <span className={`text-[9px] px-2 py-0.5 rounded font-mono font-bold uppercase ${ach.reward.badge === 'gold' ? 'bg-yellow-950/30 text-yellow-400' : ach.reward.badge === 'silver' ? 'bg-slate-800 text-slate-300' : 'bg-amber-950/20 text-amber-600'}`}>
                        {ach.reward.badge}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400 mt-1 font-sans leading-relaxed">{ach.description}</p>
                    {ach.unlocked ? (
                      <span className="text-[10px] text-emerald-400 font-bold mt-2 inline-block">🔓 تم فك القفل (+{ach.reward.xp} XP)</span>
                    ) : (
                      <span className="text-[10px] text-slate-500 mt-2 inline-block">🔒 مغلق حتى استيفاء الشروط</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* تفضيلات وإعدادات النظام */}
        {activeSubTab === 'preferences' && userPreferences && (
          <div className="flex flex-col gap-6">
            <div>
              <h3 className="font-sans text-base font-bold text-white flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-400" /> إعدادات وتخصيص تجربة التعلم
              </h3>
              <p className="text-xs text-slate-400 mt-1">خصص المظهر وسرعة الصوت ومستويات التنبيهات بالشكل الذي يطابق أسلوبك.</p>
            </div>

            <div className="flex flex-col gap-5 divide-y divide-slate-800/60">
              {/* خيار المظهر (Themes) */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4 first:pt-0">
                <div>
                  <h4 className="font-sans text-xs font-bold text-white flex items-center gap-2">
                    <Moon className="w-4 h-4 text-emerald-400" /> مظهر واجهة التطبيق
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">اختر سمة الألوان الأنسب لعينيك أثناء القراءة الطويلة.</p>
                </div>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 gap-1.5">
                  {['dark', 'light', 'sepia'].map((themeName) => (
                    <button 
                      key={themeName}
                      onClick={() => handleTogglePreference('theme', themeName as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize font-bold transition-all ${userPreferences.theme === themeName ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      {themeName}
                    </button>
                  ))}
                </div>
              </div>

              {/* سرعة قراءة الصوتيات */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                <div>
                  <h4 className="font-sans text-xs font-bold text-white flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-emerald-400" /> سرعة نطق الكلمات والجمل
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">تعديل وتخصيص سرعة مخارج الحروف لتسهيل الاستماع والتحليل.</p>
                </div>
                <div className="flex items-center gap-3">
                  <input 
                    type="range"
                    min="0.6"
                    max="1.5"
                    step="0.1"
                    value={userPreferences.audio_speed}
                    onChange={(e) => handleTogglePreference('audio_speed', parseFloat(e.target.value))}
                    className="w-32 accent-emerald-400"
                  />
                  <span className="font-mono text-xs text-emerald-400 font-bold">{userPreferences.audio_speed}x</span>
                </div>
              </div>

              {/* خيار حجم الخط */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pt-4">
                <div>
                  <h4 className="font-sans text-xs font-bold text-white flex items-center gap-2">
                    <Type className="w-4 h-4 text-emerald-400" /> قياس وحجم الخطوط
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">تعديل وتخصيص حجم الخطوط لضمان تجربة تصفح وقراءة مريحة.</p>
                </div>
                <div className="flex bg-slate-950 p-1 rounded-xl border border-slate-900 gap-1.5">
                  {['small', 'medium', 'large'].map((size) => (
                    <button 
                      key={size}
                      onClick={() => handleTogglePreference('font_size', size as any)}
                      className={`px-3 py-1.5 rounded-lg text-xs capitalize font-bold transition-all ${userPreferences.font_size === size ? 'bg-gradient-to-r from-emerald-400 to-teal-500 text-slate-950 shadow-md' : 'text-slate-400 hover:text-white'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>

              {/* التشغيل التلقائي للصوت وترجمة الشاشات */}
              <div className="flex items-center justify-between pt-4">
                <div>
                  <h4 className="font-sans text-xs font-bold text-white flex items-center gap-2">
                    <Eye className="w-4 h-4 text-emerald-400" /> عرض ترجمات الجمل والقصة
                  </h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">إظهار الترجمات العربية أسفل النصوص لتبسيط فهم المحتوى المكتوب.</p>
                </div>
                <button 
                  onClick={() => handleTogglePreference('show_translation', !userPreferences.show_translation)}
                  className={`w-12 h-6 rounded-full p-1 transition-all ${userPreferences.show_translation ? 'bg-emerald-400 flex-row-reverse' : 'bg-slate-950'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-slate-900 transition-all ${userPreferences.show_translation ? 'translate-x-6' : 'translate-x-0'}`} />
                </button>
              </div>

              {/* إعدادات التنبيهات والخصوصية */}
              <div className="flex flex-col gap-4 pt-4">
                <h4 className="font-sans text-xs font-bold text-white flex items-center gap-2">
                  <Bell className="w-4 h-4 text-emerald-400" /> تخصيص تنبيهات وإشعارات النظام
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                    <span className="text-slate-300">تذكير التعلم اليومي</span>
                    <input 
                      type="checkbox"
                      checked={userPreferences.notifications.daily_reminder}
                      onChange={() => handleToggleNotification('daily_reminder')}
                      className="accent-emerald-400 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                    <span className="text-slate-300">أيام الممارسة المتتالية</span>
                    <input 
                      type="checkbox"
                      checked={userPreferences.notifications.streak_alert}
                      onChange={() => handleToggleNotification('streak_alert')}
                      className="accent-emerald-400 cursor-pointer"
                    />
                  </label>
                  <label className="flex items-center justify-between p-3 bg-slate-950 rounded-xl border border-slate-900 text-xs">
                    <span className="text-slate-300">فك قفل الإنجازات والأوسمة</span>
                    <input 
                      type="checkbox"
                      checked={userPreferences.notifications.achievement_unlock}
                      onChange={() => handleToggleNotification('achievement_unlock')}
                      className="accent-emerald-400 cursor-pointer"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* خيارات مسح البيانات للبداية من جديد */}
            <div className="mt-6 pt-4 border-t border-slate-800 flex justify-between items-center bg-red-950/10 border border-red-900/20 p-4 rounded-xl">
              <div>
                <h4 className="font-sans text-xs font-bold text-red-400">خيارات مسح وحذف البيانات</h4>
                <p className="text-[11px] text-slate-400 mt-0.5">سيؤدي مسح السجلات لحذف كافة الأوسمة، درجات الامتحانات والعودة للبداية.</p>
              </div>
              <button 
                onClick={handleResetProgress}
                className="py-2 px-4 bg-red-900/20 hover:bg-red-900/40 border border-red-900/30 text-red-400 rounded-lg text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer"
              >
                <Trash2 className="w-4 h-4" /> مسح السجلات بالكامل
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UserProfile;
