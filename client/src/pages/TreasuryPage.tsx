import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Landmark, RefreshCw, TrendingUp, TrendingDown } from "lucide-react";

export default function TreasuryPage() {
  const { t, lang } = useLanguage();
  const balanceQuery = trpc.treasury.getBalance.useQuery();
  const transactionsQuery = trpc.treasury.getTransactions.useQuery({ limit: 50, offset: 0 });

  const handleRefresh = () => {
    balanceQuery.refetch();
    transactionsQuery.refetch();
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Landmark className="h-6 w-6 text-primary" />
            {t("treasury.title")}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRefresh}
            disabled={balanceQuery.isRefetching || transactionsQuery.isRefetching}
          >
            <RefreshCw
              className={`h-4 w-4 ${
                balanceQuery.isRefetching || transactionsQuery.isRefetching ? "animate-spin" : ""
              }`}
            />
          </Button>
        </div>

        {/* Balance Card */}
        <Card className="bg-gradient-to-br from-card to-card/50 border-primary/20">
          <CardHeader>
            <CardTitle className="text-base text-muted-foreground">{t("treasury.balance")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">
              {balanceQuery.data?.balance || "0"} ISC
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {lang === "zh" ? "当前城市国库总余额" : "Current total treasury balance"}
            </p>
          </CardContent>
        </Card>

        {/* Transactions */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("treasury.transactions")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {transactionsQuery.isLoading ? (
                <div className="text-center py-8 text-muted-foreground">
                  {lang === "zh" ? "加载中..." : "Loading..."}
                </div>
              ) : transactionsQuery.data && transactionsQuery.data.length > 0 ? (
                transactionsQuery.data.map((tx) => (
                  <div
                    key={tx.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                  >
                    <div className="flex items-center gap-3 flex-1">
                      <div
                        className={`p-2 rounded-lg ${
                          tx.txType === "deposit"
                            ? "bg-chart-1/20 text-chart-1"
                            : "bg-chart-5/20 text-chart-5"
                        }`}
                      >
                        {tx.txType === "deposit" ? (
                          <TrendingUp className="h-4 w-4" />
                        ) : (
                          <TrendingDown className="h-4 w-4" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <Badge variant={tx.txType === "deposit" ? "default" : "secondary"}>
                            {tx.txType === "deposit" ? t("treasury.deposit") : t("treasury.withdraw")}
                          </Badge>
                          <span className="text-xs text-muted-foreground truncate">
                            {tx.description || "-"}
                          </span>
                        </div>
                        <div className="text-xs text-muted-foreground mt-1 space-y-0.5">
                          {tx.fromAddress && (
                            <div>
                              <span className="text-muted-foreground">{t("events.from")}:</span>
                              <code className="ml-1 font-mono text-foreground/70">{tx.fromAddress}</code>
                            </div>
                          )}
                          {tx.toAddress && (
                            <div>
                              <span className="text-muted-foreground">{t("events.to")}:</span>
                              <code className="ml-1 font-mono text-foreground/70">{tx.toAddress}</code>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-sm font-mono font-bold ${
                          tx.txType === "deposit" ? "text-chart-1" : "text-chart-5"
                        }`}
                      >
                        {tx.txType === "deposit" ? "+" : "-"}
                        {tx.amount} ISC
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(tx.createdAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  {t("common.noData")}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
