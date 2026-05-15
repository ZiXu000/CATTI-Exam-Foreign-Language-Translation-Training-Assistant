import React, { useRef, useState } from 'react';
import { GraderResponse, EvaluationItem } from '../types';
import { DeductionCard } from './DeductionCard';
import { FileText, BookOpen, CheckCircle, Download } from 'lucide-react';
import html2canvas from 'html2canvas';

interface ResultSectionProps {
  result: GraderResponse | null;
  error: string | null;
  isLoading: boolean;
  onHoverEvaluation?: (item: EvaluationItem | null) => void;
  t: any;
}

type TabType = 'report' | 'glossary' | 'gold_standard';

export const ResultSection: React.FC<ResultSectionProps> = ({ result, error, isLoading, onHoverEvaluation, t }) => {
  const [activeTab, setActiveTab] = useState<TabType>('report');
  const [isExporting, setIsExporting] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleExport = async () => {
    if (!containerRef.current) return;
    try {
      setIsExporting(true);
      
      // Temporary style adjustments for export
      const originalHeight = containerRef.current.style.height;
      const originalOverflow = containerRef.current.style.overflow;
      containerRef.current.style.height = 'auto';
      containerRef.current.style.overflow = 'visible';

      const canvas = await html2canvas(containerRef.current, {
        scale: 2,
        backgroundColor: '#ffffff',
        windowWidth: containerRef.current.scrollWidth,
        windowHeight: containerRef.current.scrollHeight,
      });
      
      // Restore styles
      containerRef.current.style.height = originalHeight;
      containerRef.current.style.overflow = originalOverflow;

      const image = canvas.toDataURL("image/png");
      const link = document.createElement('a');
      link.download = `CATTI_Evaluation_${new Date().getTime()}.png`;
      link.href = image;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-slate-500 font-medium tracking-wider uppercase text-sm">{t.evaluatingBtn}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-full p-8 bg-red-50 border border-red-200 rounded-xl flex items-center justify-center">
        <div className="text-center space-y-4 max-w-lg">
          <div className="w-16 h-16 bg-red-100 text-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-red-800">{t.evalFailed}</h3>
          <p className="text-red-600 font-mono text-sm leading-relaxed">{error}</p>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="h-full flex items-center justify-center bg-slate-50 border-2 border-dashed border-slate-200 rounded-xl">
        <div className="text-center">
          <p className="text-slate-400 font-medium tracking-wider uppercase text-sm">{t.waitingInput}</p>
        </div>
      </div>
    );
  }

  const scoreColor = result.final_score >= 80 ? 'text-green-500' : result.final_score >= 60 ? 'text-amber-500' : 'text-red-500';

  return (
    <div className="h-full flex flex-col bg-slate-50/50">
      <div ref={containerRef} className="flex flex-col h-full bg-white relative">
        {/* Header & Score */}
        <div className="bg-white p-6 border-b border-slate-200 shadow-sm shrink-0">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-bold text-slate-800 uppercase tracking-wide">{t.evalReportTitle}</h2>
              <p className="text-sm text-slate-500 mt-1">{t.evalReportSubtitle}</p>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <div className="text-5xl font-black tracking-tighter">
                  <span className={scoreColor}>{result.final_score.toFixed(1)}</span>
                  <span className="text-2xl text-slate-300 ml-1">/ 100</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs & Export Button */}
        <div className="bg-white px-6 border-b border-slate-200 shrink-0 flex items-center justify-between">
          <div className="flex space-x-6">
            <button
              onClick={() => setActiveTab('report')}
              className={`py-3 px-1 flex items-center space-x-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'report' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <FileText size={16} />
              <span>{t.reportTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('glossary')}
              className={`py-3 px-1 flex items-center space-x-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'glossary' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <BookOpen size={16} />
              <span>{t.glossaryTab}</span>
            </button>
            <button
              onClick={() => setActiveTab('gold_standard')}
              className={`py-3 px-1 flex items-center space-x-2 font-medium text-sm border-b-2 transition-colors ${
                activeTab === 'gold_standard' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'
              }`}
            >
              <CheckCircle size={16} />
              <span>{t.goldStandardTab}</span>
            </button>
          </div>
          
          <button 
            onClick={handleExport}
            disabled={isExporting}
            className="flex items-center space-x-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-md text-xs font-bold uppercase tracking-wider transition-colors"
            data-html2canvas-ignore
          >
            <Download size={14} />
            <span>{isExporting ? '...' : t.exportReport}</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {activeTab === 'report' && (
            <>
              {result.evaluations.length === 0 ? (
                <div className="text-center py-12 text-slate-500">
                  <p className="text-lg font-medium">{t.perfectTranslation}</p>
                  <p className="text-sm">{t.noDeductions}</p>
                </div>
              ) : (
                result.evaluations.map((item, idx) => (
                  <DeductionCard 
                    key={idx} 
                    item={item} 
                    index={idx} 
                    onHoverStart={() => onHoverEvaluation && onHoverEvaluation(item)}
                    onHoverEnd={() => onHoverEvaluation && onHoverEvaluation(null)}
                    t={t}
                  />
                ))
              )}
            </>
          )}

          {activeTab === 'glossary' && (
            <div className="grid grid-cols-1 gap-4">
              {(!result.glossary || result.glossary.length === 0) ? (
                <p className="text-center text-slate-500 py-12">{t.noGlossary}</p>
              ) : (
                result.glossary.map((item, idx) => (
                  <div key={idx} className="p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
                    <div className="flex items-baseline space-x-3 mb-2">
                      <h3 className="text-lg font-bold text-slate-900">{item.word}</h3>
                      <span className="text-sm font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded">
                        {item.pos}
                      </span>
                    </div>
                    <p className="text-slate-700 mb-3">{item.definition}</p>
                    <div className="bg-slate-50 p-3 rounded-lg border border-slate-100">
                      <p className="text-sm text-slate-600 italic">"{item.example}"</p>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {activeTab === 'gold_standard' && (
            <div className="p-6 bg-white border border-slate-200 rounded-xl shadow-sm">
              <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4 flex items-center">
                <CheckCircle size={16} className="mr-2 text-green-500" />
                {t.refTranslationTitle}
              </h3>
              <p className="text-slate-800 leading-relaxed font-serif text-lg whitespace-pre-wrap">
                {result.gold_standard}
              </p>
            </div>
          )}
        </div>
        
        {/* Watermark for Export */}
        <div className="hidden pb-4 text-center text-slate-300 font-mono text-xs" style={{ display: isExporting ? 'block' : 'none' }}>
          {t.watermark}
        </div>
      </div>
    </div>
  );
};
