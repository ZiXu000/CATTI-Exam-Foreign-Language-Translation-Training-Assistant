import React from 'react';
import { EvaluationItem } from '../types';
import { AlertCircle, AlertTriangle, SpellCheck, Type } from 'lucide-react';

interface DeductionCardProps {
  item: EvaluationItem;
  index: number;
  onHoverStart?: () => void;
  onHoverEnd?: () => void;
  t: any;
}

export const DeductionCard: React.FC<DeductionCardProps> = ({ item, onHoverStart, onHoverEnd, t }) => {
  // Map error types to visual styles
  const styles = {
    'Major Mistranslation': { color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200', icon: AlertCircle },
    'Omission': { color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200', icon: AlertTriangle },
    'Grammar/Spelling': { color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200', icon: SpellCheck },
    'Inappropriate Wording': { color: 'text-amber-700', bg: 'bg-amber-50', border: 'border-amber-200', icon: Type },
  };

  const style = styles[item.error_type] || styles['Major Mistranslation'];
  const Icon = style.icon;

  return (
    <div 
      className={`rounded-xl border ${style.border} overflow-hidden bg-white shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5 cursor-crosshair`}
      onMouseEnter={onHoverStart}
      onMouseLeave={onHoverEnd}
    >
      <div className={`px-4 py-3 border-b ${style.border} ${style.bg} flex items-center justify-between`}>
        <div className="flex items-center space-x-2">
          <Icon size={16} className={style.color} />
          <span className={`text-sm font-bold tracking-wide uppercase ${style.color}`}>
            {item.error_type}
          </span>
        </div>
        <span className="text-sm font-black text-red-600 bg-white px-2 py-0.5 rounded shadow-sm border border-red-100">
          -{item.penalty.toFixed(1)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.sourceSnippet}</p>
          <div className="p-3 bg-slate-50 rounded border border-slate-100 font-serif text-slate-800">
            "{item.source_snippet}"
          </div>
        </div>

        <div>
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">{t.yourTranslation}</p>
          <div className="p-3 bg-red-50/50 rounded border border-red-100 font-serif text-slate-800">
            "{item.user_translation}"
          </div>
        </div>

        <div className="pt-2 border-t border-slate-100">
          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">{t.suggestion}</p>
          <p className="text-sm text-slate-600 leading-relaxed">
            {item.suggestion}
          </p>
        </div>
      </div>
    </div>
  );
};
