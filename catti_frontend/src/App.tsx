import { useState, useEffect } from 'react';
import { InputSection } from './components/InputSection';
import { ResultSection } from './components/ResultSection';
import { InterpretationSection } from './components/InterpretationSection';
import { HistorySection } from './components/HistorySection';
import { WrittenCompSection } from './components/WrittenCompSection';
import { gradeTranslation, saveExamRecord, getExamRecords } from './api';
import { GraderResponse, EvaluationItem } from './types';
import { GraduationCap, Key, Settings, Globe, Timer, Play, ArrowLeft, PenTool, Mic, BookOpen, Clock } from 'lucide-react';
import { translations, LanguageKey } from './i18n';

function App() {
  const [sourceText, setSourceText] = useState('');
  const [userTranslation, setUserTranslation] = useState('');
  const [result, setResult] = useState<GraderResponse | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [hoveredEvaluation, setHoveredEvaluation] = useState<EvaluationItem | null>(null);

  // Router state
  const [currentPage, setCurrentPage] = useState<'home' | 'written' | 'interpretation' | 'written_comp' | 'history'>('home');

  // Settings
  const [provider, setProvider] = useState<'deepseek' | 'mimo'>('deepseek');
  const [apiKey, setApiKey] = useState('');
  const [language, setLanguage] = useState<LanguageKey>('en');

  // Custom Timer Mode
  const [timerEnabled, setTimerEnabled] = useState(false);
  const [timerMinutes, setTimerMinutes] = useState(60);
  const [examActive, setExamActive] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0); 

  // Recent History State
  const [recentExams, setRecentExams] = useState<any[]>([]);
  const [interpRecordToLoad, setInterpRecordToLoad] = useState<any>(null);
  const [writtenCompRecordToLoad, setWrittenCompRecordToLoad] = useState<any>(null);

  const t = translations[language];

  // Fetch recent exams on home page load
  useEffect(() => {
    if (currentPage === 'home') {
      getExamRecords()
        .then(records => setRecentExams(records.slice(0, 3)))
        .catch(err => console.error("Failed to fetch recent records:", err));
    }
  }, [currentPage]);

  const [writtenMode, setWrittenMode] = useState<'translate' | 'comprehensive'>('translate');

  // Timer logic
  useEffect(() => {
    let timer: number | undefined;
    if (examActive && timeLeft > 0) {
      timer = window.setInterval(() => setTimeLeft((prev) => prev - 1), 1000);
    } else if (timeLeft === 0 && examActive) {
      setExamActive(false);
      handleEvaluate(true); // auto-submit when time is up
    }
    return () => {
      if (timer) window.clearInterval(timer);
    };
  }, [examActive, timeLeft]);

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const toggleExamMode = () => {
    if (examActive) {
      if (!window.confirm("Are you sure you want to exit Timer Mode? Your progress will not be evaluated.")) {
        return;
      }
    }
    setTimerEnabled(!timerEnabled);
    setExamActive(false);
    setTimeLeft(timerMinutes * 60);
    setResult(null);
  };

  const startExam = () => {
    if (!timerEnabled) {
      // Direct start without timer
      setExamActive(true);
      setResult(null);
      return;
    }
    setTimeLeft(timerMinutes * 60);
    setExamActive(true);
    setResult(null);
  };

  // Save credentials when changed
  useEffect(() => {
    localStorage.setItem('catti_provider', provider);
    localStorage.setItem('catti_api_key', apiKey);
    localStorage.setItem('catti_language', language);
  }, [provider, apiKey, language]);

  const handleEvaluate = async (autoSubmit: boolean = false) => {
    if (!sourceText.trim() || !userTranslation.trim()) {
      setError('Please provide both source text and translation.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please provide an API Key.');
      return;
    }

    if (!autoSubmit && !window.confirm(language === 'zh' ? "确认提交阅卷吗？" : "Submit your translation for evaluation?")) {
      return;
    }

    if (timerEnabled && examActive) {
      setExamActive(false); // Stop timer
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await gradeTranslation({
        source_text: sourceText,
        user_translation: userTranslation,
        provider,
        api_key: apiKey,
        language
      });
      setResult(data);

      // Auto save to history
      try {
        await saveExamRecord({
          exam_type: 'written',
          content: JSON.stringify({
            source_text: sourceText,
            user_translation: userTranslation,
            result: data
          })
        });
      } catch (err) {
        console.error("Auto-save to history failed:", err);
      }
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during evaluation.');
    } finally {
      setIsLoading(false);
    }
  };

  const navigateToHome = () => {
    setCurrentPage('home');
    setExamActive(false);
    setTimerEnabled(false);
    setResult(null);
    setError(null);
    setSourceText('');
    setUserTranslation('');
    setInterpRecordToLoad(null);
    setWrittenCompRecordToLoad(null);
  };

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans print:bg-white">
      <header className="bg-slate-900 text-white shadow-md z-20 shrink-0 print:hidden">
        <div className="max-w-7xl mx-auto px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center space-x-3 w-full sm:w-auto">
            {currentPage !== 'home' && (
              <button 
                onClick={navigateToHome}
                className="p-2 hover:bg-slate-800 rounded-lg transition-colors mr-2"
                title="Back to Home"
              >
                <ArrowLeft size={20} className="text-slate-400" />
              </button>
            )}
            <div className="bg-blue-600 p-2 rounded-lg shrink-0">
              <GraduationCap size={24} className="text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight leading-none uppercase">{t.appTitle}</h1>
              <p className="text-xs text-slate-400 font-mono mt-1">{t.appSubtitle}</p>
            </div>
          </div>

          {/* Timer Display */}
          {currentPage === 'written' && examActive && timerEnabled && (
            <div className="flex items-center space-x-4 bg-slate-800 px-6 py-2 rounded-full border border-red-500/30 animate-pulse-slow">
              <Timer className="text-red-400" size={24} />
              <div className="text-red-400 font-mono text-3xl font-black tracking-widest">
                {formatTime(timeLeft)}
              </div>
            </div>
          )}
          
          <div className="flex flex-wrap items-center justify-end gap-3 w-full sm:w-auto">
            {currentPage === 'written' && (
              <>
                <div className="flex items-center space-x-2 px-3 py-1.5 rounded-lg border border-slate-700 bg-slate-800">
                  <Timer size={14} className="text-slate-400" />
                  <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">{t.examMode}</span>
                  <input 
                    type="checkbox" 
                    checked={timerEnabled} 
                    onChange={toggleExamMode}
                    className="ml-2 accent-blue-500"
                  />
                  {timerEnabled && (
                    <input 
                      type="number"
                      value={timerMinutes}
                      onChange={(e) => setTimerMinutes(Number(e.target.value))}
                      disabled={examActive}
                      className="ml-2 w-16 bg-slate-900 border border-slate-600 text-white text-xs p-1 rounded outline-none"
                      min="1"
                      max="300"
                    />
                  )}
                  {timerEnabled && <span className="text-xs text-slate-400 ml-1">min</span>}
                </div>
                <div className="h-6 w-px bg-slate-700 mx-1 hidden sm:block"></div>
              </>
            )}

            <div className="flex items-center space-x-2 bg-slate-800 p-2 rounded-lg border border-slate-700 text-sm">
              <Globe size={16} className="text-slate-400" />
              <select 
                value={language}
                onChange={(e) => setLanguage(e.target.value as LanguageKey)}
                className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none"
              >
                <option value="zh">Feedback: 中文</option>
                <option value="en">Feedback: EN</option>
              </select>
            </div>
            <div className="flex items-center space-x-3 bg-slate-800 p-2 rounded-lg border border-slate-700">
              <div className="flex items-center space-x-2 text-sm">
                <Settings size={16} className="text-slate-400" />
                <select 
                  value={provider}
                  onChange={(e) => setProvider(e.target.value as 'deepseek' | 'mimo')}
                  className="bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none"
                >
                  <option value="deepseek">DeepSeek (v4 Pro)</option>
                  <option value="mimo">Xiaomi MiMo (v2.5 Pro)</option>
                </select>
              </div>
              <div className="flex items-center space-x-2 text-sm w-full sm:w-64">
                <Key size={16} className="text-slate-400 shrink-0" />
                <input 
                  type="password" 
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder={t.apiKeyPlaceholder}
                  className="w-full bg-slate-900 border border-slate-700 text-slate-200 text-sm rounded focus:ring-blue-500 focus:border-blue-500 block p-1.5 outline-none placeholder-slate-600"
                />
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto p-6 flex flex-col h-[calc(100vh-120px)] sm:h-[calc(100vh-80px)] overflow-hidden transition-all duration-500 print:p-0 print:h-auto print:overflow-visible">
        
        {currentPage === 'home' && (
          <div className="flex-1 flex flex-col items-center overflow-y-auto pb-12 print:hidden">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl w-full mt-12">
              <button 
                onClick={() => setCurrentPage('written')}
                className="group flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-blue-500 hover:-translate-y-2 transition-all"
              >
                <div className="w-20 h-20 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-blue-600 transition-colors">
                  <PenTool size={40} className="text-blue-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t.homeWrittenMode}</h2>
                <p className="text-slate-500 font-medium">{t.homeWrittenDesc}</p>
              </button>

              <button 
                onClick={() => setCurrentPage('interpretation')}
                className="group flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-emerald-500 hover:-translate-y-2 transition-all"
              >
                <div className="w-20 h-20 bg-emerald-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-emerald-600 transition-colors">
                  <Mic size={40} className="text-emerald-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t.homeInterpMode}</h2>
                <p className="text-slate-500 font-medium">{t.homeInterpDesc}</p>
              </button>
              
              <button 
                onClick={() => setCurrentPage('history')}
                className="group flex flex-col items-center justify-center p-12 bg-white rounded-3xl shadow-sm border border-slate-200 hover:shadow-xl hover:border-amber-500 hover:-translate-y-2 transition-all md:col-span-2"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-amber-600 transition-colors">
                  <BookOpen size={40} className="text-amber-600 group-hover:text-white transition-colors" />
                </div>
                <h2 className="text-2xl font-black text-slate-800 mb-2">{t.historyArchiveTitle}</h2>
                <p className="text-slate-500 font-medium">{t.historyArchiveDesc}</p>
              </button>
            </div>

            {/* Recent History Section */}
            {recentExams.length > 0 && (
              <div className="max-w-4xl w-full mt-12">
                <div className="flex items-center space-x-2 mb-6">
                  <Clock size={20} className="text-slate-500" />
                  <h3 className="text-lg font-bold text-slate-700">{t.historyRecentTitle}</h3>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {recentExams.map((record) => (
                    <div 
                      key={record.id} 
                      onClick={() => setCurrentPage('history')}
                      className="bg-white p-5 rounded-2xl shadow-sm border border-slate-200 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer flex flex-col cursor-pointer"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                          record.exam_type === 'written' ? 'bg-blue-50 text-blue-700' : 
                          record.exam_type === '笔译综合能力' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                        }`}>
                          {record.exam_type === 'written' ? t.historyTypeWritten : record.exam_type}
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mb-4 flex-1 font-mono">
                        {new Date(record.created_at).toLocaleDateString()}
                      </p>
                      <div className="text-sm font-medium text-slate-600 line-clamp-2">
                        {(() => {
                          try {
                            const content = JSON.parse(record.content);
                            if (record.exam_type === 'written') {
                              return content.user_translation || content.source_text || t.historyPreviewUnavailable;
                            } else if (record.exam_type === '笔译综合能力') {
                              return content.vocab_text || content.reading_text || content.cloze_text || t.historyPreviewUnavailable;
                            } else {
                              return content.transcript || (t.homeInterpMode + " Exam Record");
                            }
                          } catch (e) {
                            return t.historyPreviewUnavailable;
                          }
                        })()}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {currentPage === 'interpretation' && (
          <InterpretationSection provider={provider} apiKey={apiKey} t={t} initialRecord={interpRecordToLoad} />
        )}

        {currentPage === 'history' && (
          <HistorySection 
            t={t} 
            onLoadRecord={(record) => {
              try {
                const content = JSON.parse(record.content);
                if (record.exam_type === 'written') {
                  setSourceText(content.source_text || '');
                  setUserTranslation(content.user_translation || '');
                  setResult(content.result || null);
                  setWrittenMode('translate');
                  setCurrentPage('written');
                } else if (record.exam_type === '笔译综合能力') {
                  setWrittenCompRecordToLoad({
                    vocab_text: content.vocab_text || '',
                    reading_text: content.reading_text || '',
                    cloze_text: content.cloze_text || '',
                    result: content.result,
                    answers: content.answers || {}
                  });
                  setWrittenMode('comprehensive');
                  setCurrentPage('written');
                } else {
                  let parsedResult = content;
                  let parsedTranscript = '';
                  let parsedTtsCache = {};
                  let parsedAnswers = {};
                  if (content.result) {
                    parsedResult = content.result;
                    parsedTranscript = content.transcript || '';
                    parsedTtsCache = content.ttsCache || {};
                    parsedAnswers = content.answers || {};
                  }
                  setInterpRecordToLoad({
                    transcript: parsedTranscript,
                    result: parsedResult,
                    ttsCache: parsedTtsCache,
                    answers: parsedAnswers
                  });
                  setCurrentPage('interpretation');
                }
              } catch (e) {
                alert("Failed to load record.");
              }
            }} 
          />
        )}

        {currentPage === 'written' && (
          <div className="flex-1 relative flex flex-col h-full overflow-hidden print:overflow-visible">
            {/* Mode Switcher inside Written Page */}
            <div className="flex justify-center mb-6 shrink-0 print:hidden">
              <div className="bg-slate-200 p-1 rounded-lg inline-flex">
                <button
                  onClick={() => setWrittenMode('translate')}
                  className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${writtenMode === 'translate' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.homeWrittenMode}
                </button>
                <button
                  onClick={() => setWrittenMode('comprehensive')}
                  className={`px-6 py-2 rounded-md font-bold text-sm transition-all ${writtenMode === 'comprehensive' ? 'bg-white text-purple-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                  {t.homeWrittenCompMode}
                </button>
              </div>
            </div>

            {writtenMode === 'translate' ? (
              <div className="flex-1 relative flex flex-col lg:flex-row gap-6 min-h-0 print:block print:h-auto">
                {/* Start Timer overlay if Timer is enabled and not active */}
                {timerEnabled && !examActive && !result && !isLoading && !error && (
                  <div className="absolute inset-0 z-50 flex flex-col items-center justify-center space-y-8 p-12 text-center bg-slate-50/95 backdrop-blur-sm rounded-xl border border-slate-200 print:hidden">
                    <div className="w-24 h-24 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center shadow-inner">
                      <Timer size={48} />
                    </div>
                    <div>
                      <h2 className="text-3xl font-black text-slate-800 tracking-tight uppercase mb-2">{t.examMode}</h2>
                      <p className="text-slate-600 text-lg font-medium">{timerMinutes} {t.timerMinutes}</p>
                    </div>
                    <button
                      onClick={startExam}
                      className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xl tracking-wide shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 hover:-translate-y-1 transition-all flex items-center space-x-3"
                    >
                      <Play size={24} fill="currentColor" />
                      <span>{t.startTranslation}</span>
                    </button>
                  </div>
                )}

                {/* Editing Layout (No Result, Not Loading) */}
                {(!result && !isLoading && !error) ? (
                  <div className="w-full flex-1 flex gap-6 print:hidden">
                    <section className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                      <div className="flex flex-col space-y-2 flex-1 relative">
                        <label htmlFor="userTranslation" className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
                          {t.userTranslationLabel}
                        </label>
                        <textarea
                          id="userTranslation"
                          value={userTranslation}
                          onChange={(e) => setUserTranslation(e.target.value)}
                          className="flex-1 w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
                          placeholder={t.userTranslationPlaceholder}
                        />
                      </div>
                    </section>
                    <section className="flex-1 flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-hidden">
                      <div className="flex flex-col space-y-2 flex-1 relative">
                        <label htmlFor="sourceText" className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
                          {t.sourceTextLabel}
                        </label>
                        <textarea
                          id="sourceText"
                          value={sourceText}
                          onChange={(e) => setSourceText(e.target.value)}
                          className="flex-1 w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed"
                          placeholder={t.sourceTextPlaceholder}
                        />
                      </div>
                    </section>

                    {/* Floating Action Button for Submit */}
                    <div className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%-40px)] hover:translate-x-0 transition-transform duration-300 z-40 flex items-center h-24 group">
                      <div className="bg-slate-800 text-white w-[40px] h-full rounded-l-xl shadow-xl flex items-center justify-center cursor-pointer group-hover:bg-slate-700">
                        <span className="[writing-mode:vertical-lr] font-bold text-sm tracking-widest uppercase rotate-180 whitespace-nowrap">{t.evaluateAction}</span>
                      </div>
                      <div className="bg-slate-900 p-4 shadow-2xl h-full flex flex-col justify-center">
                        <button
                          onClick={() => handleEvaluate(false)}
                          disabled={!sourceText.trim() || !userTranslation.trim()}
                          className="py-3 px-6 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-all whitespace-nowrap"
                        >
                          {t.submitExam}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Evaluation Phase Layout (40% Input Stacked, 60% Report) */
                  <div className="w-full flex-1 flex gap-6 min-h-0 print:block print:h-auto">
                    <section className="w-[40%] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 p-6 overflow-y-auto print:w-full print:mb-6 print:border-none print:shadow-none print:overflow-visible">
                      <InputSection
                        sourceText={sourceText}
                        setSourceText={setSourceText}
                        userTranslation={userTranslation}
                        setUserTranslation={setUserTranslation}
                        onSubmit={() => handleEvaluate(false)}
                        isLoading={isLoading}
                        hoveredEvaluation={hoveredEvaluation}
                        t={t}
                        isExamMode={timerEnabled}
                        hideButton={true}
                      />
                    </section>

                    <section className="w-[60%] flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-500 print:w-full print:border-none print:shadow-none print:overflow-visible">
                      <ResultSection
                        result={result}
                        error={error}
                        isLoading={isLoading}
                        onHoverEvaluation={setHoveredEvaluation}
                        t={t}
                      />
                    </section>

                    {/* Floating Action Button for Retake */}
                    {!isLoading && (
                      <div className="fixed right-0 top-1/2 -translate-y-1/2 translate-x-[calc(100%-40px)] hover:translate-x-0 transition-transform duration-300 z-40 flex items-center h-24 group print:hidden">
                        <div className="bg-slate-800 text-white w-[40px] h-full rounded-l-xl shadow-xl flex items-center justify-center cursor-pointer group-hover:bg-slate-700">
                          <span className="[writing-mode:vertical-lr] font-bold text-sm tracking-widest uppercase rotate-180 whitespace-nowrap">{t.retakeAction}</span>
                        </div>
                        <div className="bg-slate-900 p-4 shadow-2xl h-full flex flex-col justify-center">
                          <button
                            onClick={() => {
                              setResult(null);
                              setError(null);
                              if (timerEnabled) setExamActive(false);
                            }}
                            className="py-3 px-6 bg-slate-700 hover:bg-slate-600 text-white rounded-lg font-bold text-sm uppercase tracking-wider transition-all whitespace-nowrap"
                          >
                            {t.retakeExam}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <WrittenCompSection provider={provider} apiKey={apiKey} t={t} initialRecord={writtenCompRecordToLoad} />
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;
