import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import DashboardLayout from "./components/DashboardLayout";
import Dashboard from "./pages/Dashboard";
import RFPsList from "./pages/RFPsList";
import RFPDetail from "./pages/RFPDetail";
import ProposalGenerator from "./pages/ProposalGenerator";
import KnowledgeBase from "./pages/KnowledgeBase";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";

function Router() {
  return (
    <DashboardLayout>
      <Switch>
        <Route path={"/"} component={Dashboard} />
        <Route path={"/rfps"} component={RFPsList} />
        <Route path={"/rfps/:id"} component={RFPDetail} />
        <Route path={"/knowledge-base"} component={KnowledgeBase} />
        <Route path={"/analytics"} component={Analytics} />
        <Route path={"/settings"} component={Settings} />
        <Route path={"/ai/analyzer"} component={() => <div>RFP Analyzer - Coming Soon</div>} />
        <Route path={"/ai/generator"} component={ProposalGenerator} />
        <Route path={"/ai/quality"} component={() => <div>Quality Checker - Coming Soon</div>} />
        <Route path={"/ai/collaboration"} component={() => <div>Team Collaboration - Coming Soon</div>} />
        <Route path={"/404"} component={NotFound} />
        <Route component={NotFound} />
      </Switch>
    </DashboardLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
