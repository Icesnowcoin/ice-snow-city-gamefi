import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import { TransactionNotificationProvider } from "./contexts/TransactionNotificationContext";
import { SimulatedTradeNotificationProvider } from "./contexts/SimulatedTradeNotificationContext";
import GameLayout from "./components/layout/GameLayout";
import { Suspense, lazy } from "react";
import { Spinner } from "./components/ui/spinner";

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-screen">
    <Spinner className="w-8 h-8" />
  </div>
);

// Immediate imports (frequently accessed pages)
import GameDashboard from "./pages/GameDashboard";
import OpeningPage from "./pages/OpeningPage";
import GameHub from "./components/game/GameHub";
import { SplashScreen } from "./components/SplashScreen";
import ReferralAttributionBridge from "./components/social/ReferralAttributionBridge";

// Lazy-loaded game pages
const PlayerProfile = lazy(() => import("./pages/PlayerProfile"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const WalletAuthorizationPage = lazy(() => import("./pages/WalletAuthorizationPage"));
const MobileWalletPage = lazy(() => import("./pages/MobileWalletPage"));
const NPCInteraction = lazy(() => import("./pages/NPCInteraction"));
const TasksPage = lazy(() => import("./pages/TasksPage"));
const ShopPage = lazy(() => import("./pages/ShopPage"));
const RealEstatePage = lazy(() => import("./pages/RealEstatePage"));
const AgriculturePage = lazy(() => import("./pages/AgriculturePage"));
const RTSGameEngine = lazy(() => import("./components/game/RTSGameEngine"));
const BankPage = lazy(() => import("./pages/BankPage"));
const BankingPage = lazy(() => import("./pages/BankingPage"));
const MiningPage = lazy(() => import("./pages/MiningPage"));
const LoggingPage = lazy(() => import("./pages/LoggingPage"));
const SmeltingPage = lazy(() => import("./pages/SmeltingPage"));
const CommercialPage = lazy(() => import("./pages/CommercialPage"));
const ResidentialPage = lazy(() => import("./pages/ResidentialPage"));
const EntertainmentPage = lazy(() => import("./pages/EntertainmentPage"));
const JobPage = lazy(() => import("./pages/JobPage").then(m => ({ default: m.JobPage })));
const AdvancedFacilitiesPage = lazy(() => import("./pages/AdvancedFacilitiesPage"));
const GameScenesPage = lazy(() => import("./pages/GameScenesPage"));
const AchievementsPage = lazy(() => import("./pages/AchievementsPage"));
const LeaderboardPage = lazy(() => import("./pages/LeaderboardPage"));
const CharacterModelViewer = lazy(() => import("./pages/CharacterModelViewer"));
const AssetReadinessPage = lazy(() => import("./pages/AssetReadinessPage"));

// Lazy-loaded admin pages
const Dashboard = lazy(() => import("./pages/Dashboard"));
const SecretKeyPage = lazy(() => import("./pages/SecretKeyPage"));
const ContractParamsPage = lazy(() => import("./pages/ContractParamsPage"));
const EventLogsPage = lazy(() => import("./pages/EventLogsPage"));
const AgentConsolePage = lazy(() => import("./pages/AgentConsolePage"));
const TreasuryPage = lazy(() => import("./pages/TreasuryPage"));
const StakingPage = lazy(() => import("./pages/StakingPage"));
const MonitoringDashboard = lazy(() => import("./pages/MonitoringDashboard"));

function GameRouter() {
  return (
    <GameLayout>
      <Suspense fallback={<PageLoader />}>
        <Switch>
        <Route path="/opening" component={OpeningPage} />
        <Route path={/^\/$/} component={GameHub} />
        <Route path="/dashboard" component={GameDashboard} />
        <Route path="/profile/:userId" component={PlayerProfile} />
        <Route path="/profile" component={PlayerProfile} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/wallet-mobile" component={MobileWalletPage} />
        <Route path="/wallet-auth" component={WalletAuthorizationPage} />
        <Route path="/npc" component={NPCInteraction} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/real-estate" component={RealEstatePage} />
        <Route path="/agriculture" component={AgriculturePage} />
        <Route path="/world" component={RTSGameEngine} />
        <Route path="/game" component={GameHub} />
        <Route path="/scenes" component={GameScenesPage} />
        <Route path="/achievements" component={AchievementsPage} />
        <Route path="/leaderboard" component={LeaderboardPage} />
        <Route path="/banking" component={BankingPage} />
        <Route path="/bank" component={BankPage} />
        <Route path="/mining" component={MiningPage} />
        <Route path="/logging" component={LoggingPage} />
        <Route path="/smelting" component={SmeltingPage} />
        <Route path="/commercial" component={CommercialPage} />
        <Route path="/residential" component={ResidentialPage} />
        <Route path="/entertainment" component={EntertainmentPage} />
        <Route path="/jobs" component={JobPage} />
        <Route path="/advanced-facilities" component={AdvancedFacilitiesPage} />
        <Route path="/character-model" component={CharacterModelViewer} />
        <Route path="/settings" component={() => <div>Settings (Coming Soon)</div>} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
        </Switch>
      </Suspense>
    </GameLayout>
  );
}

function AdminRouter() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Switch>
      <Route path="/admin" component={Dashboard} />
      <Route path="/admin/secret-key" component={SecretKeyPage} />
      <Route path="/admin/contract-params" component={ContractParamsPage} />
      <Route path="/admin/event-logs" component={EventLogsPage} />
      <Route path="/admin/agent-console" component={AgentConsolePage} />
      <Route path="/admin/treasury" component={TreasuryPage} />
      <Route path="/admin/staking" component={StakingPage} />
      <Route path="/admin/monitoring" component={MonitoringDashboard} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
      </Switch>
    </Suspense>
  );
}

function AssetReadinessShell() {
  return (
    <GameLayout>
      <Suspense fallback={<PageLoader />}>
        <AssetReadinessPage />
      </Suspense>
    </GameLayout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path={/^\/asset-readiness\/?$/} component={AssetReadinessShell} />
      <Route path="/admin/*" nest component={AdminRouter} />
      <Route path="/*" nest component={GameRouter} />
    </Switch>
  );
}

function App() {
  const [, setLocation] = useLocation();
  const skipSplash = import.meta.env.DEV && new URLSearchParams(window.location.search).get("skipSplash") === "1";

  const handleSplashComplete = () => {
    if (window.location.pathname === "/opening") {
      setLocation("/");
    }
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TransactionNotificationProvider>
            <SimulatedTradeNotificationProvider>
            <TooltipProvider>
              {!skipSplash && <SplashScreen onComplete={handleSplashComplete} />}
              <Toaster />
              <ReferralAttributionBridge />
              <Router />
            </TooltipProvider>
            </SimulatedTradeNotificationProvider>
          </TransactionNotificationProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
