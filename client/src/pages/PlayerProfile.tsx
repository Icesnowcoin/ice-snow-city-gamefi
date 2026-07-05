import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlayerProfile, useUpdateProfile } from "@/hooks/useGameData";
import { trpc } from "@/lib/trpc";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import {
  User,
  Award,
  TrendingUp,
  Calendar,
  MapPin,
  Mail,
  Edit2,
  Trophy,
  Star,
  Zap,
  Heart,
  Droplets,
  Utensils,
  Battery,
  Home,
  Loader2,
  Save,
  Shield,
} from "lucide-react";

export default function PlayerProfile() {
  const { lang } = useLanguage();
  const { data: player, isLoading, refetch } = usePlayerProfile();
  const updateProfile = useUpdateProfile();
  const [editOpen, setEditOpen] = useState(false);
  const [editUsername, setEditUsername] = useState("");

  const handleSaveProfile = async () => {
    if (!editUsername.trim()) {
      toast.error(lang === "zh" ? "用户名不能为空" : "Username cannot be empty");
      return;
    }
    try {
      await updateProfile.mutateAsync({ username: editUsername });
      toast.success(lang === "zh" ? "资料更新成功" : "Profile updated");
      setEditOpen(false);
      refetch();
    } catch (error) {
      toast.error(lang === "zh" ? "更新失败" : "Update failed");
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  const p = player as any;

  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white border-0">
        <CardContent className="pt-6">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="w-20 h-20 rounded-full bg-white/20 flex items-center justify-center text-3xl font-bold flex-shrink-0">
              {(p?.username || "P")[0].toUpperCase()}
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-bold truncate">{p?.username || "Player"}</h1>
                <Dialog open={editOpen} onOpenChange={setEditOpen}>
                  <DialogTrigger asChild>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="text-white hover:bg-white/20"
                      onClick={() => setEditUsername(p?.username || "")}
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{lang === "zh" ? "编辑资料" : "Edit Profile"}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div>
                        <Label>{lang === "zh" ? "用户名" : "Username"}</Label>
                        <Input
                          value={editUsername}
                          onChange={(e) => setEditUsername(e.target.value)}
                          placeholder={lang === "zh" ? "输入新用户名" : "Enter new username"}
                        />
                      </div>
                      <Button
                        onClick={handleSaveProfile}
                        disabled={updateProfile.isPending}
                        className="w-full"
                      >
                        {updateProfile.isPending ? (
                          <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        ) : (
                          <Save className="w-4 h-4 mr-2" />
                        )}
                        {lang === "zh" ? "保存" : "Save"}
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <p className="text-blue-100 text-sm">ID: #{p?.id || "000"}</p>
              <div className="flex items-center gap-3 mt-2">
                <Badge className="bg-yellow-500 text-black">
                  Lv.{p?.level || 1}
                </Badge>
                <Badge className="bg-white/20 text-white">
                  {p?.maritalStatus === "married" ? (lang === "zh" ? "已婚" : "Married") : (lang === "zh" ? "单身" : "Single")}
                </Badge>
              </div>
            </div>
          </div>

          {/* Level Progress */}
          <div className="mt-4">
            <div className="flex justify-between text-sm text-blue-100 mb-1">
              <span>EXP: {p?.experience || 0}/{p?.totalExperience || 10000}</span>
              <span>{Math.round(((p?.experience || 0) / (p?.totalExperience || 10000)) * 100)}%</span>
            </div>
            <Progress value={((p?.experience || 0) / (p?.totalExperience || 10000)) * 100} className="h-2" />
          </div>
        </CardContent>
      </Card>

      {/* Status Bars */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm">{lang === "zh" ? "状态" : "Status"}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Battery className="w-4 h-4 text-yellow-500" />
                <span>{lang === "zh" ? "体力" : "Stamina"}</span>
                <span className="ml-auto font-medium">{p?.stamina || 0}/{p?.maxStamina || 100}</span>
              </div>
              <Progress value={((p?.stamina || 0) / (p?.maxStamina || 100)) * 100} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Heart className="w-4 h-4 text-red-500" />
                <span>{lang === "zh" ? "健康" : "Health"}</span>
                <span className="ml-auto font-medium">{p?.health || 0}</span>
              </div>
              <Progress value={p?.health || 0} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Utensils className="w-4 h-4 text-orange-500" />
                <span>{lang === "zh" ? "饥饿" : "Hunger"}</span>
                <span className="ml-auto font-medium">{p?.hunger || 0}</span>
              </div>
              <Progress value={p?.hunger || 0} className="h-1.5" />
            </div>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-sm">
                <Droplets className="w-4 h-4 text-blue-500" />
                <span>{lang === "zh" ? "口渴" : "Thirst"}</span>
                <span className="ml-auto font-medium">{p?.thirst || 0}</span>
              </div>
              <Progress value={p?.thirst || 0} className="h-1.5" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabs */}
      <Tabs defaultValue="stats" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="stats">{lang === "zh" ? "统计" : "Stats"}</TabsTrigger>
          <TabsTrigger value="achievements">{lang === "zh" ? "成就" : "Achievements"}</TabsTrigger>
          <TabsTrigger value="account">{lang === "zh" ? "账户" : "Account"}</TabsTrigger>
        </TabsList>

        {/* Stats Tab */}
        <TabsContent value="stats">
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-accent rounded-lg text-center">
                  <Home className="w-5 h-5 mx-auto text-blue-500 mb-1" />
                  <p className="text-2xl font-bold">{p?.propertiesOwned || 0}</p>
                  <p className="text-xs text-muted-foreground">{lang === "zh" ? "房产" : "Properties"}</p>
                </div>
                <div className="p-3 bg-accent rounded-lg text-center">
                  <Zap className="w-5 h-5 mx-auto text-green-500 mb-1" />
                  <p className="text-2xl font-bold">{p?.farmsCreated || 0}</p>
                  <p className="text-xs text-muted-foreground">{lang === "zh" ? "农场" : "Farms"}</p>
                </div>
                <div className="p-3 bg-accent rounded-lg text-center">
                  <Trophy className="w-5 h-5 mx-auto text-yellow-500 mb-1" />
                  <p className="text-2xl font-bold">{p?.tasksCompleted || 0}</p>
                  <p className="text-xs text-muted-foreground">{lang === "zh" ? "任务" : "Tasks"}</p>
                </div>
                <div className="p-3 bg-accent rounded-lg text-center">
                  <User className="w-5 h-5 mx-auto text-pink-500 mb-1" />
                  <p className="text-2xl font-bold">{p?.npcsFriended || 0}</p>
                  <p className="text-xs text-muted-foreground">{lang === "zh" ? "好友" : "Friends"}</p>
                </div>
              </div>

              <div className="mt-4 space-y-3">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{lang === "zh" ? "钱包余额" : "Wallet"}</span>
                  <span className="font-medium">{p?.money?.toLocaleString() || 0} ISC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{lang === "zh" ? "银行存款" : "Bank"}</span>
                  <span className="font-medium">{p?.bankBalance?.toLocaleString() || 0} ISC</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{lang === "zh" ? "总资产" : "Total Assets"}</span>
                  <span className="font-bold text-green-600">
                    {((p?.money || 0) + (p?.isc || 0) + (p?.bankBalance || 0)).toLocaleString()} ISC
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Achievements Tab */}
        <TabsContent value="achievements">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-3">
                {[
                  { id: "first_login", name: lang === "zh" ? "首次登录" : "First Login", icon: "🎯", progress: 100 },
                  { id: "first_trade", name: lang === "zh" ? "首次交易" : "First Trade", icon: "💰", progress: p?.tasksCompleted > 0 ? 100 : 0 },
                  { id: "property_owner", name: lang === "zh" ? "房产拥有者" : "Property Owner", icon: "🏠", progress: p?.propertiesOwned > 0 ? 100 : 0 },
                  { id: "farmer", name: lang === "zh" ? "农业专家" : "Farmer", icon: "🌾", progress: p?.farmsCreated > 0 ? 100 : 0 },
                  { id: "social", name: lang === "zh" ? "社交达人" : "Social Master", icon: "👥", progress: Math.min(100, (p?.npcsFriended || 0) * 20) },
                  { id: "rich", name: lang === "zh" ? "富豪" : "Millionaire", icon: "💎", progress: Math.min(100, ((p?.money || 0) + (p?.bankBalance || 0)) / 1000) },
                ].map((achievement) => (
                  <div key={achievement.id} className="flex items-center gap-3 p-3 border rounded-lg">
                    <span className="text-2xl">{achievement.icon}</span>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{achievement.name}</p>
                      <Progress value={achievement.progress} className="h-1.5 mt-1" />
                    </div>
                    <Badge variant={achievement.progress >= 100 ? "default" : "outline"} className="text-xs">
                      {achievement.progress >= 100 ? (lang === "zh" ? "已达成" : "Done") : `${achievement.progress}%`}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Account Tab */}
        <TabsContent value="account">
          <Card>
            <CardContent className="pt-4">
              <div className="space-y-4">
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "邮箱" : "Email"}</p>
                    <p className="font-medium text-sm">player@example.com</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Shield className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "实名认证" : "Identity Verification"}</p>
                    <p className="font-medium text-sm text-yellow-500">{lang === "zh" ? "未认证" : "Not Verified"}</p>
                  </div>
                  <Button size="sm" variant="outline" className="ml-auto" onClick={() => toast.info(lang === "zh" ? "功能开发中" : "Coming soon")}>
                    {lang === "zh" ? "认证" : "Verify"}
                  </Button>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <MapPin className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "当前位置" : "Location"}</p>
                    <p className="font-medium text-sm">{lang === "zh" ? "冰雪城" : "Ice Snow City"}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-3 border rounded-lg">
                  <Calendar className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">{lang === "zh" ? "注册时间" : "Registered"}</p>
                    <p className="font-medium text-sm">
                      {p?.createdAt ? new Date(p.createdAt).toLocaleDateString() : "-"}
                    </p>
                  </div>
                </div>

                <div className="border-t pt-4 space-y-2">
                  <p className="text-xs text-muted-foreground">
                    {lang === "zh"
                      ? "提示：一个实名信息终身只能注册一个游戏账户。提款前需完成实名认证并设置提款密码。最多可绑定 3 个链上地址用于提款。"
                      : "Note: One identity can only register one game account. Complete identity verification and set withdrawal password before withdrawing. Up to 3 blockchain addresses can be bound for withdrawal."}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
