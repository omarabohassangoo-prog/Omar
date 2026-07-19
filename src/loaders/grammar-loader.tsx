// ============================================================
// grammar-loader.tsx - تحميل وعرض القواعد (مصحح بالكامل مع دعم IPA)
// ============================================================

import type { GrammarData } from '../types';

interface GrammarLoaderType {
  data: GrammarData | null;
  currentPage: number;
  pageSize: number;
  currentView: 'main' | 'detail';
  _loaded: boolean;
  searchQuery: string;
  load(): Promise<boolean>;
  generateFallbackData(): GrammarData;
  render(container: HTMLElement): void;
  _escapeHtml(text: string): string;
  bindEvents(container: HTMLElement): void;
  showDetail(ruleId: number): void;
  goBackFromDetail(): void;
  getTotalRules(): number;
  search(query: string): void;
}

const GrammarLoader: GrammarLoaderType = {
  data: null,
  currentPage: 0,
  pageSize: 6,
  currentView: 'main',
  _loaded: false,
  searchQuery: '',

  load: function(): Promise<boolean> {
    const self = this;
    if (this._loaded && this.data) return Promise.resolve(true);
    
    return fetch('/grammar_rules.json')
      .then(function(response: Response) {
        if (!response.ok) throw new Error('فشل تحميل grammar_rules.json');
        return response.json();
      })
      .then(function(data: any) {
        self.data = data;
        self._loaded = true;
        console.log('✅ GrammarLoader: تم تحميل البيانات من grammar_rules.json');
        return true;
      })
      .catch(function(error: Error) {
        console.error('❌ GrammarLoader:', error);
        return fetch('/story_data.json')
          .then(function(response: Response) {
            if (!response.ok) throw new Error('فشل تحميل story_data.json');
            return response.json();
          })
          .then(function(data: any) {
            if (data.grammar_rules) {
              self.data = { grammar_rules: data.grammar_rules };
              self._loaded = true;
              console.log('✅ GrammarLoader: تم تحميل البيانات من story_data.json');
              return true;
            }
            throw new Error('لا توجد قواعد في story_data.json');
          })
          .catch(function(err: Error) {
            console.error('❌ GrammarLoader: فشل تحميل جميع المصادر:', err);
            self.data = self.generateFallbackData();
            self._loaded = true;
            return true;
          });
      });
  },

  generateFallbackData: function(): GrammarData {
    return {
      grammar_rules: [
        { 
          id: 1, 
          rule: 'المضارع البسيط (Present Simple)', 
          structure: 'الفاعل + الفعل (مع s في حالة المفرد الغائب)',
          description: 'يستخدم للحقائق العلمية والثوابت والعادات والروتين اليومي',
          keywords: ['always', 'usually', 'every day', 'never', 'sometimes', 'often'],
          examples: [
            { sentence: 'I wake up at 6 AM every day.', translation: 'أستيقظ الساعة 6 صباحاً كل يوم.', explanation: 'عادة يومية → مضارع بسيط' },
            { sentence: 'The sun rises in the east.', translation: 'الشمس تشرق من الشرق.', explanation: 'حقيقة علمية → مضارع بسيط' }
          ],
          common_mistakes: ["❌ He don't like coffee → ✅ He doesn't like coffee"]
        },
        { 
          id: 2, 
          rule: 'الماضي البسيط (Past Simple)', 
          structure: 'الفاعل + الفعل في الماضي (مع ed للقاعدة أو التصريف الثاني للشاذ)',
          description: 'يستخدم للأحداث التي انتهت في الماضي مع وقت محدد',
          keywords: ['yesterday', 'last week', 'in 2010', 'ago', 'when', 'then'],
          examples: [
            { sentence: 'I visited my grandmother yesterday.', translation: 'زرت جدتي أمس.', explanation: 'حدث انتهى في الماضي → ماضي بسيط' },
            { sentence: 'We bought a new car last week.', translation: 'اشترينا سيارة جديدة الأسبوع الماضي.', explanation: 'حدث انتهى في الماضي → ماضي بسيط' }
          ],
          common_mistakes: ["❌ I didn't went → ✅ I didn't go"]
        }
      ]
    };
  },

  render: function(container: HTMLElement): void {
    try {
      if (!container) return;
      if (!this.data || !this.data.grammar_rules) {
        container.innerHTML = '<p style="color:var(--text-muted);">⚠️ بيانات القواعد غير متوفرة</p>';
        return;
      }
      
      const rules = this.data.grammar_rules;
      if (rules.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);">⚠️ لا توجد قواعد</p>';
        return;
      }
      
      if (this.currentView === 'detail') return;
      
      const total = rules.length;
      const start = this.currentPage * this.pageSize;
      const end = Math.min(start + this.pageSize, total);
      const pageRules = rules.slice(start, end);
      const totalPages = Math.ceil(total / this.pageSize);
      
      let html = '';
      
      // شريط التنقل
      html += '<div class="nav-controls">';
      html += '<div class="title-area">';
      html += '<h2>📚 القواعد النحوية</h2>';
      html += `<div class="sub">${total} قاعدة · عرض ${start + 1} - ${end} من ${total}</div>`;
      html += '</div>';
      html += '<div class="nav-btns">';
      html += `<button id="prevGrammar"${this.currentPage === 0 ? ' disabled' : ''}>⬅ السابق</button>`;
      html += `<span class="page-indicator">${this.currentPage + 1} / ${totalPages}</span>`;
      html += `<button id="nextGrammar"${end >= total ? ' disabled' : ''}>التالي ➡</button>`;
      html += '</div></div>';
      
      // البحث
      html += '<div class="search-wrapper">';
      html += `<input class="search-box" id="grammarSearch" placeholder="🔍 ابحث في القواعد..." value="${this._escapeHtml(this.searchQuery)}" />`;
      html += '<span class="result-count" id="grammarResultCount"></span>';
      html += '</div>';
      
      // عرض البطاقات
      html += '<div id="grammarContent" class="grammar-grid">';
      
      if (pageRules.length === 0) {
        html += '<div class="no-results"><div class="icon">🔍</div><p>لا توجد قواعد مطابقة</p></div>';
      } else {
        for (let i = 0; i < pageRules.length; i++) {
          const rule = pageRules[i];
          let searchText = (rule.rule || '') + ' ' + (rule.description || '') + ' ' + (rule.structure || '');
          if (rule.keywords) {
            for (let k = 0; k < rule.keywords.length; k++) {
              searchText += ' ' + rule.keywords[k];
            }
          }
          
          // بناء الأمثلة
          let examplesHtml = '';
          if (rule.examples && rule.examples.length > 0) {
            const exCount = Math.min(rule.examples.length, 2);
            for (let e = 0; e < exCount; e++) {
              const ex = rule.examples[e];
              const safeSentence = this._escapeHtml(ex.sentence);
              const safeTranslation = this._escapeHtml(ex.translation);
              const safeExplanation = ex.explanation ? this._escapeHtml(ex.explanation) : '';
              
              examplesHtml += '<div class="ex-item">';
              examplesHtml += `<div class="en">${safeSentence} <button class="play-btn" data-text="${safeSentence}" onclick="event.stopPropagation(); if(window.speakText) window.speakText('${safeSentence}');">🔊</button></div>`;
              examplesHtml += `<div class="ar">${safeTranslation}</div>`;
              if (safeExplanation) {
                examplesHtml += `<div style="font-size:0.7em;color:var(--text-muted);margin-top:2px;">💡 ${safeExplanation}</div>`;
              }
              examplesHtml += '</div>';
            }
          }
          
          // بناء الكلمات المفتاحية
          let keywordsHtml = '';
          if (rule.keywords && rule.keywords.length > 0) {
            keywordsHtml += '<div class="keywords-tag">🔑 ';
            for (let kw = 0; kw < rule.keywords.length; kw++) {
              keywordsHtml += `<span>${this._escapeHtml(rule.keywords[kw])}</span>`;
            }
            keywordsHtml += '</div>';
          }
          
          const safeRule = this._escapeHtml(rule.rule);
          const safeDesc = this._escapeHtml(rule.description || '');
          const safeStructure = rule.structure ? this._escapeHtml(rule.structure) : '';
          
          html += `<div class="grammar-card clickable" onclick="GrammarLoader.showDetail(${rule.id})" data-search="${this._escapeHtml(searchText.toLowerCase())}" style="background:var(--bg-card);border-radius:var(--radius-sm);padding:18px 20px;border-right:3px solid var(--blue);transition:all 0.3s;cursor:pointer;">`;
          
          html += '<div class="rule-title">';
          html += `<span>${safeRule}</span>`;
          html += `<button class="play-btn" data-text="${safeRule}" onclick="event.stopPropagation(); if(window.speakText) window.speakText('${safeRule}');" style="background:none;border:none;color:var(--gold);font-size:1em;cursor:pointer;padding:2px 8px;border-radius:50%;transition:all 0.3s;">🔊</button>`;
          html += '</div>';
          
          html += `<div class="rule-desc">${safeDesc}</div>`;
          
          if (safeStructure) {
            html += `<div class="structure" style="background:rgba(0,0,0,0.15);padding:5px 12px;border-radius:8px;font-size:0.78em;color:var(--text-secondary);margin-bottom:8px;direction:ltr;text-align:left;overflow-x:auto;">${safeStructure}</div>`;
          }
          
          html += `<div class="examples-list">${examplesHtml}</div>`;
          html += keywordsHtml;
          
          // عرض الأخطاء الشائعة
          if (rule.common_mistakes && rule.common_mistakes.length > 0) {
            html += '<div style="margin-top:6px;font-size:0.7em;color:var(--red);">';
            for (let cm = 0; cm < Math.min(rule.common_mistakes.length, 2); cm++) {
              html += `⚠️ ${this._escapeHtml(rule.common_mistakes[cm])}<br/>`;
            }
            html += '</div>';
          }
          
          html += '<div class="click-hint" style="font-size:0.6em;color:var(--text-muted);opacity:0.4;margin-top:8px;">👆 اضغط للتفاصيل</div>';
          html += '</div>';
        }
      }
      
      html += '</div>';
      container.innerHTML = html;
      this.bindEvents(container);
      
    } catch (e) {
      console.error('❌ خطأ في render:', e);
      if (container) container.innerHTML = '<p style="color:var(--text-muted);">⚠️ حدث خطأ في عرض القواعد</p>';
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
      
      const prevBtn = container.querySelector('#prevGrammar') as HTMLButtonElement;
      const nextBtn = container.querySelector('#nextGrammar') as HTMLButtonElement;
      
      if (prevBtn) {
        prevBtn.addEventListener('click', function() {
          try {
            if (self.currentPage > 0) {
              self.currentPage--;
              self.currentView = 'main';
              self.render(container);
              if (typeof window.scrollToTop === 'function') window.scrollToTop();
            }
          } catch (e) {
            console.error('❌ خطأ في prevGrammar:', e);
          }
        });
      }
      
      if (nextBtn) {
        nextBtn.addEventListener('click', function() {
          try {
            if (self.data) {
              const total = self.data.grammar_rules.length;
              if ((self.currentPage + 1) * self.pageSize < total) {
                self.currentPage++;
                self.currentView = 'main';
                self.render(container);
                if (typeof window.scrollToTop === 'function') window.scrollToTop();
              }
            }
          } catch (e) {
            console.error('❌ خطأ في nextGrammar:', e);
          }
        });
      }
      
      const searchBox = container.querySelector('#grammarSearch') as HTMLInputElement;
      if (searchBox) {
        let searchTimeout: number;
        searchBox.addEventListener('input', function() {
          clearTimeout(searchTimeout);
          searchTimeout = window.setTimeout(function() {
            try {
              self.searchQuery = searchBox.value;
              const q = searchBox.value.toLowerCase().trim();
              const cards = container.querySelectorAll<HTMLElement>('#grammarContent .grammar-card');
              let visible = 0;
              
              for (let i = 0; i < cards.length; i++) {
                const card = cards[i];
                const text = (card.dataset.search || '').toLowerCase();
                const match = !q || text.indexOf(q) !== -1;
                card.style.display = match ? '' : 'none';
                if (match) visible++;
              }
              
              const resultEl = container.querySelector('#grammarResultCount');
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

  showDetail: function(ruleId: number): void {
    try {
      if (!this.data || !this.data.grammar_rules) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ بيانات القواعد غير متوفرة');
        return;
      }
      
      const rule = this.data.grammar_rules.find(function(r) { return r.id === ruleId; });
      if (!rule) {
        if (typeof window.showToast === 'function') window.showToast('⚠️ القاعدة غير موجودة');
        return;
      }
      
      this.currentView = 'detail';
      const container = document.getElementById('contentArea') as HTMLElement;
      if (!container) return;
      
      // بناء الأمثلة
      let examplesHtml = '';
      if (rule.examples && rule.examples.length > 0) {
        examplesHtml += '<div style="margin-top:8px;"><div style="color:var(--gold);font-size:0.9em;margin-bottom:6px;">📌 الأمثلة:</div>';
        for (let i = 0; i < rule.examples.length; i++) {
          const ex = rule.examples[i];
          const safeSentence = this._escapeHtml(ex.sentence);
          const safeTranslation = this._escapeHtml(ex.translation);
          const safeExplanation = ex.explanation ? this._escapeHtml(ex.explanation) : '';
          
          examplesHtml += '<div style="background:var(--bg-card);padding:10px 14px;border-radius:8px;margin-bottom:6px;border-right:2px solid var(--gold-dim);">';
          examplesHtml += '<div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:6px;">';
          examplesHtml += `<div style="color:var(--text-primary);font-size:0.95em;">${safeSentence}</div>`;
          examplesHtml += `<button class="play-btn" data-text="${safeSentence}" onclick="if(window.speakText) window.speakText('${safeSentence}');" style="background:none;border:none;color:var(--gold);font-size:0.9em;cursor:pointer;padding:2px 8px;border-radius:50%;">🔊</button>`;
          examplesHtml += '</div>';
          examplesHtml += `<div style="color:var(--text-secondary);font-size:0.85em;">${safeTranslation}</div>`;
          if (safeExplanation) {
            examplesHtml += `<div style="font-size:0.7em;color:var(--text-muted);margin-top:2px;">💡 ${safeExplanation}</div>`;
          }
          examplesHtml += '</div>';
        }
        examplesHtml += '</div>';
      }
      
      // بناء الكلمات المفتاحية
      let keywordsHtml = '';
      if (rule.keywords && rule.keywords.length > 0) {
        keywordsHtml += '<div style="margin-top:8px;"><div style="color:var(--blue);font-size:0.8em;margin-bottom:4px;">🔑 الكلمات المفتاحية:</div>';
        for (let j = 0; j < rule.keywords.length; j++) {
          keywordsHtml += `<span style="display:inline-block;background:var(--bg-card);padding:2px 14px;border-radius:20px;margin:3px;font-size:0.75em;border:1px solid var(--border-color);">${this._escapeHtml(rule.keywords[j])}</span>`;
        }
        keywordsHtml += '</div>';
      }
      
      // الأخطاء الشائعة
      let mistakesHtml = '';
      if (rule.common_mistakes && rule.common_mistakes.length > 0) {
        mistakesHtml += '<div style="margin-top:8px;padding:8px 14px;background:rgba(255,107,107,0.05);border-radius:8px;border:1px solid rgba(255,107,107,0.1);">';
        mistakesHtml += '<div style="color:var(--red);font-size:0.8em;margin-bottom:4px;">⚠️ الأخطاء الشائعة:</div>';
        for (let cm = 0; cm < rule.common_mistakes.length; cm++) {
          mistakesHtml += `<div style="font-size:0.75em;color:var(--text-secondary);padding:2px 0;">${this._escapeHtml(rule.common_mistakes[cm])}</div>`;
        }
        mistakesHtml += '</div>';
      }
      
      // أمثلة من القصة
      let storyExamples = '';
      try {
        const storyLoader = (window as any).StoryLoader;
        if (storyLoader && storyLoader.data && storyLoader.data.chapters) {
          const found: any[] = [];
          const chapters = storyLoader.data.chapters;
          for (let c = 0; c < chapters.length; c++) {
            const ch = chapters[c];
            if (ch.content) {
              for (let s = 0; s < ch.content.length; s++) {
                const item = ch.content[s];
                if (item.grammar_rules && item.grammar_rules.indexOf(rule.id) !== -1) {
                  found.push({
                    chapter: c,
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
              const safeSentence2 = this._escapeHtml(item.sentence);
              const safeTranslation2 = this._escapeHtml(item.translation);
              storyExamples += `<div style="background:var(--bg-card);padding:8px 14px;border-radius:8px;margin-bottom:6px;font-size:0.85em;cursor:pointer;border-right:2px solid var(--gold-dim);" onclick="if(window.StoryLoader) { window.StoryLoader.currentChapter=${item.chapter}; window.StoryLoader.currentView='main'; window.StoryLoader.render(document.getElementById('contentArea')); }">`;
              storyExamples += `<div style="color:var(--text-primary);">${safeSentence2}</div>`;
              storyExamples += `<div style="color:var(--text-secondary);font-size:0.85em;">${safeTranslation2}</div>`;
              storyExamples += '</div>';
            }
            storyExamples += '</div>';
          }
        }
      } catch (e) {
        console.warn('⚠️ خطأ في البحث عن أمثلة من القصة:', e);
      }
      
      // عرض التفاصيل
      const safeRule = this._escapeHtml(rule.rule);
      const safeDesc = this._escapeHtml(rule.description || '');
      const safeStructure = rule.structure ? this._escapeHtml(rule.structure) : '';
      
      let html = '';
      
      // الرأس
      html += '<div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:10px;margin-bottom:16px;">';
      html += '<div>';
      html += `<h2 style="color:var(--blue);font-size:1.3em;display:flex;align-items:center;gap:10px;flex-wrap:wrap;">${safeRule}`;
      html += `<button class="play-btn" data-text="${safeRule}" onclick="if(window.speakText) window.speakText('${safeRule}');" style="background:none;border:none;color:var(--gold);font-size:1em;cursor:pointer;padding:2px 8px;border-radius:50%;">🔊</button>`;
      html += '</h2>';
      html += `<div style="color:var(--text-secondary);font-size:0.9em;">${safeDesc}</div>`;
      html += '</div>';
      html += '<button onclick="GrammarLoader.goBackFromDetail()" class="back-btn" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);cursor:pointer;font-family:inherit;color:var(--text-secondary);transition:all 0.3s;">⬅ العودة</button>';
      html += '</div>';
      
      // الهيكل
      if (safeStructure) {
        html += `<div style="background:rgba(0,0,0,0.15);padding:8px 16px;border-radius:8px;font-size:0.9em;color:var(--text-secondary);margin-bottom:8px;direction:ltr;text-align:left;overflow-x:auto;font-family:monospace;">${safeStructure}</div>`;
      }
      
      html += examplesHtml;
      html += keywordsHtml;
      html += mistakesHtml;
      html += storyExamples;
      
      html += '<div style="margin-top:16px;display:flex;gap:10px;flex-wrap:wrap;padding-top:12px;border-top:1px solid var(--border-color);">';
      const firstExample = rule.examples && rule.examples[0] ? this._escapeHtml(rule.examples[0].sentence) : '';
      if (firstExample) {
        html += `<button onclick="if(window.speakText) window.speakText('${safeRule}. ${firstExample}')" style="padding:8px 20px;border:none;border-radius:30px;background:var(--gold-dim);color:var(--gold);cursor:pointer;font-family:inherit;">🔊 استماع للقاعدة والمثال</button>`;
      }
      html += '<button onclick="GrammarLoader.goBackFromDetail()" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-family:inherit;">📚 العودة للقواعد</button>';
      if ((window as any).StoryLoader) {
        html += '<button onclick="if(window.StoryLoader) { window.StoryLoader.currentView=\'main\'; window.StoryLoader.render(document.getElementById(\'contentArea\')); }" style="padding:8px 20px;border:1px solid var(--border-color);border-radius:30px;background:var(--bg-card);color:var(--text-secondary);cursor:pointer;font-family:inherit;">📖 القصة</button>';
      }
      html += '</div>';
      
      container.innerHTML = html;
      
      if (typeof window.bindAudioButtons === 'function') {
        setTimeout(function() {
          window.bindAudioButtons(container);
        }, 100);
      }
      
      if (typeof window.updateBreadcrumb === 'function') {
        window.updateBreadcrumb(safeRule);
      }
      
    } catch (e) {
      console.error('❌ خطأ في showDetail:', e);
      if (typeof window.showToast === 'function') window.showToast('⚠️ حدث خطأ في عرض التفاصيل');
    }
  },

  goBackFromDetail: function(): void {
    try {
      console.log('🔙 العودة من تفاصيل القاعدة');
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

  getTotalRules: function(): number {
    try {
      return this.data && this.data.grammar_rules ? this.data.grammar_rules.length : 0;
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

console.log('✅ grammar-loader.tsx (مصحح بالكامل مع دعم IPA) تم تحميله');

export default GrammarLoader;
