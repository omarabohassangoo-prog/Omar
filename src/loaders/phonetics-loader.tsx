// ============================================================
// phonetics-loader.tsx - تحميل وعرض الصوتيات (مصحح بالكامل مع دعم IPA)
// ============================================================

import type { PhoneticData, PhoneticSymbol } from '../types';

interface PhoneticsLoaderType {
  data: PhoneticData | null;
  currentSection: number;
  currentView: 'main' | 'detail';
  _loaded: boolean;
  load(): Promise<boolean>;
  getFallbackSymbols(category: string): PhoneticSymbol[];
  generateFallbackData(): PhoneticData;
  render(container: HTMLElement): void;
  _escapeHtml(text: string): string;
  bindEvents(container: HTMLElement): void;
  showDetail(index: number): void;
  goBackFromDetail(): void;
  _updateBadge(count: number): void;
  getTotal(): number;
}

const PhoneticsLoader: PhoneticsLoaderType = {
  data: null,
  currentSection: 0,
  currentView: 'main',
  _loaded: false,

  load: function(): Promise<boolean> {
    const self = this;
    if (this._loaded && this.data) return Promise.resolve(true);
    return fetch('/complete_data.json')
      .then(function(response: Response) {
        if (!response.ok) throw new Error('فشل تحميل complete_data.json');
        return response.json();
      })
      .then(function(data: any) {
        self.data = data;
        self._loaded = true;
        console.log('✅ PhoneticsLoader: تم تحميل البيانات');
        return true;
      })
      .catch(function(error: Error) {
        console.error('❌ PhoneticsLoader:', error);
        self.data = self.generateFallbackData();
        self._loaded = true;
        return true;
      });
  },

  generateFallbackData: function(): PhoneticData {
    return {
      phonetic_symbols: {
        vowels: { name: 'أصوات العلة', name_en: 'Vowel Sounds', symbols: [
          { symbol: '/iː/', example: 'see, sea', description: 'طويل مفتوح', audio_example: 'see' },
          { symbol: '/ɪ/', example: 'sit, ship', description: 'قصير مفتوح', audio_example: 'sit' },
          { symbol: '/e/', example: 'bed, red', description: 'متوسط مفتوح', audio_example: 'bed' },
          { symbol: '/æ/', example: 'cat, hat', description: 'مفتوح قصير', audio_example: 'cat' },
          { symbol: '/ɑː/', example: 'car, far', description: 'طويل مفتوح خلفي', audio_example: 'car' }
        ] },
        consonants: { name: 'الأصوات الساكنة', name_en: 'Consonant Sounds', symbols: [
          { symbol: '/p/', example: 'pen, stop', description: 'انفجاري مهموس', audio_example: 'pen' },
          { symbol: '/b/', example: 'big, job', description: 'انفجاري مجهور', audio_example: 'big' },
          { symbol: '/t/', example: 'tea, stop', description: 'انفجاري مهموس', audio_example: 'tea' },
          { symbol: '/d/', example: 'dog, did', description: 'انفجاري مجهور', audio_example: 'dog' },
          { symbol: '/k/', example: 'cat, kick', description: 'انفجاري مهموس طبقي', audio_example: 'cat' },
          { symbol: '/g/', example: 'go, get', description: 'انفجاري مجهور طبقي', audio_example: 'go' }
        ] },
        diphthongs: { name: 'الأصوات المزدوجة', name_en: 'Diphthong Sounds', symbols: [
          { symbol: '/eɪ/', example: 'say, way', description: 'من /e/ إلى /ɪ/', audio_example: 'say' },
          { symbol: '/aɪ/', example: 'my, time', description: 'من /a/ إلى /ɪ/', audio_example: 'my' },
          { symbol: '/ɔɪ/', example: 'boy, toy', description: 'من /ɔ/ إلى /ɪ/', audio_example: 'boy' }
        ] }
      }
    };
  },

  getFallbackSymbols: function(category: string): PhoneticSymbol[] {
    const fallbacks: Record<string, PhoneticSymbol[]> = {
      'vowels': [
        { symbol: '/iː/', example: 'see, sea', description: 'طويل مفتوح', audio_example: 'see' },
        { symbol: '/ɪ/', example: 'sit, ship', description: 'قصير مفتوح', audio_example: 'sit' },
        { symbol: '/e/', example: 'bed, red', description: 'متوسط مفتوح', audio_example: 'bed' },
        { symbol: '/æ/', example: 'cat, hat', description: 'مفتوح قصير', audio_example: 'cat' },
        { symbol: '/ɑː/', example: 'car, far', description: 'طويل مفتوح خلفي', audio_example: 'car' }
      ],
      'consonants': [
        { symbol: '/p/', example: 'pen, stop', description: 'انفجاري مهموس', audio_example: 'pen' },
        { symbol: '/b/', example: 'big, job', description: 'انفجاري مجهور', audio_example: 'big' },
        { symbol: '/t/', example: 'tea, stop', description: 'انفجاري مهموس', audio_example: 'tea' },
        { symbol: '/d/', example: 'dog, did', description: 'انفجاري مجهور', audio_example: 'dog' },
        { symbol: '/k/', example: 'cat, kick', description: 'انفجاري مهموس طبقي', audio_example: 'cat' },
        { symbol: '/g/', example: 'go, get', description: 'انفجاري مجهور طبقي', audio_example: 'go' }
      ],
      'diphthongs': [
        { symbol: '/eɪ/', example: 'say, way', description: 'من /e/ إلى /ɪ/', audio_example: 'say' },
        { symbol: '/aɪ/', example: 'my, time', description: 'من /a/ إلى /ɪ/', audio_example: 'my' },
        { symbol: '/ɔɪ/', example: 'boy, toy', description: 'من /ɔ/ إلى /ɪ/', audio_example: 'boy' }
      ]
    };
    return fallbacks[category] || [];
  },

  render: function(container: HTMLElement): void {
    try {
      if (!container) return;
      if (!this.data) {
        container.innerHTML = '<p style="color:var(--text-muted);">⚠️ بيانات الصوتيات غير متوفرة</p>';
        return;
      }
      
      const sections: Record<string, { name: string; name_en: string }> = {
        'vowels': { name: 'أصوات العلة', name_en: 'Vowel Sounds' },
        'consonants': { name: 'الأصوات الساكنة', name_en: 'Consonant Sounds' },
        'diphthongs': { name: 'الأصوات المزدوجة', name_en: 'Diphthong Sounds' }
      };
      
      const keys = Object.keys(sections);
      const currentKey = keys[this.currentSection] || keys[0];
      const section = sections[currentKey];
      
      let symbols: PhoneticSymbol[] = [];
      if (this.data.phonetic_symbols && this.data.phonetic_symbols[currentKey]) {
        symbols = this.data.phonetic_symbols[currentKey].symbols || [];
      }
      if (symbols.length === 0) {
        symbols = this.getFallbackSymbols(currentKey);
      }
      
      let subTabsHtml = '';
      for (let k = 0; k < keys.length; k++) {
        const key = keys[k];
        let count = 0;
        if (this.data.phonetic_symbols && this.data.phonetic_symbols[key]) {
          count = this.data.phonetic_symbols[key].symbols ? this.data.phonetic_symbols[key].symbols.length : 0;
        }
        if (count === 0) count = this.getFallbackSymbols(key).length;
        subTabsHtml += `<button class="${k === this.currentSection ? 'active' : ''}" data-psection="${k}" style="padding:6px 16px;border:none;border-radius:30px;cursor:pointer;background:${k === this.currentSection ? 'var(--blue)' : 'transparent'};color:${k === this.currentSection ? 'white' : 'var(--text-secondary)'};font-family:inherit;transition:all 0.3s;">${sections[key].name} <span style="font-size:0.7rem;">(${count})</span></button>`;
      }
      
      let cardsHtml = '';
      for (let s = 0; s < symbols.length; s++) {
        const sym = symbols[s];
        const exampleText = sym.audio_example || (sym.example ? sym.example.split(',')[0].trim() : '');
        
        const symbolDisplay = sym.symbol || '';
        const exampleDisplay = this._escapeHtml(sym.example || '');
        const descDisplay = this._escapeHtml(sym.description || '');
        const audioDisplay = this._escapeHtml(exampleText);
        const searchText = symbolDisplay + ' ' + exampleDisplay + ' ' + descDisplay;
        
        cardsHtml += `<div class="card-item clickable" data-pindex="${s}" data-search="${searchText}" onclick="PhoneticsLoader.showDetail(${s})" style="background:var(--bg-card);border-radius:var(--radius-sm);padding:16px 18px;border:1px solid var(--border-color);transition:all 0.3s;cursor:pointer;">`;
        cardsHtml += '<div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;">';
        cardsHtml += `<span class="ipa-symbol" style="font-size:2em;font-weight:600;direction:ltr;unicode-bidi:bidi-override;background:rgba(255,215,0,0.08);padding:4px 16px;border-radius:12px;border:1px solid rgba(255,215,0,0.15);display:inline-block;">${symbolDisplay}</span>`;
        cardsHtml += `<button class="play-btn" data-text="${audioDisplay}" onclick="event.stopPropagation(); if(window.speakText) window.speakText('${audioDisplay}');" style="border:none;border-radius:30px;padding:4px 14px;cursor:pointer;background:var(--blue-dim);color:var(--blue);font-size:0.85rem;">🔊</button>`;
        cardsHtml += '</div>';
        cardsHtml += `<div style="font-size:1.1em;color:var(--text-primary);margin-top:8px;">${exampleDisplay}</div>`;
        cardsHtml += `<div style="color:var(--text-secondary);font-size:0.85em;margin-top:2px;">${descDisplay}</div>`;
        cardsHtml += '<div style="font-size:0.7em;color:var(--text-muted);margin-top:4px;">👆 اضغط للتفاصيل</div></div>';
      }
      
      let html = '';
      html += '<div style="margin-bottom:16px;">';
      html += `<h2 style="color:#9b59b6;">🔊 ${section.name}</h2>`;
      html += `<p style="color:var(--text-secondary);">${section.name_en || ''} · ${symbols.length} رمز صوتي</p>`;
      html += '</div>';
      
      html += `<div style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;background:var(--bg-card);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--border-color);">${subTabsHtml}</div>`;
      
      html += '<div style="margin-bottom:12px;">';
      html += '<input id="phoneticSearch" placeholder="🔍 ابحث في الرموز الصوتية..." style="width:100%;padding:10px 16px;border-radius:30px;border:1px solid var(--border-color);background:var(--bg-card);color:var(--text-primary);font-family:inherit;" />';
      html += '<span id="phoneticResultCount" style="margin-right:10px;font-size:0.85rem;color:var(--text-muted);"></span>';
      html += '</div>';
      
      html += '<div id="phoneticContent" style="display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:16px;">';
      if (symbols.length === 0) {
        html += '<div style="text-align:center;padding:40px 20px;color:var(--text-muted);">🔇 لا توجد رموز صوتية</div>';
      } else {
        html += cardsHtml;
      }
      html += '</div>';
      
      container.innerHTML = html;
      this.bindEvents(container);
      
      this._updateBadge(this.getTotal());
      
    } catch (e) {
      console.error('❌ خطأ في render:', e);
      if (container) container.innerHTML = '<p style="color:var(--text-muted);">⚠️ حدث خطأ في عرض الصوتيات</p>';
    }
  },

  _escapeHtml: function(text: string): string {
    try {
      if (!text) return '';
      const div = document.createElement('div');
      div.textContent = text;
      return div.innerHTML;
    } catch (e) {
      return text || '';
    }
  },

  bindEvents: function(container: HTMLElement): void {
    try {
      const self = this;
      
      const subBtns = container.querySelectorAll<HTMLButtonElement>('[data-psection]');
      for (let i = 0; i < subBtns.length; i++) {
        subBtns[i].addEventListener('click', function() {
          try {
            const section = parseInt(this.dataset.psection || '0');
            if (!isNaN(section) && section !== self.currentSection) {
              self.currentSection = section;
              self.render(container);
              if (typeof window.scrollToTop === 'function') window.scrollToTop();
            }
          } catch (e) {
            console.error('❌ خطأ في subTab:', e);
          }
        });
      }
      
      const searchBox = container.querySelector('#phoneticSearch') as HTMLInputElement;
      if (searchBox) {
        let searchTimeout: number;
        searchBox.addEventListener('input', function() {
          clearTimeout(searchTimeout);
          searchTimeout = window.setTimeout(function() {
            try {
              const q = searchBox.value.toLowerCase().trim();
              const cards = container.querySelectorAll<HTMLElement>('#phoneticContent .card-item');
              let visible = 0;
              for (let c = 0; c < cards.length; c++) {
                const card = cards[c];
                const text = (card.dataset.search || '').toLowerCase();
                const match = !q || text.indexOf(q) !== -1;
                card.style.display = match ? '' : 'none';
                if (match) visible++;
              }
              const resultEl = container.querySelector('#phoneticResultCount');
              if (resultEl) {
                if (q) {
                  resultEl.textContent = `🔍 ${visible} نتيجة`;
                } else {
                  resultEl.textContent = '';
                }
              }
            } catch (e) {
              console.warn('⚠️ خطأ في البحث:', e);
            }
          }, 150);
        });
      }
      
    } catch (e) {
      console.error('❌ خطأ في bindEvents:', e);
    }
  },

  showDetail: function(index: number): void {
    try {
      const sections = ['vowels', 'consonants', 'diphthongs'];
      const currentKey = sections[this.currentSection] || sections[0];
      
      let symbols: PhoneticSymbol[] = [];
      if (this.data && this.data.phonetic_symbols && this.data.phonetic_symbols[currentKey]) {
        symbols = this.data.phonetic_symbols[currentKey].symbols || [];
      }
      if (symbols.length === 0) {
        symbols = this.getFallbackSymbols(currentKey);
      }
      
      if (index >= symbols.length || index < 0) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ الرمز غير موجود');
        return;
      }
      
      const sym = symbols[index];
      const container = document.getElementById('contentArea') as HTMLElement;
      if (!container) return;
      
      const exampleText = sym.audio_example || (sym.example ? sym.example.split(',')[0].trim() : '');
      const symbolDisplay = sym.symbol || '';
      const exampleDisplay = this._escapeHtml(sym.example || '');
      const descDisplay = this._escapeHtml(sym.description || '');
      const audioDisplay = this._escapeHtml(exampleText);
      
      let html = '';
      html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:16px;">';
      html += `<div><span class="ipa-symbol" style="font-size:3em;font-weight:700;direction:ltr;unicode-bidi:bidi-override;background:rgba(255,215,0,0.08);padding:8px 24px;border-radius:16px;border:2px solid rgba(255,215,0,0.2);display:inline-block;">${symbolDisplay}</span>`;
      html += `<div style="color:var(--text-primary);font-size:1.1em;margin-top:8px;">${exampleDisplay}</div>`;
      html += `<div style="color:var(--text-secondary);font-size:0.9em;">${descDisplay}</div></div>`;
      html += '<button onclick="PhoneticsLoader.goBackFromDetail()" class="back-btn" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);cursor:pointer;font-family:inherit;">⬅ العودة</button></div>';
      
      if (audioDisplay) {
        html += '<div style="background:var(--bg-card);padding:12px 16px;border-radius:8px;margin-top:8px;border:1px solid var(--border-color);">';
        html += '<div style="display:flex;align-items:center;gap:12px;flex-wrap:wrap;">';
        html += `<span style="color:var(--text-secondary);">🔊 مثال:</span><span style="color:var(--text-primary);font-size:1.1em;">${audioDisplay}</span>`;
        html += `<button onclick="if(window.speakText) window.speakText('${audioDisplay}')" style="padding:4px 16px;border:none;border-radius:20px;background:var(--gold-dim);color:var(--gold);cursor:pointer;">▶ استماع</button></div></div>`;
      }
      
      let relatedWords = '';
      try {
        if (this.data && this.data.words) {
          const related: any[] = [];
          for (let wi = 0; wi < this.data.words.length; wi++) {
            const w = this.data.words[wi];
            if (w.ipa === sym.symbol) related.push(w);
          }
          if (related.length > 0) {
            relatedWords += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color);"><div style="font-size:0.8em;color:var(--blue);margin-bottom:6px;">📝 كلمات بنفس الرمز:</div>';
            const rLimit = Math.min(related.length, 10);
            for (let r = 0; r < rLimit; r++) {
              const w = related[r];
              const safeWord = this._escapeHtml(w.word);
              const safeAr = this._escapeHtml(w.ar);
              relatedWords += `<span style="display:inline-block;background:var(--bg-card);padding:3px 14px;border-radius:20px;margin:3px;font-size:0.8em;border:1px solid var(--border-color);cursor:pointer;" onclick="if(window.speakText) window.speakText('${safeWord}')">${safeWord} (${safeAr})</span>`;
            }
            relatedWords += '</div>';
          }
        }
      } catch (e) {}
      html += relatedWords;
      
      container.innerHTML = html;
      
      if (typeof window.bindAudioButtons === 'function') {
        setTimeout(function() {
          window.bindAudioButtons(container);
        }, 100);
      }
      
    } catch (e) {
      console.error('❌ خطأ في showDetail:', e);
      if (typeof window.showToast === 'function') window.showToast('⚠️ حدث خطأ');
    }
  },

  goBackFromDetail: function(): void {
    try {
      console.log('🔙 العودة من تفاصيل الرمز الصوتي');
      this.currentView = 'main';
      const container = document.getElementById('contentArea') as HTMLElement;
      if (container) this.render(container);
      if (typeof window.scrollToTop === 'function') window.scrollToTop();
    } catch (e) {
      console.error('❌ خطأ في goBackFromDetail:', e);
    }
  },

  _updateBadge: function(count: number): void {
    try {
      const el = document.getElementById('totalPhonetics');
      if (el) el.textContent = String(count);
      const tabEl = document.getElementById('tabPhoneticsCount');
      if (tabEl) tabEl.textContent = String(count);
    } catch (e) {}
  },

  getTotal: function(): number {
    try {
      if (!this.data) return 12;
      let count = 0;
      if (this.data.phonetic_symbols) {
        for (const key in this.data.phonetic_symbols) {
          if (this.data.phonetic_symbols[key] && this.data.phonetic_symbols[key].symbols) {
            count += this.data.phonetic_symbols[key].symbols.length;
          }
        }
      }
      return count > 0 ? count : 12;
    } catch (e) {
      return 12;
    }
  }
};

console.log('✅ phonetics-loader.tsx (مصحح بالكامل مع دعم IPA) تم تحميله');

export default PhoneticsLoader;
