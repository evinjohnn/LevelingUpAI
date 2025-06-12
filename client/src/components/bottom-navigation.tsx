import { useLocation } from "wouter";

interface BottomNavigationProps {
  currentPage: "home" | "quests" | "workouts" | "system" | "profile";
}

export default function BottomNavigation({ currentPage }: BottomNavigationProps) {
  const [, setLocation] = useLocation();

  const navItems = [
    { key: "home", icon: "fas fa-home", label: "Home", path: "/" },
    { key: "quests", icon: "fas fa-scroll", label: "Quests", path: "/quests" },
    { key: "workouts", icon: "fas fa-dumbbell", label: "Workout", path: "/workout" },
    { key: "system", icon: "fas fa-robot", label: "System", path: "/system" },
    { key: "profile", icon: "fas fa-user", label: "Profile", path: "/profile" },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 h-20 bg-system-dark/70 backdrop-blur-lg border-t border-electric/10 z-50">
      <div className="max-w-md mx-auto h-full flex items-center justify-around">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => setLocation(item.path)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-2xl transition-all duration-300 ${
              currentPage === item.key
                ? "text-electric bg-electric/10"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            <i className={`${item.icon} text-xl mb-1`}></i>
            <span className="text-xs font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}