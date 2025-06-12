// client/src/pages/leaderboard.tsx
import { useQuery } from '@tanstack/react-query';
import BottomNavigation from '@/components/bottom-navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

export default function Leaderboard() {
  const { data: leaders = [], isLoading } = useQuery({ queryKey: ['/api/leaderboard'] });

  return (
    <div className="min-h-screen system-theme pb-20">
      <div className="max-w-md mx-auto p-4">
        <Card className="glass-card border-0 shadow-card">
          <CardHeader>
            <CardTitle className="text-text-primary flex items-center">
              <i className="fas fa-trophy text-system-gold mr-2"></i> Global Leaderboard
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {isLoading && <p>Loading rankings...</p>}
              {leaders.map((user, index) => (
                <div key={user.id} className="flex items-center justify-between p-3 bg-system-lighter rounded-lg">
                  <div className="flex items-center gap-4">
                    <span className="font-bold text-lg text-system-gold w-6">{index + 1}</span>
                    <Avatar>
                      <AvatarImage src={user.profileImageUrl || ''} />
                      <AvatarFallback>{user.firstName?.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold text-text-primary">{user.firstName}</p>
                      <p className="text-xs text-text-secondary">Level {user.level} - {user.rank}</p>
                    </div>
                  </div>
                  <p className="font-mono text-electric">{user.xp} XP</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <BottomNavigation currentPage="profile" /> {/* Or a new 'leaderboard' page */}
    </div>
  );
}