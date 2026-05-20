import React, { useState, useEffect } from 'react';
import { GenerateWrittenCompResponse } from '../types';
import { generateWrittenComp, saveExamRecord } from '../api';
import { FileText, AlertCircle, List, Play, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface WrittenCompSectionProps {
  provider: 'deepseek' | 'mimo';
  apiKey: string;
  t: any;
  initialRecord?: { vocab_text: string, reading_text: string, cloze_text: string, result: GenerateWrittenCompResponse, answers?: Record<string, string> } | null;
}

export const WrittenCompSection: React.FC<WrittenCompSectionProps> = ({ provider, apiKey, t, initialRecord }) => {
  const [vocabText, setVocabText] = useState('');
  const [readingText, setReadingText] = useState('');
  const [clozeText, setClozeText] = useState('');
  
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateWrittenCompResponse | null>(null);
  const [examState, setExamState] = useState<'input' | 'taking' | 'results'>('input');
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [score, setScore] = useState<number | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  useEffect(() => {
    if (initialRecord) {
      setVocabText(initialRecord.vocab_text || '');
      setReadingText(initialRecord.reading_text || '');
      setClozeText(initialRecord.cloze_text || '');
      setResult(initialRecord.result);
      if (initialRecord.answers) {
        setAnswers(initialRecord.answers);
      }
      setExamState('results');
      setIsSidebarOpen(false);
      calculateScore(initialRecord.result, initialRecord.answers || {});
    }
  }, [initialRecord]);

  const handleGenerate = async () => {
    if (!vocabText.trim() && !readingText.trim() && !clozeText.trim()) {
      setError('Please provide at least one source text.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please provide an API Key in the top header.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);
    setAnswers({});
    setScore(null);

    try {
      const data = await generateWrittenComp({
        vocab_text: vocabText,
        reading_text: readingText,
        cloze_text: clozeText,
        provider,
        api_key: apiKey
      });
      setResult(data);
      setExamState('taking');
      setIsSidebarOpen(false);
    } catch (err: any) {
      setError(err.message || 'An unexpected error occurred during generation.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToHistory = async () => {
    if (!result) return;
    try {
      await saveExamRecord({
        exam_type: '笔译综合能力',
        content: JSON.stringify({
          vocab_text: vocabText,
          reading_text: readingText,
          cloze_text: clozeText,
          result: result,
          answers: answers
        })
      });
      alert("Exam saved to history successfully!");
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save exam to history.");
    }
  };

  const calculateScore = (examResult: GenerateWrittenCompResponse, currentAnswers: Record<string, string>) => {
    let total = 0;
    
    // Vocab (1 pt each)
    if (examResult.data.vocab_grammar?.questions) {
      examResult.data.vocab_grammar.questions.forEach(q => {
        const correctOpt = q.options[q.correct];
        if (currentAnswers[`vocab_${q.id}`] === correctOpt) total += 1;
      });
    }

    // Reading (1 pt each)
    if (examResult.data.reading?.passages) {
      examResult.data.reading.passages.forEach(p => {
        p.questions?.forEach(q => {
          const correctOpt = q.options[q.correct];
          if (currentAnswers[`read_${p.passageId}_${q.id}`] === correctOpt) total += 1;
        });
      });
    }

    // Cloze (0.5 pt each)
    if (examResult.data.cloze?.passage?.blanks) {
      examResult.data.cloze.passage.blanks.forEach(b => {
        const correctOpt = b.options[b.correct];
        if (currentAnswers[`cloze_${b.position}`] === correctOpt) total += 0.5;
      });
    }

    setScore(total);
  };

  const handleSubmitExam = () => {
    if (result) {
      calculateScore(result, answers);
    }
    setExamState('results');
  };

  const renderOptions = (answerKey: string, options: string[], correctIndex: number, explanation?: string) => {
    const userAnswer = answers[answerKey];
    const correctOpt = options[correctIndex];
    const isCorrect = userAnswer === correctOpt;

    return (
      <>
        <div className="space-y-2 mb-4">
          {options.map((opt: string, i: number) => {
            const isThisOptionCorrect = i === correctIndex;
            const isThisOptionSelected = userAnswer === opt;
            
            let optClass = "p-3 rounded border text-left w-full transition-colors ";
            
            if (examState === 'taking') {
              optClass += isThisOptionSelected
                ? "bg-blue-50 border-blue-500 text-blue-800"
                : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50";
            } else if (examState === 'results') {
              if (isThisOptionCorrect) {
                optClass += "bg-emerald-50 border-emerald-500 text-emerald-800 font-medium";
              } else if (isThisOptionSelected && !isCorrect) {
                optClass += "bg-red-50 border-red-500 text-red-800";
              } else {
                optClass += "bg-white border-slate-200 text-slate-400 opacity-60";
              }
            }

            return (
              <button
                key={i}
                onClick={() => examState === 'taking' && setAnswers(prev => ({ ...prev, [answerKey]: opt }))}
                disabled={examState === 'results'}
                className={optClass}
              >
                {opt}
              </button>
            );
          })}
        </div>
        
        {examState === 'results' && explanation && (
          <div className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-100 mt-2">
            <span className="font-semibold text-amber-600 mr-2">解析:</span>
            {explanation}
          </div>
        )}
      </>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row gap-6 relative">
      {/* Floating Expand Button when collapsed */}
      {!isSidebarOpen && result && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center group">
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="h-20 px-2 bg-slate-800 text-slate-300 rounded-r-md flex items-center justify-center shadow-2xl hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Show Source Text"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Left Input Section */}
      <section className={`${!result ? 'flex-1' : isSidebarOpen ? 'w-[30%]' : 'hidden'} flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 p-6 transition-all duration-500 relative shrink-0 overflow-hidden`}>
        {/* Toggle Button */}
        {result && (
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors z-10"
            title="Hide Source Text"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="flex flex-col space-y-6 h-full overflow-y-auto">
          
          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-slate-700 tracking-wide uppercase mb-2 flex items-center">
              <FileText size={16} className="mr-2" />
              {t.writtenCompVocabLabel}
            </label>
            <textarea
              value={vocabText}
              onChange={(e) => setVocabText(e.target.value)}
              className="flex-1 min-h-[100px] w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs leading-relaxed"
              disabled={isLoading || examState !== 'input'}
            />
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-slate-700 tracking-wide uppercase mb-2 flex items-center">
              <FileText size={16} className="mr-2" />
              {t.writtenCompReadingLabel}
            </label>
            <textarea
              value={readingText}
              onChange={(e) => setReadingText(e.target.value)}
              className="flex-1 min-h-[100px] w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs leading-relaxed"
              disabled={isLoading || examState !== 'input'}
            />
          </div>

          <div className="flex flex-col flex-1">
            <label className="text-sm font-semibold text-slate-700 tracking-wide uppercase mb-2 flex items-center">
              <FileText size={16} className="mr-2" />
              {t.writtenCompClozeLabel}
            </label>
            <textarea
              value={clozeText}
              onChange={(e) => setClozeText(e.target.value)}
              className="flex-1 min-h-[100px] w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs leading-relaxed"
              disabled={isLoading || examState !== 'input'}
            />
          </div>

          {examState === 'input' ? (
            <button
              onClick={handleGenerate}
              disabled={(!vocabText.trim() && !readingText.trim() && !clozeText.trim()) || isLoading}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg tracking-wide shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play size={20} fill="currentColor" />
              )}
              <span>{isLoading ? t.writtenCompGeneratingBtn : t.writtenCompGenerateBtn}</span>
            </button>
          ) : (
            <button
              onClick={() => {
                setResult(null);
                setExamState('input');
                setScore(null);
                setAnswers({});
                setIsSidebarOpen(true);
              }}
              className="w-full py-4 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-lg tracking-wide transition-all flex items-center justify-center space-x-2 shrink-0"
            >
              Reset
            </button>
          )}
        </div>
      </section>

      {/* Right Exam Section */}
      {result && (
        <section className={`${isSidebarOpen ? 'w-[70%]' : 'flex-1'} flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-500 print:w-full print:border-none print:shadow-none print:overflow-visible`}>
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between shrink-0 print:bg-transparent print:border-none print:p-0 print:mb-6">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-purple-100 text-purple-600 print:hidden">
                <List size={18} />
              </div>
              <div>
                <h2 className="font-black text-slate-800 tracking-tight leading-none">{result.exam_type}</h2>
              </div>
            </div>
            <div className="flex items-center space-x-3 print:hidden">
               <button
                 onClick={() => window.print()}
                 className="flex items-center space-x-1 px-3 py-1.5 bg-slate-100 text-slate-600 rounded-md hover:bg-slate-200 transition-colors text-sm font-medium border border-slate-200"
               >
                 <Printer size={14} />
                 <span>{t.exportPDF}</span>
               </button>
               <button 
                 onClick={handleSaveToHistory}
                 className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
               >
                 <Save size={14} />
                 <span>Save</span>
               </button>
               {score !== null && (
                 <div className="text-right ml-2 border-l border-slate-200 pl-4">
                   <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">{t.scoreLabel}</p>
                   <p className="text-lg font-black text-emerald-600">{score} pt</p>
                 </div>
               )}
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-12">
            
            {/* Vocab Section */}
            {(result.data?.vocab_grammar?.questions?.length ?? 0) > 0 && (
              <div>
                <h3 className="font-black text-xl text-slate-800 border-b-2 border-slate-100 pb-3 mb-6">{t.vocabGrammarTitle}</h3>
                <div className="space-y-6">
                  {result.data.vocab_grammar!.questions.map((q, idx) => (
                    <div key={`vocab_${q.id}`} className="bg-slate-50 p-5 rounded-xl border border-slate-200">
                      <p className="font-medium text-slate-800 mb-4 text-lg">
                        <span className="mr-2 text-slate-400">{idx + 1}.</span>
                        {q.stem}
                      </p>
                      {renderOptions(`vocab_${q.id}`, q.options || [], q.correct || 0, q.explanation)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Reading Section */}
            {(result.data?.reading?.passages?.length ?? 0) > 0 && (
              <div>
                <h3 className="font-black text-xl text-slate-800 border-b-2 border-slate-100 pb-3 mb-6">{t.readingComprehensionTitle}</h3>
                <div className="space-y-10">
                  {result.data.reading!.passages.map((passage, pIdx) => (
                    <div key={`read_p_${passage.passageId}`} className="border border-slate-200 rounded-xl overflow-hidden">
                      <div className="bg-slate-100 p-5 border-b border-slate-200">
                        <h4 className="font-bold text-lg text-slate-800 mb-3">Passage {pIdx + 1}: {passage.title}</h4>
                        <p className="text-slate-700 leading-relaxed font-serif whitespace-pre-wrap">{passage.content}</p>
                      </div>
                      <div className="p-5 space-y-6 bg-slate-50">
                        {passage.questions?.map((q, qIdx) => (
                          <div key={`read_${passage.passageId}_${q.id}`}>
                            <p className="font-medium text-slate-800 mb-3">
                              <span className="mr-2 text-slate-400">{qIdx + 1}.</span>
                              {q.stem}
                            </p>
                            {renderOptions(`read_${passage.passageId}_${q.id}`, q.options || [], q.correct || 0, `${q.explanation} (Location: ${q.location})`)}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Cloze Section */}
            {result.data?.cloze?.passage?.blanks && (
              <div>
                <h3 className="font-black text-xl text-slate-800 border-b-2 border-slate-100 pb-3 mb-6">{t.clozeTestTitle}</h3>
                <div className="border border-slate-200 rounded-xl overflow-hidden">
                  <div className="bg-slate-100 p-6 border-b border-slate-200">
                    <p className="text-slate-800 leading-relaxed font-serif whitespace-pre-wrap text-lg">{result.data.cloze.passage.content}</p>
                  </div>
                  <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50">
                    {result.data.cloze.passage.blanks.map((b) => (
                      <div key={`cloze_${b.position}`} className="bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
                        <p className="font-bold text-slate-700 mb-3">Blank ({b.position})</p>
                        {renderOptions(`cloze_${b.position}`, b.options || [], b.correct || 0, b.explanation)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
            
            {examState === 'taking' && (
              <div className="mt-8 flex justify-center pb-8">
                <button
                  onClick={handleSubmitExam}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all uppercase tracking-wide"
                >
                  {t.submitExam}
                </button>
              </div>
            )}
          </div>
        </section>
      )}

      {error && !result && (
        <section className="flex-1 flex flex-col items-center justify-center bg-white rounded-2xl shadow-sm border border-red-200 p-6 text-center">
          <AlertCircle size={48} className="text-red-400 mb-4" />
          <h3 className="text-xl font-bold text-slate-800 mb-2">Generation Failed</h3>
          <p className="text-slate-600 max-w-md">{error}</p>
        </section>
      )}
    </div>
  );
};
