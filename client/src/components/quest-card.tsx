import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface QuestCardProps {
  quest: {
    id: number;
    title: string;
    description: string;
    xpReward: number;
    goldReward?: number;
    completed: boolean;
    type: string;
    completedAt?: string;
  };
}

export default function QuestCard({ quest }: QuestCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const completeQuestMutation = useMutation({
    mutationFn: async () => {
      return await apiRequest("PATCH", `/api/quests/${quest.id}/complete`, {});
    },
    onSuccess: () => {
      toast({
        title: "Quest Completed!",
        description: `+${quest.xpReward} XP gained! Well done, Hunter.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleCompleteQuest = () => {
    if (!quest.completed) {
      completeQuestMutation.mutate();
    }
  };

  const getQuestIcon = () => {
    if (quest.completed) return "fas fa-check";
    if (quest.type === "daily") return "fas fa-hourglass-half";
    if (quest.type === "weekly") return "fas fa-calendar-week";
    return "fas fa-scroll";
  };

  const getQuestColor = () => {
    if (quest.completed) return "border-neon bg-neon";
    if (quest.type === "daily") return "border-electric bg-electric";
    if (quest.type === "weekly") return "border-purple-500 bg-purple-500";
    return "border-system-gold bg-system-gold";
  };

  const getBorderColor = () => {
    if (quest.completed) return "border-l-4 border-neon";
    if (quest.type === "daily") return "border-l-4 border-electric";
    if (quest.type === "weekly") return "border-l-4 border-purple-500";
    return "border-l-4 border-system-gold";
  };

  return (
    <div className={`glass-card rounded-xl p-4 ${getBorderColor()}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3 flex-1">
          <div className={`w-8 h-8 ${getQuestColor()} rounded-lg flex items-center justify-center`}>
            <i className={`${getQuestIcon()} text-system-dark text-sm`}></i>
          </div>
          <div className="flex-1">
            <h3 className="font-semibold text-sm text-text-primary">{quest.title}</h3>
            <p className="text-xs text-text-secondary">{quest.description}</p>
          </div>
        </div>
        <div className="text-right ml-3">
          <p className={`font-bold text-sm ${quest.completed ? "text-neon" : "text-electric"}`}>
            +{quest.xpReward} XP
          </p>
          <p className="text-xs text-text-secondary">
            {quest.completed ? "Completed" : "Pending"}
          </p>
        </div>
      </div>

      {/* Quest Progress/Actions */}
      {!quest.completed && quest.type === "daily" && (
        <div className="mt-3">
          <Button
            onClick={handleCompleteQuest}
            disabled={completeQuestMutation.isPending}
            size="sm"
            className="w-full gradient-electric text-system-dark hover:shadow-glow transition-all duration-300"
          >
            {completeQuestMutation.isPending ? (
              <span className="flex items-center">
                <i className="fas fa-spinner fa-spin mr-2"></i>
                Completing...
              </span>
            ) : (
              <span className="flex items-center">
                <i className="fas fa-check mr-2"></i>
                Mark Complete
              </span>
            )}
          </Button>
        </div>
      )}

      {/* Show completion time if completed */}
      {quest.completed && quest.completedAt && (
        <div className="mt-2 text-xs text-text-secondary font-mono">
          Completed: {new Date(quest.completedAt).toLocaleDateString()}
        </div>
      )}

      {/* Special quest types can have progress bars */}
      {!quest.completed && quest.title.includes("Water") && (
        <div className="mt-3">
          <div className="h-2 bg-system-lighter rounded-full overflow-hidden">
            <div 
              className="h-full bg-electric rounded-full"
              style={{ width: "40%" }} // This would be calculated based on actual progress
            ></div>
          </div>
          <div className="flex justify-between text-xs text-text-secondary mt-1">
            <span>1.2L / 3L</span>
            <span>40%</span>
          </div>
        </div>
      )}
    </div>
  );
}
