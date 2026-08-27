import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  Shield,
  Gift,
  Lightbulb,
  Users,
  Target,
  Zap,
  Clock,
  X,
} from 'lucide-react';

export type TutorialStep =
  | 'build_first_house'
  | 'collect_resources'
  | 'interact_npc'
  | 'complete_task'
  | 'first_trade'
  | 'upgrade_building';

interface StepConfig {
  step: TutorialStep;
  title: string;
  description: string;
  objective: string;
  hints: string[];
  guidanceNPCName: string;
  estimatedDuration: number;
  order: number;
  rewards: Array<{
    type: string;
    amount: number;
    description: string;
  }>;
}

interface OnboardingUIProps {
  currentStep?: TutorialStep;
  completedSteps?: TutorialStep[];
  isProtected?: boolean;
  protectionDaysRemaining?: number;
  onStepComplete?: (step: TutorialStep) => void;
  onSkipStep?: (step: TutorialStep) => void;
  onAbandon?: () => void;
  isLoading?: boolean;
}

const TUTORIAL_STEPS: Record<TutorialStep, StepConfig> = {
  build_first_house: {
    step: 'build_first_house',
    title: '建造第一个房屋',
    description: '在您的土地上建造第一个房屋，这是您在冰雪城的家园',
    objective: '使用 100 金币建造一个木制房屋',
    hints: [
      '点击空地选择建造',
      '在菜单中选择房屋',
      '确认建造即可开始',
      '建造需要 30 秒完成',
    ],
    guidanceNPCName: '建筑师 Alice',
    estimatedDuration: 120000,
    order: 1,
    rewards: [
      { type: 'isc', amount: 100, description: '完成奖励' },
      { type: 'item', amount: 1, description: '新手房屋装饰' },
    ],
  },
  collect_resources: {
    step: 'collect_resources',
    title: '收集第一批资源',
    description: '从您的建筑中收集资源，这是获得收入的基本方式',
    objective: '收集 500 金币',
    hints: [
      '点击建筑查看资源',
      '点击"收集"按钮获取资源',
      '资源每小时自动生成',
      '升级建筑可增加产出',
    ],
    guidanceNPCName: '商人 Bob',
    estimatedDuration: 180000,
    order: 2,
    rewards: [
      { type: 'isc', amount: 100, description: '完成奖励' },
      { type: 'resource', amount: 200, description: '额外金币' },
    ],
  },
  interact_npc: {
    step: 'interact_npc',
    title: '与 NPC 交互',
    description: '与城市中的 NPC 建立关系，他们会提供任务和交易机会',
    objective: '与 3 个不同的 NPC 交互',
    hints: [
      '打开 NPC 列表',
      '点击 NPC 查看详情',
      '选择"问候"进行交互',
      '建立关系可解锁新功能',
    ],
    guidanceNPCName: '社交大使 Carol',
    estimatedDuration: 120000,
    order: 3,
    rewards: [
      { type: 'isc', amount: 150, description: '完成奖励' },
      { type: 'item', amount: 1, description: '友谊礼物' },
    ],
  },
  complete_task: {
    step: 'complete_task',
    title: '完成第一个任务',
    description: '接受并完成 NPC 发布的任务，赚取奖励',
    objective: '完成 1 个任务',
    hints: [
      '打开任务列表',
      '选择推荐的新手任务',
      '按照任务要求完成',
      '返回 NPC 提交任务',
    ],
    guidanceNPCName: '任务管理员 David',
    estimatedDuration: 300000,
    order: 4,
    rewards: [
      { type: 'isc', amount: 200, description: '完成奖励' },
      { type: 'resource', amount: 100, description: '食物奖励' },
    ],
  },
  first_trade: {
    step: 'first_trade',
    title: '进行第一笔交易',
    description: '与其他玩家或 NPC 进行交易，体验经济系统',
    objective: '完成 1 笔交易',
    hints: [
      '打开商城或玩家市场',
      '选择一件商品',
      '确认交易',
      '查看库存中的新物品',
    ],
    guidanceNPCName: '交易员 Eve',
    estimatedDuration: 180000,
    order: 5,
    rewards: [
      { type: 'isc', amount: 250, description: '完成奖励' },
      { type: 'item', amount: 1, description: '交易徽章' },
    ],
  },
  upgrade_building: {
    step: 'upgrade_building',
    title: '升级第一个建筑',
    description: '升级建筑以增加产出和功能',
    objective: '将一个建筑升级到 2 级',
    hints: [
      '选择一个建筑',
      '点击"升级"按钮',
      '确认升级需要的资源',
      '升级需要 1 分钟完成',
    ],
    guidanceNPCName: '工程师 Frank',
    estimatedDuration: 120000,
    order: 6,
    rewards: [
      { type: 'isc', amount: 300, description: '完成奖励' },
      { type: 'item', amount: 1, description: '升级加速券' },
    ],
  },
};

