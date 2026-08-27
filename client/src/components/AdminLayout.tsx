import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { getLoginUrl } from "@/const";
import { VITE_OWNER_OPEN_ID } from "@/const";
import { Link, useLocation } from "wouter";
import {
  Key,
  Settings,
  ScrollText,
  Terminal,
  Landmark,
  PiggyBank,
  LayoutDashboard,
  Globe,
  LogOut,
  Loader2,
  ShieldAlert,
  Activity,
} from "lucide-react";
import { Button } from "@/components/ui/button";



interface AdminLayoutProps {
  children: React.ReactNode;
}

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, isAuthenticated, logout } = useAuth();
  const { lang, toggleLang, t } = useLanguage();
  const [location] = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-muted-foreground mx-auto" />
          <h1 className="text-2xl font-semibold text-foreground">
            {lang === "zh" ? "需要管理员登录" : "Admin Login Required"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "zh" ? "请登录管理员账户以访问控制台" : "Please log in with admin account to access the console"}
          </p>
          <Button asChild>
            <a href={getLoginUrl()}>
              {lang === "zh" ? "登录" : "Login"}
            </a>
          </Button>
        </div>
      </div>
    );
  }

  // Strict Owner-only access control using OWNER_OPEN_ID
  if (user?.openId !== VITE_OWNER_OPEN_ID) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-4">
          <ShieldAlert className="h-16 w-16 text-destructive mx-auto" />
          <h1 className="text-2xl font-semibold text-foreground">
            {lang === "zh" ? "权限不足" : "Access Denied"}
          </h1>
          <p className="text-muted-foreground">
            {lang === "zh" ? "仅限项目 Owner 访问此系统" : "Only project Owner can access this system"}
          </p>
        </div>
      </div>
    );
  }

  const navItems = [
    { path: "/", icon: LayoutDashboard, label: t("nav.dashboard") },
    { path: "/secret-key", icon: Key, label: t("nav.secretKey") },
    { path: "/contract-params", icon: Settings, label: t("nav.contractParams") },
    { path: "/event-logs", icon: ScrollText, label: t("nav.eventLogs") },
    { path: "/agent-console", icon: Terminal, label: t("nav.agentConsole") },
    { path: "/treasury", icon: Landmark, label: t("nav.treasury") },
    { path: "/staking", icon: PiggyBank, label: t("nav.staking") },
    { path: "/monitoring", icon: Activity, label: t("nav.monitoring") },
  ];

  return (
    <div className="min-h-screen flex bg-background">
      {/* Sidebar */}
      <aside className="w-64 border-r border-border bg-sidebar flex flex-col">
        <div className="p-6 border-b border-border">
          <h1 className="text-lg font-bold text-sidebar-foreground tracking-tight">
            Ice Snow City
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            {lang === "zh" ? "合约管理控制台" : "Contract Admin Console"}
          </p>
        </div>

        <nav className="flex-1 p-3 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.path;
            return (
              <Link key={item.path} href={item.path}>
                <div
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 cursor-pointer ${
                    isActive
                      ? "bg-sidebar-accent text-sidebar-primary"
                      : "text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                  }`}
                >
                  <item.icon className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </div>
              </Link>
            );
          })}
        </nav>

        <div className="p-3 border-t border-border space-y-2">
          <button
            onClick={toggleLang}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-all duration-150 w-full"
          >
            <Globe className="h-4 w-4 shrink-0" />
            <span>{lang === "zh" ? "English" : "中文"}</span>
          </button>
          <button
            onClick={() => logout()}
            className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-150 w-full"
          >
            <LogOut className="h-4 w-4 shrink-0" />
            <span>{lang === "zh" ? "退出登录" : "Logout"}</span>
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}
