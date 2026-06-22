import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import {
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Gift,
  MapPin,
  Calendar,
  User,
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  npc: string;
  location: string;
  status: "available" | "in_progress" | "completed";
  difficulty: "easy" | "medium" | "hard";
  reward: number;
  deadline: string;
  progress: number;
}

const mockTasks: Task[] = [
  {
    id: "1",
    title: "收集布料",
    description: "从市场收集 10 件布料并交给李商人",
    npc: "李商人",
    location: "商业广场",
    status: "in_progress",
    difficulty: "easy",
    reward: 100,
    deadline: "2026-06-25",
    progress: 60,
  },
  {
    id: "2",
    title: "种植小麦",
    description: "在农业区种植 5 块小麦田",
    npc: "王农民",
    location: "农业区",
    status: "available",
    difficulty: "medium",
    reward: 250,
    deadline: "2026-06-30",
    progress: 0,
  },
  {
    id: "3",
    title: "制作木制品",
    description: "制作 3 件木制家具",
    npc: "张工匠",
    location: "工坊",
    status: "available",
    difficulty: "hard",
    reward: 500,
    deadline: "2026-07-05",
    progress: 0,
  },
  {
    id: "4",
    title: "艺术展览",
    description: "为艺术馆收集 5 件艺术作品",
    npc: "陈艺术家",
    location: "艺术馆",
    status: "completed",
    difficulty: "medium",
    reward: 300,
    deadline: "2026-06-20",
    progress: 100,
  },
  {
    id: "5",
    title: "医疗援助",
    description: "收集 20 种草药供应给诊所",
    npc: "刘医生",
    location: "诊所",
    status: "in_progress",
    difficulty: "hard",
    reward: 400,
    deadline: "2026-06-28",
    progress: 40,
  },
];

