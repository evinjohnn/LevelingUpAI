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
    completed: boolean;
    type: string;
    completedAt?: string;
  };
}

// Helper function to determine the visual style based on quest status and type
const getQuestAppearance = (quest: QuestCardProps['quest']) => {
  if (quest.completed) {
    return {
      icon: "fas fa-check-double",
      bgColor: "bg-neon/10",
      textColor: "text-neon",
      borderColor: "border-neon/30",
      glowColor: "shadow-neon/20",
    };
  }
  switch (quest.type) {
    case 'daily':
      return {
        icon: "fas fa-hourglass-half",
        bgColor: "bg-electric/10",
        textColor: "text-electric",
        borderColor: "border-electric/30",
        glowColor: "shadow-electric/20",
      };
    case 'weekly':
      return {
        icon: "fas fa-calendar-check",
        bgColor: "bg-purple-500/10",
        textColor: "text-purple-400",
        borderColor: "border-purple-500/30",
        glowColor: "shadow-purple-500/20",
      };
    default: // Special quests or fallbacks
      return {
        icon: "fas fa-star",
        bgColor: "bg-system-gold/10",
        textColor: "text-system-gold",
        borderColor: "border-system-gold/30",
        glowColor: "shadow-yellow-500/20",
      };
  }
};

export default function QuestCard({ quest }: QuestCardProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const appearance = getQuestAppearance(quest);

  const completeQuestMutation = useMutation({
    mutationFn: async () => apiRequest("PATCH", `/api/quests/${quest.id}/complete`, {}),
    onSuccess: () => {
      toast({
        title: "Quest Completed!",
        description: `+${quest.xpReward} XP gained! Well done, Hunter.`,
      });
      queryClient.invalidateQueries({ queryKey: ["/api/quests"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
  });

  const handleCompleteQuest = () => {
    if (!quest.completed) {
      completeQuestMutation.mutate();
    }
  };

  return (
    <div className={`relative bg-system-gray/50 border ${appearance.borderColor} rounded-xl p-4 transition-all duration-300 hover:bg-system-gray/80 hover:shadow-lg ${appearance.glowColor}`}>
      <div className="flex items-center space-x-4">
        {/* Prominent Icon */}
        <div className={`flex-shrink-0 w-12 h-12 rounded-lg flex items-center justify-center ${appearance.bgColor} ${appearance.textColor} border ${appearance.borderColor}`}>
          <i className={`${appearance.icon} text-xl`}></i>
        </div>
        
        {/* Title and Description */}
        <div className="flex-1">
          <h3 className="font-bold text-base text-text-primary">{quest.title}</h3>
          <p className="text-xs text-text-secondary mt-1">{quest.description}</p>
        </div>

        {/* XP and Status */}
        <div className="text-right flex-shrink-0">
          <p className={`font-black text-lg ${appearance.textColor}`}>+{quest.xpReward} XP</p>
          <p className={`text-xs font-mono ${quest.completed ? appearance.textColor : 'text-text-secondary'}`}>
            {quest.completed ? "Completed" : "Pending"}
          </p>
        </div>
      </div>
      
      {/* Action Button for Daily Quests */}
      {!quest.completed && quest.type === "daily" && (
        <div className="mt-4">
          <Button
            onClick={handleCompleteQuest}
            disabled={completeQuestMutation.isPending}
            size="sm"
            className={`w-full font-bold transition-all duration-300 ${appearance.bgColor} ${appearance.textColor} border ${appearance.borderColor} hover:bg-system-dark hover:shadow-md ${appearance.glowColor}`}
          >
            {completeQuestMutation.isPending ? (
              <span className="flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Completing...</span>
            ) : (
              <span className="flex items-center"><i className="fas fa-check mr-2"></i>Mark as Complete</span>
            )}
          </Button>
        </div>
      )}

       {/* Completion Date */}
       {quest.completed && quest.completedAt && (
        <div className="mt-3 text-right text-xs text-text-secondary/70 font-mono">
          [ Cleared: {new Date(quest.completedAt).toLocaleDateString()} ]
        </div>
      )}
    </div>
  );
}