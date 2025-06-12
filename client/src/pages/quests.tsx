import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import QuestCard from "@/components/quest-card";
import BottomNavigation from "@/components/bottom-navigation";
import { SystemPanel } from "@/components/ui/system-panel";

export default function Quests() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: allQuests = [], isLoading: loadingAll } = useQuery({
    queryKey: ["/api/quests"],
  });

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

  const dailyQuests = allQuests.filter((q: any) => q.type === "daily");
  const weeklyQuests = allQuests.filter((q: any) => q.type === "weekly");

  return (
    <div className="min-h-screen system-theme pb-24">
      <div className="max-w-md mx-auto p-4">
        <SystemPanel>
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-xl font-bold text-text-primary">[ QUEST LOG ]</h1>
              <p className="text-text-secondary text-sm font-mono">Active System Directives</p>
            </div>
            <div className="w-10 h-10 bg-system-gold rounded-lg flex items-center justify-center">
              <i className="fas fa-scroll text-system-dark"></i>
            </div>
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-electric flex items-center font-mono">
                // DAILY DIRECTIVES
              </h2>
              <Button
                onClick={() => generateDailyQuestsMutation.mutate()}
                disabled={generateDailyQuestsMutation.isPending}
                size="sm"
                variant="outline"
                className="border-electric/50 text-electric hover:bg-electric/10"
              >
                {generateDailyQuestsMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync"></i>}
              </Button>
            </div>

            {loadingAll ? (
              <p className="text-center text-text-secondary">Loading directives...</p>
            ) : dailyQuests.length === 0 ? (
              <div className="text-center p-4 bg-system-dark/50 rounded-lg">
                <p className="text-text-secondary">No daily quests available. Request new directives.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {dailyQuests.map((quest: any) => <QuestCard key={quest.id} quest={quest} />)}
              </div>
            )}
          </div>

          <div className="mb-6">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-lg font-bold text-neon flex items-center font-mono">
                 // WEEKLY OBJECTIVES
               </h2>
               <Button
                  onClick={() => generateWeeklyQuestsMutation.mutate()}
                  disabled={generateWeeklyQuestsMutation.isPending}
                  size="sm"
                  variant="outline"
                  className="border-neon/50 text-neon hover:bg-neon/10"
                >
                  {generateWeeklyQuestsMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-sync"></i>}
                </Button>
             </div>
             {loadingAll ? (
              <p className="text-center text-text-secondary">Loading objectives...</p>
            ) : weeklyQuests.length === 0 ? (
              <div className="text-center p-4 bg-system-dark/50 rounded-lg">
                <p className="text-text-secondary">No weekly objectives assigned.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {weeklyQuests.map((quest: any) => <QuestCard key={quest.id} quest={quest} />)}
              </div>
            )}
          </div>
        </SystemPanel>
      </div>
      <BottomNavigation currentPage="quests" />
    </div>
  );
}