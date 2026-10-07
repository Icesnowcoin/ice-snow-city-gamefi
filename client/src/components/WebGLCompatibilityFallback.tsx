/**
 * Ice Snow City - WebGL Compatibility Fallback Component
 * 当客户端设备不支持 WebGL 或硬件加速受限时，展示此友好降级页面。
 * 支持一键发送错误报告、确认预览、本地复制/下载回退以及常见问题解答 (FAQ)。
 */

import React, { useState } from 'react';
import { AlertTriangle, RefreshCw, Layers, ShieldAlert, Monitor, Send, CheckCircle2, Copy, Download, FileText, HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { trpc } from '@/lib/trpc';
import { checkGraphicsCapability } from '@/lib/webglCompatibility';

interface WebGLCompatibilityFallbackProps {
  errorMessage?: string;
  rendererInfo?: string;
  onRetry: () => void;
  onEnterSimplifiedMode?: () => void;
}

export const WebGLCompatibilityFallback: React.FC<WebGLCompatibilityFallbackProps> = ({
  errorMessage = '您的设备或浏览器暂不支持高性能 WebGL 3D 渲染，或硬件加速已被禁用。',
  rendererInfo,
  onRetry,
  onEnterSimplifiedMode,
}) => {
  const [showReportModal, setShowReportModal] = useState(false);
  const [showFaq, setShowFaq] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedSuccess, setSubmittedSuccess] = useState(false);
  const [copyStatus, setCopyStatus] = useState(false);

  const reportMutation = trpc.systemDiagnostics.reportWebGLFailure.useMutation();

  const getReportPayload = () => {
    const cap = checkGraphicsCapability();
    return {
      errorMessage,
      rendererInfo: rendererInfo || cap.rendererInfo || 'Unknown',
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
      screenResolution: typeof window !== 'undefined' ? `${window.innerWidth}x${window.innerHeight}` : 'Unknown',
      hasWebGL: cap.hasWebGL,
      hasWebGL2: cap.hasWebGL2,
      hasWebGPU: cap.hasWebGPU,
      timestamp: Date.now(),
    };
  };

  const payload = getReportPayload();
  const formattedReportText = `=== ICE SNOW CITY WEBGL DIAGNOSTIC REPORT ===
Time: ${new Date(payload.timestamp).toISOString()}
UserAgent: ${payload.userAgent}
Screen: ${payload.screenResolution}
WebGL 1.0: ${payload.hasWebGL ? 'Yes' : 'No'}
WebGL 2.0: ${payload.hasWebGL2 ? 'Yes' : 'No'}
WebGPU: ${payload.hasWebGPU ? 'Yes' : 'No'}
Renderer: ${payload.rendererInfo}
Error: ${payload.errorMessage}
============================================`;

  const handleSendReport = async () => {
    setIsSubmitting(true);
    try {
      await reportMutation.mutateAsync(payload);
      setSubmittedSuccess(true);
    } catch (err) {
      console.error('Failed to submit report via tRPC:', err);
      navigator.clipboard?.writeText(formattedReportText);
      setSubmittedSuccess(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCopyReport = () => {
    navigator.clipboard?.writeText(formattedReportText);
    setCopyStatus(true);
    setTimeout(() => setCopyStatus(false), 2000);
  };

  const handleDownloadReport = () => {
    const blob = new Blob([formattedReportText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `icesnowcity-webgl-error-${Date.now()}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex items-center justify-center min-h-[480px] w-full p-4 bg-background/80 backdrop-blur-md rounded-xl">
      <Card className="max-w-md w-full shadow-2xl border-amber-500/30 bg-card/95 text-card-foreground">
        <CardHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 rounded-full bg-amber-500/10 flex items-center justify-center mb-3 text-amber-500 animate-pulse">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <CardTitle className="text-xl font-bold tracking-tight">
            3D 图形渲染受限 / WebGL 不可用
          </CardTitle>
          <CardDescription className="text-muted-foreground mt-1">
            Ice Snow City 现代化都市模拟需要 WebGL 支持以呈现 3D 建筑、农业区与动态光影。
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4 pt-2">
          <div className="p-3 rounded-lg bg-muted/60 border border-border text-sm space-y-1">
            <div className="flex items-center gap-2 font-medium text-foreground">
              <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0" />
              <span>可能的原因与排查建议：</span>
            </div>
            <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 pl-1">
              <li>浏览器设置中关闭了“硬件加速”（Hardware Acceleration）。</li>
              <li>当前运行环境（如无头虚拟机或远程服务器）未配置虚拟 GPU 驱动。</li>
              <li>显卡驱动过旧或浏览器 WebGL 策略受限。</li>
            </ul>
            {rendererInfo && (
              <div className="pt-2 text-xs font-mono text-muted-foreground flex items-center gap-1 border-t border-border/50 mt-2">
                <Monitor className="w-3.5 h-3.5 shrink-0" />
                <span className="truncate">GPU: {rendererInfo}</span>
              </div>
            )}
          </div>

          {errorMessage && (
            <div className="p-2.5 rounded bg-destructive/10 text-destructive text-xs font-mono border border-destructive/20">
              {errorMessage}
            </div>
          )}

          {/* 常见问题解答 (FAQ) 可折叠模块 */}
          <div className="pt-1 border-t border-border/60">
            <button
              type="button"
              onClick={() => setShowFaq(!showFaq)}
              className="w-full text-xs text-foreground font-medium hover:text-primary flex items-center justify-between py-1.5 px-1 rounded hover:bg-muted/40 transition-colors"
            >
              <div className="flex items-center gap-1.5">
                <HelpCircle className="w-3.5 h-3.5 text-primary" />
                <span>如何开启硬件加速或解决 WebGL 问题？（FAQ）</span>
              </div>
              {showFaq ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>

            {showFaq && (
              <div className="mt-2 p-3 rounded-lg bg-secondary/40 border border-border text-xs space-y-2.5">
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">1. 如何在 Chrome / Edge 中开启硬件加速？</p>
                  <p className="text-muted-foreground pl-2">
                    进入浏览器设置 → 系统 (System) → 开启“可用时使用图形硬件加速”(Use graphics acceleration when available)，然后重启浏览器。
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">2. 如何在 Firefox 中开启 WebGL？</p>
                  <p className="text-muted-foreground pl-2">
                    在地址栏输入 <code className="bg-background px-1 rounded font-mono">about:config</code>，搜索 <code className="bg-background px-1 rounded font-mono">webgl.disabled</code> 确保其值为 false。
                  </p>
                </div>
                <div className="space-y-1">
                  <p className="font-semibold text-foreground">3. 远程桌面或云服务器无硬件加速怎么办？</p>
                  <p className="text-muted-foreground pl-2">
                    若您在远程服务器或虚拟机中访问，由于缺乏 GPU 驱动可能无法渲染 3D 画面，建议点击下方按钮进入 <strong>2D 简化管理模式</strong>。
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* 错误报告交互区域 */}
          <div className="pt-1 border-t border-border/60">
            {!showReportModal ? (
              <button
                type="button"
                onClick={() => setShowReportModal(true)}
                className="w-full text-xs text-primary hover:underline flex items-center justify-center gap-1.5 py-1"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>查看并发送设备错误报告给开发者</span>
              </button>
            ) : (
              <div className="p-3 rounded-lg bg-secondary/50 border border-border space-y-2 text-xs">
                <div className="font-semibold text-foreground flex items-center justify-between">
                  <span>诊断报告预览</span>
                  <button
                    type="button"
                    onClick={() => setShowReportModal(false)}
                    className="text-muted-foreground hover:text-foreground text-[11px]"
                  >
                    收起
                  </button>
                </div>
                <div className="max-h-28 overflow-y-auto p-2 rounded bg-background font-mono text-[10px] text-muted-foreground whitespace-pre-wrap select-all">
                  {formattedReportText}
                </div>

                {submittedSuccess ? (
                  <div className="flex items-center gap-1.5 text-emerald-500 font-medium py-1">
                    <CheckCircle2 className="w-4 h-4 shrink-0" />
                    <span>错误报告已成功提交！感谢您的反馈。</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 pt-1">
                    <Button
                      size="sm"
                      className="flex-1 h-8 text-xs gap-1 bg-primary text-primary-foreground"
                      disabled={isSubmitting}
                      onClick={handleSendReport}
                    >
                      <Send className="w-3 h-3" />
                      {isSubmitting ? '发送中...' : '一键发送报告'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs px-2 gap-1"
                      onClick={handleCopyReport}
                      title="复制到剪贴板"
                    >
                      <Copy className="w-3 h-3" />
                      {copyStatus ? '已复制' : '复制'}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs px-2 gap-1"
                      onClick={handleDownloadReport}
                      title="下载为文本文件"
                    >
                      <Download className="w-3 h-3" />
                      下载
                    </Button>
                  </div>
                )}
              </div>
            )}
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-2 pt-0">
          <Button 
            className="w-full gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
            onClick={onRetry}
          >
            <RefreshCw className="w-4 h-4" />
            重新检测并重试
          </Button>

          {onEnterSimplifiedMode && (
            <Button 
              variant="outline" 
              className="w-full gap-2"
              onClick={onEnterSimplifiedMode}
            >
              <Layers className="w-4 h-4" />
              进入 2D 简化管理模式
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
};
