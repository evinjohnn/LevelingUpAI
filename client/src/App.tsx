// client/src/App.tsx

import { Switch, Route, Redirect } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import Landing from "@/pages/landing";
import Onboarding from "@/pages/onboarding";
import Dashboard from "@/pages/dashboard";
import WorkoutLogger from "@/pages/workout-logger";
import SystemChat from "@/pages/system-chat";
import Profile from "@/pages/profile";
import Quests from "@/pages/quests";
import Leaderboard from "@/pages/leaderboard";
import NotFound from "@/pages/not-found";
import { SystemNotification } from "@/components/system-notification";

function AuthenticatedApp() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/workout" component={WorkoutLogger} />
      <Route path="/system" component={SystemChat} />
      <Route path="/profile" component={Profile} />
      <Route path="/quests" component={Quests} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AppRouter() {
  const { isAuthenticated, isLoading, userProfile } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen system-theme flex items-center justify-center">
        <div className="glass-card rounded-2xl p-8 text-center">
          <div className="w-12 h-12 gradient-electric rounded-xl mx-auto mb-4 flex items-center justify-center">
            <i className="fas fa-terminal text-system-dark text-xl"></i>
          </div>
          <p className="text-electric font-mono">System initializing...</p>
        </div>
      </div>
    );
  }

  // After loading, we can make a clear decision
  if (isAuthenticated) {
    if (userProfile?.onboardingCompleted) {
      return <AuthenticatedApp />;
    } else {
      // If profile is loaded but onboarding is not complete, show onboarding
      return <Onboarding />;
    }
  }

  // If not authenticated, show landing page
  return (
     <Switch>
        <Route path="/" component={Landing} />
        {/* Redirect any other path to the landing page if not authenticated */}
        <Route>
          <Redirect to="/" />
        </Route>
      </Switch>
  );
}


function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <div className="system-theme min-h-screen">
          <Toaster />
          <SystemNotification />
          <AppRouter />
        </div>
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;