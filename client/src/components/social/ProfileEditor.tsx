import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export interface ProfileDraft {
  displayName: string;
  bio: string;
  avatarUrl: string;
}

interface ProfileEditorProps {
  initialProfile: ProfileDraft;
  onSave: (profile: ProfileDraft) => void | Promise<void>;
  isSaving?: boolean;
}

export function ProfileEditor({ initialProfile, onSave, isSaving = false }: ProfileEditorProps) {
  const [draft, setDraft] = useState<ProfileDraft>(initialProfile);

  useEffect(() => {
    setDraft(initialProfile);
  }, [initialProfile]);

  const update = (key: keyof ProfileDraft, value: string) => {
    setDraft((current) => ({ ...current, [key]: value }));
  };

  const isValid = draft.displayName.trim().length > 0 && draft.displayName.trim().length <= 40;

  return (
    <Card className="border-cyan-500/20 bg-slate-900/80 text-white">
      <CardHeader>
        <CardTitle>编辑玩家资料</CardTitle>
        <CardDescription className="text-slate-400">资料保存由游戏上层真实 API 处理。</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="profile-display-name" className="text-sm font-medium">显示名称</label>
          <Input
            id="profile-display-name"
            value={draft.displayName}
            maxLength={40}
            onChange={(event) => update("displayName", event.target.value)}
            disabled={isSaving}
          />
          <p className="text-xs text-slate-400">{draft.displayName.length}/40</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-bio" className="text-sm font-medium">个人简介</label>
          <Textarea
            id="profile-bio"
            value={draft.bio}
            maxLength={160}
            onChange={(event) => update("bio", event.target.value)}
            disabled={isSaving}
            className="min-h-24"
          />
          <p className="text-xs text-slate-400">{draft.bio.length}/160</p>
        </div>
        <div className="space-y-2">
          <label htmlFor="profile-avatar-url" className="text-sm font-medium">头像 URL</label>
          <Input
            id="profile-avatar-url"
            type="url"
            value={draft.avatarUrl}
            placeholder="https://..."
            onChange={(event) => update("avatarUrl", event.target.value)}
            disabled={isSaving}
          />
        </div>
        <Button
          className="w-full"
          disabled={!isValid || isSaving}
          onClick={() => onSave({ ...draft, displayName: draft.displayName.trim() })}
        >
          {isSaving ? "保存中..." : "保存资料"}
        </Button>
      </CardContent>
    </Card>
  );
}
