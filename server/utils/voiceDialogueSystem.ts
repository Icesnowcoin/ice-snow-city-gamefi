/**
 * 语音对话系统 (Phase 96-100)
 * 集成语音识别、语音合成、音频处理
 */

import { transcribeAudio } from '../_core/voiceTranscription';

// TTS 生成函数
async function generateSpeech(options: {
  text: string;
  voice: string;
  language: string;
}): Promise<string> {
  // 实际应调用 TTS API
  // 暂时返回模拟 URL
  return `https://api.example.com/tts?text=${encodeURIComponent(options.text)}&voice=${options.voice}`;
}

export interface VoiceSession {
  sessionId: string;
  playerId: string;
  npcId: string;
  startedAt: number;
  audioRecordings: AudioRecording[];
  transcriptions: Transcription[];
  syntheses: SynthesizedAudio[];
}

export interface AudioRecording {
  recordingId: string;
  audioUrl: string;
  duration: number;
  format: string;
  uploadedAt: number;
  fileSize: number;
}

export interface Transcription {
  transcriptionId: string;
  recordingId: string;
  text: string;
  language: string;
  confidence: number;
  transcribedAt: number;
}

export interface SynthesizedAudio {
  synthesisId: string;
  text: string;
  audioUrl: string;
  duration: number;
  voice: string;
  synthesizedAt: number;
}

export interface VoiceDialogueResponse {
  userText: string;
  npcResponse: string;
  npcAudioUrl: string;
  emotion: string;
  questHint?: string;
  duration: number;
}

export class VoiceDialogueSystem {
  private sessions: Map<string, VoiceSession> = new Map();
  private audioCache: Map<string, SynthesizedAudio> = new Map();
  private transcriptionCache: Map<string, Transcription> = new Map();

