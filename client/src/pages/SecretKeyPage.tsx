import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState } from "react";
import { Key, Copy, Plus, AlertTriangle } from "lucide-react";

export default function SecretKeyPage() {
  const { t, lang } = useLanguage();
  const [customKey, setCustomKey] = useState("");
  const [generatedKey, setGeneratedKey] = useState<string | null>(null);

  const activeKeyQuery = trpc.secretKey.getActive.useQuery();
  const historyQuery = trpc.secretKey.getHistory.useQuery();
  const generateMutation = trpc.secretKey.generate.useMutation({
    onSuccess: (data) => {
      setGeneratedKey(data.rawKey);
      activeKeyQuery.refetch();
      historyQuery.refetch();
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("common.error")),
  });
  const setCustomMutation = trpc.secretKey.setCustom.useMutation({
    onSuccess: () => {
      setCustomKey("");
      activeKeyQuery.refetch();
      historyQuery.refetch();
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("common.error")),
  });

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success(t("common.copied"));
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("secretKey.title")}</h1>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-chart-4/10 border border-chart-4/30">
          <AlertTriangle className="h-5 w-5 text-chart-4 mt-0.5 shrink-0" />
          <p className="text-sm text-chart-4">{t("secretKey.warning")}</p>
        </div>

        {/* Current Active Key */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Key className="h-4 w-4 text-primary" />
              {t("secretKey.currentHash")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {activeKeyQuery.data ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <code className="flex-1 text-xs font-mono bg-muted px-3 py-2 rounded break-all text-foreground">
                    {activeKeyQuery.data.keyHash}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => copyToClipboard(activeKeyQuery.data!.keyHash)}
                  >
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  {lang === "zh" ? "创建时间" : "Created"}: {new Date(activeKeyQuery.data.createdAt).toLocaleString()}
                </p>
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">{t("common.noData")}</p>
            )}
          </CardContent>
        </Card>

        {/* Generated Key Display */}
        {generatedKey && (
          <Card className="bg-card border-chart-2/50">
            <CardHeader>
              <CardTitle className="text-base text-chart-2">{t("secretKey.newKey")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <code className="flex-1 text-xs font-mono bg-chart-2/10 px-3 py-2 rounded break-all text-chart-2">
                  {generatedKey}
                </code>
                <Button variant="outline" size="sm" onClick={() => copyToClipboard(generatedKey)}>
                  <Copy className="h-3.5 w-3.5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {lang === "zh" ? "请立即复制并安全保存，此密令不会再次显示" : "Copy and save immediately. This key will not be shown again."}
              </p>
            </CardContent>
          </Card>
        )}

        {/* Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">{t("secretKey.generate")}</CardTitle>
            </CardHeader>
            <CardContent>
              <Button
                onClick={() => generateMutation.mutate()}
                disabled={generateMutation.isPending}
                className="w-full"
              >
                <Plus className="h-4 w-4 mr-2" />
                {t("secretKey.generate")}
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-card">
            <CardHeader>
              <CardTitle className="text-base">{t("secretKey.setCustom")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Input
                value={customKey}
                onChange={(e) => setCustomKey(e.target.value)}
                placeholder={t("secretKey.inputPlaceholder")}
                type="password"
              />
              <Button
                onClick={() => setCustomMutation.mutate({ rawKey: customKey })}
                disabled={!customKey || setCustomMutation.isPending}
                variant="secondary"
                className="w-full"
              >
                {t("secretKey.setCustom")}
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* History */}
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("secretKey.history")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {historyQuery.data?.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                >
                  <div className="flex-1 min-w-0">
                    <code className="text-xs font-mono text-muted-foreground truncate block">
                      {key.keyHash}
                    </code>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(key.createdAt).toLocaleString()}
                    </p>
                  </div>
                  <Badge variant={key.isActive === "yes" ? "default" : "secondary"}>
                    {key.isActive === "yes" ? t("secretKey.active") : t("secretKey.inactive")}
                  </Badge>
                </div>
              ))}
              {(!historyQuery.data || historyQuery.data.length === 0) && (
                <p className="text-muted-foreground text-sm text-center py-4">{t("common.noData")}</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
