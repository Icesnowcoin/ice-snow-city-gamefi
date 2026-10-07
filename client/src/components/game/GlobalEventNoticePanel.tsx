import React, { useEffect, useRef, useState } from 'react';
import { Bell, CheckCircle2, ChevronDown, ChevronUp, History, Info, X, Zap } from 'lucide-react';
import { Card } from '@/components/ui/card';

export type GlobalEventNotice = {
  id: number;
  message: string;
  kind: 'success' | 'warning' | 'info';
  createdAt: number;
};

type GlobalEventNoticePanelProps = {
  initiallyCollapsed?: boolean;
  notices: GlobalEventNotice[];
  history: GlobalEventNotice[];
  onDismiss: (id: number) => void;
  onClear: () => void;
  onHistoryDismiss: (id: number) => void;
  onHistoryClear: () => void;
};

const iconByKind = {
  success: CheckCircle2,
  warning: Zap,
  info: Info,
};

export const GlobalEventNoticePanel: React.FC<GlobalEventNoticePanelProps> = ({ notices, history, onDismiss, onClear, onHistoryDismiss, onHistoryClear, initiallyCollapsed = false }) => {
  const [expanded, setExpanded] = useState(!initiallyCollapsed);
  const [historyOpen, setHistoryOpen] = useState(false);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (expanded && listRef.current) {
      if (typeof listRef.current.scrollTo === 'function') listRef.current.scrollTo({ top: 0, behavior: 'smooth' });
      else listRef.current.scrollTop = 0;
    }
  }, [expanded, notices.length]);

  return (
    <Card
      data-testid="global-event-notice-panel"
      className={`global-event-notice-panel fixed right-3 z-40 w-[min(20rem,calc(100vw-1.5rem))] border-cyan-300/35 bg-slate-950/94 text-slate-100 shadow-2xl shadow-cyan-950/30 backdrop-blur-md sm:right-5 ${expanded ? 'global-event-notice-panel--expanded' : 'global-event-notice-panel--collapsed'}`}
      aria-label="全局事件通知"
    >
      <div className="flex items-center justify-between gap-2 border-b border-cyan-300/20 px-3 py-2.5">
        <button type="button" className="flex min-w-0 items-center gap-2 text-left" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-controls="global-event-notice-list">
          <span className="relative grid h-8 w-8 shrink-0 place-items-center rounded-lg border border-cyan-300/40 bg-cyan-300/10">
            <Bell className="h-4 w-4 text-cyan-200" aria-hidden="true" />
            {notices.length > 0 && <span className="global-event-notice-count" aria-label={`${notices.length} 条未读事件`}>{Math.min(notices.length, 9)}</span>}
          </span>
          <span className="min-w-0"><span className="block text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">实时事件</span><span className="block truncate text-sm font-semibold text-cyan-50">城市消息通知</span></span>
          {expanded ? <ChevronUp className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" /> : <ChevronDown className="h-4 w-4 shrink-0 text-slate-400" aria-hidden="true" />}
        </button>
        <div className="flex items-center gap-1">
          <button type="button" className="global-event-notice-history-button" onClick={() => setHistoryOpen(true)} aria-label={`历史记录，共 ${history.length} 条`}>
            <History className="mr-1 h-3.5 w-3.5" aria-hidden="true" />历史记录{history.length > 0 ? ` (${history.length})` : ''}
          </button>
          {notices.length > 0 && <button type="button" className="global-event-notice-clear" onClick={onClear}>清空</button>}
        </div>
      </div>
      {expanded && (
        <div id="global-event-notice-list" ref={listRef} className="global-event-notice-list" role="log" aria-live="polite" aria-relevant="additions text">
          {notices.length === 0 ? (
            <p className="px-3 py-4 text-center text-xs text-slate-500">暂无重要事件，城市运行正常。</p>
          ) : notices.map((notice) => {
            const Icon = iconByKind[notice.kind];
            return (
              <div key={notice.id} className={`global-event-notice global-event-notice--${notice.kind} ${notice.message.startsWith('危机已解除') ? 'global-event-notice--recovered' : ''}`} data-testid={`global-event-notice-${notice.id}`}>
                <Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                <p className="min-w-0 flex-1 text-xs leading-5">{notice.message}</p>
                <button type="button" className="global-event-notice-dismiss" onClick={() => onDismiss(notice.id)} aria-label={`关闭通知：${notice.message}`}><X className="h-3.5 w-3.5" /></button>
              </div>
            );
          })}
        </div>
      )}
      {historyOpen && (
        <div className="global-event-history-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) setHistoryOpen(false); }}>
          <div className="global-event-history-modal" role="dialog" aria-modal="true" aria-labelledby="global-event-history-title">
            <div className="flex items-center justify-between gap-2 border-b border-cyan-300/20 px-4 py-3">
              <div><p className="text-[10px] uppercase tracking-[0.16em] text-cyan-200/70">完整日志</p><h2 id="global-event-history-title" className="text-sm font-semibold text-cyan-50">历史记录</h2></div>
              <div className="flex items-center gap-1"><button type="button" className="global-event-notice-clear" onClick={onHistoryClear} disabled={history.length === 0}>清空历史</button><button type="button" className="global-event-notice-dismiss" onClick={() => setHistoryOpen(false)} aria-label="关闭历史记录"><X className="h-4 w-4" /></button></div>
            </div>
            <div className="global-event-history-list" role="log" aria-label="历史事件日志">
              {history.length === 0 ? <p className="px-4 py-8 text-center text-xs text-slate-500">还没有历史事件。</p> : history.map((notice) => {
                const Icon = iconByKind[notice.kind];
                return <div key={notice.id} className={`global-event-notice global-event-notice--${notice.kind} ${notice.message.startsWith('危机已解除') ? 'global-event-notice--recovered' : ''}`} data-testid={`global-event-history-${notice.id}`}><Icon className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" /><div className="min-w-0 flex-1"><p className="text-xs leading-5">{notice.message}</p><time className="text-[10px] text-slate-500">{new Date(notice.createdAt).toLocaleTimeString()}</time></div><button type="button" className="global-event-notice-dismiss" onClick={() => onHistoryDismiss(notice.id)} aria-label={`删除历史记录：${notice.message}`}><X className="h-3.5 w-3.5" /></button></div>;
              })}
            </div>
          </div>
        </div>
      )}
    </Card>
  );
};

export default GlobalEventNoticePanel;