export const OnboardingUI: React.FC<OnboardingUIProps> = ({
  currentStep = 'build_first_house',
  completedSteps = [],
  isProtected = true,
  protectionDaysRemaining = 7,
  onStepComplete,
  onSkipStep,
  onAbandon,
  isLoading = false,
}) => {
  const [expandedHint, setExpandedHint] = useState(0);
  const [showConfirmAbandon, setShowConfirmAbandon] = useState(false);

  const stepConfig = TUTORIAL_STEPS[currentStep];
  const completionRate = (completedSteps.length / Object.keys(TUTORIAL_STEPS).length) * 100;
  const totalSteps = Object.keys(TUTORIAL_STEPS).length;

  return (
    <div className="w-full space-y-6">
      {/* Header with progress */}
      <Card className="bg-gradient-to-r from-blue-900/30 to-purple-900/30 border-blue-500/30">
        <CardHeader>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-xl">新手引导</CardTitle>
                <p className="text-sm text-gray-400 mt-1">
                  完成教程以解锁完整游戏功能
                </p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setShowConfirmAbandon(true)}
                className="text-red-400 hover:text-red-300"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>

            {/* Progress bar */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>进度</span>
                <span>
                  {completedSteps.length} / {totalSteps}
                </span>
              </div>
              <Progress value={completionRate} className="h-2" />
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Protection status */}
      {isProtected && (
        <Card className="bg-green-900/20 border-green-500/30">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-green-400 mt-0.5 flex-shrink-0" />
              <div className="space-y-1">
                <p className="font-semibold text-green-300">新手保护激活</p>
                <p className="text-sm text-green-400">
                  您受到 {protectionDaysRemaining} 天的保护，无法被 PvP 攻击或抢劫
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Current step */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0 w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
                <span className="text-lg font-bold">{stepConfig.order}</span>
              </div>
              <div>
                <CardTitle className="text-lg">{stepConfig.title}</CardTitle>
                <p className="text-sm text-gray-400 mt-1">{stepConfig.description}</p>
              </div>
            </div>
            <div className="text-right">
              <Badge variant="outline" className="mb-2">
                <Clock className="w-3 h-3 mr-1" />
                {Math.round(stepConfig.estimatedDuration / 60000)} 分钟
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Objective */}
          <div className="p-3 bg-blue-900/20 border border-blue-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Target className="w-5 h-5 text-blue-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm mb-1">目标</p>
                <p className="text-sm text-gray-300">{stepConfig.objective}</p>
              </div>
            </div>
          </div>

          {/* Guidance NPC */}
          <div className="p-3 bg-purple-900/20 border border-purple-500/30 rounded-lg">
            <div className="flex items-start gap-2">
              <Users className="w-5 h-5 text-purple-400 mt-0.5 flex-shrink-0" />
              <div>
                <p className="font-semibold text-sm mb-1">指导 NPC</p>
                <p className="text-sm text-gray-300">{stepConfig.guidanceNPCName}</p>
              </div>
            </div>
          </div>

          {/* Hints */}
          <div className="space-y-2">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Lightbulb className="w-4 h-4 text-yellow-400" />
              提示
            </p>
            <div className="space-y-2">
              {stepConfig.hints.map((hint, index) => (
                <div
                  key={index}
                  className="p-2 bg-black/30 rounded cursor-pointer hover:bg-black/40 transition-colors"
                  onClick={() => setExpandedHint(expandedHint === index ? -1 : index)}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-sm">{hint}</span>
                    <ChevronRight
                      className={`w-4 h-4 transition-transform ${
                        expandedHint === index ? 'rotate-90' : ''
                      }`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Rewards */}
          <div className="space-y-2">
            <p className="font-semibold text-sm flex items-center gap-2">
              <Gift className="w-4 h-4 text-yellow-400" />
              完成奖励
            </p>
            <div className="grid grid-cols-2 gap-2">
              {stepConfig.rewards.map((reward, index) => (
                <div key={index} className="p-2 bg-yellow-900/20 border border-yellow-500/30 rounded">
                  <p className="text-xs text-yellow-300 capitalize">{reward.type}</p>
                  <p className="text-sm font-bold">+{reward.amount}</p>
                  <p className="text-xs text-gray-400">{reward.description}</p>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Completed steps */}
      {completedSteps.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-green-400" />
              已完成的步骤
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {completedSteps.map((step) => {
                const config = TUTORIAL_STEPS[step];
                return (
                  <div key={step} className="flex items-center gap-3 p-2 bg-green-900/20 rounded">
                    <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="font-semibold text-sm">{config.title}</p>
                    </div>
                    <Badge variant="outline" className="text-green-300 border-green-500/50">
                      完成
                    </Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action buttons */}
      <div className="flex gap-3">
        <Button
          className="flex-1 h-12"
          onClick={() => onStepComplete?.(currentStep)}
          disabled={isLoading}
        >
          <CheckCircle2 className="w-5 h-5 mr-2" />
          标记为完成
        </Button>
        <Button
          variant="outline"
          className="flex-1 h-12"
          onClick={() => onSkipStep?.(currentStep)}
          disabled={isLoading}
        >
          <ChevronRight className="w-5 h-5 mr-2" />
          跳过此步
        </Button>
      </div>

      {/* Abandon confirmation dialog */}
      {showConfirmAbandon && (
        <Alert className="border-red-500/30 bg-red-900/20">
          <AlertCircle className="h-4 w-4 text-red-400" />
          <AlertDescription className="text-red-300 space-y-3">
            <p>您确定要放弃新手引导吗？您可以随时重新开始。</p>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="destructive"
                onClick={() => {
                  onAbandon?.();
                  setShowConfirmAbandon(false);
                }}
              >
                确认放弃
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowConfirmAbandon(false)}
              >
                取消
              </Button>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
};

export default OnboardingUI;
