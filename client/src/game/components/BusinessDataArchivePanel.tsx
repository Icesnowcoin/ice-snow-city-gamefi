import React, { useEffect, useRef, useState } from 'react';
import { Database, LockKeyhole, Search, X } from 'lucide-react';
import { BusinessDataPoint } from '../map/BusinessDataCollectionManager';

interface BusinessDataArchivePanelProps {
  open: boolean;
  points: BusinessDataPoint[];
  onClose: () => void;
}

type ArchiveFilter = 'all' | 'decrypted' | 'locked';

export const BusinessDataArchivePanel: React.FC<BusinessDataArchivePanelProps> = ({ open, points, onClose }) => {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const [decryptedIds, setDecryptedIds] = useState<Set<string>>(() => new Set());
  const [decryptingId, setDecryptingId] = useState<string | null>(null);
  const [recentlyDecryptedId, setRecentlyDecryptedId] = useState<string | null>(null);
  const [cipherPreview, setCipherPreview] = useState('••• 7F A2 C9 01 •••');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const successResetTimerRef = useRef<number | null>(null);
  const collectedCount = points.filter((point) => point.collected).length;
  const decryptedCount = points.filter((point) => decryptedIds.has(point.id)).length;
  const lockedCount = points.length - decryptedCount;
  const normalizedQuery = searchQuery.trim().toLocaleLowerCase();
  const visiblePoints = points.filter((point) => {
    const matchesFilter = archiveFilter === 'decrypted'
      ? decryptedIds.has(point.id)
      : archiveFilter === 'locked'
        ? !decryptedIds.has(point.id)
        : true;
    if (!matchesFilter || !normalizedQuery) return matchesFilter;

    const isDecrypted = decryptedIds.has(point.id);
    const searchableText = [
      isDecrypted ? point.name : '未解锁商业数据',
      isDecrypted ? point.category : '锁定',
      point.description,
      ...(isDecrypted ? [point.archiveContent] : []),
    ].join(' ').toLocaleLowerCase();
    return searchableText.includes(normalizedQuery);
  });
  const filterOptions: Array<{ id: ArchiveFilter; label: string; count: number }> = [
    { id: 'all', label: '全部', count: points.length },
    { id: 'decrypted', label: '已解密', count: decryptedCount },
    { id: 'locked', label: '未解密', count: lockedCount },
  ];

  useEffect(() => {
    if (!open) return;
    closeButtonRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    return () => {
      if (successResetTimerRef.current !== null) window.clearTimeout(successResetTimerRef.current);
    };
  }, []);

  useEffect(() => {
    if (!decryptingId) return;
    let frame = 0;
    const reducedMotion = typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    const timer = window.setTimeout(() => {
      const completedId = decryptingId;
      setDecryptedIds((current) => new Set(current).add(completedId));
      setRecentlyDecryptedId(completedId);
      setDecryptingId(null);
      if (successResetTimerRef.current !== null) window.clearTimeout(successResetTimerRef.current);
      successResetTimerRef.current = window.setTimeout(() => {
        setRecentlyDecryptedId((current) => (current === completedId ? null : current));
        successResetTimerRef.current = null;
      }, 720);
    }, reducedMotion ? 0 : 900);
    const interval = reducedMotion ? undefined : window.setInterval(() => {
      frame += 1;
      const chars = ['7F', 'A2', 'C9', '01', 'D4', '6B', 'E8', '3C'];
      setCipherPreview(`••• ${chars[frame % chars.length]} ${chars[(frame + 2) % chars.length]} ${chars[(frame + 4) % chars.length]} ${chars[(frame + 6) % chars.length]} •••`);
    }, 80);
    return () => {
      window.clearTimeout(timer);
      if (interval !== undefined) window.clearInterval(interval);
    };
  }, [decryptingId]);

  const startDecrypt = (pointId: string) => {
    if (decryptingId || decryptedIds.has(pointId)) return;
    if (successResetTimerRef.current !== null) window.clearTimeout(successResetTimerRef.current);
    setRecentlyDecryptedId(null);
    setCipherPreview('••• 7F A2 C9 01 •••');
    setDecryptingId(pointId);
  };

  const cancelDecrypt = () => setDecryptingId(null);

  if (!open) return null;

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-950/55 p-4 backdrop-blur-sm" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <section data-testid="business-data-archive-panel" role="dialog" aria-modal="true" aria-labelledby="business-data-archive-title" className="max-h-[min(38rem,calc(100%-2rem))] w-[min(44rem,100%)] overflow-hidden rounded-2xl border border-amber-200/45 bg-slate-950/95 text-white shadow-2xl shadow-amber-950/30">
        <header className="flex items-start justify-between gap-4 border-b border-white/10 bg-gradient-to-r from-amber-950/55 via-slate-950 to-cyan-950/45 p-4 sm:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <span className="mt-0.5 rounded-xl border border-amber-200/30 bg-amber-300/10 p-2 text-amber-200" aria-hidden="true"><Database className="h-5 w-5" /></span>
            <div className="min-w-0">
              <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-amber-200">金融区 / 本地演示档案</p>
              <h2 id="business-data-archive-title" className="mt-1 text-lg font-bold">数据档案</h2>
              <p className="mt-1 text-xs text-slate-400">已收集 {collectedCount}/{points.length} 个商业数据终端</p>
            </div>
          </div>
          <button ref={closeButtonRef} type="button" onClick={onClose} aria-label="关闭数据档案" className="rounded-lg p-2 text-slate-300 transition hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200"><X className="h-5 w-5" aria-hidden="true" /></button>
        </header>

        <div className="border-b border-white/10 px-4 pt-3 sm:px-5">
          <label className="relative block" htmlFor="business-data-archive-search">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-cyan-200/70" aria-hidden="true" />
            <input
              id="business-data-archive-search"
              data-testid="business-data-archive-search"
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="搜索已解密档案名称、分类或内容"
              aria-label="搜索已解密商业数据档案"
              className="min-h-11 w-full rounded-xl border border-cyan-200/20 bg-slate-950/60 py-2 pl-9 pr-20 text-sm text-white placeholder:text-slate-500 focus:border-cyan-200/55 focus:outline-none focus:ring-2 focus:ring-cyan-200/20"
            />
            {searchQuery && (
              <button type="button" data-testid="business-data-archive-search-clear" onClick={() => setSearchQuery('')} aria-label="清空档案搜索" className="absolute right-2 top-1/2 min-h-9 -translate-y-1/2 rounded-lg px-2 text-xs font-semibold text-cyan-200 transition hover:bg-cyan-300/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">清空</button>
            )}
          </label>
          <div className="flex gap-2 overflow-x-auto pb-3 pt-3" role="tablist" aria-label="数据档案筛选">
            {filterOptions.map((option) => (
              <button
                key={option.id}
                type="button"
                role="tab"
                aria-selected={archiveFilter === option.id}
                aria-controls={`business-data-filter-panel-${option.id}`}
                data-testid={`business-data-filter-${option.id}`}
                onClick={() => setArchiveFilter(option.id)}
                className={`min-h-10 shrink-0 rounded-lg border px-3 py-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200 ${archiveFilter === option.id ? 'border-cyan-200/60 bg-cyan-300/15 text-cyan-100 shadow-[0_0_14px_rgba(103,232,249,0.14)]' : 'border-white/10 bg-white/[0.03] text-slate-400 hover:border-white/25 hover:text-white'}`}
              >
                {option.label} <span className="ml-1 text-[10px] opacity-75">{option.count}</span>
              </button>
            ))}
          </div>
        </div>

        <div id={`business-data-filter-panel-${archiveFilter}`} className="max-h-[min(30rem,calc(100vh-14rem))] space-y-3 overflow-y-auto p-4 sm:p-5" role="tabpanel" aria-label={`${filterOptions.find((option) => option.id === archiveFilter)?.label ?? '全部'}数据档案`}>
          {visiblePoints.length === 0 ? (
            <div data-testid="business-data-empty-filter" className="rounded-xl border border-dashed border-cyan-200/20 bg-cyan-950/15 p-6 text-center" role="status">
              <p className="text-sm font-semibold text-cyan-100">{normalizedQuery ? '没有匹配的数据档案' : '当前分类暂无数据档案'}</p>
              <p className="mt-1 text-xs text-slate-400">{normalizedQuery ? '尝试更换关键词，或清空搜索后查看全部条目。' : '完成对应终端收集并解密后，条目会显示在这里。'}</p>
            </div>
          ) : visiblePoints.map((point) => (
            <article key={point.id} data-testid={`business-data-entry-${point.id}`} className={point.collected ? `business-data-entry rounded-xl border border-cyan-200/25 bg-cyan-950/20 p-4 ${recentlyDecryptedId === point.id ? 'business-data-entry--decrypted' : ''}` : 'business-data-entry rounded-xl border border-white/10 bg-white/[0.03] p-4 opacity-75'}>
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className={point.collected && recentlyDecryptedId === point.id ? 'business-data-entry__title text-sm font-bold' : 'text-sm font-bold text-white'}>{point.collected ? point.name : '未解锁商业数据'}</h3>
                    <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] text-slate-400">{point.collected ? point.category : '锁定'}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-400">{point.description}</p>
                </div>
                {point.collected ? <span className="shrink-0 text-xs font-semibold text-emerald-300">已收集</span> : <LockKeyhole className="h-4 w-4 shrink-0 text-slate-500" aria-label="尚未收集" />}
              </div>
              {point.collected ? (
                decryptedIds.has(point.id) ? (
                  <div className="mt-3 rounded-lg border border-cyan-200/10 bg-slate-950/45 p-3 text-xs leading-5 text-cyan-50/90">
                    <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-cyan-200/70">{recentlyDecryptedId === point.id ? '解密完成' : '已解密档案内容'}</p>
                    <p>{point.archiveContent}</p>
                    {point.collectedAt && <p className="mt-2 text-[10px] text-slate-500">采集时间：{new Date(point.collectedAt).toLocaleString()}</p>}
                  </div>
                ) : decryptingId === point.id ? (
                  <div className="mt-3 rounded-lg border border-amber-200/25 bg-amber-950/20 p-3 text-xs text-amber-100" role="status" aria-live="polite">
                    <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-amber-200">正在解密商业数据</p>
                    <p data-testid="business-data-cipher" className="mt-2 font-mono tracking-[0.18em] text-amber-100">{cipherPreview}</p>
                    <button type="button" onClick={cancelDecrypt} className="mt-3 min-h-10 rounded-lg border border-amber-200/30 px-3 py-2 font-semibold text-amber-100 transition hover:bg-amber-200/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-200">取消解密</button>
                  </div>
                ) : (
                  <div className="mt-3 rounded-lg border border-cyan-200/10 bg-slate-950/45 p-3">
                    <p className="text-xs text-slate-400">档案已收集，完成一次本地解密后查看完整内容。</p>
                    <button data-testid={`decrypt-business-data-${point.id}`} type="button" onClick={() => startDecrypt(point.id)} className="mt-3 min-h-10 rounded-lg border border-cyan-200/35 bg-cyan-300/10 px-3 py-2 text-xs font-semibold text-cyan-100 transition hover:bg-cyan-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200">解密数据</button>
                  </div>
                )
              ) : (
                <p className="mt-3 text-xs text-slate-500">前往金融区找到该数据终端并完成收集后解锁内容。</p>
              )}
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default BusinessDataArchivePanel;
