import React, { useState, useEffect } from 'react';
import { GenerateExamResponse } from '../types';
import { generateExam, generateTTS, saveExamRecord } from '../api';
import { FileText, CheckCircle2, AlertCircle, List, Play, Volume2, Save, ChevronLeft, ChevronRight } from 'lucide-react';

interface InterpretationSectionProps {
  provider: 'deepseek' | 'mimo';
  apiKey: string;
  t: any;
  initialRecord?: { 
    transcript?: string, 
    true_false_transcript?: string,
    multiple_choice_transcript?: string,
    summary_transcript?: string,
    result: GenerateExamResponse, 
    ttsCache?: Record<string, string>, 
    answers?: Record<string, string> 
  } | null;
}

export const InterpretationSection: React.FC<InterpretationSectionProps> = ({ provider, apiKey, t, initialRecord }) => {
  const [transcript, setTranscript] = useState('');
  const [tfTranscript, setTfTranscript] = useState('');
  const [mcTranscript, setMcTranscript] = useState('');
  const [sumTranscript, setSumTranscript] = useState('');

  const [examType, setExamType] = useState<'口译综合能力' | '口译实务'>('口译综合能力');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerateExamResponse | null>(null);
  const [examState, setExamState] = useState<'input' | 'taking' | 'results'>('input');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  
  // TTS State
  const [playingAudioId, setPlayingAudioId] = useState<string | null>(null);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [ttsCache, setTtsCache] = useState<Record<string, string>>({});

  // Answers State
  const [answers, setAnswers] = useState<Record<string, string>>({});

  useEffect(() => {
    if (initialRecord) {
      setTranscript(initialRecord.transcript || '');
      setTfTranscript(initialRecord.true_false_transcript || '');
      setMcTranscript(initialRecord.multiple_choice_transcript || '');
      setSumTranscript(initialRecord.summary_transcript || '');
      setResult(initialRecord.result);
      if (initialRecord.result.exam_type) {
        setExamType(initialRecord.result.exam_type as '口译综合能力' | '口译实务');
      }
      if (initialRecord.ttsCache) {
        setTtsCache(initialRecord.ttsCache);
      }
      if (initialRecord.answers) {
        setAnswers(initialRecord.answers);
      }
      setExamState('results');
      setIsSidebarOpen(false);
    }
  }, [initialRecord]);

  const handleGenerate = async () => {
    if (examType === '口译实务' && !transcript.trim()) {
      setError('Please provide the audio transcript.');
      return;
    }
    if (examType === '口译综合能力' && !tfTranscript.trim() && !mcTranscript.trim() && !sumTranscript.trim()) {
      setError('Please provide at least one source transcript.');
      return;
    }
    if (!apiKey.trim()) {
      setError('Please provide an API Key in the top header.');
      return;
    }

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const data = await generateExam({
        transcript,
        true_false_transcript: tfTranscript,
        multiple_choice_transcript: mcTranscript,
        summary_transcript: sumTranscript,
        exam_type: examType,
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

  const handlePlayTTS = async (id: string, text: string) => {
    if (!apiKey.trim()) {
      alert("Please provide an API Key to use TTS.");
      return;
    }
    
    setPlayingAudioId(id);

    // Check cache first
    if (ttsCache[id]) {
      setAudioSrc(ttsCache[id]);
      return;
    }

    try {
      const base64Audio = await generateTTS(text, apiKey, "Chloe");
      const src = `data:audio/wav;base64,${base64Audio}`;
      setAudioSrc(src);
      setTtsCache(prev => ({ ...prev, [id]: src }));
    } catch (err) {
      console.error("TTS failed:", err);
      alert("Failed to play audio.");
      setPlayingAudioId(null);
      setAudioSrc(null);
    }
  };

  const handleSaveToHistory = async () => {
    if (!result) return;
    try {
      await saveExamRecord({
        exam_type: result.exam_type,
        content: JSON.stringify({
          transcript: transcript,
          true_false_transcript: tfTranscript,
          multiple_choice_transcript: mcTranscript,
          summary_transcript: sumTranscript,
          result: result,
          ttsCache: ttsCache,
          answers: answers
        })
      });
      alert("Exam saved to history successfully!");
    } catch (err) {
      console.error("Failed to save:", err);
      alert("Failed to save exam to history.");
    }
  };

  const handleSubmitExam = () => {
    setExamState('results');
  };

  const renderTrueFalse = (questions: any[]) => {
    return (
      <div className="space-y-4">
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer === q.answer;
          return (
            <div key={q.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between">
                <p className="font-medium text-slate-800">
                  <span className="mr-2 text-slate-400">{idx + 1}.</span>
                  {q.statement}
                </p>
                <button 
                  onClick={() => handlePlayTTS(q.id, q.statement)}
                  disabled={playingAudioId === q.id}
                  className="ml-2 p-1 text-slate-500 hover:text-blue-600 transition-colors shrink-0"
                >
                  <Volume2 size={16} className={playingAudioId === q.id ? "animate-pulse text-blue-600" : ""} />
                </button>
              </div>
              
              <div className="mt-4 flex space-x-4">
                {['True', 'False'].map(opt => {
                  let btnClass = "px-4 py-2 rounded-md border text-sm font-medium transition-colors ";
                  
                  if (examState === 'taking') {
                    btnClass += userAnswer === opt 
                      ? "bg-blue-100 border-blue-500 text-blue-700" 
                      : "bg-white border-slate-300 text-slate-600 hover:bg-slate-50";
                  } else if (examState === 'results') {
                    if (opt === q.answer) {
                      btnClass += "bg-emerald-100 border-emerald-500 text-emerald-700"; // Correct answer is always green
                    } else if (userAnswer === opt && !isCorrect) {
                      btnClass += "bg-red-100 border-red-500 text-red-700"; // User's wrong answer is red
                    } else {
                      btnClass += "bg-white border-slate-200 text-slate-400 opacity-50"; // Unselected wrong options
                    }
                  }

                  return (
                    <button
                      key={opt}
                      onClick={() => examState === 'taking' && setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      disabled={examState === 'results'}
                      className={btnClass}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>

              {examState === 'results' && (
                <div className="mt-3 text-sm text-slate-600 bg-white p-3 rounded border border-slate-100">
                  <span className="font-semibold text-amber-600 mr-2">解析:</span>
                  {q.distractor_logic}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderMultipleChoice = (title: string, questions: any[]) => {
    if (!questions || questions.length === 0) return null;
    return (
      <div className="space-y-4 mt-8">
        <h4 className="font-bold text-md text-slate-700">{title}</h4>
        {questions.map((q, idx) => {
          const userAnswer = answers[q.id];
          const isCorrect = userAnswer && userAnswer.startsWith(q.correct_answer);
          return (
            <div key={q.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200">
              <div className="flex items-start justify-between mb-3">
                <p className="font-medium text-slate-800">
                  <span className="mr-2 text-slate-400">{idx + 1}.</span>
                  {q.question}
                </p>
                <button 
                  onClick={() => handlePlayTTS(q.id, q.question)}
                  disabled={playingAudioId === q.id}
                  className="ml-2 p-1 text-slate-500 hover:text-blue-600 transition-colors shrink-0"
                >
                  <Volume2 size={16} className={playingAudioId === q.id ? "animate-pulse text-blue-600" : ""} />
                </button>
              </div>
              
              <div className="space-y-2 mb-4">
                {q.options.map((opt: string, i: number) => {
                  const isThisOptionCorrect = opt.startsWith(q.correct_answer);
                  const isThisOptionSelected = userAnswer === opt;
                  
                  let optClass = "p-3 rounded border text-left w-full transition-colors ";
                  
                  if (examState === 'taking') {
                    optClass += isThisOptionSelected
                      ? "bg-blue-50 border-blue-500 text-blue-800"
                      : "bg-white border-slate-200 text-slate-600 hover:border-blue-300 hover:bg-slate-50";
                  } else if (examState === 'results') {
                    if (isThisOptionCorrect) {
                      optClass += "bg-emerald-50 border-emerald-500 text-emerald-800 font-medium"; // Correct answer is green
                    } else if (isThisOptionSelected && !isCorrect) {
                      optClass += "bg-red-50 border-red-500 text-red-800"; // User's wrong answer is red
                    } else {
                      optClass += "bg-white border-slate-200 text-slate-400 opacity-60"; // Unselected wrong options
                    }
                  }

                  return (
                    <button
                      key={i}
                      onClick={() => examState === 'taking' && setAnswers(prev => ({ ...prev, [q.id]: opt }))}
                      disabled={examState === 'results'}
                      className={optClass}
                    >
                      {opt}
                    </button>
                  );
                })}
              </div>
              
              {examState === 'results' && (
                <div className="text-sm text-slate-600 bg-white p-3 rounded border border-slate-100">
                  <span className="font-semibold text-amber-600 mr-2">解析:</span>
                  {q.distractor_logic}
                </div>
              )}
            </div>
          );
        })}
      </div>
    );
  };

  const renderSummaryRubric = (rubric: any) => {
    if (examState !== 'results') return null;
    
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 mb-4">
          <p className="text-sm text-blue-800 font-medium">Source Word Count: {rubric.source_word_count}</p>
          <p className="text-sm text-blue-800 font-medium">Target Word Count: {rubric.required_word_count_target}</p>
        </div>
        <ul className="space-y-2">
          {rubric.key_scoring_points.map((point: string, i: number) => (
            <li key={i} className="flex items-start">
              <CheckCircle2 size={18} className="text-emerald-500 mr-2 mt-0.5 shrink-0" />
              <span className="text-slate-700">{point}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  const renderChunks = (chunks: any[]) => {
    return (
      <div className="space-y-6">
        <h3 className="font-bold text-lg text-slate-800 border-b pb-2">{t.practiceChunksTitle}</h3>
        {chunks.map((chunk, idx) => (
          <div key={chunk.id} className="bg-slate-50 p-4 rounded-lg border border-slate-200 relative group">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-emerald-400 rounded-l-lg"></div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chunk {idx + 1}</span>
              <div className="flex items-center space-x-2">
                {chunk.start_time && chunk.end_time && (
                  <span className="text-xs font-mono bg-white px-2 py-1 rounded border border-slate-200 text-slate-500">
                    {chunk.start_time} - {chunk.end_time}
                  </span>
                )}
                <button 
                  onClick={() => handlePlayTTS(chunk.id, chunk.text)}
                  disabled={playingAudioId === chunk.id}
                  className="p-1.5 bg-blue-100 text-blue-600 rounded hover:bg-blue-200 transition-colors flex items-center"
                >
                  <Volume2 size={14} className={playingAudioId === chunk.id ? "animate-pulse" : ""} />
                  <span className="text-xs ml-1 font-bold">Play</span>
                </button>
              </div>
            </div>
            
            {examState === 'taking' && (
              <textarea
                value={answers[chunk.id] || ''}
                onChange={(e) => setAnswers(prev => ({ ...prev, [chunk.id]: e.target.value }))}
                placeholder="在此输入你的分段译文..."
                className="w-full mt-2 p-3 border border-slate-300 rounded-lg shadow-inner focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-sans text-sm leading-relaxed"
                rows={3}
              />
            )}

            {examState === 'results' && (
              <div className="space-y-4">
                {answers[chunk.id] && (
                  <div className="bg-blue-50 p-3 rounded border border-blue-100">
                    <span className="text-xs font-bold text-blue-500 uppercase block mb-1">Your Translation</span>
                    <p className="text-slate-800 font-medium text-sm leading-relaxed">{answers[chunk.id]}</p>
                  </div>
                )}
                <div className="bg-white p-3 rounded border border-slate-200">
                  <span className="text-xs font-bold text-emerald-500 uppercase block mb-1">Source Text</span>
                  <p className="text-slate-700 font-medium text-sm leading-relaxed">{chunk.text}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="w-full flex-1 flex flex-col lg:flex-row gap-6 relative">
      {/* Floating Play Button when collapsed */}
      {!isSidebarOpen && result && (
        <div className="fixed left-0 top-1/2 -translate-y-1/2 z-50 flex items-center group">
          <button
            onClick={() => handlePlayTTS('full-transcript', transcript)}
            disabled={playingAudioId === 'full-transcript'}
            className="w-14 h-20 bg-indigo-600 text-white rounded-r-xl flex flex-col items-center justify-center shadow-2xl hover:bg-indigo-500 transition-all hover:w-16"
            title="Play Audio"
          >
            <Volume2 size={24} className={playingAudioId === 'full-transcript' ? "animate-pulse" : ""} />
          </button>
          <button
            onClick={() => setIsSidebarOpen(true)}
            className="h-16 px-1 bg-slate-800 text-slate-300 rounded-r-md flex items-center justify-center shadow-lg hover:text-white transition-all opacity-0 group-hover:opacity-100 cursor-pointer"
            title="Show Transcript"
          >
            <ChevronRight size={18} />
          </button>
        </div>
      )}

      {/* Left Input Section */}
      <section className={`${!result ? 'flex-1' : isSidebarOpen ? 'w-[40%]' : 'hidden'} flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 transition-all duration-500 relative shrink-0 overflow-hidden`}>
        {/* Toggle Button */}
        {result && (
          <button 
            onClick={() => setIsSidebarOpen(false)}
            className="absolute top-4 right-4 p-1.5 bg-slate-100 text-slate-500 rounded hover:bg-slate-200 transition-colors z-10"
            title="Hide Transcript"
          >
            <ChevronLeft size={18} />
          </button>
        )}

        <div className="flex flex-col h-full p-6 overflow-y-auto">
          <div className="flex items-center justify-between mb-4 pr-8 shrink-0">
            <label htmlFor="transcript" className="text-sm font-semibold text-slate-700 tracking-wide uppercase flex items-center">
              <FileText size={16} className="mr-2" />
              {examType === '口译实务' ? t.interpTranscriptLabel : "Source Transcripts"}
            </label>
            <div className="flex items-center space-x-2 bg-slate-100 p-1 rounded-lg border border-slate-200">
              <button
                onClick={() => setExamType('口译综合能力')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${examType === '口译综合能力' ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                disabled={examState !== 'input'}
              >
                {t.examTypeComprehensive}
              </button>
              <button
                onClick={() => setExamType('口译实务')}
                className={`px-3 py-1.5 text-xs font-bold rounded-md transition-colors ${examType === '口译实务' ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                disabled={examState !== 'input'}
              >
                {t.examTypePractice}
              </button>
            </div>
          </div>

          {examType === '口译实务' ? (
            <textarea
              id="transcript"
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              className="flex-1 w-full p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed mb-4"
              placeholder={t.interpTranscriptPlaceholder}
              disabled={isLoading || examState !== 'input'}
            />
          ) : (
            <div className="flex-1 flex flex-col space-y-4 mb-4">
              <div className="flex flex-col flex-1">
                <label className="text-xs font-semibold text-slate-600 mb-1">{t.interpTfTranscriptLabel}</label>
                <textarea
                  value={tfTranscript}
                  onChange={(e) => setTfTranscript(e.target.value)}
                  className="flex-1 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs leading-relaxed"
                  disabled={isLoading || examState !== 'input'}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-semibold text-slate-600 mb-1">{t.interpMcTranscriptLabel}</label>
                <textarea
                  value={mcTranscript}
                  onChange={(e) => setMcTranscript(e.target.value)}
                  className="flex-1 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs leading-relaxed"
                  disabled={isLoading || examState !== 'input'}
                />
              </div>
              <div className="flex flex-col flex-1">
                <label className="text-xs font-semibold text-slate-600 mb-1">{t.interpSumTranscriptLabel}</label>
                <textarea
                  value={sumTranscript}
                  onChange={(e) => setSumTranscript(e.target.value)}
                  className="flex-1 w-full p-3 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 outline-none resize-none font-mono text-xs leading-relaxed"
                  disabled={isLoading || examState !== 'input'}
                />
              </div>
            </div>
          )}

          {examState === 'input' ? (
            <button
              onClick={handleGenerate}
              disabled={(examType === '口译实务' ? !transcript.trim() : (!tfTranscript.trim() && !mcTranscript.trim() && !sumTranscript.trim())) || isLoading}
              className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-xl font-bold text-lg tracking-wide shadow-lg hover:-translate-y-0.5 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2 shrink-0"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <Play size={20} fill="currentColor" />
              )}
              <span>{isLoading ? t.interpGeneratingBtn : t.interpGenerateBtn}</span>
            </button>
          ) : (
            <div className="flex items-center space-x-3 shrink-0">
              {examType === '口译实务' && transcript.trim() && (
                <button
                  onClick={() => handlePlayTTS('full-transcript', transcript)}
                  disabled={playingAudioId === 'full-transcript'}
                  className="flex-1 py-4 px-6 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl font-bold text-lg tracking-wide transition-all flex items-center justify-center space-x-2 disabled:opacity-50"
                >
                  <Volume2 size={20} className={playingAudioId === 'full-transcript' ? "animate-pulse" : ""} />
                  <span>Play Audio</span>
                </button>
              )}
              <button
                onClick={() => {
                  setResult(null);
                  setExamState('input');
                  setIsSidebarOpen(true);
                  setAnswers({});
                }}
                className="flex-1 py-4 px-6 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-xl font-bold text-lg tracking-wide transition-all flex items-center justify-center space-x-2"
              >
                Reset
              </button>
            </div>
          )}
        </div>
      </section>

      {result && (
        <section className={`${isSidebarOpen ? 'w-[60%]' : 'flex-1'} flex flex-col bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden relative transition-all duration-500`}>
          <div className="bg-slate-50 p-4 border-b border-slate-200 flex items-center justify-between shrink-0">
            <div className="flex items-center space-x-2">
              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${result.exam_type === '口译综合能力' ? 'bg-blue-100 text-blue-600' : 'bg-emerald-100 text-emerald-600'}`}>
                <List size={18} />
              </div>
              <div>
                <h2 className="font-black text-slate-800 tracking-tight leading-none">{t.interpResultTitle}</h2>
                <p className="text-xs text-slate-500 mt-1">{result.exam_type}</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
               <button 
                 onClick={handleSaveToHistory}
                 className="flex items-center space-x-1 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
               >
                 <Save size={14} />
                 <span>Save</span>
               </button>
               <div className="text-right ml-2 border-l border-slate-200 pl-4">
                 <p className="text-xs text-slate-400 font-mono uppercase tracking-wider">Audio Meta</p>
                 <p className="text-sm font-bold text-slate-700">{result.audio_meta.word_count} Words</p>
               </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6">
            {result.exam_type === '口译综合能力' && result.questions && (
              <div className="space-y-12">
                <div>
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-6">
                    <h3 className="font-black text-xl text-slate-800">{t.trueFalseQuestions}</h3>
                    {tfTranscript.trim() && (
                      <button
                        onClick={() => handlePlayTTS('tf-transcript', tfTranscript)}
                        disabled={playingAudioId === 'tf-transcript'}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                      >
                        <Volume2 size={14} className={playingAudioId === 'tf-transcript' ? "animate-pulse" : ""} />
                        <span>Play Audio</span>
                      </button>
                    )}
                  </div>
                  {renderTrueFalse(result.questions.true_or_false)}
                </div>

                <div>
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-6">
                    <h3 className="font-black text-xl text-slate-800">Multiple Choice</h3>
                    {mcTranscript.trim() && (
                      <button
                        onClick={() => handlePlayTTS('mc-transcript', mcTranscript)}
                        disabled={playingAudioId === 'mc-transcript'}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                      >
                        <Volume2 size={14} className={playingAudioId === 'mc-transcript' ? "animate-pulse" : ""} />
                        <span>Play Audio</span>
                      </button>
                    )}
                  </div>
                  {renderMultipleChoice(t.multipleChoiceShort, result.questions.multiple_choice_short)}
                  {renderMultipleChoice(t.multipleChoicePassage, result.questions.multiple_choice_passage)}
                </div>

                <div>
                  <div className="flex items-center justify-between border-b-2 border-slate-100 pb-3 mb-6">
                    <h3 className="font-black text-xl text-slate-800">{t.summaryRubricTitle}</h3>
                    {sumTranscript.trim() && (
                      <button
                        onClick={() => handlePlayTTS('sum-transcript', sumTranscript)}
                        disabled={playingAudioId === 'sum-transcript'}
                        className="flex items-center space-x-1 px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-md hover:bg-indigo-100 transition-colors text-sm font-medium"
                      >
                        <Volume2 size={14} className={playingAudioId === 'sum-transcript' ? "animate-pulse" : ""} />
                        <span>Play Audio</span>
                      </button>
                    )}
                  </div>
                  {renderSummaryRubric(result.questions.summary_rubric)}
                </div>
              </div>
            )}
            
            {result.exam_type === '口译实务' && result.practice_data && (
              <>
                {renderChunks(result.practice_data.chunks)}
              </>
            )}
            
            {examState === 'taking' && (
              <div className="mt-8 flex justify-center pb-8">
                <button
                  onClick={handleSubmitExam}
                  className="px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-600/30 transition-all uppercase tracking-wide"
                >
                  Submit & Show Results
                </button>
              </div>
            )}
          </div>
          
          {audioSrc && (
            <div className="bg-slate-50 border-t border-slate-200 p-4 sticky bottom-0 z-10 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)]">
              <audio 
                controls 
                autoPlay 
                src={audioSrc} 
                onEnded={() => setPlayingAudioId(null)} 
                className="w-full h-10 outline-none"
              />
            </div>
          )}
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