  /**
   * 创建语音对话会话
   */
  createVoiceSession(playerId: string, npcId: string): VoiceSession {
    const sessionId = `voice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const session: VoiceSession = {
      sessionId,
      playerId,
      npcId,
      startedAt: Date.now(),
      audioRecordings: [],
      transcriptions: [],
      syntheses: [],
    };

    this.sessions.set(sessionId, session);
    return session;
  }

  /**
   * 处理玩家语音输入
   */
  async processPlayerVoice(
    sessionId: string,
    audioUrl: string,
    duration: number,
    format: string = 'mp3'
  ): Promise<Transcription> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Voice session ${sessionId} not found`);
    }

    // 记录音频
    const recordingId = `rec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const recording: AudioRecording = {
      recordingId,
      audioUrl,
      duration,
      format,
      uploadedAt: Date.now(),
      fileSize: 0, // 实际应从文件获取
    };

    session.audioRecordings.push(recording);

    // 检查缓存
    if (this.transcriptionCache.has(audioUrl)) {
      return this.transcriptionCache.get(audioUrl)!;
    }

    // 调用语音识别 API
    try {
      const result = await transcribeAudio({
        audioUrl,
        language: 'en',
        prompt: 'This is a conversation with an NPC in a game',
      });

      // 检查是否是错误响应
      if ('error' in result) {
        throw new Error(`Transcription error: ${result.error}`);
      }

      const transcription: Transcription = {
        transcriptionId: `trans_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        recordingId,
        text: result.text || '',
        language: result.language || 'en',
        confidence: 0.95, // 实际应从 API 获取
        transcribedAt: Date.now(),
      };

      session.transcriptions.push(transcription);
      this.transcriptionCache.set(audioUrl, transcription);

      return transcription;
    } catch (error) {
      console.error('Error transcribing audio:', error);
      throw new Error('Failed to transcribe audio');
    }
  }

  /**
   * 生成 NPC 语音响应
   */
  async generateNPCVoice(
    sessionId: string,
    npcResponse: string,
    voiceId: string = 'default'
  ): Promise<SynthesizedAudio> {
    const session = this.sessions.get(sessionId);
    if (!session) {
      throw new Error(`Voice session ${sessionId} not found`);
    }

    // 检查缓存
    const cacheKey = `${npcResponse}_${voiceId}`;
    if (this.audioCache.has(cacheKey)) {
      return this.audioCache.get(cacheKey)!;
    }

    try {
      // 调用文本转语音 API
      const audioUrl = await generateSpeech({
        text: npcResponse,
        voice: voiceId,
        language: 'en',
      });

      const synthesis: SynthesizedAudio = {
        synthesisId: `syn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        text: npcResponse,
        audioUrl: audioUrl || '',
        duration: this.estimateDuration(npcResponse),
        voice: voiceId,
        synthesizedAt: Date.now(),
      };

      session.syntheses.push(synthesis);
      this.audioCache.set(cacheKey, synthesis);

      return synthesis;
    } catch (error) {
      console.error('Error generating speech:', error);
      throw new Error('Failed to generate NPC voice');
    }
  }

  /**
   * 完整的语音对话流程
   */
  async processVoiceDialogue(
    sessionId: string,
    playerAudioUrl: string,
    npcResponse: string,
    voiceId: string = 'default'
  ): Promise<VoiceDialogueResponse> {
    const startTime = Date.now();

    // 1. 处理玩家语音
    const transcription = await this.processPlayerVoice(sessionId, playerAudioUrl, 10);

    // 2. 生成 NPC 语音
    const synthesis = await this.generateNPCVoice(sessionId, npcResponse, voiceId);

    // 3. 构建响应
    const response: VoiceDialogueResponse = {
      userText: transcription.text,
      npcResponse,
      npcAudioUrl: synthesis.audioUrl,
      emotion: this.detectEmotionFromText(npcResponse),
      duration: Date.now() - startTime,
    };

    return response;
  }

  /**
   * 估计语音持续时间
   */
  private estimateDuration(text: string): number {
    // 平均每个单词 0.5 秒
    const wordCount = text.split(' ').length;
    return Math.ceil(wordCount * 0.5);
  }

  /**
   * 从文本检测情感
   */
  private detectEmotionFromText(text: string): string {
    const lowerText = text.toLowerCase();

    if (lowerText.includes('wonderful') || lowerText.includes('amazing')) {
      return 'happy';
    } else if (lowerText.includes('sorry') || lowerText.includes('sad')) {
      return 'sad';
    } else if (lowerText.includes('angry') || lowerText.includes('furious')) {
      return 'angry';
    }

    return 'neutral';
  }

  /**
   * 获取会话信息
   */
  getSession(sessionId: string): VoiceSession | null {
    return this.sessions.get(sessionId) || null;
  }

  /**
   * 获取会话历史
   */
  getSessionHistory(sessionId: string): {
    recordings: AudioRecording[];
    transcriptions: Transcription[];
    syntheses: SynthesizedAudio[];
  } {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return {
        recordings: [],
        transcriptions: [],
        syntheses: [],
      };
    }

    return {
      recordings: session.audioRecordings,
      transcriptions: session.transcriptions,
      syntheses: session.syntheses,
    };
  }

  /**
   * 结束语音会话
   */
  endVoiceSession(sessionId: string): void {
    this.sessions.delete(sessionId);
  }

  /**
   * 获取音频统计
   */
  getAudioStats(sessionId: string) {
    const session = this.sessions.get(sessionId);
    if (!session) {
      return null;
    }

    const totalRecordingTime = session.audioRecordings.reduce((sum, rec) => sum + rec.duration, 0);
    const totalSynthesisTime = session.syntheses.reduce((sum, syn) => sum + syn.duration, 0);

    return {
      totalRecordings: session.audioRecordings.length,
      totalRecordingTime,
      totalTranscriptions: session.transcriptions.length,
      totalSyntheses: session.syntheses.length,
      totalSynthesisTime,
      sessionDuration: Date.now() - session.startedAt,
    };
  }

  /**
   * 清空缓存
   */
  clearCache(): void {
    this.audioCache.clear();
    this.transcriptionCache.clear();
  }

  /**
   * 获取系统统计
   */
  getSystemStats() {
    return {
      activeSessions: this.sessions.size,
      cachedAudio: this.audioCache.size,
      cachedTranscriptions: this.transcriptionCache.size,
    };
  }
}

export default VoiceDialogueSystem;
