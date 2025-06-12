import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress"; // Import the ShadCN Progress component

interface LevelProgressProps {
  user: any;
}

export default function LevelProgress({ user }: LevelProgressProps) {
  // --- Guard Clause to prevent errors during loading ---
  if (!user || user.level === undefined || user.xp === undefined) {
    return (
      <div>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center space-x-3">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-6 w-24" />
          </div>
          <div className="text-right">
            <Skeleton className="h-5 w-16 mb-1" />
            <Skeleton className="h-4 w-20" />
          </div>
        </div>
        <Skeleton className="relative h-4 w-full rounded-full" />
      </div>
    );
  }

  // --- Calculations can now safely assume `user` exists ---
  const currentXP = user.xp;
  const level = user.level;
  
  const currentLevelMinXP = Math.pow(level - 1, 2) * 100;
  const nextLevelXP = Math.pow(level, 2) * 100;
  const xpInCurrentLevel = currentXP - currentLevelMinXP;
  const xpNeededForLevel = nextLevelXP - currentLevelMinXP;
  
  // Ensure we don't divide by zero and handle the case where a user might somehow exceed 100%
  const progressPercentage = xpNeededForLevel > 0 ? Math.min(100, (xpInCurrentLevel / xpNeededForLevel) * 100) : 0;

  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 gradient-electric rounded-lg flex items-center justify-center">
            <span className="font-bold text-lg text-system-dark">{level}</span>
          </div>
          <span className="font-semibold text-text-primary text-lg">Level {level}</span>
        </div>
        <div className="text-right font-mono">
          <p className="text-sm text-electric">{currentXP.toLocaleString()} XP</p>
          <p className="text-xs text-text-secondary">Next: {nextLevelXP.toLocaleString()} XP</p>
        </div>
      </div>
      
      {/* --- FIX: Use the robust ShadCN Progress component --- */}
      <Progress 
        value={progressPercentage} 
        className="h-3 [&>div]:bg-electric [&>div]:shadow-glow" // Use custom classes to style the inner bar
      />
    </div>
  );
}