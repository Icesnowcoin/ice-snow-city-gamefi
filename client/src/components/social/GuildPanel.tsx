import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import {
  Users,
  Crown,
  Shield,
  User,
  Mail,
  Trash2,
  Plus,
  Search,
  Settings,
  Megaphone,
  Coins,
  TrendingUp,
} from 'lucide-react';
import { Guild, GuildMember, GuildInvitation, GuildApplication } from '@/game/social/GuildManager';
import './guild-panel.css';

interface GuildPanelProps {
  currentGuild?: Guild;
  currentPlayerId: string;
  onCreateGuild?: (name: string, description: string) => void;
  onLeaveGuild?: () => void;
  onInvitePlayer?: (playerId: string) => void;
  onApproveApplication?: (applicationId: string) => void;
  onRejectApplication?: (applicationId: string) => void;
  onUpdateAnnouncement?: (announcement: string) => void;
}

export const GuildPanel: React.FC<GuildPanelProps> = ({
  currentGuild,
  currentPlayerId,
  onCreateGuild,
  onLeaveGuild,
  onInvitePlayer,
  onApproveApplication,
  onRejectApplication,
  onUpdateAnnouncement,
}) => {
  const [activeTab, setActiveTab] = useState('info');
  const [searchQuery, setSearchQuery] = useState('');
  const [newGuildName, setNewGuildName] = useState('');
  const [newGuildDesc, setNewGuildDesc] = useState('');
  const [announcement, setAnnouncement] = useState(currentGuild?.announcement || '');
  const [invitations, setInvitations] = useState<GuildInvitation[]>([]);
  const [applications, setApplications] = useState<GuildApplication[]>([]);

  useEffect(() => {
    if (currentGuild) {
      setAnnouncement(currentGuild.announcement);
    }
  }, [currentGuild]);

  const currentMember = currentGuild?.members.find((m) => m.playerId === currentPlayerId);
  const isFounder = currentMember?.role === 'founder';
  const isOfficer = currentMember?.role === 'officer';
  const canManage = isFounder || isOfficer;

  const filteredMembers = currentGuild?.members.filter((m) =>
    m.playerName.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  const handleCreateGuild = () => {
    if (newGuildName.trim()) {
      onCreateGuild?.(newGuildName, newGuildDesc);
      setNewGuildName('');
      setNewGuildDesc('');
    }
  };

  const handleUpdateAnnouncement = () => {
    onUpdateAnnouncement?.(announcement);
  };

  if (!currentGuild) {
    return (
      <div className="guild-panel-empty">
        <div className="empty-state">
          <Users className="empty-icon" />
          <h3>还未加入工会</h3>
          <p>加入或创建一个工会来与其他玩家合作</p>

          <div className="create-guild-form">
            <h4>创建新工会</h4>
            <Input
              placeholder="工会名称"
              value={newGuildName}
              onChange={(e) => setNewGuildName(e.target.value)}
              className="form-input"
            />
            <Textarea
              placeholder="工会描述"
              value={newGuildDesc}
              onChange={(e) => setNewGuildDesc(e.target.value)}
              className="form-textarea"
            />
            <Button onClick={handleCreateGuild} className="create-btn">
              <Plus className="icon" />
              创建工会
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guild-panel">
      <div className="guild-header">
        <div className="guild-info">
          <img src={currentGuild.guildLogo} alt={currentGuild.guildName} className="guild-logo" />
          <div className="guild-details">
            <h2>{currentGuild.guildName}</h2>
            <p className="guild-description">{currentGuild.description}</p>
            <div className="guild-stats">
              <span className="stat">
                <Users className="icon" />
                {currentGuild.members.length}/{currentGuild.maxMembers}
              </span>
              <span className="stat">
                <TrendingUp className="icon" />
                等级 {currentGuild.level}
              </span>
              <span className="stat">
                <Coins className="icon" />
                {currentGuild.funds.toLocaleString()}
              </span>
            </div>
          </div>
        </div>

        <div className="guild-actions">
          {currentMember && (
            <Badge className={`role-badge role-${currentMember.role}`}>
              {currentMember.role === 'founder'
                ? '创始人'
                : currentMember.role === 'officer'
                  ? '官员'
                  : '成员'}
            </Badge>
          )}
          {!isFounder && (
            <Button variant="outline" onClick={onLeaveGuild}>
              离开工会
            </Button>
          )}
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="guild-tabs">
        <TabsList>
          <TabsTrigger value="info">工会信息</TabsTrigger>
          <TabsTrigger value="members">
            成员 ({currentGuild.members.length})
          </TabsTrigger>
          {canManage && (
            <>
              <TabsTrigger value="applications">申请</TabsTrigger>
              <TabsTrigger value="settings">设置</TabsTrigger>
            </>
          )}
        </TabsList>

        {/* 工会信息标签页 */}
        <TabsContent value="info" className="tab-content">
          <Card className="announcement-card">
            <div className="announcement-header">
              <Megaphone className="icon" />
              <h3>工会公告</h3>
            </div>
            <p className="announcement-text">{currentGuild.announcement || '暂无公告'}</p>
          </Card>

          <Card className="info-card">
            <h3>工会信息</h3>
            <div className="info-grid">
              <div className="info-item">
                <span className="label">创始人</span>
                <span className="value">{currentGuild.founder}</span>
              </div>
              <div className="info-item">
                <span className="label">成立时间</span>
                <span className="value">{new Date(currentGuild.foundedDate).toLocaleDateString()}</span>
              </div>
              <div className="info-item">
                <span className="label">工会等级</span>
                <span className="value">{currentGuild.level}</span>
              </div>
              <div className="info-item">
                <span className="label">工会资金</span>
                <span className="value">{currentGuild.funds.toLocaleString()}</span>
              </div>
              <div className="info-item">
                <span className="label">成员数量</span>
                <span className="value">
                  {currentGuild.members.length}/{currentGuild.maxMembers}
                </span>
              </div>
              <div className="info-item">
                <span className="label">加入要求</span>
                <span className="value">
                  {currentGuild.joinRequirement === 'open'
                    ? '开放'
                    : currentGuild.joinRequirement === 'approval'
                      ? '需要审批'
                      : '关闭'}
                </span>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* 成员标签页 */}
        <TabsContent value="members" className="tab-content">
          <div className="members-search">
            <Search className="search-icon" />
            <Input
              placeholder="搜索成员..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="search-input"
            />
          </div>

          <ScrollArea className="members-list">
            {filteredMembers.map((member) => (
              <div key={member.playerId} className="member-item">
                <Avatar className="member-avatar">
                  <AvatarImage src={member.playerAvatar} />
                  <AvatarFallback>{member.playerName[0]}</AvatarFallback>
                </Avatar>

                <div className="member-info">
                  <div className="member-name">
                    {member.playerName}
                    {member.role === 'founder' && <Crown className="role-icon founder" />}
                    {member.role === 'officer' && <Shield className="role-icon officer" />}
                  </div>
                  <div className="member-details">
                    <span className="level">Lv.{member.level}</span>
                    <span className="contribution">贡献: {member.contribution}</span>
                    <span className="join-date">
                      加入: {new Date(member.joinDate).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {canManage && member.playerId !== currentPlayerId && (
                  <div className="member-actions">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 处理角色变更
                      }}
                    >
                      {member.role === 'member' ? '升为官员' : '降为成员'}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        // 处理踢出
                      }}
                    >
                      <Trash2 className="icon" />
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </ScrollArea>
        </TabsContent>

        {/* 申请标签页 */}
        {canManage && (
          <TabsContent value="applications" className="tab-content">
            <div className="applications-list">
              {applications.length === 0 ? (
                <div className="empty-state">
                  <Mail className="empty-icon" />
                  <p>暂无申请</p>
                </div>
              ) : (
                applications.map((app) => (
                  <Card key={app.applicationId} className="application-item">
                    <div className="app-header">
                      <h4>{app.playerName}</h4>
                      <Badge>Lv.{app.playerLevel}</Badge>
                    </div>
                    {app.applicationMessage && (
                      <p className="app-message">{app.applicationMessage}</p>
                    )}
                    <div className="app-actions">
                      <Button
                        size="sm"
                        onClick={() => onApproveApplication?.(app.applicationId)}
                      >
                        批准
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onRejectApplication?.(app.applicationId)}
                      >
                        拒绝
                      </Button>
                    </div>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>
        )}

        {/* 设置标签页 */}
        {canManage && (
          <TabsContent value="settings" className="tab-content">
            <Card className="settings-card">
              <h3>工会公告</h3>
              <Textarea
                placeholder="输入工会公告..."
                value={announcement}
                onChange={(e) => setAnnouncement(e.target.value)}
                className="announcement-textarea"
              />
              <Button onClick={handleUpdateAnnouncement} className="update-btn">
                <Settings className="icon" />
                更新公告
              </Button>
            </Card>

            {isFounder && (
              <Card className="settings-card danger">
                <h3>工会管理</h3>
                <p>工会等级: {currentGuild.level}</p>
                <p>工会资金: {currentGuild.funds.toLocaleString()}</p>
                <Button variant="destructive" className="danger-btn">
                  升级工会
                </Button>
              </Card>
            )}
          </TabsContent>
        )}
      </Tabs>
    </div>
  );
};

export default GuildPanel;
