import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import GameLayout from "./components/layout/GameLayout";

// Game Pages
import GameDashboard from "./pages/GameDashboard";
import PlayerProfile from "./pages/PlayerProfile";
import WalletPage from "./pages/WalletPage";
import NPCInteraction from "./pages/NPCInteraction";
import TasksPage from "./pages/TasksPage";
import ShopPage from "./pages/ShopPage";
import RealEstatePage from "./pages/RealEstatePage";
import AgriculturePage from "./pages/AgriculturePage";
import RTSGameEngine from "./components/game/RTSGameEngine";
import GameHub from "./components/game/GameHub";
import { SplashScreen } from "./components/SplashScreen";

// Admin Pages (kept for backward compatibility)
import Dashboard from "./pages/Dashboard";
import SecretKeyPage from "./pages/SecretKeyPage";
import ContractParamsPage from "./pages/ContractParamsPage";
import EventLogsPage from "./pages/EventLogsPage";
import AgentConsolePage from "./pages/AgentConsolePage";
import TreasuryPage from "./pages/TreasuryPage";
import StakingPage from "./pages/StakingPage";
import MonitoringDashboard from "./pages/MonitoringDashboard";

function GameRouter() {
  return (
    <GameLayout>
      <Switch>
        <Route path="/" component={GameDashboard} />
        <Route path="/profile" component={PlayerProfile} />
        <Route path="/wallet" component={WalletPage} />
        <Route path="/npc" component={NPCInteraction} />
        <Route path="/tasks" component={TasksPage} />
        <Route path="/shop" component={ShopPage} />
        <Route path="/real-estate" component={RealEstatePage} />
        <Route path="/agriculture" component={AgriculturePage} />
        <Route path="/world" component={RTSGameEngine} />
        <Route path="/game" component={GameHub} />
        {/* Game routes will be added here */}
        <Route path="/banking" component={() => <div>Banking System (Coming Soon)</div>} />
        <Route path="/settings" component={() => <div>Settings (Coming Soon)</div>} />
        <Route path="/404" component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </GameLayout>
  );
}

function AdminRouter() {
  return (
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
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/admin/*" nest component={AdminRouter} />
      <Route path="/*" nest component={GameRouter} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <SplashScreen />
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
