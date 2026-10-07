import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  Zap,
  Clock,
  Trophy,
  Target,
  Lightbulb,
  Play,
  Pause,
  RotateCcw,
  ChevronRight,
} from 'lucide-react';

export type SceneType = 'fishing' | 'mining' | 'lumberjacking';
export type DifficultyLevel = 'easy' | 'medium' | 'hard';

interface SceneConfig {
  type: SceneType;
  name: string;
  icon: React.ReactNode;
  description: string;
  energyCost: number;
  duration: number;
  rewards: string;
  difficulty: DifficultyLevel;
}

interface GameSceneUIProps {
  onSceneStart?: (sceneType: SceneType, difficulty: DifficultyLevel) => void;
  onSceneComplete?: (rewards: any) => void;
  playerEnergy?: number;
  maxEnergy?: number;
  isLoading?: boolean;
}

const SCENE_CONFIGS: Record<SceneType, SceneConfig> = {
  fishing: {
    type: 'fishing',
    name: '🎣 钓鱼',
    icon: '🎣',
    description: '在冰雪湖中钓鱼，获得食物和金币',
    energyCost: 10,
    duration: 60,
    rewards: '金币、食物、能量',
    difficulty: 'medium',
  },
  mining: {
    type: 'mining',
    name: '⛏️ 采矿',
    icon: '⛏️',
    description: '在矿山中采矿，获得金币和矿石',
    energyCost: 15,
    duration: 90,
    rewards: '金币、矿石、ISC',
    difficulty: 'hard',
  },
  lumberjacking: {
    type: 'lumberjacking',
    name: '🪵 伐木',
    icon: '🪵',
    description: '在森林中伐木，获得木材和食物',
    energyCost: 12,
    duration: 75,
    rewards: '木材、食物、金币',
    difficulty: 'medium',
  },
};

const DIFFICULTY_COLORS: Record<DifficultyLevel, string> = {
  easy: 'bg-green-500',
  medium: 'bg-yellow-500',
  hard: 'bg-red-500',
};

const DIFFICULTY_LABELS: Record<DifficultyLevel, string> = {
  easy: '简单',
  medium: '中等',
  hard: '困难',
};

