/**
 * 对话历史记录面板
 * Phase 102: 对话记录面板 UI 组件
 */

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Search, Download, Trash2, Volume2, MessageSquare } from 'lucide-react';

export interface DialogueMessage {
  id: string;
  type: 'text' | 'voice';
  sender: 'player' | 'npc';
  npcName: string;
  content: string;
  audioUrl?: string;
  timestamp: number;
  emotion?: string;
  questHint?: string;
}

export interface DialogueSession {
  sessionId: string;
  npcName: string;
  startTime: number;
  endTime?: number;
  messages: DialogueMessage[];
  totalDuration: number;
}

interface DialogueHistoryPanelProps {
  sessions: DialogueSession[];
  onDeleteSession?: (sessionId: string) => void;
  onExportSession?: (sessionId: string) => void;
}

export const DialogueHistoryPanel: React.FC<DialogueHistoryPanelProps> = ({
  sessions,
  onDeleteSession,
  onExportSession,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedNPC, setSelectedNPC] = useState<string | null>(null);
  const [selectedSession, setSelectedSession] = useState<DialogueSession | null>(null);
  const [filterType, setFilterType] = useState<'all' | 'text' | 'voice'>('all');

  // 获取所有 NPC 名称
  const npcNames = useMemo(() => {
    const names = new Set(sessions.map((s) => s.npcName));
    return Array.from(names);
  }, [sessions]);

  // 筛选会话
  const filteredSessions = useMemo(() => {
    return sessions.filter((session) => {
      const matchesSearch =
        session.npcName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        session.messages.some((msg) => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));

      const matchesNPC = !selectedNPC || session.npcName === selectedNPC;

      return matchesSearch && matchesNPC;
    });
  }, [sessions, searchQuery, selectedNPC]);

  // 筛选消息
  const filteredMessages = useMemo(() => {
    if (!selectedSession) return [];

    return selectedSession.messages.filter((msg) => {
      if (filterType === 'all') return true;
      return msg.type === filterType;
    });
  }, [selectedSession, filterType]);

  // 格式化时间
  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  // 格式化日期
  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleDateString();
  };

  // 格式化持续时间
  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  // 获取情感图标
  const getEmotionIcon = (emotion?: string) => {
    const emotionMap: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      neutral: '😐',
    };
    return emotionMap[emotion || 'neutral'] || '😐';
  };

  return (
    <div className="w-full h-full flex flex-col gap-4 p-4 bg-background">
      <CardHeader className="p-0">
        <CardTitle className="text-2xl">对话历史记录</CardTitle>
      </CardHeader>

      <div className="flex gap-2">
        {/* 搜索框 */}
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索 NPC 或对话内容..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* NPC 筛选 */}
        <div className="flex gap-1 overflow-x-auto pb-2">
          <Button
            variant={selectedNPC === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedNPC(null)}
          >
            全部
          </Button>
          {npcNames.map((npc) => (
            <Button
              key={npc}
              variant={selectedNPC === npc ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedNPC(npc)}
            >
              {npc}
            </Button>
          ))}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-3 gap-4 overflow-hidden">
        {/* 左侧：会话列表 */}
        <Card className="col-span-1 flex flex-col overflow-hidden">
          <CardHeader className="pb-3">
            <CardTitle className="text-lg">对话会话</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-hidden p-0">
            <ScrollArea className="h-full">
              <div className="space-y-2 p-4">
                {filteredSessions.length === 0 ? (
                  <div className="text-center text-muted-foreground py-8">
                    没有找到对话记录
                  </div>
                ) : (
                  filteredSessions.map((session) => (
                    <div
                      key={session.sessionId}
                      onClick={() => setSelectedSession(session)}
                      className={`p-3 rounded-lg cursor-pointer transition-colors ${
                        selectedSession?.sessionId === session.sessionId
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted hover:bg-muted/80'
                      }`}
                    >
                      <div className="font-semibold text-sm">{session.npcName}</div>
                      <div className="text-xs opacity-75">
                        {formatDate(session.startTime)}
                      </div>
                      <div className="text-xs opacity-75">
                        {formatDuration(session.totalDuration)}
                      </div>
                      <div className="text-xs opacity-75">
                        {session.messages.length} 条消息
                      </div>
                    </div>
                  ))
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* 中间和右侧：对话内容 */}
        {selectedSession ? (
          <Card className="col-span-2 flex flex-col overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="text-lg">{selectedSession.npcName}</CardTitle>
                  <div className="text-sm text-muted-foreground">
                    {formatDate(selectedSession.startTime)} {formatTime(selectedSession.startTime)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Tabs value={filterType} onValueChange={(v) => setFilterType(v as any)}>
                    <TabsList>
                      <TabsTrigger value="all">全部</TabsTrigger>
                      <TabsTrigger value="text">文字</TabsTrigger>
                      <TabsTrigger value="voice">语音</TabsTrigger>
                    </TabsList>
                  </Tabs>
                </div>
              </div>
            </CardHeader>

            <CardContent className="flex-1 overflow-hidden p-0">
              <ScrollArea className="h-full">
                <div className="space-y-3 p-4">
                  {filteredMessages.length === 0 ? (
                    <div className="text-center text-muted-foreground py-8">
                      没有对话记录
                    </div>
                  ) : (
                    filteredMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.sender === 'player' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs rounded-lg p-3 ${
                            msg.sender === 'player'
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-muted'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            {msg.type === 'voice' && (
                              <Volume2 className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            )}
                            {msg.type === 'text' && (
                              <MessageSquare className="h-4 w-4 flex-shrink-0 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="text-xs opacity-75 mb-1">
                                {formatTime(msg.timestamp)}
                              </div>
                              <div className="text-sm break-words">{msg.content}</div>

                              {msg.emotion && msg.sender === 'npc' && (
                                <div className="mt-2 flex items-center gap-2">
                                  <span className="text-lg">{getEmotionIcon(msg.emotion)}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {msg.emotion}
                                  </Badge>
                                </div>
                              )}

                              {msg.questHint && msg.sender === 'npc' && (
                                <div className="mt-2 p-2 bg-accent/20 rounded text-xs">
                                  <strong>任务提示：</strong> {msg.questHint}
                                </div>
                              )}

                              {msg.audioUrl && msg.type === 'voice' && (
                                <audio controls className="mt-2 w-full h-6 text-xs">
                                  <source src={msg.audioUrl} />
                                </audio>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </CardContent>

            {/* 底部操作按钮 */}
            <div className="border-t p-3 flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onExportSession?.(selectedSession.sessionId)}
              >
                <Download className="h-4 w-4 mr-2" />
                导出
              </Button>
              <Button
                variant="destructive"
                size="sm"
                onClick={() => {
                  onDeleteSession?.(selectedSession.sessionId);
                  setSelectedSession(null);
                }}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                删除
              </Button>
            </div>
          </Card>
        ) : (
          <Card className="col-span-2 flex items-center justify-center">
            <div className="text-center text-muted-foreground">
              <MessageSquare className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>选择一个对话会话查看详情</p>
            </div>
          </Card>
        )}
      </div>

      {/* 统计信息 */}
      <Card className="p-4">
        <div className="grid grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold">{sessions.length}</div>
            <div className="text-sm text-muted-foreground">总对话会话</div>
          </div>
          <div>
            <div className="text-2xl font-bold">{npcNames.length}</div>
            <div className="text-sm text-muted-foreground">不同 NPC</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {sessions.reduce((sum, s) => sum + s.messages.length, 0)}
            </div>
            <div className="text-sm text-muted-foreground">总消息数</div>
          </div>
          <div>
            <div className="text-2xl font-bold">
              {formatDuration(sessions.reduce((sum, s) => sum + s.totalDuration, 0))}
            </div>
            <div className="text-sm text-muted-foreground">总对话时长</div>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default DialogueHistoryPanel;
