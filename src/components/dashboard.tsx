// ============================================================
// dashboard.tsx - لوحة التحكم الشاملة للتعلم والمساعد الآلي والاختبارات
// ============================================================

import React, { useState, useEffect, useRef } from 'react';
import { 
  Sparkles, Send, Award, Flame, Clock, 
  BarChart2, BookOpen, GraduationCap, CheckCircle2, 
  XCircle, ArrowRight, RefreshCw, HelpCircle 
} from 'lucide-react';
import type { UserProgress, Quiz, Statistics } from '../types';

interface DashboardProps {
  userProgress: UserProgress | null;
  onUpdateProgress: (updated: UserProgress) => void;
  showToast: (msg: string, type?: 'success' | 'error' | 'info') => void;
}

export const Dashboard: React.FC<DashboardProps> = ({ userProgress, onUpdateProgress, showToast }) => {
  // تتبع المحادثة مع المساعد الآلي Aura
  const [chatMessages, setChatMessages] = useState<{ sender: 'user' | 'ai'; text: string; translation?: string; correction?: string; tips?: string }[]>([
    { 
      sender: 'ai', 
      text: "Hello! I am Aura, your expert AI English Tutor. Let's practice English together. How are you feeling today?", 
      translation: "مرحباً! أنا أورا، معلمتك الآلية المتميزة للغة الإنجليزية. لنمارس الإنجليزية معاً. كيف تشعرين اليوم؟"
    }
  ]);
  const [userInput, setUserInput] = useState<string>('');
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // تتبع الاختبارات النشطة
  const [quizzes, setQuizzes] = useState<Quiz[]>([]);
  const [activeQuiz, setActiveQuiz] = useState<Quiz | null>(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState<number>(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | number | null>(null);
  const [quizScore, setQuizScore] = useState<number>(0);
  const [quizCompleted, setQuizCompleted] = useState<boolean>(false);
  const [userAnswers, setUserAnswers] = useState<Record<string, string | number>>({});
  const [textFillAnswer, setTextFillAnswer] = useState<string>('');

  // تتبع الإحصاءات العامة والتطوير
  const [stats, setStats] = useState<Statistics | null>(null);
  const [activeTab, setActiveTab] = useState<'ai-tutor' | 'quizzes' | 'analytics'>('ai-tutor');

  // تحميل الاختبارات والإحصائيات
  useEffect(() => {
    fetch('/quiz_data.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data && data.quizzes) setQuizzes(data.quizzes);
      })
      .catch(err => {
        console.warn("Could not load quizzes via network, it might be due to dev server restart. Error:", err.message);
      });

    fetch('/statistics.json')
      .then(res => res.ok ? res.json() : null)
      .then(data => {
        if (data) setStats(data);
      })
      .catch(err => {
        console.warn("Could not load statistics via network. Error:", err.message);
      });
  }, []);

  // التمرير التلقائي لأسفل المحادثة
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, isTyping]);

  // إرسال رسالة للمساعد الآلي Aura
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isTyping) return;

    const userText = userInput.trim();
    setChatMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setUserInput('');
    setIsTyping(true);

    try {
      const payload = {
        messages: [
          ...chatMessages.map(m => ({ sender: m.sender, text: m.text })),
          { sender: 'user', text: userText }
        ]
      };

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error('فشل الاتصال بخادم Aura التعليمي');
      }

      const data = await response.json();
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: data.reply,
          translation: data.translation,
          correction: data.correction,
          tips: data.tips
        }
      ]);

      // منح المستخدم XP على المحادثة والممارسة الفعالة
      if (userProgress) {
        const updatedProgress: UserProgress = {
          ...userProgress,
          xp: userProgress.xp + 15,
          total_hours: parseFloat((userProgress.total_hours + 0.1).toFixed(2))
        };
        // التحقق من الانتقال للمستوى التالي
        if (updatedProgress.xp >= updatedProgress.next_level_xp) {
          updatedProgress.level += 1;
          updatedProgress.xp = updatedProgress.xp - updatedProgress.next_level_xp;
          updatedProgress.next_level_xp = Math.floor(updatedProgress.next_level_xp * 1.5);
          showToast(`🎉 مبروك! لقد ارتقيت إلى المستوى ${updatedProgress.level}!`, 'success');
        }
        onUpdateProgress(updatedProgress);
      }
    } catch (err: any) {
      console.error(err);
      setChatMessages(prev => [
        ...prev,
        {
          sender: 'ai',
          text: "I am sorry, but my linguistic connection is currently weak. Let's continue practicing using our offline models!",
          translation: "أنا آسفة، ولكن اتصالي اللغوي ضعيف حالياً. لنواصل التدريب باستخدام نماذجنا المحلية!"
        }
      ]);
    } finally {
      setIsTyping(false);
    }
  };

  // التحكم في اختبارات التقييم الذاتي
  const startQuiz = (quiz: Quiz) => {
    setActiveQuiz(quiz);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setQuizScore(0);
    setQuizCompleted(false);
    setUserAnswers({});
    setTextFillAnswer('');
    showToast(`📝 بدأ اختبار: ${quiz.title}`, 'info');
  };

  const handleSelectAnswer = (answer: string | number) => {
    if (selectedAnswer !== null) return; // تم الإجابة مسبقاً على هذا السؤال
    setSelectedAnswer(answer);

    const question = activeQuiz?.questions[currentQuestionIdx];
    if (!question) return;

    setUserAnswers(prev => ({ ...prev, [question.id]: answer }));

    const isCorrect = String(answer).trim().toLowerCase() === String(question.correct_answer).trim().toLowerCase();
    if (isCorrect) {
      setQuizScore(prev => prev + 1);
      showToast("🎯 إجابة صحيحة وممتازة!", "success");
    } else {
      showToast("⚠️ إجابة غير دقيقة، اقرأ التفسير بالأسفل.", "error");
    }
  };

  const handleNextQuestion = () => {
    if (!activeQuiz) return;
    setSelectedAnswer(null);
    setTextFillAnswer('');

    if (currentQuestionIdx < activeQuiz.questions.length - 1) {
      setCurrentQuestionIdx(prev => prev + 1);
    } else {
      // إكمال الاختبار بنجاح وحساب النقاط
      setQuizCompleted(true);
      console.log("Logged user answers:", userAnswers);
      const scorePercentage = Math.round((quizScore / activeQuiz.questions.length) * 100);

      if (userProgress) {
        let earnedXP = scorePercentage >= activeQuiz.passing_score ? 100 : 30;
        const updatedProgress: UserProgress = {
          ...userProgress,
          xp: userProgress.xp + earnedXP,
          quiz_scores: {
            ...userProgress.quiz_scores,
            [activeQuiz.id]: Math.max(userProgress.quiz_scores[activeQuiz.id] || 0, scorePercentage)
          }
        };

        if (scorePercentage >= activeQuiz.passing_score) {
          showToast(`🏆 نجحت في الاختبار بنسبة ${scorePercentage}% وحصلت على ${earnedXP} نقطة خبرة!`, "success");
        } else {
          showToast(`✍️ أنهيت الاختبار بنسبة ${scorePercentage}%. حاول مجدداً للحصول على درجة النجاح.`, "info");
        }

        onUpdateProgress(updatedProgress);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 p-1 md:p-4 text-slate-100" id="main-dashboard-wrapper">
      {/* الشريط الجانبي السريع للإحصاءات الفورية */}
      <div className="lg:col-span-1 flex flex-col gap-5">
        {/* ملف المستخدم السريع والمستوى */}
        <div className="p-5 bg-gradient-to-br from-slate-900 via-slate-900 to-indigo-950 border border-slate-800 rounded-2xl shadow-xl flex flex-col items-center text-center">
          <div className="relative w-16 h-16 bg-gradient-to-tr from-emerald-400 to-indigo-500 rounded-full flex items-center justify-center font-bold text-2xl text-slate-950 shadow-lg shadow-indigo-500/10">
            {userProgress?.level || 1}
            <div className="absolute -bottom-1 -right-1 bg-amber-400 p-1 rounded-full text-slate-950 border-2 border-slate-950" title="مستوى التعلم">
              <Award className="w-3.5 h-3.5" />
            </div>
          </div>
          <h4 className="font-sans text-base font-bold text-white mt-3">طالب ذكي (Aura Student)</h4>
          <p className="text-xs text-slate-400">مرحباً بك مجدداً في رحلتك اللغوية</p>

          {/* شريط التقدم بالنقاط */}
          <div className="w-full mt-5">
            <div className="flex items-center justify-between text-xs mb-1.5 font-mono">
              <span className="text-slate-400">XP Progress</span>
              <span className="text-emerald-400 font-bold">{userProgress?.xp || 0} / {userProgress?.next_level_xp || 1000} XP</span>
            </div>
            <div className="w-full bg-slate-950 h-2 rounded-full overflow-hidden border border-slate-800">
              <div 
                className="bg-gradient-to-r from-emerald-400 to-teal-500 h-full rounded-full transition-all duration-500"
                style={{ width: `${Math.min(((userProgress?.xp || 0) / (userProgress?.next_level_xp || 1000)) * 100, 100)}%` }}
              />
            </div>
          </div>

          <div className="w-full flex justify-between mt-4 text-xs font-mono text-slate-400 border-t border-slate-800 pt-3">
             <span className="flex items-center gap-1"><Award className="w-3 h-3 text-amber-400" /> البادجات: {userProgress?.badges_earned || 0}</span>
             <span className="flex items-center gap-1"><BarChart2 className="w-3 h-3 text-indigo-400" /> نقاط إجمالية: {userProgress?.total_xp || 0}</span>
          </div>
        </div>

        {/* عداد الأيام المتتالية والوقت */}
        <div className="grid grid-cols-2 gap-4">
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col items-center text-center hover:border-amber-500/50 transition-colors">
            <Flame className="w-6 h-6 text-amber-500 animate-pulse" />
            <span className="text-xs text-slate-400 mt-2">أيام متتالية</span>
            <span className="font-mono text-xl font-extrabold text-white mt-1">{userProgress?.daily_streak || userProgress?.streak_days || 0}</span>
          </div>
          <div className="p-4 bg-slate-900/80 border border-slate-800 rounded-xl flex flex-col items-center text-center hover:border-indigo-400/50 transition-colors">
            <Clock className="w-6 h-6 text-indigo-400" />
            <span className="text-xs text-slate-400 mt-2">ساعات التعلم</span>
            <span className="font-mono text-xl font-extrabold text-white mt-1">{userProgress?.total_hours || 0}h</span>
          </div>
        </div>

        {/* تبديل علامات تبويب لوحة التحكم */}
        <div className="flex flex-col gap-2 p-1.5 bg-slate-950/80 border border-slate-900 rounded-xl">
          <button 
            onClick={() => setActiveTab('ai-tutor')}
            className={`w-full py-2.5 px-4 rounded-lg font-sans text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'ai-tutor' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <Sparkles className="w-4 h-4" /> المعلم الآلي Aura
          </button>
          <button 
            onClick={() => setActiveTab('quizzes')}
            className={`w-full py-2.5 px-4 rounded-lg font-sans text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'quizzes' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <GraduationCap className="w-4 h-4" /> اختبارات ذكية
          </button>
          <button 
            onClick={() => setActiveTab('analytics')}
            className={`w-full py-2.5 px-4 rounded-lg font-sans text-sm font-semibold flex items-center gap-2.5 transition-colors ${activeTab === 'analytics' ? 'bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 border border-emerald-500/20' : 'text-slate-400 hover:text-white hover:bg-slate-900'}`}
          >
            <BarChart2 className="w-4 h-4" /> التحليلات العامة
          </button>
        </div>
      </div>

      {/* منطقة المحتوى الرئيسية للتفاعلات */}
      <div className="lg:col-span-3 flex flex-col bg-slate-900/60 border border-slate-800 rounded-2xl shadow-2xl backdrop-blur-md overflow-hidden min-h-[550px]">
        
        {/* 1. مساعد الذكاء الاصطناعي Aura */}
        {activeTab === 'ai-tutor' && (
          <div className="flex flex-col h-full flex-grow">
            {/* رأس صندوق الدردشة */}
            <div className="p-4 bg-slate-950/80 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="w-2.5 h-2.5 bg-emerald-400 rounded-full animate-ping" />
                <div>
                  <h3 className="font-sans text-sm font-extrabold text-white flex items-center gap-1.5">
                    Aura AI Trainer <Sparkles className="w-4 h-4 text-emerald-400" />
                  </h3>
                  <p className="text-[10px] text-slate-400">تواصل مباشر بالإنجليزية مع تصحيح وتحليل فوري للقواعد.</p>
                </div>
              </div>
              <button 
                onClick={() => setChatMessages([chatMessages[0]])}
                className="p-1.5 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition-colors"
                title="تصفية المحادثة"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* رسائل المحادثة المتدفقة */}
            <div className="p-4 flex-grow overflow-y-auto max-h-[400px] min-h-[300px] flex flex-col gap-4">
              {chatMessages.map((msg, index) => (
                <div 
                  key={index} 
                  className={`flex flex-col max-w-[85%] ${msg.sender === 'user' ? 'self-end items-end' : 'self-start items-start'}`}
                >
                  <div className={`p-3.5 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-gradient-to-r from-emerald-500 to-teal-600 text-slate-950 font-medium rounded-tr-none' : 'bg-slate-950 text-slate-100 rounded-tl-none border border-slate-800'}`}>
                    <p>{msg.text}</p>

                    {/* ترجمة فورية لتعليم سلس ومريح */}
                    {msg.translation && (
                      <p className="text-xs text-slate-400 mt-2 border-t border-slate-800/80 pt-1.5 leading-relaxed font-sans" dir="rtl">
                        {msg.translation}
                      </p>
                    )}
                  </div>

                  {/* لوحة تصحيح القواعد للمستخدم */}
                  {msg.correction && msg.correction !== 'Excellent! Perfect grammar.' && (
                    <div className="mt-1.5 p-2.5 bg-amber-950/20 border border-amber-900/30 text-amber-400 text-xs rounded-xl flex flex-col gap-1 w-full" dir="rtl">
                      <span className="font-sans font-bold text-amber-300">💡 تصحيح مقترح:</span>
                      <p className="font-mono">{msg.correction}</p>
                    </div>
                  )}

                  {/* نصيحة تعليمية ذكية من Aura */}
                  {msg.tips && (
                    <div className="mt-1.5 p-2.5 bg-indigo-950/20 border border-indigo-900/30 text-indigo-400 text-xs rounded-xl flex flex-col gap-1 w-full" dir="rtl">
                      <span className="font-sans font-bold text-indigo-300">⚡ معلومة لغوية مضافة:</span>
                      <p className="leading-relaxed font-sans">{msg.tips}</p>
                    </div>
                  )}
                </div>
              ))}

              {isTyping && (
                <div className="flex items-center gap-2 bg-slate-950 p-3 rounded-xl border border-slate-800 self-start">
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                  <div className="w-2 h-2 bg-emerald-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  <span className="text-xs text-slate-400 font-mono">أورا تفكر...</span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* حقل إدخال الرسالة */}
            <form onSubmit={handleSendMessage} className="p-3.5 bg-slate-950 border-t border-slate-800 flex gap-3 items-center">
              <input 
                type="text"
                value={userInput}
                onChange={e => setUserInput(e.target.value)}
                placeholder="اكتب رسالتك بالإنجليزية للممارسة والتصحيح..."
                className="flex-grow p-3 bg-slate-900 border border-slate-800 rounded-xl text-sm focus:border-emerald-500/50 focus:outline-none"
              />
              <button 
                type="submit"
                disabled={!userInput.trim() || isTyping}
                className="p-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl transition-colors disabled:opacity-40 disabled:hover:bg-emerald-400 cursor-pointer"
              >
                <Send className="w-4 h-4" />
              </button>
            </form>
          </div>
        )}

        {/* 2. تبويب الاختبارات الذكية */}
        {activeTab === 'quizzes' && (
          <div className="p-6 flex flex-col h-full flex-grow">
            {!activeQuiz ? (
              /* قائمة الاختبارات المتاحة */
              <div>
                <h3 className="font-sans text-base font-bold text-white mb-4">اختبر معلوماتك لرفع مستواك اللغوي 🎓</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {quizzes.map((quiz) => {
                    const existingScore = userProgress?.quiz_scores[quiz.id];
                    return (
                      <div 
                        key={quiz.id}
                        className="p-5 bg-slate-950 rounded-xl border border-slate-800/80 hover:border-slate-700 transition-all flex flex-col justify-between"
                      >
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="px-2 py-0.5 bg-slate-900 text-slate-400 text-[10px] font-semibold rounded uppercase tracking-wider">
                              {quiz.type}
                            </span>
                            <span className={`px-2 py-0.5 text-[10px] rounded-full font-bold uppercase ${quiz.difficulty === 'easy' ? 'bg-emerald-950/40 text-emerald-400 border border-emerald-900/40' : 'bg-amber-950/40 text-amber-400 border border-amber-900/40'}`}>
                              {quiz.difficulty}
                            </span>
                          </div>
                          <h4 className="font-sans text-sm font-extrabold text-white mt-1.5">{quiz.title}</h4>
                          <p className="text-xs text-slate-400 font-mono mt-1">{quiz.title_en}</p>

                          <div className="flex items-center gap-4 text-[11px] text-slate-400 mt-4">
                            <span className="flex items-center gap-1"><BookOpen className="w-3.5 h-3.5" /> {quiz.questions.length} أسئلة</span>
                            <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {quiz.time_limit / 60} دقائق</span>
                          </div>
                        </div>

                        <div className="mt-5 pt-4 border-t border-slate-900 flex items-center justify-between">
                          {existingScore !== undefined ? (
                            <span className="text-xs text-emerald-400 font-bold">آخر نتيجة: {existingScore}%</span>
                          ) : (
                            <span className="text-xs text-slate-500">لم يكتمل بعد</span>
                          )}
                          <button 
                            onClick={() => startQuiz(quiz)}
                            className="text-xs font-semibold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                          >
                            ابدأ الآن <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : quizCompleted ? (
              /* واجهة تقرير نتائج الاختبار */
              <div className="flex flex-col items-center justify-center py-10 text-center max-w-md mx-auto">
                <div className="w-16 h-16 bg-gradient-to-tr from-emerald-400 to-indigo-500 rounded-full flex items-center justify-center text-slate-950 shadow-lg mb-4">
                  <Award className="w-8 h-8" />
                </div>
                <h3 className="font-sans text-lg font-bold text-white">رائع! لقد أكملت الاختبار بنجاح</h3>
                <p className="text-sm text-slate-400 mt-1">{activeQuiz.title}</p>

                <div className="my-6 p-4 bg-slate-950 border border-slate-800 rounded-xl w-full">
                  <div className="flex items-center justify-between border-b border-slate-900 pb-3 mb-3 text-sm">
                    <span className="text-slate-400">مجموع الإجابات الصحيحة:</span>
                    <span className="font-mono font-bold text-white">{quizScore} من {activeQuiz.questions.length}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-slate-400">النسبة المئوية:</span>
                    <span className={`font-mono font-bold ${Math.round((quizScore / activeQuiz.questions.length) * 100) >= activeQuiz.passing_score ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {Math.round((quizScore / activeQuiz.questions.length) * 100)}%
                    </span>
                  </div>
                </div>

                <div className="flex gap-4 w-full">
                  <button 
                    onClick={() => startQuiz(activeQuiz)}
                    className="flex-1 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-semibold transition-colors"
                  >
                    إعادة المحاولة
                  </button>
                  <button 
                    onClick={() => setActiveQuiz(null)}
                    className="flex-1 py-2 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-lg text-xs font-semibold transition-colors"
                  >
                    العودة للقائمة
                  </button>
                </div>
              </div>
            ) : (
              /* محتوى الأسئلة التفاعلي */
              <div className="flex flex-col h-full justify-between flex-grow">
                {/* رأس السؤال ومؤشر التقدم */}
                <div>
                  <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-800/80">
                    <button 
                      onClick={() => setActiveQuiz(null)}
                      className="text-xs text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
                    >
                      خروج
                    </button>
                    <span className="text-xs text-slate-400 font-mono">
                      السؤال {currentQuestionIdx + 1} / {activeQuiz.questions.length}
                    </span>
                  </div>

                  {/* السؤال الحالي */}
                  <div className="my-4">
                    <h4 className="font-sans text-base font-extrabold text-white leading-relaxed">
                      {activeQuiz.questions[currentQuestionIdx].question}
                    </h4>
                    {activeQuiz.questions[currentQuestionIdx].question_ar && (
                      <p className="text-sm text-slate-400 mt-1.5 font-sans leading-relaxed" dir="rtl">
                        {activeQuiz.questions[currentQuestionIdx].question_ar}
                      </p>
                    )}
                  </div>

                  {/* خيارات الإجابة */}
                  <div className="flex flex-col gap-3 my-6">
                    {activeQuiz.questions[currentQuestionIdx].type === 'multiple_choice' || activeQuiz.questions[currentQuestionIdx].type === 'true_false' ? (
                      activeQuiz.questions[currentQuestionIdx].options?.map((option, idx) => {
                        const isSelected = selectedAnswer === idx;
                        const isCorrect = idx === activeQuiz.questions[currentQuestionIdx].correct_answer;
                        let btnClass = "bg-slate-950 border-slate-800 text-slate-300 hover:border-slate-700";

                        if (selectedAnswer !== null) {
                          if (isSelected) {
                            btnClass = isCorrect ? "bg-emerald-950/40 border-emerald-500 text-emerald-400" : "bg-red-950/40 border-red-500 text-red-400";
                          } else if (isCorrect) {
                            btnClass = "bg-emerald-950/20 border-emerald-900/60 text-emerald-500";
                          }
                        }

                        return (
                          <button 
                            key={idx}
                            disabled={selectedAnswer !== null}
                            onClick={() => handleSelectAnswer(idx)}
                            className={`w-full p-4 rounded-xl border text-right text-xs font-semibold flex items-center justify-between transition-all ${btnClass}`}
                          >
                            <span>{option}</span>
                            {selectedAnswer !== null && isCorrect && <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />}
                            {selectedAnswer !== null && isSelected && !isCorrect && <XCircle className="w-4 h-4 text-red-400 flex-shrink-0" />}
                          </button>
                        );
                      })
                    ) : (
                      /* سؤال ملء الفراغ النصي */
                      <div className="flex flex-col gap-3">
                        <div className="flex gap-2">
                          <input 
                            type="text"
                            value={textFillAnswer}
                            disabled={selectedAnswer !== null}
                            onChange={(e) => setTextFillAnswer(e.target.value)}
                            placeholder="اكتب الإجابة هنا..."
                            className="flex-grow p-3 bg-slate-950 border border-slate-800 rounded-lg text-xs"
                          />
                          <button 
                            disabled={selectedAnswer !== null || !textFillAnswer.trim()}
                            onClick={() => handleSelectAnswer(textFillAnswer.trim().toLowerCase())}
                            className="bg-emerald-400 hover:bg-emerald-300 disabled:opacity-40 text-slate-950 font-bold px-4 rounded-lg text-xs"
                          >
                            تأكيد
                          </button>
                        </div>
                        {selectedAnswer !== null && (
                          <div className={`p-4 rounded-xl border ${String(selectedAnswer).trim().toLowerCase() === String(activeQuiz.questions[currentQuestionIdx].correct_answer).trim().toLowerCase() ? 'bg-emerald-950/20 border-emerald-900 text-emerald-400' : 'bg-red-950/20 border-red-900 text-red-400'}`}>
                            <p className="text-xs font-bold">الإجابة الصحيحة: {activeQuiz.questions[currentQuestionIdx].correct_answer}</p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* التفسير والشرح التوضيحي المضاف بعد الحل */}
                  {selectedAnswer !== null && (
                    <div className="p-4 bg-slate-950 border border-slate-800 rounded-xl text-xs mt-4" dir="rtl">
                      <div className="flex items-center gap-2 text-indigo-400 font-bold mb-1">
                        <HelpCircle className="w-4 h-4" /> تفسير تعليمي:
                      </div>
                      <p className="text-slate-300 font-sans leading-relaxed">
                        {activeQuiz.questions[currentQuestionIdx].explanation_ar || activeQuiz.questions[currentQuestionIdx].explanation}
                      </p>
                    </div>
                  )}
                </div>

                {/* زر السؤال التالي */}
                {selectedAnswer !== null && (
                  <button 
                    onClick={handleNextQuestion}
                    className="w-full py-3 bg-emerald-400 hover:bg-emerald-300 text-slate-950 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-6 cursor-pointer"
                  >
                    السؤال التالي <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        )}

        {/* 3. تبويب تحليلات التعلم المتقدمة */}
        {activeTab === 'analytics' && stats && (
          <div className="p-6 flex flex-col gap-6 flex-grow">
            <div>
              <h3 className="font-sans text-base font-bold text-white mb-1.5 flex items-center gap-2">
                <BarChart2 className="w-5 h-5 text-emerald-400" /> لوحة التحليلات المتقدمة للتعلم
              </h3>
              <p className="text-xs text-slate-400">إحصاءات الانتشار وحجم الممارسة اللغوية في المنصة.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 tracking-wider">الطلاب النشطون يومياً</span>
                <h4 className="font-mono text-2xl font-black text-emerald-400 mt-1">{stats.daily_active_users.toLocaleString()}</h4>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 tracking-wider">ساعات التعلم الإجمالية</span>
                <h4 className="font-mono text-2xl font-black text-white mt-1">{(stats.total_minutes_learned / 60).toFixed(0)}h</h4>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                <span className="text-[10px] uppercase text-slate-400 tracking-wider">متوسط وقت الممارسة</span>
                <h4 className="font-mono text-2xl font-black text-white mt-1">{stats.average_learning_time} min</h4>
              </div>
            </div>

            {/* الفصول الأكثر تصفحاً وقراءة */}
            <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80 mt-2">
              <h4 className="font-sans text-xs font-bold text-indigo-300 mb-3">📈 الفصول الأكثر قراءة وتفاعلاً</h4>
              <div className="flex flex-col gap-3">
                {stats.popular_chapters.map((ch, idx) => (
                  <div key={idx} className="flex items-center justify-between text-xs">
                    <span className="text-slate-300 font-sans">الفصل {ch.chapter}:</span>
                    <div className="flex-grow mx-4 h-1.5 bg-slate-900 rounded-full overflow-hidden">
                      <div 
                        className="bg-indigo-400 h-full rounded-full" 
                        style={{ width: `${(ch.views / stats.popular_chapters[0].views) * 100}%` }}
                      />
                    </div>
                    <span className="font-mono text-slate-400">{ch.views.toLocaleString()} زيارة</span>
                  </div>
                ))}
              </div>
            </div>

            {/* الأجهزة اللوحية والمحمول */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                <h4 className="font-sans text-xs font-bold text-slate-300 mb-3">📱 توزيع الأجهزة المستخدمة</h4>
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span className="text-emerald-400">هاتف: {stats.device_stats.mobile}%</span>
                  <span>حاسوب: {stats.device_stats.desktop}%</span>
                  <span>لوحي: {stats.device_stats.tablet}%</span>
                </div>
              </div>
              <div className="p-4 bg-slate-950 rounded-xl border border-slate-800/80">
                <h4 className="font-sans text-xs font-bold text-slate-300 mb-3">🌍 اللغات المفضلة لواجهة التطبيق</h4>
                <div className="flex justify-between text-xs font-mono text-slate-400">
                  <span className="text-indigo-400">العربية: {stats.language_stats.ar}%</span>
                  <span>الإنجليزية: {stats.language_stats.en}%</span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
