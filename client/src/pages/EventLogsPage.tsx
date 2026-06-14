import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollText, RefreshCw } from "lucide-react";
import { useState } from "react";

const EVENT_FILTERS = ["all", "UtilityFeePaid", "LuxuryGiftRebateProcessed", "LandMinted", "HouseMinted"];

export default function EventLogsPage() {
  const { t, lang } = useLanguage();
  const [filter, setFilter] = useState<string>("all");
  const [limit] = useState(50);

  const eventsQuery = trpc.contractEvents.list.useQuery({
    limit,
    offset: 0,
    eventName: filter === "all" ? undefined : filter,
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive"> = {
      success: "default",
      failed: "destructive",
      pending: "secondary",
    };
    return variants[status] || "secondary";
  };

  const getFilterLabel = (eventName: string) => {
    const labels: Record<string, string> = {
      all: t("events.filterAll"),
      UtilityFeePaid: t("events.filterUtility"),
      LuxuryGiftRebateProcessed: t("events.filterRebate"),
      LandMinted: t("events.filterLand"),
      HouseMinted: t("events.filterHouse"),
    };
    return labels[eventName] || eventName;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <ScrollText className="h-6 w-6 text-primary" />
            {t("events.title")}
          </h1>
          <Button
            variant="outline"
            size="sm"
            onClick={() => eventsQuery.refetch()}
            disabled={eventsQuery.isRefetching}
          >
            <RefreshCw className={`h-4 w-4 ${eventsQuery.isRefetching ? "animate-spin" : ""}`} />
          </Button>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap gap-2">
          {EVENT_FILTERS.map((f) => (
            <Button
              key={f}
              variant={filter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setFilter(f)}
            >
              {getFilterLabel(f)}
            </Button>
          ))}
        </div>

        {/* Events List */}
        <div className="space-y-2">
          {eventsQuery.isLoading ? (
            <Card className="bg-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                {lang === "zh" ? "加载中..." : "Loading..."}
              </CardContent>
            </Card>
          ) : eventsQuery.data && eventsQuery.data.length > 0 ? (
            eventsQuery.data.map((event) => (
              <Card key={event.id} className="bg-card hover:border-primary/30 transition-colors">
                <CardContent className="pt-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Badge variant="outline">{event.eventName}</Badge>
                        <Badge variant={getStatusBadge(event.status)}>
                          {event.status.toUpperCase()}
                        </Badge>
                      </div>
                      <span className="text-xs text-muted-foreground">
                        {new Date(event.createdAt).toLocaleString()}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                      {event.txHash && (
                        <div>
                          <span className="text-muted-foreground">{t("events.txHash")}:</span>
                          <code className="block font-mono text-foreground/70 truncate">
                            {event.txHash}
                          </code>
                        </div>
                      )}
                      {event.blockNumber && (
                        <div>
                          <span className="text-muted-foreground">{t("events.blockNumber")}:</span>
                          <span className="font-mono text-foreground/70">{event.blockNumber}</span>
                        </div>
                      )}
                      {event.fromAddress && (
                        <div>
                          <span className="text-muted-foreground">{t("events.from")}:</span>
                          <code className="block font-mono text-foreground/70 truncate">
                            {event.fromAddress}
                          </code>
                        </div>
                      )}
                      {event.toAddress && (
                        <div>
                          <span className="text-muted-foreground">{t("events.to")}:</span>
                          <code className="block font-mono text-foreground/70 truncate">
                            {event.toAddress}
                          </code>
                        </div>
                      )}
                      {event.amount && (
                        <div>
                          <span className="text-muted-foreground">{t("common.amount")}:</span>
                          <span className="font-mono text-chart-1">{event.amount} ISC</span>
                        </div>
                      )}
                    </div>

                    {event.params && (
                      <div className="pt-2 border-t border-border">
                        <details className="text-xs">
                          <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                            {lang === "zh" ? "查看详细参数" : "View Parameters"}
                          </summary>
                          <pre className="mt-2 p-2 bg-muted rounded text-foreground/70 overflow-auto text-xs">
                            {JSON.stringify(JSON.parse(event.params), null, 2)}
                          </pre>
                        </details>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-card">
              <CardContent className="py-8 text-center text-muted-foreground">
                {t("common.noData")}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
