// client/src/pages/dashboard.tsx

import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import SystemHeader from "@/components/system-header";
import LevelProgress from "@/components/level-progress";
import RPGStats from "@/components/rpg-stats";
import QuestCard from "@/components/quest-card";
import BottomNavigation from "@/components/bottom-navigation";
import { Button } from "@/components/ui/button";
import { useLocation } from "wouter";
import { SystemPanel } from "@/components/ui/system-panel";

export default function Dashboard() {
  const { userProfile: user } = useAuth();
  const [, setLocation] = useLocation();

  // --- FIX START: Added 'select' option to parse the API responses correctly ---
  const { data: quests = [] } = useQuery({ 
    queryKey: ["/api/quests?type=daily"],
    select: (response: any) => response.data,
  });
  const { data: recentMessages = [] } = useQuery({ 
    queryKey: ["/api/system/messages?limit=1"],
    select: (response: any) => response.data,
  });
  // --- FIX END ---

  const latestMessage = recentMessages.find((m: any) => m.role === "assistant");

  return (
    <div className="min-h-screen system-theme pb-24">
      <div className="relative z-10 max-w-md mx-auto p-4 space-y-6">
        <SystemHeader user={user} />

        <SystemPanel>
          <LevelProgress user={user} />
        </SystemPanel>

        <SystemPanel>
          <RPGStats stats={user} />
        </SystemPanel>
        
        <div>
            <div className="flex items-center justify-between mb-3 px-2">
                <h2 className="text-lg font-bold text-text-primary font-mono">[ DAILY DIRECTIVES ]</h2>
                <span className="text-sm text-text-secondary">{quests.filter((q: any) => q.completed).length}/{quests.length}</span>
            </div>
            <div className="space-y-3">
                {quests.slice(0, 3).map((quest: any) => <QuestCard key={quest.id} quest={quest} />)}
                {quests.length > 3 && (
                    <Button variant="outline" className="w-full mt-3 border-electric/30 text-electric/80" onClick={() => setLocation("/quests")}>
                        View All Directives
                    </Button>
                )}
            </div>
        </div>
        
        <SystemPanel>
            <h2 className="text-lg font-bold text-text-primary mb-3 font-mono">[ SYSTEM CHANNEL ]</h2>
            <div className="bg-system-lighter rounded-lg p-3 font-mono text-sm">
                <p className="text-electric mb-1 text-xs">[SYSTEM NOTIFICATION]</p>
                <p className="text-text-primary">
                    {latestMessage?.content || "Welcome, Hunter. Your training awaits."}
                </p>
            </div>
            <Button className="w-full mt-4 gradient-electric text-system-dark" onClick={() => setLocation("/system")}>
                <i className="fas fa-comments mr-2"></i> Open Channel
            </Button>
        </SystemPanel>
      </div>
      <BottomNavigation currentPage="home" />
    </div>
  );
}