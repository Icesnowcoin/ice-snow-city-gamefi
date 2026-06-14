import AdminLayout from "@/components/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { useState } from "react";
import { Terminal, AlertTriangle } from "lucide-react";

type Operation = "payUtilityFee" | "processRebate" | "mintLand" | "mintHouse";

export default function AgentConsolePage() {
  const { t, lang } = useLanguage();
  const [secretKey, setSecretKey] = useState("");
  const [operation, setOperation] = useState<Operation>("payUtilityFee");
  const [formData, setFormData] = useState<Record<string, string>>({});

  const payUtilityFeeMutation = trpc.agent.payUtilityFee.useMutation({
    onSuccess: () => {
      toast.success(t("common.success"));
      setFormData({});
    },
    onError: (err) => toast.error(err.message),
  });

  const processRebateMutation = trpc.agent.processLuxuryGiftRebate.useMutation({
    onSuccess: (data) => {
      toast.success(`${t("common.success")} - ${lang === "zh" ? "返利金额" : "Rebate"}: ${data.rebateAmount} ISC`);
      setFormData({});
    },
    onError: (err) => toast.error(err.message),
  });

  const mintLandMutation = trpc.agent.mintLand.useMutation({
    onSuccess: () => {
      toast.success(t("common.success"));
      setFormData({});
    },
    onError: (err) => toast.error(err.message),
  });

  const mintHouseMutation = trpc.agent.mintHouse.useMutation({
    onSuccess: () => {
      toast.success(t("common.success"));
      setFormData({});
    },
    onError: (err) => toast.error(err.message),
  });

  const handleExecute = () => {
    if (!secretKey) {
      toast.error(lang === "zh" ? "请输入密令" : "Please enter secret key");
      return;
    }

    switch (operation) {
      case "payUtilityFee":
        if (!formData.playerAddress || !formData.amount) {
          toast.error(lang === "zh" ? "请填写所有必填字段" : "Please fill all required fields");
          return;
        }
        payUtilityFeeMutation.mutate({
          secretKey,
          playerAddress: formData.playerAddress,
          amount: formData.amount,
        });
        break;

      case "processRebate":
        if (!formData.recipientAddress || !formData.giftValue) {
          toast.error(lang === "zh" ? "请填写所有必填字段" : "Please fill all required fields");
          return;
        }
        processRebateMutation.mutate({
          secretKey,
          recipientAddress: formData.recipientAddress,
          giftValue: formData.giftValue,
        });
        break;

      case "mintLand":
        if (!formData.toAddress || !formData.x || !formData.y || !formData.landType) {
          toast.error(lang === "zh" ? "请填写所有必填字段" : "Please fill all required fields");
          return;
        }
        mintLandMutation.mutate({
          secretKey,
          toAddress: formData.toAddress,
          x: parseInt(formData.x),
          y: parseInt(formData.y),
          landType: parseInt(formData.landType),
        });
        break;

      case "mintHouse":
        if (!formData.toAddress || !formData.landTokenId || !formData.houseType || !formData.decorationHash) {
          toast.error(lang === "zh" ? "请填写所有必填字段" : "Please fill all required fields");
          return;
        }
        mintHouseMutation.mutate({
          secretKey,
          toAddress: formData.toAddress,
          landTokenId: parseInt(formData.landTokenId),
          houseType: parseInt(formData.houseType),
          decorationHash: formData.decorationHash,
        });
        break;
    }
  };

  const isLoading =
    payUtilityFeeMutation.isPending ||
    processRebateMutation.isPending ||
    mintLandMutation.isPending ||
    mintHouseMutation.isPending;

  return (
    <AdminLayout>
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Terminal className="h-6 w-6 text-primary" />
          {t("agent.title")}
        </h1>

        {/* Warning */}
        <div className="flex items-start gap-3 p-4 rounded-lg bg-destructive/10 border border-destructive/30">
          <AlertTriangle className="h-5 w-5 text-destructive mt-0.5 shrink-0" />
          <p className="text-sm text-destructive">{t("agent.executeWarning")}</p>
        </div>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("agent.secretKeyInput")}</CardTitle>
          </CardHeader>
          <CardContent>
            <Input
              type="password"
              value={secretKey}
              onChange={(e) => setSecretKey(e.target.value)}
              placeholder={t("agent.secretKeyInput")}
            />
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-base">{t("agent.selectOperation")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Select value={operation} onValueChange={(v) => {
              setOperation(v as Operation);
              setFormData({});
            }}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="payUtilityFee">{t("agent.payUtilityFee")}</SelectItem>
                <SelectItem value="processRebate">{t("agent.processRebate")}</SelectItem>
                <SelectItem value="mintLand">{t("agent.mintLand")}</SelectItem>
                <SelectItem value="mintHouse">{t("agent.mintHouse")}</SelectItem>
              </SelectContent>
            </Select>

            {/* Dynamic Form Fields */}
            <div className="space-y-3 pt-4 border-t border-border">
              {operation === "payUtilityFee" && (
                <>
                  <div>
                    <Label className="text-xs">{t("agent.playerAddress")}</Label>
                    <Input
                      value={formData.playerAddress || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, playerAddress: e.target.value }))
                      }
                      placeholder="0x..."
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("agent.amount")}</Label>
                    <Input
                      type="number"
                      value={formData.amount || ""}
                      onChange={(e) => setFormData((prev) => ({ ...prev, amount: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {operation === "processRebate" && (
                <>
                  <div>
                    <Label className="text-xs">{t("agent.recipientAddress")}</Label>
                    <Input
                      value={formData.recipientAddress || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, recipientAddress: e.target.value }))
                      }
                      placeholder="0x..."
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("agent.giftValue")}</Label>
                    <Input
                      type="number"
                      value={formData.giftValue || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, giftValue: e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                </>
              )}

              {operation === "mintLand" && (
                <>
                  <div>
                    <Label className="text-xs">{t("agent.toAddress")}</Label>
                    <Input
                      value={formData.toAddress || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, toAddress: e.target.value }))
                      }
                      placeholder="0x..."
                      className="font-mono text-xs"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-xs">{t("agent.coordinateX")}</Label>
                      <Input
                        type="number"
                        value={formData.x || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, x: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                    <div>
                      <Label className="text-xs">{t("agent.coordinateY")}</Label>
                      <Input
                        type="number"
                        value={formData.y || ""}
                        onChange={(e) => setFormData((prev) => ({ ...prev, y: e.target.value }))}
                        placeholder="0"
                      />
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs">{t("agent.landType")}</Label>
                    <Input
                      type="number"
                      value={formData.landType || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, landType: e.target.value }))
                      }
                      placeholder="0-4"
                    />
                  </div>
                </>
              )}

              {operation === "mintHouse" && (
                <>
                  <div>
                    <Label className="text-xs">{t("agent.toAddress")}</Label>
                    <Input
                      value={formData.toAddress || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, toAddress: e.target.value }))
                      }
                      placeholder="0x..."
                      className="font-mono text-xs"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("agent.landTokenId")}</Label>
                    <Input
                      type="number"
                      value={formData.landTokenId || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, landTokenId: e.target.value }))
                      }
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("agent.houseType")}</Label>
                    <Input
                      type="number"
                      value={formData.houseType || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, houseType: e.target.value }))
                      }
                      placeholder="0-3"
                    />
                  </div>
                  <div>
                    <Label className="text-xs">{t("agent.decorationHash")}</Label>
                    <Input
                      value={formData.decorationHash || ""}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, decorationHash: e.target.value }))
                      }
                      placeholder="0x..."
                      className="font-mono text-xs"
                    />
                  </div>
                </>
              )}
            </div>

            <Button
              onClick={handleExecute}
              disabled={isLoading || !secretKey}
              className="w-full mt-4"
            >
              {t("common.execute")}
            </Button>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
