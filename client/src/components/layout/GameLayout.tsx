import React, { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
import { WalletStatusIndicator } from "@/components/WalletStatusIndicator";
import { TransactionNotificationCenter } from "@/components/TransactionNotificationCenter";
import { NetworkModeSwitcher } from "@/components/NetworkModeSwitcher";
import { NetworkModeProvider } from "@/contexts/NetworkModeContext";
import { PerformanceMonitorPanel } from "@/components/PerformanceMonitorPanel";
import { useWalletPersistence } from "@/hooks/useWalletPersistence";
import {
  Menu,
  X,
  Home,
  Users,
  Briefcase,
  ShoppingCart,
  Landmark,
  PiggyBank,
  Settings,
  LogOut,
  Sun,
  Moon,
  Globe,
  Gamepad2,
  Trophy,
  Sprout,
  Award,
  Pickaxe,
  Trees,
  Flame,
  Building2,
  House,
  Sparkles,
  Briefcase as JobIcon,
} from "lucide-react";


interface GameLayoutProps {
  children: React.ReactNode;
}

export default function GameLayout({ children }: GameLayoutProps) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { getWalletConnection, getWalletConnectionRemainingTime } = useWalletPersistence();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState("/");
  const [walletConnection, setWalletConnection] = useState<any>(null);
  const [expiryTime, setExpiryTime] = useState<number | null>(null);
  const [showPerformanceMonitor, setShowPerformanceMonitor] = useState(() => {
    if (typeof window === "undefined") return false;
    return new URLSearchParams(window.location.search).get("perf") === "1";
  });

  // Load wallet connection on mount
  React.useEffect(() => {{
    const connection = getWalletConnection();
    setWalletConnection(connection);
    if (connection) {{
      const remaining = getWalletConnectionRemainingTime();
      setExpiryTime(new Date().getTime() + remaining);
    }}
  }}, [getWalletConnection, getWalletConnectionRemainingTime]);

  const navigationItems = [
    { label: "Game Hub", icon: Gamepad2, path: "/" },
    { label: t("nav.dashboard") || "Dashboard", icon: Home, path: "/dashboard" },
    { label: t("nav.gameWorld") || "Game World", icon: Gamepad2, path: "/world" },
    { label: t("nav.npc") || "NPC", icon: Users, path: "/npc" },
    { label: t("nav.tasks") || "Tasks", icon: Briefcase, path: "/tasks" },
    { label: t("nav.shop") || "Shop", icon: ShoppingCart, path: "/shop" },
    { label: t("nav.realEstate") || "Real Estate", icon: Landmark, path: "/real-estate" },
    { label: "Agriculture", icon: Sprout, path: "/agriculture" },
    { label: "Achievements", icon: Award, path: "/achievements" },
    { label: "Leaderboard", icon: Trophy, path: "/leaderboard" },
    { label: t("nav.banking") || "Banking", icon: PiggyBank, path: "/banking" },
    { label: "Mining", icon: Pickaxe, path: "/mining" },
    { label: "Logging", icon: Trees, path: "/logging" },
    { label: "Smelting", icon: Flame, path: "/smelting" },
    { label: "Commercial", icon: Building2, path: "/commercial" },
    { label: "Residential", icon: House, path: "/residential" },
    { label: "Entertainment", icon: Sparkles, path: "/entertainment" },
    { label: "Jobs", icon: JobIcon, path: "/jobs" },
    { label: "Advanced Facilities", icon: Building2, path: "/advanced-facilities" },
    { label: t("nav.wallet") || "Wallet", icon: ShoppingCart, path: "/wallet" },
    { label: t("nav.settings") || "Settings", icon: Settings, path: "/settings" },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const toggleLanguage = () => {
    setLang(lang === "zh" ? "en" : "zh");
  };

  return (
    <NetworkModeProvider>
    <div className="flex h-screen bg-background text-foreground">
      {showPerformanceMonitor && (
        <PerformanceMonitorPanel onClose={() => setShowPerformanceMonitor(false)} />
      )}
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col bg-card border-r border-border transition-all duration-300 ${
          sidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="flex items-center justify-center h-20 border-b border-border">
          <div className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
            {sidebarOpen ? "Ice Snow City" : "ISC"}
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-4">
          <ul className="space-y-2 px-3">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.path}>
                  <Link href={item.path} onClick={() => setActiveRoute(item.path)} className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-colors ${
                    activeRoute === item.path
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent hover:text-accent-foreground"
                  }`}>
                    <Icon className="w-5 h-5 flex-shrink-0" />
                    {sidebarOpen && <span className="text-sm">{item.label}</span>}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>

        {/* User Section */}
        <div className="border-t border-border p-3 space-y-2">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
              {user?.name?.charAt(0) || "U"}
            </div>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
              </div>
            )}
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start gap-2"
            onClick={handleLogout}
          >
            <LogOut className="w-4 h-4" />
            {sidebarOpen && <span>{t("nav.logout") || "Logout"}</span>}
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Header */}
        <header className="bg-card border-b border-border h-20 px-4 md:px-6 flex items-center justify-between">
          {/* Mobile Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 hover:bg-accent rounded-lg"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>

          {/* Desktop Sidebar Toggle */}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="hidden md:block p-2 hover:bg-accent rounded-lg"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>

          {/* Right Controls */}
          <div className="flex items-center gap-2 ml-auto">
            {/* Network Mode Switcher */}
            <NetworkModeSwitcher />
            {/* Transaction Notification Center */}
            <TransactionNotificationCenter />

            {/* Wallet Status Indicator */}
            {walletConnection && (
              <WalletStatusIndicator
                address={walletConnection.address}
                chainId={walletConnection.chainId}
                walletType={walletConnection.walletType}
                isConnected={true}
                connectionExpiryTime={expiryTime || undefined}
                onDisconnect={() => {
                  setWalletConnection(null);
                  setExpiryTime(null);
                }}
                onSwitchWallet={() => {
                  window.location.href = '/wallet-auth';
                }}
                onRefreshBalance={() => {
                  window.location.reload();
                }}
              />
            )}

            {/* Theme Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleTheme}
              className="p-2"
              title={t("nav.toggleTheme") || "Toggle Theme"}
            >
              {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </Button>

            {/* Language Toggle */}
            <Button
              variant="ghost"
              size="sm"
              onClick={toggleLanguage}
              className="p-2"
              title={t("nav.toggleLanguage") || "Toggle Language"}
            >
              <Globe className="w-5 h-5" />
              <span className="ml-1 text-xs font-medium">{lang.toUpperCase()}</span>
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-auto bg-background">
          <div className="container mx-auto px-4 md:px-6 py-6">
            {children}
          </div>
        </main>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden fixed inset-0 top-20 bg-card border-t border-border z-40 overflow-y-auto">
            <nav className="p-4 space-y-2">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-accent hover:text-accent-foreground transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
          </div>
        )}
      </div>
    </div>
    </NetworkModeProvider>
  );
}
