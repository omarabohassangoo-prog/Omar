// ============================================================
// story-loader.tsx - تحميل وعرض القصة (مصحح بالكامل مع دعم IPA)
// ============================================================

import type { StoryData, StoryChapter, StoryContentItem } from '../types';

interface StoryLoaderType {
  data: StoryData | null;
  currentChapter: number;
  currentView: 'main' | 'detail';
  _loaded: boolean;
  searchQuery: string;
  load(): Promise<boolean>;
  _convertFromCompleteData(data: any): StoryData;
  generateFallbackData(): StoryData;
  render(container: HTMLElement): void;
  _escapeHtml(text: string): string;
  bindEvents(container: HTMLElement): void;
  showSentenceDetail(idx: number): void;
  goBackFromDetail(): void;
  goToChapter(index: number): void;
  getTotalChapters(): number;
  search(query: string): void;
}

const StoryLoader: StoryLoaderType = {
  data: null,
  currentChapter: 0,
  currentView: 'main',
  _loaded: false,
  searchQuery: '',

  load: function(): Promise<boolean> {
    const self = this;
    if (this._loaded && this.data) return Promise.resolve(true);
    
    return fetch('/story_data.json')
      .then(function(response: Response) {
        if (!response.ok) throw new Error('فشل تحميل story_data.json');
        return response.json();
      })
      .then(function(data: any) {
        self.data = data;
        self._loaded = true;
        console.log('✅ StoryLoader: تم تحميل البيانات من story_data.json');
        return true;
      })
      .catch(function(error: Error) {
        console.error('❌ StoryLoader:', error);
        return fetch('/complete_data.json')
          .then(function(response: Response) {
            if (!response.ok) throw new Error('فشل تحميل complete_data.json');
            return response.json();
          })
          .then(function(data: any) {
            self.data = self._convertFromCompleteData(data);
            self._loaded = true;
            console.log('✅ StoryLoader: تم تحميل البيانات من complete_data.json');
            return true;
          })
          .catch(function(err: Error) {
            console.error('❌ StoryLoader: فشل تحميل جميع المصادر:', err);
            self.data = self.generateFallbackData();
            self._loaded = true;
            return true;
          });
      });
  },

  _convertFromCompleteData: function(data: any): StoryData {
    const chapters: StoryChapter[] = [];
    const words = data.words || [];
    
    const storyWords = words.filter(function(w: any) {
      return w.source && w.source.indexOf('story') !== -1;
    });
    
    const chapterSize = 15;
    const totalChapters = Math.ceil(storyWords.length / chapterSize);
    
    for (let i = 0; i < totalChapters; i++) {
      const start = i * chapterSize;
      const end = Math.min(start + chapterSize, storyWords.length);
      const chapterWords = storyWords.slice(start, end);
      
      const content: StoryContentItem[] = chapterWords.map(function(w: any) {
        return {
          sentence: w.example || `${w.word} is an important word.`,
          translation: w.example_ar || w.ar,
          grammar_rules: []
        };
      });
      
      chapters.push({
        number: i + 1,
        title: `الفصل ${i + 1}: ${chapterWords[0] ? chapterWords[0].word : ''}`,
        title_ar: `الفصل ${i + 1}`,
        content: content
      });
    }
    
    return {
      title: 'قصة تعلم الإنجليزية',
      title_ar: 'قصة تعلم الإنجليزية',
      total_chapters: chapters.length,
      chapters: chapters
    };
  },

  generateFallbackData: function(): StoryData {
    return {
      title: 'قصة تعلم الإنجليزية',
      title_ar: 'قصة تعلم الإنجليزية',
      total_chapters: 3,
      chapters: [
        { 
          number: 1, 
          title: 'My Morning Routine', 
          title_ar: 'روتيني الصباحي', 
          content: [
            { sentence: 'I wake up at 6 AM every day.', translation: 'أستيقظ الساعة 6 صباحاً كل يوم.', grammar_rules: [1] },
            { sentence: 'The first thing I do is drink a glass of water.', translation: 'أول شيء أفعله هو شرب كوب من الماء.', grammar_rules: [1] }
          ] 
        },
        { 
          number: 2, 
          title: 'My Job', 
          title_ar: 'وظيفتي', 
          content: [
            { sentence: 'I work as a teacher in a school near my house.', translation: 'أعمل كمعلم في مدرسة قريبة من منزلي.', grammar_rules: [1] }
          ] 
        },
        { 
          number: 3, 
          title: 'My Family', 
          title_ar: 'عائلتي', 
          content: [
            { sentence: 'My mother is the most wonderful person I know.', translation: 'أمي هي أكثر شخص رائع أعرفه.', grammar_rules: [1] }
          ] 
        }
      ]
    };
  },

  render: function(container: HTMLElement): void {
    try {
      if (!container) return;
      if (!this.data || !this.data.chapters) {
        container.innerHTML = '<p style="color:var(--text-muted);">⚠️ بيانات القصة غير متوفرة</p>';
        return;
      }
      
      const ch = this.data.chapters[this.currentChapter];
      if (!ch) {
        container.innerHTML = '<p style="color:var(--text-muted);">⚠️ الفصل غير موجود</p>';
        return;
      }
      
      if (this.currentView === 'detail') return;
      
      let html = '';
      
      // شريط التنقل
      html += '<div class="nav-controls">';
      html += '<div class="title-area">';
      html += `<h2>${this._escapeHtml(String(ch.number))}. ${this._escapeHtml(ch.title)} <span class="chapter-progress">${this.currentChapter + 1} / ${this.data.chapters.length}</span></h2>`;
      html += `<div class="sub">${this._escapeHtml(ch.title_ar)} · ${ch.content.length} جملة</div>`;
      html += '</div>';
      html += '<div class="nav-btns">';
      html += `<button id="prevChapter"${this.currentChapter === 0 ? ' disabled' : ''}>⬅ السابق</button>`;
      html += `<span class="page-indicator">${this.currentChapter + 1}</span>`;
      html += `<button id="nextChapter"${this.currentChapter === this.data.chapters.length - 1 ? ' disabled' : ''}>التالي ➡</button>`;
      html += '</div></div>';
      
      // البحث ونطق الفصل كاملاً
      let allSentences = '';
      for (let i = 0; i < ch.content.length; i++) {
        allSentences += ch.content[i].sentence + '. ';
      }
      
      html += '<div class="search-wrapper">';
      html += `<input class="search-box" id="storySearch" placeholder="🔍 ابحث في القصة..." value="${this._escapeHtml(this.searchQuery)}" />`;
      html += '<span class="result-count" id="storyResultCount"></span>';
      html += `<button class="play-btn" data-text="${this._escapeHtml(allSentences)}" onclick="if(window.speakText) window.speakText('${this._escapeHtml(allSentences)}');" style="background:none;border:none;color:var(--gold);font-size:1em;cursor:pointer;padding:6px 16px;border-radius:30px;border:1px solid var(--border-color);">🔊 الفصل كاملاً</button>`;
      html += '</div>';
      
      // عرض الجمل
      html += '<div id="storyContent">';
      
      for (let j = 0; j < ch.content.length; j++) {
        const item = ch.content[j];
        const searchText = (item.sentence || '') + ' ' + (item.translation || '');
        
        // بناء علامات القواعد
        let tags = '';
        if (item.grammar_rules && item.grammar_rules.length > 0) {
          tags += '<div class="tags">';
          for (let k = 0; k < item.grammar_rules.length; k++) {
            const ruleId = item.grammar_rules[k];
            try {
              const grammarLoader = (window as any).GrammarLoader;
              const rule = grammarLoader && grammarLoader.data ? 
                grammarLoader.data.grammar_rules.find(function(r: any) { return r.id === ruleId; }) : null;
              if (rule) {
                const ruleName = rule.rule.split('(')[0].trim();
                tags += `<span onclick="event.stopPropagation(); if(window.GrammarLoader) { window.GrammarLoader.currentView='main'; window.GrammarLoader.showDetail(${ruleId}); }" style="cursor:pointer;">${this._escapeHtml(ruleName)}</span>`;
              }
            } catch (e) {}
          }
          tags += '</div>';
        }
        
        const safeSentence = this._escapeHtml(item.sentence);
        const safeTranslation = this._escapeHtml(item.translation);
        
        html += `<div class="story-sentence clickable" data-index="${j}" data-search="${this._escapeHtml(searchText.toLowerCase())}" onclick="StoryLoader.showSentenceDetail(${j})" style="background:var(--bg-card);border-radius:var(--radius-sm);padding:12px 18px;margin-bottom:8px;border-right:3px solid var(--gold-dim);transition:all 0.3s;cursor:pointer;">`;
        
        html += '<div class="en" style="font-size:1em;color:var(--text-primary);display:flex;justify-content:space-between;align-items:center;gap:10px;line-height:1.5;">';
        html += `<span><span class="sentence-number" style="font-size:0.65em;color:var(--text-muted);opacity:0.4;margin-left:6px;">#${j + 1}</span> ${safeSentence}</span>`;
        html += `<button class="play-btn" data-text="${safeSentence}" onclick="event.stopPropagation(); if(window.speakText) window.speakText('${safeSentence}');" style="background:none;border:none;color:var(--gold);font-size:1em;cursor:pointer;padding:4px 8px;border-radius:50%;transition:all 0.3s;">🔊</button>`;
        html += '</div>';
        
        html += `<div class="ar" style="color:var(--text-secondary);font-size:0.88em;margin-top:3px;line-height:1.4;">${safeTranslation}</div>`;
        html += tags;
        html += '<div class="click-hint" style="font-size:0.6em;color:var(--text-muted);opacity:0.4;margin-top:4px;">👆 اضغط لرؤية القواعد</div>';
        html += '</div>';
      }
      
      html += '</div>';
      container.innerHTML = html;
      this.bindEvents(container);
      
    } catch (e) {
      console.error('❌ خطأ في render:', e);
      if (container) container.innerHTML = '<p style="color:var(--text-muted);">⚠️ حدث خطأ في عرض القصة</p>';
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
      
      const prevBtn = container.querySelector('#prevChapter') as HTMLButtonElement;
      const nextBtn = container.querySelector('#nextChapter') as HTMLButtonElement;
      
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          try {
            if (self.currentChapter > 0) {
              self.currentChapter--;
              self.currentView = 'main';
              self.render(container);
              if (typeof window.scrollToTop === 'function') window.scrollToTop();
            }
          } catch (e) {
            console.error('❌ خطأ في prevChapter:', e);
          }
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          try {
            if (self.data && self.currentChapter < self.data.chapters.length - 1) {
              self.currentChapter++;
              self.currentView = 'main';
              self.render(container);
              if (typeof window.scrollToTop === 'function') window.scrollToTop();
            }
          } catch (e) {
            console.error('❌ خطأ في nextChapter:', e);
          }
        });
      }
      
      const searchBox = container.querySelector('#storySearch') as HTMLInputElement;
      if (searchBox) {
        let searchTimeout: number;
        searchBox.addEventListener('input', function() {
          clearTimeout(searchTimeout);
          searchTimeout = window.setTimeout(function() {
            try {
              self.searchQuery = searchBox.value;
              const q = searchBox.value.toLowerCase().trim();
              const cards = container.querySelectorAll<HTMLElement>('#storyContent .story-sentence');
              let visible = 0;
              
              for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const text = (card.dataset.search || '').toLowerCase();
                const match = !q || text.indexOf(q) !== -1;
                card.style.display = match ? 'block' : 'none';
                if (match) visible++;
              }
              
              const resultEl = container.querySelector('#storyResultCount');
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

  showSentenceDetail: function(idx: number): void {
    try {
      if (!this.data || !this.data.chapters) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ بيانات القصة غير متوفرة');
        return;
      }
      
      const ch = this.data.chapters[this.currentChapter];
      if (!ch || !ch.content) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ الفصل غير موجود');
        return;
      }
      
      const item = ch.content[idx];
      if (!item) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ الجملة غير موجودة');
        return;
      }
      
      const rules: any[] = [];
      if (item.grammar_rules && item.grammar_rules.length > 0) {
        for (let i = 0; i < item.grammar_rules.length; i++) {
          const ruleId = item.grammar_rules[i];
          try {
            const grammarLoader = (window as any).GrammarLoader;
            const rule = grammarLoader && grammarLoader.data ? 
              grammarLoader.data.grammar_rules.find(function(r: any) { return r.id === ruleId; }) : null;
            if (rule) rules.push(rule);
          } catch (e) {}
        }
      }
      
      this.currentView = 'detail';
      const container = document.getElementById('contentArea') as HTMLElement;
      if (!container) return;
      
      const safeSentence = this._escapeHtml(item.sentence);
      const safeTranslation = this._escapeHtml(item.translation);
      
      let html = '';
      
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:16px;">';
      html += '<div>';
      html += `<h2 style="color:var(--gold);font-size:1.2em;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">📖 الجملة #${idx + 1}`;
      html += `<button class="play-btn" data-text="${safeSentence}" onclick="if(window.speakText) window.speakText('${safeSentence}');" style="background:none;border:none;color:var(--gold);font-size:1em;cursor:pointer;padding:2px 8px;border-radius:50%;">🔊</button>`;
      html += '</h2>';
      html += `<div style="color:var(--text-primary);font-size:1.05em;margin-top:4px;">${safeSentence}</div>`;
      html += `<div style="color:var(--text-secondary);font-size:0.92em;">${safeTranslation}</div>`;
      html += '</div>';
      html += '<button onclick="StoryLoader.goBackFromDetail()" class="back-btn" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);cursor:pointer;font-family:inherit;color:var(--text-secondary);transition:all 0.3s;">⬅ العودة</button>';
      html += '</div>';
      
      if (rules.length > 0) {
        html += '<div style="margin-top:12px;">';
        html += `<div style="color:var(--gold);font-size:0.95em;margin-bottom:8px;">📚 القواعد المستخدمة (${rules.length})</div>`;
        
        for (let r = 0; r < rules.length; r++) {
          const rule = rules[r];
          const safeRule = this._escapeHtml(rule.rule);
          const safeDesc = this._escapeHtml(rule.description || '');
          const safeExample = rule.examples && rule.examples[0] ? this._escapeHtml(rule.examples[0].sentence) : '';
          
          html += `<div style="background:var(--bg-card);padding:10px 14px;border-radius:8px;margin-bottom:6px;border-right:3px solid var(--blue);cursor:pointer;" onclick="event.stopPropagation(); if(window.GrammarLoader && typeof window.GrammarLoader.showDetail === 'function') { window.GrammarLoader.currentView='detail'; window.GrammarLoader.showDetail(${rule.id}); }">`;
          html += `<div style="color:var(--blue);font-weight:600;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">${safeRule}`;
          html += `<button onclick="event.stopPropagation(); if(window.speakText) window.speakText('${safeRule}');" style="background:none;border:none;color:var(--gold);font-size:0.8em;cursor:pointer;padding:2px 6px;">🔊</button>`;
          html += '</div>';
          html += `<div style="color:var(--text-secondary);font-size:0.82em;">${safeDesc}</div>`;
          if (safeExample) {
            html += `<div style="color:var(--text-muted);font-size:0.75em;margin-top:2px;">💡 ${safeExample}</div>`;
          }
          html += '</div>';
        }
        html += '</div>';
      } else {
        html += '<div style="margin-top:12px;padding:10px 14px;background:rgba(255,215,0,0.05);border-radius:8px;border:1px solid rgba(255,215,0,0.1);">';
        html += '<div style="color:var(--text-muted);font-size:0.85em;">💡 لا توجد قواعد محددة لهذه الجملة</div>';
        html += '</div>';
      }
      
      // البحث عن كلمات من المفردات
      let vocabWords = '';
      try {
        const vocabularyLoader = (window as any).VocabularyLoader;
        if (vocabularyLoader && vocabularyLoader.data) {
          let allWords: any[] = [];
          const sentenceLower = item.sentence.toLowerCase();
          
          if (vocabularyLoader.data.words) {
            allWords = vocabularyLoader.data.words;
          } else if (vocabularyLoader.data.sections) {
            const sections = vocabularyLoader.data.sections;
            for (const key in sections) {
              const section = sections[key];
              if (section && section.items) {
                for (let si = 0; si < section.items.length; si++) {
                  const subItems = section.items[si];
                  if (subItems.words) {
                    allWords = allWords.concat(subItems.words);
                  }
                }
              }
            }
          }
          
          const words: any[] = [];
          for (let w = 0; w < allWords.length; w++) {
            const word = allWords[w];
            if (word.en && sentenceLower.indexOf(word.en.toLowerCase()) !== -1) {
              words.push(word);
            }
          }
          
          if (words.length > 0) {
            vocabWords += '<div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--border-color);">';
            vocabWords += '<div style="font-size:0.8em;color:var(--blue);margin-bottom:6px;">📝 كلمات من المفردات في هذه الجملة:</div>';
            const limit = Math.min(words.length, 8);
            for (let v = 0; v < limit; v++) {
              const w = words[v];
              const safeWord = this._escapeHtml(w.en);
              const safeAr = this._escapeHtml(w.ar || '');
              const safeIpa = w.ipa ? this._escapeHtml(w.ipa) : '';
              
              vocabWords += `<span style="display:inline-block;background:var(--bg-card);padding:3px 14px;border-radius:20px;margin:3px;font-size:0.8em;border:1px solid var(--border-color);cursor:pointer;" onclick="if(window.speakText) window.speakText('${safeWord}');">`;
              vocabWords += safeWord;
              if (safeIpa) {
                vocabWords += ` <span class="ipa-symbol" style="font-size:0.7em;direction:ltr;unicode-bidi:bidi-override;background:rgba(255,215,0,0.05);padding:0px 8px;border-radius:4px;">${safeIpa}</span>`;
              }
              if (safeAr) {
                vocabWords += ` (${safeAr})`;
              }
              vocabWords += '</span>';
            }
            vocabWords += '</div>';
          }
        }
      } catch (e) {
        console.warn('⚠️ خطأ في البحث عن كلمات من المفردات:', e);
      }
      
      html += vocabWords;
      
      html += '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border-color);">';
      html += `<button onclick="if(window.speakText) window.speakText('${safeSentence}')" style="padding:8px 20px;border:none;border-radius:30px;background:var(--gold-dim);color:var(--gold);cursor:pointer;font-family:inherit;">🔊 استماع للجملة</button>`;
      if (rules.length > 0) {
        html += `<button onclick="if(window.GrammarLoader) { window.GrammarLoader.currentView='main'; window.GrammarLoader.render(document.getElementById('contentArea')); }" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-family:inherit;">📚 عرض القواعد</button>`;
      }
      html += '<button onclick="StoryLoader.goBackFromDetail()" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-family:inherit;">📖 العودة للقصة</button>';
      html += '</div>';
      
      container.innerHTML = html;
      
      if (typeof window.bindAudioButtons === 'function') {
        setTimeout(function() {
          window.bindAudioButtons(container);
        }, 100);
      }
      
      if (typeof window.updateBreadcrumb === 'function') {
        window.updateBreadcrumb(`جملة #${idx + 1}`);
      }
      
    } catch (e) {
      console.error('❌ خطأ في showSentenceDetail:', e);
      if (typeof window.showToast === 'function') window.showToast('⚠️ حدث خطأ في عرض التفاصيل');
    }
  },

  goBackFromDetail: function(): void {
    try {
      console.log('🔙 العودة من تفاصيل الجملة');
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

  goToChapter: function(index: number): void {
    try {
      if (this.data && this.data.chapters && index >= 0 && index < this.data.chapters.length) {
        this.currentChapter = index;
        this.currentView = 'main';
        const container = document.getElementById('contentArea') as HTMLElement;
        if (container) this.render(container);
        if (typeof window.scrollToTop === 'function') window.scrollToTop();
        if (typeof window.updateBreadcrumb === 'function') {
          window.updateBreadcrumb(null);
        }
      }
    } catch (e) {
      console.error('❌ خطأ في goToChapter:', e);
    }
  },

  getTotalChapters: function(): number {
    try {
      return this.data && this.data.chapters ? this.data.chapters.length : 0;
    } catch (e) {
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

console.log('✅ story-loader.tsx (مصحح بالكامل مع دعم IPA) تم تحميله');

export default StoryLoader;
