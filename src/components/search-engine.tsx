// ============================================================
// search-engine.tsx - محرك البحث المعجمي المتقدم والقاموس المدمج
// ============================================================

import React, { useState, useEffect } from 'react';
import { Search, Volume2, BookOpen, ChevronRight, AlertCircle } from 'lucide-react';
import type { DictionaryEntry } from '../types';

interface SearchEngineProps {
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const SearchEngine: React.FC<SearchEngineProps> = ({ showToast }) => {
  const [dictionary, setDictionary] = useState<DictionaryEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [results, setResults] = useState<DictionaryEntry[]>([]);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [selectedEntry, setSelectedEntry] = useState<DictionaryEntry | null>(null);

  // تحميل القاموس عند التشغيل
  useEffect(() => {
    fetch('/dictionary.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.dictionary) {
          setDictionary(data.dictionary);
        }
      })
      .catch(err => console.error("Error loading dictionary:", err));
  }, []);

  // تحديث الاقتراحات والنتائج أثناء الكتابة
  useEffect(() => {
    if (!searchQuery.trim()) {
      setResults([]);
      setSuggestions([]);
      return;
    }

    const query = searchQuery.trim().toLowerCase();

    // البحث عن كلمات مطابقة في القاموس
    const filteredResults = dictionary.filter(entry => 
      entry.word.toLowerCase().includes(query) || 
      entry.ar.toLowerCase().includes(query)
    );

    setResults(filteredResults);

    // إنتاج اقتراحات كتابة سريعة
    const matchingWords = dictionary
      .filter(entry => entry.word.toLowerCase().startsWith(query))
      .map(entry => entry.word)
      .slice(0, 5);

    setSuggestions(matchingWords);
  }, [searchQuery, dictionary]);

  // نطق الكلمة المحددة عبر المحرك الصوتي
  const handlePronounce = (word: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      if ((window as any).speakText) {
        (window as any).speakText(word);
        showToast(`🔊 جاري نطق الكلمة: ${word}`, 'info');
      } else {
        showToast('⚠️ المحرك الصوتي غير متصل حالياً', 'error');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSelectWord = (entry: DictionaryEntry) => {
    setSelectedEntry(entry);
    setSearchQuery('');
    setSuggestions([]);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-1 md:p-4 text-slate-100" id="search-engine-wrapper">
      
      {/* العمود الأول: صندوق البحث والنتائج والاقتراحات */}
      <div className="md:col-span-1 flex flex-col gap-4">
        <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-3">
          <h4 className="font-sans text-xs font-bold text-white flex items-center gap-1.5">
            <Search className="w-4 h-4 text-emerald-400" /> ابحث في القاموس اللغوي
          </h4>
          <p className="text-[11px] text-slate-400 leading-relaxed">ابحث عن المفردات بالإنجليزية أو العربية واستمع لنطقها بدقة.</p>

          <div className="relative mt-2">
            <input 
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="اكتب كلمة... (مثال: routine)"
              className="w-full p-3 bg-slate-950 border border-slate-800 focus:border-emerald-500/50 focus:outline-none rounded-xl text-xs pl-9"
            />
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-3.5" />
          </div>

          {/* اقتراحات ذكية فورية أثناء الكتابة */}
          {suggestions.length > 0 && (
            <div className="flex flex-col bg-slate-950 border border-slate-900 rounded-xl overflow-hidden mt-1">
              {suggestions.map((word, idx) => (
                <button 
                  key={idx}
                  onClick={() => {
                    const matched = dictionary.find(e => e.word.toLowerCase() === word.toLowerCase());
                    if (matched) handleSelectWord(matched);
                  }}
                  className="px-3.5 py-2 hover:bg-slate-900 text-left text-xs text-slate-300 font-mono transition-colors border-b border-slate-900 last:border-none flex items-center justify-between"
                >
                  <span>{word}</span>
                  <ChevronRight className="w-3.5 h-3.5 text-slate-600" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* قائمة النتائج المطابقة */}
        {results.length > 0 && (
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-2xl shadow-xl flex flex-col gap-2 max-h-[350px] overflow-y-auto">
            <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider mb-1">الكلمات المطابقة للبحث ({results.length})</span>
            {results.map((entry, idx) => (
              <button 
                key={idx}
                onClick={() => handleSelectWord(entry)}
                className={`p-3 text-right text-xs rounded-xl border flex items-center justify-between transition-all ${selectedEntry?.word === entry.word ? 'bg-gradient-to-r from-emerald-500/10 to-teal-500/10 border-emerald-500/30 text-emerald-400' : 'bg-slate-950 border-slate-900 text-slate-300 hover:border-slate-800'}`}
              >
                <div className="flex items-center gap-2">
                  <button 
                    onClick={(e) => handlePronounce(entry.word, e)}
                    className="p-1.5 bg-slate-900 hover:bg-slate-800 rounded-lg text-slate-400 hover:text-white transition-colors"
                  >
                    <Volume2 className="w-3.5 h-3.5" />
                  </button>
                  <span className="font-mono text-sm font-bold">{entry.word}</span>
                </div>
                <span className="font-sans text-slate-400 max-w-[50%] truncate" dir="rtl">{entry.ar}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* العمود الثاني والثالث: شاشة تفاصيل الكلمة المعجمية */}
      <div className="md:col-span-2 bg-slate-900/60 border border-slate-800 rounded-2xl p-6 shadow-2xl backdrop-blur-md min-h-[400px] flex flex-col justify-between">
        {selectedEntry ? (
          <div className="flex flex-col gap-6">
            
            {/* رأس تفاصيل الكلمة */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
              <div className="flex items-center gap-3">
                <button 
                  onClick={(e) => handlePronounce(selectedEntry.word, e)}
                  className="p-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl transition-colors cursor-pointer shadow-md shadow-emerald-400/10"
                  title="استمع للنطق الصحيح"
                >
                  <Volume2 className="w-5 h-5 animate-pulse" />
                </button>
                <div>
                  <h3 className="font-mono text-2xl font-black text-white flex items-center gap-2">
                    {selectedEntry.word}
                    <span className="text-xs px-2 py-0.5 bg-indigo-950/30 text-indigo-400 border border-indigo-900/30 rounded font-bold uppercase">
                      {selectedEntry.level}
                    </span>
                  </h3>
                  <p className="text-xs text-slate-400 font-mono mt-0.5">{selectedEntry.ipa} · {selectedEntry.type}</p>
                </div>
              </div>

              <div className="text-right">
                <span className="font-sans text-lg font-bold text-emerald-400 leading-none" dir="rtl">{selectedEntry.ar}</span>
              </div>
            </div>

            {/* المرادفات والأضداد */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-900">
                <h4 className="font-sans text-xs font-bold text-slate-400 mb-2">🌿 المرادفات (Synonyms)</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntry.synonyms.length > 0 ? (
                    selectedEntry.synonyms.map((syn, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded font-mono text-[11px] border border-slate-800 transition-colors">
                        {syn}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">لا يوجد مرادفات متوفرة</span>
                  )}
                </div>
              </div>

              <div className="p-4 bg-slate-950 rounded-xl border border-slate-900">
                <h4 className="font-sans text-xs font-bold text-slate-400 mb-2">🍂 الأضداد (Antonyms)</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedEntry.antonyms.length > 0 ? (
                    selectedEntry.antonyms.map((ant, idx) => (
                      <span key={idx} className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-slate-300 rounded font-mono text-[11px] border border-slate-800 transition-colors">
                        {ant}
                      </span>
                    ))
                  ) : (
                    <span className="text-slate-500 text-xs">لا يوجد أضداد متوفرة</span>
                  )}
                </div>
              </div>
            </div>

            {/* الجمل والأمثلة التوضيحية المدمجة */}
            <div>
              <h4 className="font-sans text-xs font-bold text-indigo-300 mb-3 flex items-center gap-1">
                <BookOpen className="w-4 h-4" /> جمل وأمثلة توضيحية ثنائية اللغة:
              </h4>
              <div className="flex flex-col gap-3">
                {selectedEntry.sentences.map((sent, idx) => (
                  <div key={idx} className="p-4 bg-slate-950 rounded-xl border border-slate-900/60 flex flex-col gap-2 relative overflow-hidden group hover:border-slate-850">
                    <div className="flex items-start justify-between">
                      <p className="font-sans text-sm font-semibold text-white leading-relaxed max-w-[90%]">
                        {sent.en}
                      </p>
                      <button 
                        onClick={(e) => handlePronounce(sent.en, e)}
                        className="p-1 text-slate-500 hover:text-white transition-colors"
                      >
                        <Volume2 className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="font-sans text-xs text-slate-400 text-right leading-relaxed" dir="rtl">
                      {sent.ar}
                    </p>
                  </div>
                ))}
              </div>
            </div>

          </div>
        ) : (
          /* شاشة فارغة جذابة تدعو للبدء في البحث */
          <div className="flex flex-col items-center justify-center text-center py-20 max-w-sm mx-auto flex-grow">
            <div className="w-16 h-16 bg-slate-950 border border-slate-800 rounded-full flex items-center justify-center text-slate-500 mb-4 animate-bounce">
              <Search className="w-6 h-6 text-slate-400" />
            </div>
            <h3 className="font-sans text-sm font-bold text-white">ابدأ تصفح القاموس اللغوي</h3>
            <p className="text-xs text-slate-400 mt-1.5 font-sans leading-relaxed">
              اختر كلمة من قائمة المقترحات الجانبية أو ابحث في الحقل للتعرف على معانيها، نطقها الصحيح، وجملها الشارحة.
            </p>
          </div>
        )}

        {/* الملاحظة التنبيهية في ذيل البطاقة المعجمية */}
        <div className="mt-6 flex items-center gap-2 bg-indigo-950/15 text-indigo-400 border border-indigo-900/20 p-3 rounded-xl text-xs" dir="rtl">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span className="font-sans">تم صياغة القاموس بدقة لغوية متكاملة لدعم نطق المفردات بالاستناد إلى معايير IPA الدولية ومخارج الحروف الصحيحة.</span>
        </div>

      </div>
    </div>
  );
};

export default SearchEngine;
