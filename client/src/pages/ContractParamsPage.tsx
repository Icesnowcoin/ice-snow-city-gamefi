import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { Settings, Save } from "lucide-react";

export default function ContractParamsPage() {
  const { t, lang } = useLanguage();
  const paramsQuery = trpc.contractParams.getAll.useQuery();
  const updateMutation = trpc.contractParams.update.useMutation({
    onSuccess: () => {
      paramsQuery.refetch();
      toast.success(t("common.success"));
    },
    onError: () => toast.error(t("common.error")),
  });

  const [editValues, setEditValues] = useState<Record<string, string>>({});

  useEffect(() => {
    if (paramsQuery.data) {
      const values: Record<string, string> = {};
      paramsQuery.data.forEach((p) => {
        values[p.paramName] = p.paramValue;
      });
      setEditValues(values);
    }
  }, [paramsQuery.data]);

  const paramMeta: Record<string, { label: string; desc: string }> = {
    utilityFeeRate: {
      label: t("params.utilityFeeRate"),
      desc: t("params.utilityFeeRate.desc"),
    },
    luxuryGiftRebateRate: {
      label: t("params.luxuryGiftRebateRate"),
      desc: t("params.luxuryGiftRebateRate.desc"),
    },
    stakingPoolId: {
      label: t("params.stakingPoolId"),
      desc: t("params.stakingPoolId.desc"),
    },
  };

  const handleUpdate = (paramName: string) => {
    const value = editValues[paramName];
    if (!value) return;
    updateMutation.mutate({
      paramName: paramName as "utilityFeeRate" | "luxuryGiftRebateRate" | "stakingPoolId",
      paramValue: value,
    });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground">{t("params.title")}</h1>

        <div className="grid grid-cols-1 gap-4">
          {paramsQuery.data?.map((param) => {
            const meta = paramMeta[param.paramName];
            return (
              <Card key={param.id} className="bg-card">
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Settings className="h-4 w-4 text-primary" />
                    <span className="font-mono text-primary">{param.paramName}</span>
                    <span className="text-muted-foreground font-normal text-sm ml-2">
                      {meta?.label}
                    </span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-xs text-muted-foreground">{meta?.desc}</p>
                  <div className="flex items-center gap-3">
                    <Input
                      value={editValues[param.paramName] || ""}
                      onChange={(e) =>
                        setEditValues((prev) => ({ ...prev, [param.paramName]: e.target.value }))
                      }
                      className="font-mono"
                    />
                    <Button
                      onClick={() => handleUpdate(param.paramName)}
                      disabled={
                        updateMutation.isPending ||
                        editValues[param.paramName] === param.paramValue
                      }
                      size="sm"
                    >
                      <Save className="h-3.5 w-3.5 mr-1" />
                      {t("params.update")}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {t("params.lastUpdated")}: {new Date(param.updatedAt).toLocaleString()}
                    {param.updatedBy && ` | by ${param.updatedBy}`}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    </AdminLayout>
  );
}
