import { Switch, Route } from "wouter";
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

// This component contains all the routes for a fully authenticated and onboarded user.
function AuthenticatedApp() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route path="/leaderboard" component={Leaderboard} />
      <Route path="/workout" component={WorkoutLogger} />
      <Route path="/system" component={SystemChat} />
      <Route path="/profile" component={Profile} />
      <Route path="/quests" component={Quests} />
      {/* A user inside the app can still hit a non-existent route */}
      <Route component={NotFound} />
    </Switch>
  );
}

// This is our main router. It makes ONE decision based on the auth state.
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

  if (isAuthenticated) {
    // If the user has a session, we check if they are onboarded.
    // If not, they are "jailed" on the onboarding page.
    if (!userProfile?.onboardingCompleted) {
      return <Onboarding />;
    }
    // If they are onboarded, they get the full app.
    return <AuthenticatedApp />;
  }

  // If there's no session, they can only see the landing page.
  return <Landing />;
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