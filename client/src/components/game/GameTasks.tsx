import React, { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Loader2, CheckCircle2, Clock, Gift } from "lucide-react";

export const GameTasks: React.FC = () => {
  const [selectedTask, setSelectedTask] = useState<string | null>(null);

  // 获取玩家任务
  const { data: tasks, isLoading: tasksLoading, refetch: refetchTasks } = 
    trpc.game.task.getAvailableTasks.useQuery(undefined, { staleTime: 30000 });

  // 接受任务 mutation
  const acceptMutation = trpc.game.task.acceptTask.useMutation({
    onSuccess: () => {
      refetchTasks();
      console.log("任务已接受");
    },
    onError: (error: any) => {
      console.error("接受任务失败:", error.message);
    },
  });

  // 完成任务 mutation
  const completeMutation = trpc.game.task.completeTask.useMutation({
    onSuccess: () => {
      refetchTasks();
      console.log("任务已完成");
    },
    onError: (error: any) => {
      console.error("完成任务失败:", error.message);
    },
  });

  const handleAccept = async (taskId: string) => {
    await acceptMutation.mutateAsync({ taskId });
  };

  const handleComplete = async (taskId: string) => {
    await completeMutation.mutateAsync({ taskId });
  };

  if (tasksLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <Loader2 className="w-8 h-8 animate-spin" />
      </div>
    );
  }

  const availableTasks = tasks?.filter((t: any) => t.status === "available") || [];
  const activeTasks = tasks?.filter((t: any) => t.status === "active") || [];
  const completedTasks = tasks?.filter((t: any) => t.status === "completed") || [];

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-900 to-purple-800 p-4 pb-20">
      <h1 className="text-3xl font-bold text-white mb-6">任务系统</h1>

      <Tabs defaultValue="active" className="mb-6">
        <TabsList className="grid w-full grid-cols-3 bg-purple-700 bg-opacity-30">
          <TabsTrigger value="active" className="text-xs">
            进行中 ({activeTasks.length})
          </TabsTrigger>
          <TabsTrigger value="available" className="text-xs">
            可用 ({availableTasks.length})
          </TabsTrigger>
          <TabsTrigger value="completed" className="text-xs">
            已完成 ({completedTasks.length})
          </TabsTrigger>
        </TabsList>

        {/* 进行中的任务 */}
        <TabsContent value="active" className="space-y-3">
          {activeTasks.length > 0 ? (
            activeTasks.map((task: any) => (
              <Card
                key={task.id}
                className="bg-purple-700 bg-opacity-20 border-purple-500 p-4 cursor-pointer hover:bg-opacity-30 transition-all"
                onClick={() => setSelectedTask(task.id)}
              >
                <div className="flex items-start gap-3">
                  <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <h3 className="font-bold text-white">{task.title}</h3>
                    <p className="text-purple-200 text-sm mt-1">{task.description}</p>
                    <div className="flex items-center gap-2 mt-3">
                      <div className="flex-1 bg-purple-900 rounded-full h-2">
                        <div
                          className="bg-yellow-400 h-2 rounded-full transition-all"
                          style={{ width: `${task.progress}%` }}
                        />
                      </div>
                      <span className="text-purple-300 text-xs whitespace-nowrap">
                        {task.progress}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 mt-3">
                      <Gift className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">{task.reward} ISC</span>
                    </div>
                  </div>
                  {task.progress === 100 && (
                    <Button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleComplete(task.id);
                      }}
                      className="bg-green-600 hover:bg-green-700 whitespace-nowrap"
                    >
                      <CheckCircle2 className="w-4 h-4 mr-1" />
                      完成
                    </Button>
                  )}
                </div>
              </Card>
            ))
          ) : (
            <p className="text-purple-300 text-center py-8">暂无进行中的任务</p>
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
                    <div className="flex items-center gap-2 mt-3">
                      <Gift className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 font-semibold">{task.reward} ISC</span>
                    </div>
                  </div>
                  <Button
                    onClick={() => handleAccept(task.id)}
                    className="bg-blue-600 hover:bg-blue-700 whitespace-nowrap"
                  >
                    接受
                  </Button>
                </div>
              </Card>
            ))
          ) : (
            <p className="text-purple-300 text-center py-8">暂无可用任务</p>
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
            <p className="text-purple-300 text-center py-8">暂无已完成任务</p>
          )}
        </TabsContent>
      </Tabs>

      {/* 任务统计 */}
      <Card className="bg-purple-700 bg-opacity-20 border-purple-500 p-4 mt-6">
        <h3 className="font-bold text-white mb-3">任务统计</h3>
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
