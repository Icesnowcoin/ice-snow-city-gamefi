import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PiggyBank, Percent, Wallet, Zap } from "lucide-react";

export default function StakingPage() {
  const { t, lang } = useLanguage();
  const stakingQuery = trpc.staking.getStatus.useQuery();

  const stats = stakingQuery.data
    ? [
        {
          title: t("staking.currentAPY"),
          value: stakingQuery.data.currentAPY,
          icon: Percent,
          color: "text-chart-1",
        },
        {
          title: t("staking.pendingRewards"),
          value: `${stakingQuery.data.pendingRewards} ISC`,
          icon: Wallet,
          color: "text-chart-2",
        },
        {
          title: t("staking.totalStaked"),
          value: `${stakingQuery.data.totalStaked} ISC`,
          icon: Zap,
          color: "text-chart-4",
        },
        {
          title: t("staking.poolId"),
          value: stakingQuery.data.poolId.toString(),
          icon: PiggyBank,
          color: "text-chart-3",
        },
      ]
    : [];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <PiggyBank className="h-6 w-6 text-primary" />
          {t("staking.title")}
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((stat, idx) => (
            <Card key={idx} className="bg-card">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </CardHeader>
              <CardContent>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Info Card */}
        <Card className="bg-card border-primary/20">
          <CardHeader>
            <CardTitle className="text-base">
              {lang === "zh" ? "ISC Staking 银行系统" : "ISC Staking Bank System"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm text-muted-foreground">
            <p>
              {lang === "zh"
                ? "ISC Staking 银行系统是 Ice Snow City 的核心收益机制。玩家可以质押 ISC 代币获得 APY 收益。"
                : "The ISC Staking Bank System is the core revenue mechanism of Ice Snow City. Players can stake ISC tokens to earn APY rewards."}
            </p>
            <p>
              {lang === "zh"
                ? "当前质押池 ID 为 {poolId}，APY 为 {apy}，所有质押者共享收益池。"
                : "The current staking pool ID is {poolId} with an APY of {apy}. All stakers share the rewards pool."}
            </p>
            <div className="pt-2 border-t border-border">
              <p className="font-semibold text-foreground">
                {lang === "zh" ? "关键指标说明" : "Key Metrics"}
              </p>
              <ul className="mt-2 space-y-1 text-xs">
                <li>
                  <strong>{t("staking.currentAPY")}:</strong>{" "}
                  {lang === "zh"
                    ? "年化收益率，基于当前质押总量和收益池计算"
                    : "Annual percentage yield calculated from total staked and rewards pool"}
                </li>
                <li>
                  <strong>{t("staking.pendingRewards")}:</strong>{" "}
                  {lang === "zh" ? "用户待领取的累计收益" : "Accumulated rewards pending claim"}
                </li>
                <li>
                  <strong>{t("staking.totalStaked")}:</strong>{" "}
                  {lang === "zh" ? "所有用户在该池中的质押总量" : "Total amount staked by all users in this pool"}
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
