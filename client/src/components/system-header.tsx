// client/src/components/system-header.tsx

import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface SystemHeaderProps {
  user: any;
}

export default function SystemHeader({ user }: SystemHeaderProps) {
  const { signOut } = useAuth();

  const handleLogout = async () => {
    await signOut();
    window.location.reload();
  };

  return (
    <header className="relative z-10 p-4 flex items-center justify-between">
      <div className="flex items-center space-x-4">
        <div className="relative">
          <div className="w-16 h-16 gradient-electric p-0.5 rounded-full">
            <div className="w-full h-full rounded-full bg-system-gray flex items-center justify-center">
              {user?.profileImageUrl ? (
                <img src={user.profileImageUrl} alt="Hunter Avatar" className="w-full h-full rounded-full object-cover" />
              ) : (
                // --- THIS IS THE FIX ---
                // The comment inside the parentheses has been removed.
                <i className="fas fa-user text-electric text-2xl"></i>
              )}
            </div>
          </div>
          <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-neon rounded-full border-2 border-system-dark pulse-glow"></div>
        </div>
        <div>
          <h1 className="font-bold text-xl text-text-primary">
            Hunter {user?.firstName || "Unknown"}
          </h1>
          <p className="text-text-secondary text-base font-mono">
            {user?.rank || "E-Rank Human"}
          </p>
        </div>
      </div>
      
      <div className="flex items-center space-x-3">
        <button className="p-2 glass-card rounded-xl">
          <i className="fas fa-bell text-electric"></i>
        </button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="p-2 glass-card rounded-xl">
              <i className="fas fa-cog text-text-secondary"></i>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-system-gray border-system-lighter text-text-primary" align="end">
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer focus:bg-system-lighter focus:text-electric"
            >
              <i className="fas fa-sign-out-alt mr-2"></i>
              <span>Logout</span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}