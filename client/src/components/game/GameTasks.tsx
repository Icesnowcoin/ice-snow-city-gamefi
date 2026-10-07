import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, Clock, Gift, AlertCircle, Target } from "lucide-react";

type FeedbackMessage = {
  type: "success" | "error";
  text: string;
} | null;

export const GameTasks: React.FC = () => {
  const [feedback, setFeedback] = useState<FeedbackMessage>(null);

  // 获取玩家任务列表
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } =
    trpc.game.task.getTaskList.useQuery(undefined, { staleTime: 30000 });

  // 接受任务 mutation
  const acceptMutation = trpc.game.core.acceptTask.useMutation({
    onSuccess: (data) => {
      refetchTasks();
      showFeedback("success", "任务已接受！前往完成任务获取奖励");
    },
    onError: (error: any) => {
      showFeedback("error", `接受任务失败: ${error.message}`);
    },
  });

  // 完成任务 mutation
  const completeMutation = trpc.game.core.completeTask.useMutation({
    onSuccess: (data) => {
      refetchTasks();
      showFeedback("success", "任务完成！奖励已发放到钱包");
    },
    onError: (error: any) => {
      showFeedback("error", `完成任务失败: ${error.message}`);
    },
  });

  // 显示反馈
  const showFeedback = (type: "success" | "error", text: string) => {
    setFeedback({ type, text });
    setTimeout(() => setFeedback(null), 3000);
  };

  const handleAccept = async (taskId: string) => {
    await acceptMutation.mutateAsync({ taskId });
  };

  const handleComplete = async (taskId: string) => {
    await completeMutation.mutateAsync({ taskId });
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
        <span className="ml-2 text-purple-200">加载任务数据...</span>
      </div>
    );
  }

  // 分类任务
  const activeTasks = tasks?.filter((t: any) => t.status === "active") || [];
  const availableTasks = tasks?.filter((t: any) => t.status === "available") || [];
  const completedTasks = tasks?.filter((t: any) => t.status === "completed") || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">📋 任务系统</h1>

      {/* 反馈消息 */}
      {feedback && (
        <div className={`mb-4 p-3 rounded-lg flex items-center gap-2 ${
          feedback.type === "success" ? "bg-green-900/50 border border-green-500" : "bg-red-900/50 border border-red-500"
        }`}>
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-green-400" />
          ) : (
            <AlertCircle className="w-5 h-5 text-red-400" />
          )}
          <span className={feedback.type === "success" ? "text-green-200" : "text-red-200"}>
            {feedback.text}
          </span>
        </div>
      )}

      {/* 任务标签页 */}
      <Tabs defaultValue="active" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-purple-800/50 mb-4">
          <TabsTrigger value="active" className="data-[state=active]:bg-purple-600">
            进行中 ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="data-[state=active]:bg-purple-600">
            可用 ({availableTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="data-[state=active]:bg-purple-600">
            已完成 ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* 进行中的任务 */}
        <TabsContent value="active" className="space-y-3">
          {activeTasks.length > 0 ? (
            activeTasks.map((task: any) => (
              <Card
                key={task.id}
                className="bg-purple-700 bg-opacity-20 border-purple-500 p-4"
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <p className="text-purple-200 text-sm mt-1">{task.description}</p>
                    {/* 进度条 */}
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 bg-purple-900 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${task.progress || 0}%` }}
                        />
                      </div>
                      <span className="text-purple-300 text-xs whitespace-nowrap">
                        {task.progress || 0}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Gift className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">{task.reward} ISC</span>
                    </div>
                  </div>
                  {(task.progress || 0) >= 100 && (
                    <Button
                      onClick={() => handleComplete(task.id)}
                      disabled={completeMutation.isPending}
                      className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    >
                      {completeMutation.isPending ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <CheckCircle2 className="w-4 h-4 mr-1" />
                          完成
                        </>
                      )}
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
              <p className="text-purple-300">暂无进行中的任务</p>
              <p className="text-purple-400 text-sm mt-1">去"可用"标签接受新任务吧！</p>
            </div>
          )}
        </TabsContent>

        {/* 可用任务 */}
        <TabsContent value="available" className="space-y-3">
          {availableTasks.length > 0 ? (
            availableTasks.map((task: any) => (
              <Card
                key={task.id}
                className="bg-purple-700 bg-opacity-20 border-purple-500 p-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full border-2 border-blue-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <p className="text-purple-200 text-sm mt-1">{task.description}</p>
                    <div className="flex items-center gap-4 mt-3">
                      <div className="flex items-center gap-1">
                        <Gift className="w-4 h-4 text-green-400" />
                        <span className="text-green-400 font-semibold">{task.reward} ISC</span>
                      </div>
                      {task.difficulty && (
                        <span className={`text-xs px-2 py-0.5 rounded ${
                          task.difficulty === "easy" ? "bg-green-900/50 text-green-300" :
                          task.difficulty === "medium" ? "bg-yellow-900/50 text-yellow-300" :
                          "bg-red-900/50 text-red-300"
                        }`}>
                          {task.difficulty === "easy" ? "简单" : task.difficulty === "medium" ? "中等" : "困难"}
                        </span>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAccept(task.id)}
                    disabled={acceptMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  >
                    {acceptMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      "接受"
                    )}
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <Target className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
              <p className="text-purple-300">暂无可用任务</p>
              <p className="text-purple-400 text-sm mt-1">稍后再来看看吧！</p>
            </div>
          )}
        </TabsContent>

        {/* 已完成任务 */}
        <TabsContent value="completed" className="space-y-3">
          {completedTasks.length > 0 ? (
            completedTasks.map((task: any) => (
              <Card
                key={task.id}
                className="bg-purple-700 bg-opacity-20 border-purple-500 p-4 opacity-75"
              >
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="w-5 h-5 text-green-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-white line-through">{task.title}</h3>
                    <p className="text-purple-200 text-sm mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <Gift className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">+{task.reward} ISC</span>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          ) : (
            <div className="text-center py-8">
              <CheckCircle2 className="w-12 h-12 text-purple-400 mx-auto mb-3 opacity-50" />
              <p className="text-purple-300">暂无已完成任务</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* 任务统计 */}
      <Card className="bg-purple-700 bg-opacity-20 border-purple-500 p-4 mt-6">
        <h3 className="font-bold text-white mb-3">📊 任务统计</h3>
        <div className="grid grid-cols-3 gap-3">
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-400">{activeTasks.length}</p>
            <p className="text-purple-300 text-xs">进行中</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-400">{availableTasks.length}</p>
            <p className="text-purple-300 text-xs">可用</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-green-400">{completedTasks.length}</p>
            <p className="text-purple-300 text-xs">已完成</p>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default GameTasks;
