interface RPGStatsProps {
  stats?: {
    strength: number;
    endurance: number;
    wisdom: number;
    discipline: number;
  };
}

export default function RPGStats({ stats }: RPGStatsProps) {
  const statsData = [
    {
      key: "strength",
      label: "STR",
      value: stats?.strength || 10,
      color: "red",
      icon: "fas fa-fist-raised",
      bgColor: "bg-red-500",
      textColor: "text-red-400",
    },
    {
      key: "endurance",
      label: "END",
      value: stats?.endurance || 10,
      color: "green",
      icon: "fas fa-running",
      bgColor: "bg-green-500",
      textColor: "text-green-400",
    },
    {
      key: "wisdom",
      label: "WIS",
      value: stats?.wisdom || 10,
      color: "blue",
      icon: "fas fa-brain",
      bgColor: "bg-blue-500",
      textColor: "text-blue-400",
    },
    {
      key: "discipline",
      label: "DISC",
      value: stats?.discipline || 10,
      color: "purple",
      icon: "fas fa-medal",
      bgColor: "bg-purple-500",
      textColor: "text-purple-400",
    },
  ];

  return (
    <div>
      <h2 className="text-lg font-bold mb-3 flex items-center text-text-primary">
        <i className="fas fa-chart-line text-electric mr-2"></i>
        Hunter Statistics
      </h2>
      
      <div className="grid grid-cols-2 gap-3">
        {statsData.map((stat) => (
          <div key={stat.key} className="glass-card rounded-xl p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <div className={`w-6 h-6 ${stat.bgColor} rounded-md flex items-center justify-center`}>
                  <i className={`${stat.icon} text-xs text-white`}></i>
                </div>
                <span className="font-semibold text-sm text-text-primary">{stat.label}</span>
              </div>
              <span className={`font-bold ${stat.textColor}`}>{stat.value}</span>
            </div>
            <div className="h-2 bg-system-lighter rounded-full overflow-hidden">
              <div 
                className={`h-full ${stat.bgColor} stat-bar rounded-full`}
                style={{ width: `${Math.min(100, stat.value)}%` }}
              ></div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
