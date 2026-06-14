import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { LanguageProvider } from "./contexts/LanguageContext";
import Dashboard from "./pages/Dashboard";
import SecretKeyPage from "./pages/SecretKeyPage";
import ContractParamsPage from "./pages/ContractParamsPage";
import EventLogsPage from "./pages/EventLogsPage";
import AgentConsolePage from "./pages/AgentConsolePage";
import TreasuryPage from "./pages/TreasuryPage";
import StakingPage from "./pages/StakingPage";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/secret-key" component={SecretKeyPage} />
      <Route path="/contract-params" component={ContractParamsPage} />
      <Route path="/event-logs" component={EventLogsPage} />
      <Route path="/agent-console" component={AgentConsolePage} />
      <Route path="/treasury" component={TreasuryPage} />
      <Route path="/staking" component={StakingPage} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <LanguageProvider>
          <TooltipProvider>
            <Toaster />
            <Router />
          </TooltipProvider>
        </LanguageProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
