
interface RPGStatsProps {
  stats?: {
    strength: number;
    endurance: number;
    wisdom: number;
    discipline: number;
  };
}

export default function RPGStats({ stats }: RPGStatsProps) {
  // Mapping stats to the Solo Leveling equivalents and new icons
  const statsData = [
    {
      key: "strength",
      label: "STR",
      value: stats?.strength || 10,
      icon: "fas fa-fist-raised",
    },
    {
      key: "endurance",
      label: "VIT", // Changed to VIT for Vitality/Endurance
      value: stats?.endurance || 10,
      icon: "fas fa-heartbeat",
    },
    {
      key: "wisdom",
      label: "INT", // Changed to INT for Intelligence/Wisdom
      value: stats?.wisdom || 10,
      icon: "fas fa-brain",
    },
    {
      key: "discipline",
      label: "AGI", // Re-purposed for Agility/Discipline
      value: stats?.discipline || 10,
      icon: "fas fa-running",
    },
  ];

  return (
    <div>
      <h2 className="text-xl font-black tracking-widest mb-4 text-center text-electric text-glow">
        STATUS
      </h2>
      
      <div className="grid grid-cols-2 gap-x-8 gap-y-4 font-mono">
        {statsData.map((stat) => (
          <div key={stat.key} className="flex items-center space-x-3">
            <i className={`${stat.icon} text-electric text-lg w-6 text-center`}></i>
            <span className="text-text-secondary">{stat.label}:</span>
            <span className="font-bold text-lg text-text-primary">{stat.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}