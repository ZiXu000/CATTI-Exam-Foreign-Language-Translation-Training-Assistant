import React from 'react';
import { EvaluationItem } from '../types';

interface InputSectionProps {
  sourceText: string;
  setSourceText: (val: string) => void;
  userTranslation: string;
  setUserTranslation: (val: string) => void;
  onSubmit: () => void;
  isLoading: boolean;
  hoveredEvaluation: EvaluationItem | null;
  t: any;
  isExamMode?: boolean;
  hideButton?: boolean;
}

export const InputSection: React.FC<InputSectionProps> = ({
  sourceText,
  setSourceText,
  userTranslation,
  setUserTranslation,
  onSubmit,
  isLoading,
  hoveredEvaluation,
  t,
  isExamMode,
  hideButton,
}) => {
  // Helper to render text with highlighted substrings
  const renderHighlightedText = (text: string, snippetToHighlight?: string) => {
    if (!snippetToHighlight || !text.includes(snippetToHighlight)) {
      return text;
    }
    const parts = text.split(snippetToHighlight);
    return (
      <>
        {parts.map((part, i) => (
          <React.Fragment key={i}>
            {part}
            {i < parts.length - 1 && (
              <mark className="bg-amber-200 text-amber-900 px-1 rounded transition-colors duration-200">
                {snippetToHighlight}
              </mark>
            )}
          </React.Fragment>
        ))}
      </>
    );
  };

  return (
    <div className="flex flex-col space-y-6 h-full relative">
      <div className="flex-1 flex flex-col space-y-2 relative">
        <label htmlFor="userTranslation" className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
          {t.userTranslationLabel}
        </label>
        
        <textarea
          id="userTranslation"
          value={userTranslation}
          onChange={(e) => setUserTranslation(e.target.value)}
          className={`flex-1 p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed transition-all ${hoveredEvaluation ? 'text-transparent caret-slate-900 bg-transparent relative z-10' : 'text-slate-900 bg-white z-10'}`}
          placeholder={t.userTranslationPlaceholder}
        />

        {hoveredEvaluation && (
          <div 
            className="absolute top-[28px] left-0 right-0 bottom-0 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words border border-transparent z-0 pointer-events-none text-slate-900 bg-white rounded-lg overflow-hidden"
            aria-hidden="true"
          >
            {renderHighlightedText(userTranslation, hoveredEvaluation.user_translation)}
          </div>
        )}
      </div>
      
      <div className="flex-1 flex flex-col space-y-2 relative">
        <label htmlFor="sourceText" className="text-sm font-semibold text-slate-700 tracking-wide uppercase">
          {t.sourceTextLabel}
        </label>
        
        {/* Textarea for input */}
        <textarea
          id="sourceText"
          value={sourceText}
          onChange={(e) => setSourceText(e.target.value)}
          className={`flex-1 p-4 border border-slate-300 rounded-lg shadow-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none resize-none font-mono text-sm leading-relaxed transition-all ${hoveredEvaluation ? 'text-transparent caret-slate-900 bg-transparent relative z-10' : 'text-slate-900 bg-white z-10'}`}
          placeholder={t.sourceTextPlaceholder}
        />
        
        {/* Overlay for highlights */}
        {hoveredEvaluation && (
          <div 
            className="absolute top-[28px] left-0 right-0 bottom-0 p-4 font-mono text-sm leading-relaxed whitespace-pre-wrap break-words border border-transparent z-0 pointer-events-none text-slate-900 bg-white rounded-lg overflow-hidden"
            aria-hidden="true"
          >
            {renderHighlightedText(sourceText, hoveredEvaluation.source_snippet)}
          </div>
        )}
      </div>

      {!hideButton && (
        <button
          onClick={onSubmit}
          disabled={isLoading || !sourceText.trim() || !userTranslation.trim()}
          className="w-full py-4 px-6 bg-slate-900 hover:bg-slate-800 text-white rounded-lg font-medium text-lg tracking-wide shadow-md disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center justify-center space-x-2 shrink-0 z-20"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{t.evaluatingBtn}</span>
            </>
          ) : (
            <span>{isExamMode ? t.submitExam : t.runEvalBtn}</span>
          )}
        </button>
      )}
    </div>
  );
};
