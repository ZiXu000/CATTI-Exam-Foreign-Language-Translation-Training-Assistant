import React, { useState, useEffect } from 'react';
import { getExamRecords, deleteExamRecord, toggleFavorite } from '../api';
import { BookOpen, Star, Trash2, Search, AlertCircle, ArrowRight } from 'lucide-react';

interface HistorySectionProps {
  t: any;
  onLoadRecord: (record: any) => void;
}

export const HistorySection: React.FC<HistorySectionProps> = ({ t, onLoadRecord }) => {
  const [records, setRecords] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterFavorite, setFilterFavorite] = useState(false);

  useEffect(() => {
    fetchRecords();
  }, []);

  const fetchRecords = async () => {
    setIsLoading(true);
    try {
      const data = await getExamRecords();
      setRecords(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load history.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm(t.historyConfirmDelete || 'Are you sure you want to delete this record?')) return;
    try {
      await deleteExamRecord(id);
      setRecords(records.filter(r => r.id !== id));
    } catch (err) {
      alert('Failed to delete record.');
    }
  };

  const handleToggleFavorite = async (id: number, currentStatus: boolean) => {
    try {
      const updated = await toggleFavorite(id, !currentStatus);
      setRecords(records.map(r => r.id === id ? updated : r));
    } catch (err) {
      alert('Failed to update favorite status.');
    }
  };

  const filteredRecords = records.filter(r => {
    if (filterFavorite && !r.is_favorite) return false;
    if (filterType !== 'all' && r.exam_type !== filterType) return false;
    if (searchTerm) {
      const searchStr = searchTerm.toLowerCase();
      const content = r.content ? r.content.toLowerCase() : '';
      return r.exam_type.toLowerCase().includes(searchStr) || content.includes(searchStr);
    }
    return true;
  });

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col h-full bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row gap-4 items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="bg-blue-100 text-blue-600 p-2 rounded-lg">
            <BookOpen size={24} />
          </div>
          <h2 className="text-2xl font-black text-slate-800">{t.historyArchiveTitle}</h2>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input 
              type="text" 
              placeholder={t.historySearchPlaceholder} 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 pr-4 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none w-48"
            />
          </div>
          
          <select 
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 bg-white border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="all">{t.historyFilterAll}</option>
            <option value="written">{t.homeWrittenMode}</option>
            <option value="口译综合能力">{t.examTypeComprehensive}</option>
            <option value="口译实务">{t.examTypePractice}</option>
            <option value="笔译综合能力">{t.homeWrittenCompMode}</option>
          </select>
          
          <button 
            onClick={() => setFilterFavorite(!filterFavorite)}
            className={`px-3 py-2 rounded-lg text-sm font-medium border flex items-center space-x-1 transition-colors ${filterFavorite ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-slate-300 text-slate-600'}`}
          >
            <Star size={16} fill={filterFavorite ? "currentColor" : "none"} />
            <span>{t.historyFilterFavorites}</span>
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-6 bg-slate-100">
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <AlertCircle size={48} className="text-red-400 mb-4" />
            <p className="text-slate-600">{error}</p>
          </div>
        ) : filteredRecords.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center text-slate-500">
            <BookOpen size={48} className="text-slate-300 mb-4" />
            <p>{t.historyNoRecords}</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredRecords.map(record => (
              <div key={record.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-shadow flex flex-col">
                <div className="flex justify-between items-start mb-3">
                  <span className={`px-2.5 py-1 text-xs font-bold rounded-md uppercase tracking-wider ${
                    record.exam_type === 'written' ? 'bg-blue-50 text-blue-700' : 
                    record.exam_type === '笔译综合能力' ? 'bg-purple-50 text-purple-700' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {record.exam_type === 'written' ? t.historyTypeWritten : record.exam_type}
                  </span>
                  <div className="flex items-center space-x-2">
                    <button 
                      onClick={() => handleToggleFavorite(record.id, record.is_favorite)}
                      className="text-slate-400 hover:text-amber-500 transition-colors"
                    >
                      <Star size={18} fill={record.is_favorite ? "currentColor" : "none"} className={record.is_favorite ? "text-amber-500" : ""} />
                    </button>
                    <button 
                      onClick={() => handleDelete(record.id)}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
                
                <p className="text-sm text-slate-500 mb-4 flex-1">
                  {t.historyCreatedAt} {new Date(record.created_at).toLocaleString()}
                </p>
                <div className="text-sm font-medium text-slate-600 line-clamp-2 mb-4 bg-slate-50 p-2 rounded border border-slate-100">
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
                
                <button 
                  onClick={() => onLoadRecord(record)}
                  className="w-full py-2 bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium rounded-lg text-sm flex items-center justify-center transition-colors"
                >
                  <span>{t.historyReviewBtn}</span>
                  <ArrowRight size={16} className="ml-1" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};