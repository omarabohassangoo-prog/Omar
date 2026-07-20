import React, { useEffect, useState } from 'react';
import { LogOut, Users, Settings, BarChart, Globe } from 'lucide-react';
import { AdsSimulationDashboard } from './ads-manager';
import type { AdsConfig } from '../types';

interface AdminDashboardProps {
  onLogout: () => void;
}

interface Statistics {
  total_users: number;
  total_lessons_completed: number;
  daily_active_users: number;
  most_visited_section: string;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout }) => {
  const [mockUsers] = useState([
    { id: '1', name: 'Omar', role: 'admin' },
    { id: '2', name: 'Visitor', role: 'visitor' },
  ]);
  const [adsConfig, setAdsConfig] = useState<AdsConfig | null>(null);
  const [stats, setStats] = useState<Statistics | null>(null);

  useEffect(() => {
    fetch('/ads_config.json')
      .then(res => res.json())
      .then(data => setAdsConfig(data))
      .catch(err => console.error('Failed to load ads config:', err));
    
    fetch('/statistics.json')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(err => console.error('Failed to load stats:', err));
  }, []);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-white">لوحة تحكم المدير</h2>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 px-4 py-2 bg-red-900/50 text-red-200 rounded-xl hover:bg-red-800"
        >
          <LogOut className="w-4 h-4" /> تسجيل الخروج
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Users className="w-5 h-5 text-emerald-400" /> المستخدمون
          </h3>
          <ul className="space-y-2">
            {mockUsers.map(user => (
              <li key={user.id} className="p-2 bg-slate-900 rounded-lg text-slate-300 flex justify-between">
                <span>{user.name}</span>
                <span className="text-xs text-slate-500">{user.role}</span>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Settings className="w-5 h-5 text-indigo-400" /> إعدادات AdSense
          </h3>
          {adsConfig ? (
            <div className="text-sm text-slate-400 space-y-2">
              <p><strong>معرف الناشر (Publisher ID):</strong> {adsConfig.ad_units.publisher_id}</p>
              <p><strong>الحالة:</strong> {adsConfig.ad_units.enabled ? 'مفعل' : 'معطل'}</p>
              <p><strong>وضع الاختبار:</strong> {adsConfig.ad_units.test_mode ? 'نعم' : 'لا'}</p>
            </div>
          ) : (
            <p className="text-slate-400">جاري تحميل الإعدادات...</p>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <Globe className="w-5 h-5 text-blue-400" /> إحصائيات الزوار
          </h3>
          {stats ? (
            <div className="text-sm text-slate-400 space-y-2">
              <p><strong>إجمالي المستخدمين:</strong> {stats.total_users.toLocaleString()}</p>
              <p><strong>الدروس المكتملة:</strong> {stats.total_lessons_completed.toLocaleString()}</p>
              <p><strong>مستخدم نشط يومياً:</strong> {stats.daily_active_users.toLocaleString()}</p>
              <p><strong>القسم الأكثر زيارة:</strong> {stats.most_visited_section}</p>
            </div>
          ) : (
            <p className="text-slate-400">جاري تحميل الإحصائيات...</p>
          )}
        </div>
        
        <div className="p-4 bg-slate-950 border border-slate-800 rounded-2xl">
          <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
            <BarChart className="w-5 h-5 text-amber-400" /> تحليلات الإعلانات
          </h3>
          <AdsSimulationDashboard />
        </div>
      </div>
    </div>
  );
};
