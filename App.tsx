
import React, { useState, useMemo, useEffect } from 'react';
import { InteractionMessage, MessageType } from '../types';
import { summarizeMessages } from '../services/gemini';
import QRCodeDisplay from './QRCodeDisplay';

interface InstructorDashboardProps {
  messages: InteractionMessage[];
  onMarkAsRead: (id: string) => void;
  onToggleAnswered: (id: string) => void;
  onDelete: (id: string) => void;
  onClearAll: () => void;
}

const InstructorDashboard: React.FC<InstructorDashboardProps> = ({ 
  messages, onMarkAsRead, onToggleAnswered, onDelete, onClearAll 
}) => {
  const [filter, setFilter] = useState<'ALL' | MessageType>('ALL');
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [copyFeedback, setCopyFeedback] = useState(false);

  const filteredMessages = useMemo(() => {
    return filter === 'ALL' ? messages : messages.filter(m => m.type === filter);
  }, [messages, filter]);

  const stats = useMemo(() => {
    const questions = messages.filter(m => m.type === MessageType.QUESTION);
    const feedback = messages.filter(m => m.type === MessageType.FEEDBACK);
    return {
      total: messages.length,
      questions: questions.length,
      feedback: feedback.length,
      unanswered: questions.filter(q => !q.isAnswered).length
    };
  }, [messages]);

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setAiSummary(null);
    try {
      const summary = await summarizeMessages(messages);
      setAiSummary(summary);
    } finally {
      setIsSummarizing(false);
    }
  };

  /**
   * 公開サーバー上でも確実にルート（学生用）を指すURLを生成します。
   * window.location.href を分解して '#' より前の部分を取得するのが最も安全です。
   */
  const studentUrl = useMemo(() => {
    // 現在のURLからハッシュ（#/instructorなど）を除去
    const baseUrl = window.location.href.split('#')[0];
    // 末尾のスラッシュを正規化してハッシュルートを付加
    const cleanBase = baseUrl.endsWith('/') ? baseUrl : baseUrl + '/';
    return `${cleanBase}#/`;
  }, []);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(studentUrl);
    setCopyFeedback(true);
    setTimeout(() => setCopyFeedback(false), 2000);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowQR(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const isLocalhost = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* サーバー状況アラート（ローカル実行時のみ表示） */}
      {isLocalhost && (
        <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-xl shadow-sm">
          <div className="flex items-center gap-3">
            <svg className="h-5 w-5 text-amber-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
            <div>
              <p className="text-amber-800 font-bold text-sm">ローカル環境で実行中です</p>
              <p className="text-amber-700 text-xs">スマホでQRコードを読み取るには、VercelやNetlifyなどの公開サーバーへデプロイが必要です。</p>
            </div>
          </div>
        </div>
      )}

      {/* 統計パネル */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-slate-500 text-sm font-medium mb-1">総投稿数</p>
          <p className="text-3xl font-bold text-slate-800">{stats.total}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-indigo-500 text-sm font-medium mb-1">未回答の質問</p>
          <p className="text-3xl font-bold text-slate-800">{stats.unanswered}</p>
        </div>
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
          <p className="text-emerald-500 text-sm font-medium mb-1">感想フィードバック</p>
          <p className="text-3xl font-bold text-slate-800">{stats.feedback}</p>
        </div>
        <button 
          onClick={() => setShowQR(true)}
          className="bg-indigo-600 text-white rounded-2xl hover:bg-indigo-700 transition-all flex flex-col items-center justify-center p-3 shadow-lg shadow-indigo-100 group"
        >
          <span className="group-hover:scale-110 transition-transform mb-1">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
            </svg>
          </span>
          <span className="text-xs font-black uppercase tracking-tighter">講義参加QRを表示</span>
        </button>
      </div>

      {/* アクションバー */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
          <button onClick={() => setFilter('ALL')} className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold rounded-lg transition-all ${filter === 'ALL' ? 'bg-white text-slate-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>すべて</button>
          <button onClick={() => setFilter(MessageType.QUESTION)} className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold rounded-lg transition-all ${filter === MessageType.QUESTION ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>質問</button>
          <button onClick={() => setFilter(MessageType.FEEDBACK)} className={`flex-1 sm:flex-none px-6 py-2 text-xs font-bold rounded-lg transition-all ${filter === MessageType.FEEDBACK ? 'bg-white text-emerald-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>感想</button>
        </div>
        
        <div className="flex gap-3 w-full sm:w-auto">
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing || messages.length === 0}
            className="flex-1 sm:flex-none px-6 py-2.5 bg-slate-900 text-white text-sm font-bold rounded-xl hover:bg-black transition-all flex items-center justify-center gap-2 disabled:opacity-30"
          >
            {isSummarizing ? <span className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full"></span> : <svg className="h-4 w-4" fill="currentColor" viewBox="0 0 20 20"><path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" /></svg>}
            AIで講義を分析
          </button>
          <button onClick={onClearAll} className="px-6 py-2.5 bg-white border border-slate-200 text-slate-500 text-sm font-bold rounded-xl hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all">リセット</button>
        </div>
      </div>

      {/* 分析結果 */}
      {aiSummary && (
        <div className="bg-indigo-600 rounded-[2rem] p-8 text-white shadow-2xl animate-scaleIn relative overflow-hidden">
          <div className="absolute -right-10 -top-10 opacity-10">
            <svg className="w-64 h-64" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clipRule="evenodd" /></svg>
          </div>
          <h3 className="text-xl font-black mb-4 flex items-center gap-2">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
            AIによる講義インサイト
          </h3>
          <div className="prose prose-invert max-w-none text-indigo-50 font-medium leading-relaxed whitespace-pre-wrap">
            {aiSummary}
          </div>
          <button onClick={() => setAiSummary(null)} className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-full text-xs font-bold transition-all">閉じる</button>
        </div>
      )}

      {/* メッセージフィード */}
      <div className="space-y-4">
        {filteredMessages.length === 0 ? (
          <div className="text-center py-24 bg-white rounded-[2.5rem] border-2 border-dashed border-slate-200">
            <p className="text-slate-400 font-bold">まだ投稿がありません</p>
          </div>
        ) : (
          filteredMessages.map((msg) => (
            <div 
              key={msg.id}
              onClick={() => onMarkAsRead(msg.id)}
              className={`group bg-white p-7 rounded-3xl shadow-sm border-l-[12px] transition-all hover:shadow-lg cursor-pointer ${
                msg.type === MessageType.QUESTION ? 'border-indigo-500' : 'border-emerald-500'
              } ${!msg.isRead ? 'ring-2 ring-indigo-500/10 bg-indigo-50/5' : ''}`}
            >
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-4">
                  <span className={`px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                    msg.type === MessageType.QUESTION ? 'bg-indigo-100 text-indigo-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>
                    {msg.type === MessageType.QUESTION ? 'Question' : 'Feedback'}
                  </span>
                  <span className="text-slate-400 text-xs font-bold">
                    {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <div className="flex gap-2">
                  <button onClick={(e) => { e.stopPropagation(); onToggleAnswered(msg.id); }} className={`p-2.5 rounded-xl transition-all ${msg.isAnswered ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-400 hover:bg-indigo-100'}`}><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg></button>
                  <button onClick={(e) => { e.stopPropagation(); onDelete(msg.id); }} className="p-2.5 bg-slate-100 text-slate-400 hover:bg-red-50 hover:text-red-600 rounded-xl transition-all"><svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg></button>
                </div>
              </div>
              <p className={`text-slate-800 text-xl leading-relaxed font-medium ${msg.isAnswered ? 'line-through text-slate-300' : ''}`}>
                {msg.content}
              </p>
            </div>
          ))
        )}
      </div>

      {/* プロジェクター用モーダル */}
      {showQR && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/95 backdrop-blur-2xl transition-all animate-fadeIn">
          <div className="bg-white rounded-[4rem] p-12 max-w-4xl w-full text-center shadow-2xl animate-scaleIn border border-white/20 overflow-y-auto max-h-[95vh]">
            <h3 className="text-6xl font-black text-slate-900 mb-6 tracking-tighter">講義に参加しよう</h3>
            <p className="text-slate-500 text-2xl mb-12 font-medium">スマホでスキャンして匿名で投稿してください</p>
            
            <div className="bg-white p-8 rounded-[4rem] border-8 border-slate-50 inline-block mb-12 shadow-2xl ring-1 ring-slate-100 transition-transform hover:scale-[1.02]">
              <QRCodeDisplay value={studentUrl} />
            </div>
            
            <div className="max-w-2xl mx-auto mb-12 space-y-6">
              <p className="text-slate-400 text-sm font-black uppercase tracking-[0.2em]">Access URL</p>
              <div className="p-8 bg-slate-50 border-4 border-dashed border-slate-200 rounded-[2.5rem] break-all group cursor-pointer hover:bg-slate-100 transition-all" onClick={handleCopyLink}>
                <span className="text-3xl font-black text-indigo-600 font-mono tracking-tight select-all">
                  {studentUrl}
                </span>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row gap-6 justify-center max-w-lg mx-auto">
              <button 
                onClick={handleCopyLink}
                className={`flex-1 py-6 px-10 rounded-3xl font-black text-xl transition-all flex items-center justify-center gap-3 ${
                  copyFeedback ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                {copyFeedback ? 'URLをコピーしました' : 'URLをコピー'}
              </button>
              
              <button 
                onClick={() => setShowQR(false)}
                className="flex-1 py-6 px-10 bg-slate-900 text-white font-black text-xl rounded-3xl hover:bg-black transition-all shadow-xl"
              >
                ダッシュボードに戻る
              </button>
            </div>
            <p className="mt-8 text-slate-300 font-bold">Escキーで閉じることができます</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default InstructorDashboard;
