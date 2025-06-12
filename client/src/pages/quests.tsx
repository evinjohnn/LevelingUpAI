// client/src/pages/quests.tsx

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuestCard from "@/components/quest-card";
import BottomNavigation from "@/components/bottom-navigation";
import { SystemPanel } from "@/components/ui/system-panel";
import { useAuth } from "@/hooks/useAuth";

export default function Quests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { userProfile: user } = useAuth();

  // --- THIS IS THE FIX ---
  // We add the `select` option to tell React Query: "From the full API response,
  // please select only the `data` property to be our actual query data."
  const { data: allQuests = [], isLoading: loadingAll } = useQuery({
    queryKey: ["/api/quests"],
    select: (response: any) => response.data,
    enabled: !!user,
  });
  // --- END OF FIX ---

  const generateDailyQuestsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/quests/daily", {});
    },
    onSuccess: () => {
      toast({
        title: "New Directives Received",
        description: "Daily quests have been updated.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
    onError: (error) => {
      toast({
        title: "System Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const generateWeeklyQuestsMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("POST", "/api/quests/weekly", {});
    },
    onSuccess: () => {
      toast({
        title: "New Weekly Objectives Received",
        description: "Weekly objectives have been updated for this cycle.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
    },
    onError: (error) => {
      toast({
        title: "System Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const dailyQuests = Array.isArray(allQuests) ? allQuests.filter((q: any) => q && q.type === "daily") : [];
  const weeklyQuests = Array.isArray(allQuests) ? allQuests.filter((q: any) => q && q.type === "weekly") : [];

  return (
    <div className="min-h-screen system-theme pb-24">
      <div className="max-w-md mx-auto p-4 space-y-6">
        <SystemPanel>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-xl font-bold text-text-primary">[ QUEST LOG ]</h1>
              <p className="text-text-secondary text-sm font-mono">Active System Directives</p>
            </div>
            <div className="w-10 h-10 bg-system-gold rounded-lg flex items-center justify-center">
              <i className="fas fa-scroll text-system-dark text-xl"></i>
            </div>
          </div>
        </SystemPanel>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-electric flex items-center font-mono">
              // DAILY DIRECTIVES
            </h2>
            <Button
              onClick={() => generateDailyQuestsMutation.mutate()}
              disabled={generateDailyQuestsMutation.isPending || loadingAll}
              size="sm"
              variant="outline"
              className="border-electric/50 text-electric hover:bg-electric/10"
            >
              {generateDailyQuestsMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync"></i>}
            </Button>
          </div>
          {loadingAll ? (
            <p className="text-center text-text-secondary font-mono">Loading directives...</p>
          ) : dailyQuests.length === 0 ? (
            <div className="text-center p-4 bg-system-dark/50 rounded-lg border border-system-lighter">
              <p className="text-text-secondary">No daily quests available. Request new directives.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {dailyQuests.map((quest: any) => <QuestCard key={quest.id} quest={quest} />)}
            </div>
          )}
        </div>

        <div className="space-y-4">
           <div className="flex items-center justify-between">
             <h2 className="text-lg font-bold text-purple-400 flex items-center font-mono">
               // WEEKLY OBJECTIVES
             </h2>
             <Button
                onClick={() => generateWeeklyQuestsMutation.mutate()}
                disabled={generateWeeklyQuestsMutation.isPending || loadingAll}
                size="sm"
                variant="outline"
                className="border-purple-500/50 text-purple-400 hover:bg-purple-500/10"
              >
                {generateWeeklyQuestsMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync"></i>}
              </Button>
           </div>
           {loadingAll ? (
            <p className="text-center text-text-secondary font-mono">Loading objectives...</p>
          ) : weeklyQuests.length === 0 ? (
            <div className="text-center p-4 bg-system-dark/50 rounded-lg border border-system-lighter">
              <p className="text-text-secondary">No weekly objectives assigned.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {weeklyQuests.map((quest: any) => <QuestCard key={quest.id} quest={quest} />)}
            </div>
          )}
        </div>
      </div>
      <BottomNavigation currentPage="quests" />
    </div>
  );
}