export const GameSceneUI: React.FC<GameSceneUIProps> = ({
  onSceneStart,
  onSceneComplete,
  playerEnergy = 100,
  maxEnergy = 100,
  isLoading = false,
}) => {
  const [activeScene, setActiveScene] = useState<SceneType | null>(null);
  const [selectedDifficulty, setSelectedDifficulty] = useState<DifficultyLevel>('medium');
  const [isPlaying, setIsPlaying] = useState(false);
  const [timeRemaining, setTimeRemaining] = useState(0);
  const [progress, setProgress] = useState(0);
  const [rewards, setRewards] = useState<any>(null);

  // Timer effect
  useEffect(() => {
    if (!isPlaying || timeRemaining <= 0) {
      if (isPlaying && timeRemaining <= 0) {
        setIsPlaying(false);
        // Simulate reward
        const mockRewards = [
          { type: 'gold', amount: 100 },
          { type: 'food', amount: 50 },
        ];
        setRewards(mockRewards);
        onSceneComplete?.(mockRewards);
      }
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        const next = prev - 1;
        const sceneConfig = activeScene ? SCENE_CONFIGS[activeScene] : null;
        if (sceneConfig) {
          setProgress(((sceneConfig.duration - next) / sceneConfig.duration) * 100);
        }
        return next;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isPlaying, timeRemaining, activeScene, onSceneComplete]);

  const handleStartScene = (sceneType: SceneType) => {
    const config = SCENE_CONFIGS[sceneType];
    if (playerEnergy < config.energyCost) {
      return;
    }

    setActiveScene(sceneType);
    setSelectedDifficulty('medium');
    setIsPlaying(false);
    setTimeRemaining(0);
    setProgress(0);
    setRewards(null);
  };

  const handlePlayScene = () => {
    if (!activeScene) return;

    const config = SCENE_CONFIGS[activeScene];
    setIsPlaying(true);
    setTimeRemaining(config.duration);
    setProgress(0);
    setRewards(null);

    onSceneStart?.(activeScene, selectedDifficulty);
  };

  const handlePauseScene = () => {
    setIsPlaying(false);
  };

  const handleResetScene = () => {
    setIsPlaying(false);
    setTimeRemaining(0);
    setProgress(0);
    setRewards(null);
    setActiveScene(null);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Scene selection view
  if (!activeScene) {
    return (
      <div className="w-full space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(SCENE_CONFIGS).map(([key, config]) => (
            <Card
              key={key}
              className="cursor-pointer hover:border-blue-500 transition-colors"
              onClick={() => handleStartScene(config.type)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">{config.name}</CardTitle>
                  <span className="text-2xl">{config.icon}</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <p className="text-sm text-gray-400">{config.description}</p>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="w-4 h-4 text-yellow-400" />
                    <span>消耗能量: {config.energyCost}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Clock className="w-4 h-4 text-blue-400" />
                    <span>耗时: {config.duration}秒</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="w-4 h-4 text-yellow-500" />
                    <span>奖励: {config.rewards}</span>
                  </div>
                </div>

                <Button
                  className="w-full"
                  disabled={playerEnergy < config.energyCost || isLoading}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStartScene(config.type);
                  }}
                >
                  <Play className="w-4 h-4 mr-2" />
                  开始游戏
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Energy status */}
        <Card className="bg-blue-900/20 border-blue-500/30">
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>能量</span>
                <span>
                  {playerEnergy} / {maxEnergy}
                </span>
              </div>
              <Progress value={(playerEnergy / maxEnergy) * 100} className="h-2" />
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Scene playing view
  const sceneConfig = SCENE_CONFIGS[activeScene];

  return (
    <div className="w-full space-y-6">
      {/* Scene header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-4xl">{sceneConfig.icon}</span>
              <div>
                <CardTitle>{sceneConfig.name}</CardTitle>
                <p className="text-sm text-gray-400 mt-1">{sceneConfig.description}</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={handleResetScene}>
              <RotateCcw className="w-4 h-4 mr-2" />
              返回
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Difficulty selector */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">选择难度</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-3">
            {(['easy', 'medium', 'hard'] as DifficultyLevel[]).map((difficulty) => (
              <Button
                key={difficulty}
                variant={selectedDifficulty === difficulty ? 'default' : 'outline'}
                className={`${
                  selectedDifficulty === difficulty ? DIFFICULTY_COLORS[difficulty] : ''
                }`}
                onClick={() => setSelectedDifficulty(difficulty)}
                disabled={isPlaying}
              >
                {DIFFICULTY_LABELS[difficulty]}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Game progress */}
      {isPlaying && (
        <Card className="bg-purple-900/20 border-purple-500/30">
          <CardHeader>
            <CardTitle className="text-base">游戏进行中</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-3" />
            </div>

            {/* Time remaining */}
            <div className="flex items-center justify-center">
              <Clock className="w-5 h-5 mr-2 text-blue-400" />
              <span className="text-2xl font-bold font-mono">{formatTime(timeRemaining)}</span>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2">
              <Button
                className="flex-1"
                variant={isPlaying ? 'destructive' : 'default'}
                onClick={isPlaying ? handlePauseScene : handlePlayScene}
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    暂停
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    继续
                  </>
                )}
              </Button>
              <Button className="flex-1" variant="outline" onClick={handleResetScene}>
                <RotateCcw className="w-4 h-4 mr-2" />
                重新开始
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Rewards display */}
      {rewards && !isPlaying && (
        <Card className="bg-green-900/20 border-green-500/30">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Trophy className="w-5 h-5 text-yellow-400" />
              恭喜！获得奖励
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {rewards.map((reward: any, index: number) => (
              <div key={index} className="flex items-center justify-between p-2 bg-black/30 rounded">
                <span className="capitalize">{reward.type}</span>
                <Badge variant="outline">+{reward.amount}</Badge>
              </div>
            ))}

            <Button className="w-full mt-4" onClick={handleResetScene}>
              <ChevronRight className="w-4 h-4 mr-2" />
              继续游戏
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Start button */}
      {!isPlaying && !rewards && (
        <Button
          className="w-full h-12 text-lg"
          onClick={handlePlayScene}
          disabled={playerEnergy < sceneConfig.energyCost || isLoading}
        >
          <Play className="w-5 h-5 mr-2" />
          开始游戏 (消耗 {sceneConfig.energyCost} 能量)
        </Button>
      )}

      {/* Energy warning */}
      {playerEnergy < sceneConfig.energyCost && (
        <Alert className="border-red-500/30 bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300">
            能量不足！需要 {sceneConfig.energyCost} 点能量，当前仅有 {playerEnergy} 点
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default GameSceneUI;
