// ============================================================
// vocabulary-loader.tsx - تحميل وعرض المفردات (مصحح بالكامل مع تعبئة البيانات)
// ============================================================

import type { VocabularyData, VocabularyWord, VocabularySection } from '../types';

interface VocabularyLoaderType {
  data: VocabularyData | null;
  currentSection: number;
  currentSub: number;
  currentView: 'main' | 'detail';
  _loaded: boolean;
  searchQuery: string;
  load(): Promise<boolean>;
  _convertFromCompleteData(data: any): VocabularyData;
  generateFallbackData(): VocabularyData;
  render(container: HTMLElement): void;
  _escapeHtml(text: string): string;
  bindEvents(container: HTMLElement): void;
  showDetail(index: number): void;
  goBackFromDetail(): void;
  getTotalWords(): number;
  search(query: string): void;
}

const VocabularyLoader: VocabularyLoaderType = {
  data: null,
  currentSection: 0,
  currentSub: 0,
  currentView: 'main',
  _loaded: false,
  searchQuery: '',

  load: function(): Promise<boolean> {
    const self = this;
    if (this._loaded && this.data) return Promise.resolve(true);
    
    return fetch('/complete_vocabulary.json')
      .then(function(response: Response) {
        if (!response.ok) throw new Error('فشل تحميل complete_vocabulary.json');
        return response.json();
      })
      .then(function(data: any) {
        self.data = data;
        self._loaded = true;
        console.log('✅ VocabularyLoader: تم تحميل البيانات من complete_vocabulary.json');
        return true;
      })
      .catch(function(error: Error) {
        console.error('❌ VocabularyLoader: خطأ في التحميل من complete_vocabulary.json:', error);
        return fetch('/complete_data.json')
          .then(function(response: Response) {
            if (!response.ok) throw new Error('فشل تحميل complete_data.json');
            return response.json();
          })
          .then(function(data: any) {
            self.data = self._convertFromCompleteData(data);
            self._loaded = true;
            const total = self.getTotalWords();
            console.log(`✅ VocabularyLoader: تم تحميل وتعبئة ${total} كلمة من complete_data.json`);
            return true;
          })
          .catch(function(err: Error) {
            console.error('❌ VocabularyLoader: فشل تحميل جميع المصادر:', err);
            self.data = self.generateFallbackData();
            self._loaded = true;
            return true;
          });
      });
  },

  _convertFromCompleteData: function(data: any): VocabularyData {
    const sections: Record<string, VocabularySection> = {};
    
    if (data && data.words && Array.isArray(data.words) && data.words.length > 0) {
      const words = data.words;
      
      const types: Record<string, VocabularyWord[]> = {};
      const allWords: VocabularyWord[] = [];
      
      for (let i = 0; i < words.length; i++) {
        const w = words[i];
        let type = w.type || 'other';
        
        type = type.toLowerCase().trim();
        
        if (type.indexOf('adverb') !== -1 || type.indexOf('adverb/preposition') !== -1) {
          type = 'adverb';
        } else if (type.indexOf('phrasal') !== -1 || type.indexOf('phrasal_verb') !== -1) {
          type = 'phrasal_verb';
        } else if (type.indexOf('noun') !== -1) {
          type = 'noun';
        } else if (type.indexOf('verb') !== -1) {
          type = 'verb';
        } else if (type.indexOf('adjective') !== -1) {
          type = 'adjective';
        } else if (type.indexOf('preposition') !== -1) {
          type = 'preposition';
        } else if (type.indexOf('number') !== -1) {
          type = 'number';
        } else if (type.indexOf('pronoun') !== -1) {
          type = 'pronoun';
        } else if (type.indexOf('determiner') !== -1) {
          type = 'determiner';
        } else if (type.indexOf('conjunction') !== -1) {
          type = 'conjunction';
        } else if (type.indexOf('interjection') !== -1) {
          type = 'interjection';
        }
        
        if (!types[type]) {
          types[type] = [];
        }
        
        let exists = false;
        for (let e = 0; e < types[type].length; e++) {
          if (types[type][e].en === w.word) {
            exists = true;
            break;
          }
        }
        if (!exists) {
          types[type].push({
            en: w.word || '',
            ar: w.ar || '',
            ipa: w.ipa || '',
            type: w.type || '',
            example: w.example || '',
            example_ar: w.example_ar || '',
            source: w.source || []
          });
        }
        
        let existsAll = false;
        for (let a = 0; a < allWords.length; a++) {
          if (allWords[a].en === w.word) {
            existsAll = true;
            break;
          }
        }
        if (!existsAll) {
          allWords.push({
            en: w.word || '',
            ar: w.ar || '',
            ipa: w.ipa || '',
            type: w.type || '',
            example: w.example || '',
            example_ar: w.example_ar || '',
            source: w.source || []
          });
        }
      }
      
      if (allWords.length > 0) {
        sections['all_words'] = {
          name: '📚 جميع الكلمات',
          name_en: 'All Words',
          items: [{
            type: `جميع الكلمات (${allWords.length})`,
            words: allWords
          }]
        };
      }
      
      const typeNames: Record<string, string> = {
        'verb': '🏃 أفعال',
        'noun': '📦 أسماء',
        'adjective': '🎨 صفات',
        'adverb': '⏰ ظروف',
        'preposition': '🔗 حروف جر',
        'phrasal_verb': '🔀 أفعال مركبة',
        'number': '🔢 أرقام',
        'pronoun': '👤 ضمائر',
        'determiner': '📌 محددات',
        'conjunction': '🔗 أدوات ربط',
        'interjection': '😮 أدوات تعجب',
        'other': '📌 أخرى'
      };
      
      const typeKeys = Object.keys(types);
      for (let t = 0; t < typeKeys.length; t++) {
        const key = typeKeys[t];
        const displayName = typeNames[key] || key;
        const typeWords = types[key];
        
        if (typeWords && typeWords.length > 0) {
          sections[`type_${key}`] = {
            name: displayName,
            name_en: key.charAt(0).toUpperCase() + key.slice(1),
            items: [{
              type: `${displayName} (${typeWords.length})`,
              words: typeWords
            }]
          };
        }
      }
      
      const sourceWords: Record<string, VocabularyWord[]> = {};
      for (let s = 0; s < allWords.length; s++) {
        const w = allWords[s];
        if (w.source && w.source.length > 0) {
          for (let src = 0; src < w.source.length; src++) {
            const source = w.source[src];
            if (!sourceWords[source]) {
              sourceWords[source] = [];
            }
            let existsSrc = false;
            for (let es = 0; es < sourceWords[source].length; es++) {
              if (sourceWords[source][es].en === w.en) {
                existsSrc = true;
                break;
              }
            }
            if (!existsSrc) {
              sourceWords[source].push(w);
            }
          }
        }
      }
      
      const sourceNames: Record<string, string> = {
        'story': '📖 من القصة',
        'vocabulary': '📝 مفردات أساسية',
        'phrasal_verbs': '🔀 أفعال مركبة',
        'adverbs': '⏰ ظروف',
        'prepositions': '🔗 حروف جر',
        'grammar': '📚 قواعد'
      };
      
      const sourceKeys = Object.keys(sourceWords);
      for (let src2 = 0; src2 < sourceKeys.length; src2++) {
        const key = sourceKeys[src2];
        const displayName = sourceNames[key] || key;
        const srcWords = sourceWords[key];
        
        if (srcWords && srcWords.length > 0) {
          sections[`source_${key}`] = {
            name: displayName,
            name_en: `From ${key}`,
            items: [{
              type: `${displayName} (${srcWords.length})`,
              words: srcWords
            }]
          };
        }
      }
    }
    
    if (Object.keys(sections).length === 0) {
      return this.generateFallbackData();
    }
    
    return {
      title: 'المفردات الشاملة',
      title_en: 'Complete Vocabulary',
      sections: sections
    };
  },

  generateFallbackData: function(): VocabularyData {
    return {
      title: 'المفردات الأساسية',
      title_en: 'Basic Vocabulary',
      sections: {
        'basic': {
          name: '📚 كلمات أساسية',
          name_en: 'Basic Words',
          items: [{
            type: 'أفعال شائعة',
            words: [
              { en: 'go', ar: 'يذهب', ipa: '/ɡəʊ/', example: 'I go to school.', example_ar: 'أذهب إلى المدرسة.' },
              { en: 'come', ar: 'يأتي', ipa: '/kʌm/', example: 'He comes home.', example_ar: 'هو يأتي إلى المنزل.' },
              { en: 'see', ar: 'يرى', ipa: '/siː/', example: 'I see you.', example_ar: 'أراك.' },
              { en: 'make', ar: 'يفعل', ipa: '/meɪk/', example: 'She makes coffee.', example_ar: 'هي تصنع القهوة.' }
            ]
          }]
        },
        'family': {
          name: '👨‍👩‍👧‍👦 العائلة',
          name_en: 'Family',
          items: [{
            type: 'أفراد العائلة',
            words: [
              { en: 'father', ar: 'أب', ipa: '/ˈfɑːðər/', example: 'My father is a doctor.', example_ar: 'أبي طبيب.' },
              { en: 'mother', ar: 'أم', ipa: '/ˈmʌðər/', example: 'My mother is a teacher.', example_ar: 'أمي معلمة.' },
              { en: 'brother', ar: 'أخ', ipa: '/ˈbrʌðər/', example: 'I have a brother.', example_ar: 'لدي أخ.' },
              { en: 'sister', ar: 'أخت', ipa: '/ˈsɪstər/', example: 'She is my sister.', example_ar: 'هي أختي.' }
            ]
          }]
        }
      }
    };
  },

  render: function(container: HTMLElement): void {
    try {
      if (!container) return;
      
      if (!this._loaded) {
        container.innerHTML = '<div class="loading"><div class="spinner"></div><p>جاري تحميل المفردات...</p></div>';
        const self = this;
        this.load().then(function() {
          self.render(container);
        });
        return;
      }
      
      if (!this.data || !this.data.sections) {
        container.innerHTML = '<p style="color:var(--text-muted);">⚠️ بيانات المفردات غير متوفرة</p>';
        return;
      }
      
      const sections = this.data.sections;
      const sectionKeys = Object.keys(sections);
      
      const validKeys: string[] = [];
      for (let sk = 0; sk < sectionKeys.length; sk++) {
        const key = sectionKeys[sk];
        const section = sections[key];
        if (section && section.items) {
          let hasWords = false;
          for (let it = 0; it < section.items.length; it++) {
            if (section.items[it].words && section.items[it].words.length > 0) {
              hasWords = true;
              break;
            }
          }
          if (hasWords) {
            validKeys.push(key);
          }
        }
      }
      
      if (validKeys.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">لا توجد كلمات في أي قسم</p>';
        return;
      }
      
      if (this.currentView === 'detail') return;
      
      if (this.currentSection >= validKeys.length) {
        this.currentSection = 0;
      }
      
      const currentKey = validKeys[this.currentSection];
      const section = sections[currentKey];
      if (!section) {
        container.innerHTML = '<p style="color:var(--text-muted);">⚠️ القسم غير موجود</p>';
        return;
      }
      
      const items = section.items || [];
      const subItems = items.length > 0 ? items : [{ words: [] }];
      const subIdx = Math.min(this.currentSub, subItems.length - 1);
      const currentSub = subItems[subIdx] || { words: [] };
      const words = currentSub.words || [];
      
      let totalWordsInSection = 0;
      for (let i = 0; i < subItems.length; i++) {
        if (subItems[i].words) totalWordsInSection += subItems[i].words.length;
      }
      
      const sortedWords = words.slice().sort(function(a, b) {
        return (a.en || '').localeCompare(b.en || '');
      });
      
      let subTabsHtml = '';
      if (subItems.length > 1) {
        for (let si = 0; si < subItems.length; si++) {
          const item = subItems[si];
          const label = item.type || item.name || `مجموعة ${si + 1}`;
          const count = item.words ? item.words.length : 0;
          const isActive = (si === subIdx);
          subTabsHtml += `<button class="${isActive ? 'active' : ''}" data-sub="${si}" style="padding:6px 16px;border:none;border-radius:30px;cursor:pointer;background:${isActive ? 'var(--blue)' : 'transparent'};color:${isActive ? 'white' : 'var(--text-secondary)'};font-family:inherit;transition:all 0.3s;">${this._escapeHtml(label)} <span style="font-size:0.7rem;">(${count})</span></button>`;
        }
      }
      
      let html = '';
      
      html += '<div class="nav-controls">';
      html += '<div class="title-area">';
      html += `<h2>${this._escapeHtml(section.name)}</h2>`;
      html += `<div class="sub">${section.name_en || ''} · ${totalWordsInSection} كلمة</div>`;
      html += '</div>';
      html += '<div class="nav-btns">';
      html += `<button id="prevVocabSection"${this.currentSection === 0 ? ' disabled' : ''}>⬅ قسم</button>`;
      html += `<span class="page-indicator">${this.currentSection + 1} / ${validKeys.length}</span>`;
      html += `<button id="nextVocabSection"${this.currentSection >= validKeys.length - 1 ? ' disabled' : ''}>قسم ➡</button>`;
      html += '</div></div>';
      
      if (subItems.length > 1) {
        html += `<div class="sub-tabs" id="vocabSubTabs" style="display:flex;flex-wrap:wrap;gap:6px;margin-bottom:12px;background:var(--bg-card);padding:8px 12px;border-radius:var(--radius-sm);border:1px solid var(--border-color);">${subTabsHtml}</div>`;
      }
      
      html += '<div class="search-wrapper">';
      html += `<input type="search" class="search-box" id="vocabSearch" placeholder="🔍 ابحث في المفردات (بالإنجليزية أو العربية)..." value="${this._escapeHtml(this.searchQuery)}" />`;
      html += '<span class="result-count" id="vocabResultCount"></span>';
      html += '</div>';
      
      html += '<div id="vocabContent" class="card-grid">';
      
      if (sortedWords.length === 0) {
        html += '<div class="no-results"><div class="icon">📭</div><p>لا توجد كلمات في هذا القسم</p></div>';
      } else {
        for (let wi = 0; wi < sortedWords.length; wi++) {
          const w = sortedWords[wi];
          const safeEn = this._escapeHtml(w.en || '');
          const safeAr = this._escapeHtml(w.ar || '');
          const safeIpa = w.ipa ? this._escapeHtml(w.ipa) : '';
          const safeExample = w.example ? this._escapeHtml(w.example) : '';
          const safeExampleAr = w.example_ar ? this._escapeHtml(w.example_ar) : '';
          const safeType = w.type ? this._escapeHtml(w.type) : '';
          const searchText = safeEn + ' ' + safeAr + ' ' + safeIpa + ' ' + safeExample + ' ' + safeExampleAr;
          
          html += `<div class="card-item clickable" data-index="${wi}" data-search="${this._escapeHtml(searchText.toLowerCase())}" onclick="VocabularyLoader.showDetail(${wi})" style="background:var(--bg-card);border-radius:var(--radius-sm);padding:14px 18px;border:1px solid var(--border-color);transition:all 0.3s;cursor:pointer;">`;
          
          html += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">';
          html += '<div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">';
          html += `<span style="font-size:1.1em;font-weight:600;color:var(--text-primary);">${safeEn}</span>`;
          if (safeIpa) {
            html += `<span class="ipa-symbol" style="font-size:1em;direction:ltr;unicode-bidi:bidi-override;background:rgba(255,215,0,0.08);padding:2px 12px;border-radius:8px;border:1px solid rgba(255,215,0,0.15);">${safeIpa}</span>`;
          }
          if (safeType) {
            html += `<span style="font-size:0.6em;padding:2px 10px;border-radius:20px;background:var(--blue-dim);color:var(--blue);border:1px solid rgba(100,200,255,0.1);">${safeType}</span>`;
          }
          html += '</div>';
          html += `<button class="play-btn" data-text="${safeEn}" onclick="event.stopPropagation(); if(window.speakText) window.speakText('${safeEn}');" style="background:none;border:none;color:var(--gold);font-size:1.1em;cursor:pointer;padding:4px 8px;border-radius:50%;transition:all 0.3s;">🔊</button>`;
          html += '</div>';
          
          html += `<div style="color:var(--text-secondary);font-size:0.95em;margin-top:4px;">${safeAr}</div>`;
          
          if (safeExample) {
            html += `<div style="font-size:0.82em;color:var(--text-muted);margin-top:6px;padding-top:6px;border-top:1px solid var(--border-color);">📌 ${safeExample}`;
            if (safeExampleAr) {
              html += ` <span style="color:var(--text-muted);">— ${safeExampleAr}</span>`;
            }
            html += '</div>';
          }
          
          html += '<div style="font-size:0.6em;color:var(--text-muted);opacity:0.4;margin-top:4px;">👆 اضغط للتفاصيل</div>';
          html += '</div>';
        }
      }
      
      html += '</div>';
      container.innerHTML = html;
      this.bindEvents(container);
      
    } catch (e) {
      console.error('❌ خطأ في render:', e);
      if (container) container.innerHTML = '<p style="color:var(--text-muted);">⚠️ حدث خطأ في عرض المفردات</p>';
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
      if (!this.data || !this.data.sections) return;
      
      const sections = this.data.sections;
      const sectionKeys = Object.keys(sections);
      
      const validKeys: string[] = [];
      for (let sk = 0; sk < sectionKeys.length; sk++) {
        const key = sectionKeys[sk];
        const section = sections[key];
        if (section && section.items) {
          let hasWords = false;
          for (let it = 0; it < section.items.length; it++) {
            if (section.items[it].words && section.items[it].words.length > 0) {
              hasWords = true;
              break;
            }
          }
          if (hasWords) {
            validKeys.push(key);
          }
        }
      }
      
      const prevBtn = container.querySelector('#prevVocabSection') as HTMLButtonElement;
      const nextBtn = container.querySelector('#nextVocabSection') as HTMLButtonElement;
      
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          try {
            if (self.currentSection > 0) {
              self.currentSection--;
              self.currentSub = 0;
              self.currentView = 'main';
              self.render(container);
              if (typeof window.scrollToTop === 'function') window.scrollToTop();
            }
          } catch (e) {
            console.error('❌ خطأ في prevVocabSection:', e);
          }
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          try {
            if (self.currentSection < validKeys.length - 1) {
              self.currentSection++;
              self.currentSub = 0;
              self.currentView = 'main';
              self.render(container);
              if (typeof window.scrollToTop === 'function') window.scrollToTop();
            }
          } catch (e) {
            console.error('❌ خطأ في nextVocabSection:', e);
          }
        });
      }
      
      const subBtns = container.querySelectorAll<HTMLButtonElement>('#vocabSubTabs button');
      for (let i = 0; i < subBtns.length; i++) {
        subBtns[i].addEventListener('click', function() {
          try {
            const sub = parseInt(this.dataset.sub || '0');
            if (!isNaN(sub)) {
              self.currentSub = sub;
              self.currentView = 'main';
              self.render(container);
              if (typeof window.scrollToTop === 'function') window.scrollToTop();
            }
          } catch (e) {
            console.error('❌ خطأ في subTab:', e);
          }
        });
      }
      
      const searchBox = container.querySelector('#vocabSearch') as HTMLInputElement;
      if (searchBox) {
        let searchTimeout: number;
        searchBox.addEventListener('input', function() {
          clearTimeout(searchTimeout);
          searchTimeout = window.setTimeout(function() {
            try {
              self.searchQuery = searchBox.value;
              const q = searchBox.value.toLowerCase().trim();
              const cards = container.querySelectorAll<HTMLElement>('#vocabContent .card-item');
              let visible = 0;
              
              for (let c = 0; c < cards.length; c++) {
                const card = cards[c];
                const text = (card.dataset.search || '').toLowerCase();
                const match = !q || text.indexOf(q) !== -1;
                card.style.display = match ? 'block' : 'none';
                if (match) visible++;
              }
              
              const resultEl = container.querySelector('#vocabResultCount');
              if (resultEl) {
                if (q) {
                  resultEl.textContent = `🔍 ${visible} نتيجة`;
                  resultEl.classList.add('has-results');
                } else {
                  resultEl.textContent = '';
                  resultEl.classList.remove('has-results');
                }
              }
            } catch (e) {
              console.warn('⚠️ خطأ في البحث:', e);
            }
          }, 150);
        });
      }
      
      if (typeof window.bindAudioButtons === 'function') {
        setTimeout(function() {
          window.bindAudioButtons(container);
        }, 100);
      }
      
    } catch (e) {
      console.error('❌ خطأ في bindEvents:', e);
    }
  },

  showDetail: function(index: number): void {
    try {
      if (!this.data || !this.data.sections) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ بيانات المفردات غير متوفرة');
        return;
      }
      
      const sections = this.data.sections;
      const sectionKeys = Object.keys(sections);
      
      const validKeys: string[] = [];
      for (let sk = 0; sk < sectionKeys.length; sk++) {
        const key = sectionKeys[sk];
        const section = sections[key];
        if (section && section.items) {
          let hasWords = false;
          for (let it = 0; it < section.items.length; it++) {
            if (section.items[it].words && section.items[it].words.length > 0) {
              hasWords = true;
              break;
            }
          }
          if (hasWords) {
            validKeys.push(key);
          }
        }
      }
      
      if (this.currentSection >= validKeys.length) {
        this.currentSection = 0;
      }
      
      const currentKey = validKeys[this.currentSection];
      const section = sections[currentKey];
      if (!section) return;
      
      const items = section.items || [];
      const subItems = items.length > 0 ? items : [{ words: [] }];
      const subIdx = Math.min(this.currentSub, subItems.length - 1);
      const currentSub = subItems[subIdx] || { words: [] };
      const words = currentSub.words || [];
      
      const sortedWords = words.slice().sort(function(a, b) {
        return (a.en || '').localeCompare(b.en || '');
      });
      
      if (index >= sortedWords.length) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ الكلمة غير موجودة');
        return;
      }
      
      const word = sortedWords[index];
      this.currentView = 'detail';
      const container = document.getElementById('contentArea') as HTMLElement;
      if (!container) return;
      
      // البحث عن أمثلة من القصة
      let storyExamples = '';
      try {
        const storyLoader = (window as any).StoryLoader;
        if (storyLoader && storyLoader.data && storyLoader.data.chapters) {
          const found: any[] = [];
          const chapters = storyLoader.data.chapters;
          const searchWord = word.en.toLowerCase();
          
          for (let c = 0; c < chapters.length; c++) {
            const ch = chapters[c];
            if (ch.content) {
              for (let s = 0; s < ch.content.length; s++) {
                const item = ch.content[s];
                if (item.sentence && item.sentence.toLowerCase().indexOf(searchWord) !== -1) {
                  found.push({
                    chapter: c,
                    chapterTitle: ch.title || `الفصل ${c + 1}`,
                    sentence: item.sentence,
                    translation: item.translation
                  });
                }
              }
            }
          }
          
          if (found.length > 0) {
            storyExamples += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color);">';
            storyExamples += `<div style="font-size:0.8em;color:var(--gold);margin-bottom:6px;">📖 أمثلة من القصة (${found.length}):</div>`;
            const limit = Math.min(found.length, 5);
            for (let f = 0; f < limit; f++) {
              const item = found[f];
              const safeSentence = this._escapeHtml(item.sentence);
              const safeTranslation = this._escapeHtml(item.translation);
              const safeChapterTitle = this._escapeHtml(item.chapterTitle);
              
              storyExamples += `<div style="background:var(--bg-card);padding:8px 14px;border-radius:8px;margin-bottom:6px;font-size:0.85em;cursor:pointer;border-right:2px solid var(--gold-dim);" onclick="if(window.StoryLoader) { window.StoryLoader.currentChapter=${item.chapter}; window.StoryLoader.currentView='main'; window.StoryLoader.render(document.getElementById('contentArea')); }">`;
              storyExamples += `<div style="font-size:0.7em;color:var(--text-muted);">📖 ${safeChapterTitle}</div>`;
              storyExamples += `<div style="color:var(--text-primary);">${safeSentence}</div>`;
              storyExamples += `<div style="color:var(--text-secondary);font-size:0.85em;">${safeTranslation}</div>`;
              storyExamples += '</div>';
            }
            storyExamples += '</div>';
          }
        }
      } catch (e) {
        console.warn('⚠️ خطأ في البحث عن أمثلة من القصة:', e);
      }
      
      // البحث عن كلمات مرتبطة
      let relatedWords = '';
      try {
        if (sortedWords.length > 1) {
          const related: any[] = [];
          const wordType = word.type || '';
          const wordLower = word.en.toLowerCase();
          
          for (let rw = 0; rw < sortedWords.length; rw++) {
            const w = sortedWords[rw];
            if (w.en && w.en.toLowerCase() !== wordLower) {
              if (w.type === wordType) {
                related.push(w);
              }
            }
          }
          
          if (related.length > 0) {
            const limit2 = Math.min(related.length, 6);
            relatedWords += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color);">';
            relatedWords += '<div style="font-size:0.8em;color:var(--blue);margin-bottom:6px;">🔗 كلمات مرتبطة (نفس النوع):</div>';
            for (let rw2 = 0; rw2 < limit2; rw2++) {
              const w = related[rw2];
              const safeWord = this._escapeHtml(w.en);
              const safeAr = this._escapeHtml(w.ar || '');
              relatedWords += `<span style="display:inline-block;background:var(--bg-card);padding:3px 14px;border-radius:20px;margin:3px;font-size:0.8em;border:1px solid var(--border-color);cursor:pointer;" onclick="if(window.speakText) window.speakText('${safeWord}');">${safeWord} (${safeAr})</span>`;
            }
            relatedWords += '</div>';
          }
        }
      } catch (e) {}
      
      const safeEn = this._escapeHtml(word.en || '');
      const safeAr = this._escapeHtml(word.ar || '');
      const safeIpa = word.ipa ? this._escapeHtml(word.ipa) : '';
      const safeExample = word.example ? this._escapeHtml(word.example) : '';
      const safeExampleAr = word.example_ar ? this._escapeHtml(word.example_ar) : '';
      const safeType = word.type ? this._escapeHtml(word.type) : '';
      
      let html = '';
      
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:16px;">';
      html += '<div>';
      html += `<h2 style="color:var(--gold);font-size:1.5em;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">${safeEn}`;
      if (safeIpa) {
        html += `<span class="ipa-symbol" style="font-size:0.6em;direction:ltr;unicode-bidi:bidi-override;background:rgba(255,215,0,0.08);padding:4px 16px;border-radius:12px;border:1px solid rgba(255,215,0,0.15);">${safeIpa}</span>`;
      }
      html += `<button class="play-btn" data-text="${safeEn}" onclick="if(window.speakText) window.speakText('${safeEn}');" style="background:none;border:none;color:var(--gold);font-size:1.1em;cursor:pointer;padding:4px 8px;border-radius:50%;">🔊</button>`;
      html += '</h2>';
      html += `<div style="color:var(--text-secondary);font-size:1.1em;">${safeAr}</div>`;
      if (safeType) {
        html += `<span style="font-size:0.7em;padding:2px 14px;border-radius:20px;background:var(--blue-dim);color:var(--blue);border:1px solid rgba(100,200,255,0.1);display:inline-block;margin-top:4px;">${safeType}</span>`;
      }
      html += '</div>';
      html += '<button onclick="VocabularyLoader.goBackFromDetail()" class="back-btn" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);cursor:pointer;font-family:inherit;color:var(--text-secondary);transition:all 0.3s;">⬅ العودة</button>';
      html += '</div>';
      
      if (safeExample) {
        html += '<div style="background:var(--bg-card);padding:14px 18px;border-radius:8px;margin-top:8px;border:1px solid var(--border-color);">';
        html += `<div style="color:var(--text-primary);font-size:1em;">📌 ${safeExample}</div>`;
        if (safeExampleAr) {
          html += `<div style="color:var(--text-secondary);font-size:0.9em;margin-top:4px;">${safeExampleAr}</div>`;
        }
        html += `<button onclick="if(window.speakText) window.speakText('${safeExample}')" style="margin-top:6px;padding:4px 16px;border:none;border-radius:20px;background:var(--blue-dim);color:var(--blue);cursor:pointer;font-family:inherit;">🔊 استماع للمثال</button>`;
        html += '</div>';
      }
      
      html += storyExamples;
      html += relatedWords;
      
      html += '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border-color);">';
      html += `<button onclick="if(window.speakText) window.speakText('${safeEn}')" style="padding:8px 20px;border:none;border-radius:30px;background:var(--gold-dim);color:var(--gold);cursor:pointer;font-family:inherit;">🔊 نطق الكلمة</button>`;
      if (safeExample) {
        html += `<button onclick="if(window.speakText) window.speakText('${safeExample}')" style="padding:8px 20px;border:none;border-radius:30px;background:var(--blue-dim);color:var(--blue);cursor:pointer;font-family:inherit;">🔊 نطق المثال</button>`;
      }
      if ((window as any).StoryLoader) {
        html += '<button onclick="if(window.StoryLoader) { window.StoryLoader.currentView=\'main\'; window.StoryLoader.render(document.getElementById(\'contentArea\')); }" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-family:inherit;">📖 العودة للقصة</button>';
      }
      html += '<button onclick="VocabularyLoader.goBackFromDetail()" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-family:inherit;">📝 العودة للمفردات</button>';
      html += '</div>';
      
      container.innerHTML = html;
      
      if (typeof window.bindAudioButtons === 'function') {
        setTimeout(function() {
          window.bindAudioButtons(container);
        }, 100);
      }
      
      if (typeof window.updateBreadcrumb === 'function') {
        window.updateBreadcrumb(safeEn);
      }
      
    } catch (e) {
      console.error('❌ خطأ في showDetail:', e);
      if (typeof window.showToast === 'function') window.showToast('⚠️ حدث خطأ في عرض التفاصيل');
    }
  },

  goBackFromDetail: function(): void {
    try {
      console.log('🔙 العودة من تفاصيل الكلمة');
      this.currentView = 'main';
      const container = document.getElementById('contentArea') as HTMLElement;
      if (container) this.render(container);
      if (typeof window.scrollToTop === 'function') window.scrollToTop();
      if (typeof window.updateBreadcrumb === 'function') {
        window.updateBreadcrumb(null);
      }
    } catch (e) {
      console.error('❌ خطأ في goBackFromDetail:', e);
      try {
        if (typeof window.goBackToMain === 'function') window.goBackToMain();
      } catch (e2) {}
    }
  },

  getTotalWords: function(): number {
    try {
      if (!this.data || !this.data.sections) return 0;
      let count = 0;
      const seen: Record<string, boolean> = {};
      for (const key in this.data.sections) {
        const section = this.data.sections[key];
        if (section && Array.isArray(section.items)) {
          for (let i = 0; i < section.items.length; i++) {
            const item = section.items[i];
            if (item.words) {
              for (let w = 0; w < item.words.length; w++) {
                const word = item.words[w];
                if (word.en && !seen[word.en.toLowerCase()]) {
                  seen[word.en.toLowerCase()] = true;
                  count++;
                }
              }
            }
          }
        }
      }
      return count;
    } catch (e) {
      console.error('❌ خطأ في getTotalWords:', e);
      return 0;
    }
  },
  
  search: function(query: string): void {
    try {
      this.searchQuery = query || '';
      const container = document.getElementById('contentArea') as HTMLElement;
      if (container) this.render(container);
    } catch (e) {
      console.error('❌ خطأ في البحث:', e);
    }
  }
};

console.log('✅ vocabulary-loader.tsx (مصحح بالكامل مع تعبئة المفردات) تم تحميله');

export default VocabularyLoader;