export default function TasksPage() {
  const { lang } = useLanguage();
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const filteredTasks = mockTasks.filter((task) =>
    filterStatus === "all" ? true : task.status === filterStatus
  );

  const getStatusColor = (status: string) => {
    if (status === "available") return "bg-blue-100 text-blue-800";
    if (status === "in_progress") return "bg-yellow-100 text-yellow-800";
    return "bg-green-100 text-green-800";
  };

  const getStatusLabel = (status: string) => {
    if (status === "available") return lang === "zh" ? "可接受" : "Available";
    if (status === "in_progress") return lang === "zh" ? "进行中" : "In Progress";
    return lang === "zh" ? "已完成" : "Completed";
  };

  const getDifficultyColor = (difficulty: string) => {
    if (difficulty === "easy") return "bg-green-100 text-green-800";
    if (difficulty === "medium") return "bg-yellow-100 text-yellow-800";
    return "bg-red-100 text-red-800";
  };

  const getDifficultyLabel = (difficulty: string) => {
    if (difficulty === "easy") return lang === "zh" ? "简单" : "Easy";
    if (difficulty === "medium") return lang === "zh" ? "中等" : "Medium";
    return lang === "zh" ? "困难" : "Hard";
  };

  const stats = {
    total: mockTasks.length,
    available: mockTasks.filter((t) => t.status === "available").length,
    inProgress: mockTasks.filter((t) => t.status === "in_progress").length,
    completed: mockTasks.filter((t) => t.status === "completed").length,
    totalReward: mockTasks
      .filter((t) => t.status === "completed")
      .reduce((sum, t) => sum + t.reward, 0),
  };

  return (
    <div className="space-y-6">
      {/* Statistics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-blue-600">{stats.total}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "总任务数" : "Total Tasks"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-green-600">{stats.available}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "可接受" : "Available"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-yellow-600">{stats.inProgress}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "进行中" : "In Progress"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-purple-600">{stats.completed}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "已完成" : "Completed"}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <p className="text-2xl font-bold text-orange-600">{stats.totalReward}</p>
            <p className="text-xs text-muted-foreground">{lang === "zh" ? "已获奖励" : "Rewards Earned"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="all" onClick={() => setFilterStatus("all")}>
            {lang === "zh" ? "全部" : "All"}
          </TabsTrigger>
          <TabsTrigger value="available" onClick={() => setFilterStatus("available")}>
            {lang === "zh" ? "可接受" : "Available"}
          </TabsTrigger>
          <TabsTrigger value="in_progress" onClick={() => setFilterStatus("in_progress")}>
            {lang === "zh" ? "进行中" : "In Progress"}
          </TabsTrigger>
          <TabsTrigger value="completed" onClick={() => setFilterStatus("completed")}>
            {lang === "zh" ? "已完成" : "Completed"}
          </TabsTrigger>
        </TabsList>

        {/* Tasks List */}
        <TabsContent value={filterStatus} className="space-y-4">
          {filteredTasks.map((task) => (
            <Card key={task.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="pt-6">
                <div className="space-y-4">
                  {/* Header */}
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="text-lg font-bold">{task.title}</h3>
                        <Badge className={getStatusColor(task.status)}>
                          {getStatusLabel(task.status)}
                        </Badge>
                        <Badge className={getDifficultyColor(task.difficulty)}>
                          {getDifficultyLabel(task.difficulty)}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{task.description}</p>
                    </div>
                    <div className="text-right flex-shrink-0">
                      <div className="flex items-center gap-1 text-orange-600 font-bold">
                        <Gift className="w-4 h-4" />
                        <span>{task.reward}</span>
                      </div>
                      <p className="text-xs text-muted-foreground">ISC</p>
                    </div>
                  </div>

                  {/* Info */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-muted-foreground" />
                      <span>{task.npc}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-muted-foreground" />
                      <span>{task.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>{task.deadline}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      <span>{lang === "zh" ? "进度" : "Progress"}: {task.progress}%</span>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  <div>
                    <Progress value={task.progress} className="h-2" />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setSelectedTask(task)}
                        >
                          {lang === "zh" ? "查看详情" : "View Details"}
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>{selectedTask?.title}</DialogTitle>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div>
                            <p className="text-sm font-medium mb-2">{lang === "zh" ? "任务描述" : "Description"}</p>
                            <p className="text-sm text-muted-foreground">{selectedTask?.description}</p>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <p className="text-xs text-muted-foreground">{lang === "zh" ? "NPC" : "NPC"}</p>
                              <p className="font-medium">{selectedTask?.npc}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{lang === "zh" ? "位置" : "Location"}</p>
                              <p className="font-medium">{selectedTask?.location}</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{lang === "zh" ? "奖励" : "Reward"}</p>
                              <p className="font-medium">{selectedTask?.reward} ISC</p>
                            </div>
                            <div>
                              <p className="text-xs text-muted-foreground">{lang === "zh" ? "难度" : "Difficulty"}</p>
                              <p className="font-medium">{getDifficultyLabel(selectedTask?.difficulty || "easy")}</p>
                            </div>
                          </div>
                          <div>
                            <p className="text-sm font-medium mb-2">{lang === "zh" ? "任务进度" : "Progress"}</p>
                            <Progress value={selectedTask?.progress || 0} className="h-2" />
                            <p className="text-xs text-muted-foreground mt-2">{selectedTask?.progress}%</p>
                          </div>
                          <Button className="w-full" disabled={selectedTask?.status === "completed"}>
                            {selectedTask?.status === "available"
                              ? lang === "zh"
                                ? "接受任务"
                                : "Accept Task"
                              : selectedTask?.status === "in_progress"
                              ? lang === "zh"
                                ? "继续任务"
                                : "Continue Task"
                              : lang === "zh"
                              ? "已完成"
                              : "Completed"}
                          </Button>
                        </div>
                      </DialogContent>
                    </Dialog>

                    {task.status === "in_progress" && (
                      <Button size="sm" className="flex-1">
                        {lang === "zh" ? "继续进行" : "Continue"}
                      </Button>
                    )}
                    {task.status === "available" && (
                      <Button size="sm" className="flex-1">
                        {lang === "zh" ? "接受任务" : "Accept"}
                      </Button>
                    )}
                    {task.status === "completed" && (
                      <Button size="sm" variant="outline" className="flex-1" disabled>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        {lang === "zh" ? "已完成" : "Completed"}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Empty State */}
      {filteredTasks.length === 0 && (
        <Card>
          <CardContent className="pt-6 text-center py-12">
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">
              {lang === "zh" ? "没有找到匹配的任务" : "No tasks found"}
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
