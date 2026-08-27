import { useState } from "react";
import { useAuth } from "@/_core/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { Button } from "@/components/ui/button";
import { Link } from "wouter";
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
  ChevronUp,
} from "lucide-react";

interface MobileGameLayoutProps {
  children: React.ReactNode;
}

export default function MobileGameLayout({ children }: MobileGameLayoutProps) {
  const { user, logout } = useAuth();
  const { t, lang, setLang } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState("/");

  const navigationItems = [
    { label: t("nav.dashboard") || "Dashboard", icon: Home, path: "/" },
    { label: "Game Hub", icon: Gamepad2, path: "/game" },
    { label: t("nav.gameWorld") || "World", icon: Gamepad2, path: "/world" },
    { label: t("nav.npc") || "NPC", icon: Users, path: "/npc" },
    { label: t("nav.tasks") || "Tasks", icon: Briefcase, path: "/tasks" },
    { label: t("nav.shop") || "Shop", icon: ShoppingCart, path: "/shop" },
    { label: "Real Estate", icon: Landmark, path: "/real-estate" },
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
    { label: "Advanced", icon: Building2, path: "/advanced-facilities" },
    { label: t("nav.wallet") || "Wallet", icon: ShoppingCart, path: "/wallet" },
    { label: t("nav.settings") || "Settings", icon: Settings, path: "/settings" },
  ];

  const handleLogout = async () => {
    await logout();
  };

  const toggleLanguage = () => {
    setLang(lang === "zh" ? "en" : "zh");
  };

  const handleNavClick = (path: string) => {
    setActiveRoute(path);
    setMobileMenuOpen(false);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Mobile Top Header */}
      <header className="bg-card border-b border-border h-16 px-4 flex items-center justify-between sticky top-0 z-40 safe-area-top">
        {/* Menu Button */}
        <button
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 hover:bg-accent rounded-lg active:scale-95 transition-transform"
          aria-label="Toggle menu"
        >
          {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>

        {/* Logo */}
        <div className="text-lg font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
          ISC
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-1">
          {/* Theme Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleTheme}
            className="p-2 h-10 w-10"
            title={t("nav.toggleTheme") || "Toggle Theme"}
          >
            {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
          </Button>

          {/* Language Toggle */}
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleLanguage}
            className="p-2 h-10 w-10"
            title={t("nav.toggleLanguage") || "Toggle Language"}
          >
            <span className="text-xs font-medium">{lang.toUpperCase()}</span>
          </Button>
        </div>
      </header>

      {/* Page Content */}
      <main className="flex-1 overflow-auto bg-background pb-20">
        <div className="w-full px-3 sm:px-4 py-4">
          {children}
        </div>
      </main>

      {/* Mobile Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-card border-t border-border z-40 safe-area-bottom">
        <div className="flex overflow-x-auto scrollbar-hide">
          {navigationItems.slice(0, 8).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                href={item.path}
                onClick={() => handleNavClick(item.path)}
                className={`flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-3 min-w-max transition-colors active:scale-95 ${
                  activeRoute === item.path
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}

          {/* More Menu Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="flex-shrink-0 flex flex-col items-center justify-center gap-1 px-3 py-3 text-muted-foreground hover:text-foreground transition-colors active:scale-95"
          >
            <ChevronUp className="w-5 h-5" />
            <span className="text-xs">More</span>
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 top-16 bg-black/50 z-30 md:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {mobileMenuOpen && (
        <div className="fixed top-16 left-0 right-0 bottom-20 bg-card border-t border-border z-40 overflow-y-auto md:hidden">
          <nav className="p-3 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <Link
                  key={item.path}
                  href={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors active:scale-95 ${
                    activeRoute === item.path
                      ? "bg-accent text-accent-foreground"
                      : "hover:bg-accent/50 hover:text-accent-foreground"
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="text-sm">{item.label}</span>
                </Link>
              );
            })}

            {/* User Section */}
            <div className="border-t border-border mt-4 pt-4 space-y-2">
              <div className="flex items-center gap-3 px-4 py-2">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-400 to-cyan-400 flex items-center justify-center text-white text-sm font-bold flex-shrink-0">
                  {user?.name?.charAt(0) || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user?.name || "User"}</p>
                  <p className="text-xs text-muted-foreground truncate">{user?.email || "user@example.com"}</p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="w-full justify-start gap-2"
                onClick={handleLogout}
              >
                <LogOut className="w-4 h-4" />
                <span>{t("nav.logout") || "Logout"}</span>
              </Button>
            </div>
          </nav>
        </div>
      )}
    </div>
  );
}
