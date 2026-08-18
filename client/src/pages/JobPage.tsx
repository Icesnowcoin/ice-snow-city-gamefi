import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { Briefcase, TrendingUp, Clock, DollarSign } from "lucide-react";

export function JobPage() {
  const [selectedJob, setSelectedJob] = useState<string | null>(null);
  const [workHours, setWorkHours] = useState(8);

  // 获取可用工作
  const { data: availableJobs = [] } = trpc.job.getAvailableJobs.useQuery({ playerLevel: 1 });

  // 获取工作统计
  const { data: jobStats } = trpc.job.getJobStats.useQuery();

  // 获取升级进度
  const { data: levelProgress } = trpc.job.getLevelUpProgress.useQuery();

  // 获取工作历史
  const { data: jobHistory = [] } = trpc.job.getJobHistory.useQuery({ limit: 10 }) || { data: [] };

  // 获取工作推荐
  const { data: recommendations = [] } = trpc.job.getJobRecommendations.useQuery();

  // 开始工作
  const startJobMutation = trpc.job.startJob.useMutation();

  // 完成工作
  const completeJobMutation = trpc.job.completeJob.useMutation();

  const handleStartJob = async (jobType: string) => {
    try {
      await startJobMutation.mutateAsync({
        jobType: jobType as any,
        workHours,
      });
      setSelectedJob(jobType);
    } catch (error) {
      console.error("Failed to start job:", error);
    }
  };

  const handleCompleteJob = async () => {
    try {
      await completeJobMutation.mutateAsync();
      setSelectedJob(null);
    } catch (error) {
      console.error("Failed to complete job:", error);
    }
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <Briefcase className="w-8 h-8" />
          打工系统
        </h1>
        <p className="text-muted-foreground mt-2">通过工作赚取收入和经验</p>
      </div>

      {/* 工作等级和统计 */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">工作等级</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats?.jobLevel || 1}</div>
            <p className="text-xs text-muted-foreground mt-1">当前等级</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总收入</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <DollarSign className="w-5 h-5" />
              {jobStats?.totalEarnings || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">ISC</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总工作数</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{jobStats?.totalJobs || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">次</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">总经验</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold flex items-center gap-1">
              <TrendingUp className="w-5 h-5" />
              {jobStats?.totalExperience || 0}
            </div>
            <p className="text-xs text-muted-foreground mt-1">EXP</p>
          </CardContent>
        </Card>
      </div>

      {/* 升级进度 */}
      {levelProgress && (
        <Card>
          <CardHeader>
            <CardTitle>升级进度</CardTitle>
            <CardDescription>
              第 {levelProgress.currentLevel} 级 - {levelProgress.progress}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Progress value={levelProgress.progress} className="h-2" />
            <p className="text-sm text-muted-foreground mt-2">
              还需 {levelProgress.nextLevelExp - levelProgress.totalExperience} 经验升级
            </p>
          </CardContent>
        </Card>
      )}

      {/* 工作标签页 */}
      <Tabs defaultValue="available" className="w-full">
        <TabsList>
          <TabsTrigger value="available">可用工作</TabsTrigger>
          <TabsTrigger value="recommended">推荐工作</TabsTrigger>
          <TabsTrigger value="history">工作历史</TabsTrigger>
        </TabsList>

        {/* 可用工作 */}
        <TabsContent value="available" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableJobs.map((job) => (
              <Card key={job.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="capitalize">{job.jobType}</CardTitle>
                      <CardDescription>{job.facilityType}</CardDescription>
                    </div>
                    <Badge variant="outline">{job.requiredLevel}+ 级</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">时薪</p>
                      <p className="font-semibold flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">经验/小时</p>
                      <p className="font-semibold flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {job.experienceGain}
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium">工作时长（小时）</label>
                    <div className="flex items-center gap-2 mt-1">
                      <input
                        type="range"
                        min="1"
                        max="24"
                        value={workHours}
                        onChange={(e) => setWorkHours(Number(e.target.value))}
                        className="flex-1"
                      />
                      <span className="text-sm font-semibold w-12">{workHours}h</span>
                    </div>
                  </div>

                  <div className="text-sm">
                    <p className="text-muted-foreground">预计收入</p>
                    <p className="font-semibold text-lg">
                      {job.salary * workHours} ISC
                    </p>
                  </div>

                  <Button
                    onClick={() => handleStartJob(job.jobType)}
                    disabled={selectedJob !== null}
                    className="w-full"
                  >
                    {selectedJob === job.jobType ? "工作中..." : "开始工作"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 推荐工作 */}
        <TabsContent value="recommended" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recommendations.map((job) => (
              <Card key={job.id} className="border-green-200 bg-green-50">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="capitalize text-green-900">{job.jobType}</CardTitle>
                      <CardDescription>推荐 - 高收入工作</CardDescription>
                    </div>
                    <Badge className="bg-green-600">推荐</Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <p className="text-muted-foreground">时薪</p>
                      <p className="font-semibold text-lg flex items-center gap-1">
                        <DollarSign className="w-4 h-4" />
                        {job.salary}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">经验/小时</p>
                      <p className="font-semibold text-lg flex items-center gap-1">
                        <TrendingUp className="w-4 h-4" />
                        {job.experienceGain}
                      </p>
                    </div>
                  </div>

                  <Button
                    onClick={() => handleStartJob(job.jobType)}
                    disabled={selectedJob !== null}
                    className="w-full bg-green-600 hover:bg-green-700"
                  >
                    开始推荐工作
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* 工作历史 */}
        <TabsContent value="history" className="space-y-4">
          {jobHistory.length > 0 ? (
            <div className="space-y-2">
              {jobHistory.map((job) => (
                <Card key={job.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-semibold capitalize">{job.jobType}</p>
                        <p className="text-sm text-muted-foreground">
                          工作 {job.workDuration} 分钟
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold flex items-center gap-1">
                          <DollarSign className="w-4 h-4" />
                          +{job.totalEarnings}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {new Date(job.completedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-muted-foreground">还没有工作历史</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
