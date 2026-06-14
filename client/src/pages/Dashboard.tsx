import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Key, Settings, ScrollText, Terminal, Landmark, PiggyBank } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const { t, lang } = useLanguage();
  const treasuryQuery = trpc.treasury.getBalance.useQuery();
  const stakingQuery = trpc.staking.getStatus.useQuery();
  const secretKeyQuery = trpc.secretKey.getActive.useQuery();

  const cards = [
    {
      title: t("nav.secretKey"),
      icon: Key,
      path: "/secret-key",
      value: secretKeyQuery.data ? (lang === "zh" ? "已配置" : "Configured") : (lang === "zh" ? "未配置" : "Not Set"),
      color: secretKeyQuery.data ? "text-chart-2" : "text-destructive",
    },
    {
      title: t("nav.treasury"),
      icon: Landmark,
      path: "/treasury",
      value: treasuryQuery.data ? `${treasuryQuery.data.balance} ISC` : "0 ISC",
      color: "text-chart-1",
    },
    {
      title: t("nav.staking"),
      icon: PiggyBank,
      path: "/staking",
      value: stakingQuery.data?.currentAPY || "30.00%",
      color: "text-chart-4",
    },
    {
      title: t("nav.contractParams"),
      icon: Settings,
      path: "/contract-params",
      value: lang === "zh" ? "3 个参数" : "3 Params",
      color: "text-chart-3",
    },
    {
      title: t("nav.eventLogs"),
      icon: ScrollText,
      path: "/event-logs",
      value: lang === "zh" ? "查看日志" : "View Logs",
      color: "text-chart-5",
    },
    {
      title: t("nav.agentConsole"),
      icon: Terminal,
      path: "/agent-console",
      value: lang === "zh" ? "操作面板" : "Operations",
      color: "text-primary",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            {t("nav.dashboard")}
          </h1>
          <p className="text-muted-foreground mt-1">
            {lang === "zh"
              ? "Ice Snow City 智能合约管理系统概览"
              : "Ice Snow City Smart Contract Management Overview"}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((card) => (
            <Link key={card.path} href={card.path}>
              <Card className="cursor-pointer hover:border-primary/50 transition-colors duration-200 bg-card">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground">
                    {card.title}
                  </CardTitle>
                  <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                  <p className={`text-xl font-bold ${card.color}`}>{card.value}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </AdminLayout>
  );
}
