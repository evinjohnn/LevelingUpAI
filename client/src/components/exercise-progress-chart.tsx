import { useQuery } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from '@/hooks/useAuth';

interface ExerciseProgressChartProps {
  exerciseName: string;
}

// Function to calculate estimated 1 Rep Max (Epley Formula)
const calculateE1RM = (weight: number, reps: number) => {
  if (!weight || !reps || reps === 0) return 0;
  if (reps === 1) return weight;
  return weight * (1 + reps / 30);
};

// Custom Tooltip for a more thematic look
const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="glass-card p-3 rounded-lg border border-electric/30">
        <p className="label font-mono text-text-secondary">{`Date: ${label}`}</p>
        <p className="intro text-electric font-semibold">{`Est. 1-Rep Max: ${payload[0].value.toFixed(1)} kg`}</p>
        <p className="text-system-gold font-semibold">{`Max Weight Lifted: ${payload[1].value.toFixed(1)} kg`}</p>
      </div>
    );
  }
  return null;
};


export default function ExerciseProgressChart({ exerciseName }: ExerciseProgressChartProps) {
  const { user } = useAuth();

  const { data: chartData = [], isLoading } = useQuery({
    queryKey: ["/api/workouts", user?.id, exerciseName],
    queryFn: async () => {
      // In a real app, this would be a dedicated backend endpoint for performance
      // For now, we filter on the client
      const res = await fetch('/api/workouts');
      if (!res.ok) throw new Error('Failed to fetch workouts');
      const allWorkouts: any[] = await res.json();
      
      const progressData: { date: string; e1RM: number; maxWeight: number }[] = [];

      allWorkouts.forEach((workout) => {
          if (workout.exercises) {
              const relevantExercises = (workout.exercises as any[]).filter(ex => ex.name === exerciseName);
              if (relevantExercises.length > 0) {
                  let dailyMaxWeight = 0;
                  let dailyBestE1RM = 0;

                  relevantExercises.forEach((ex: any) => {
                      (ex.sets || []).forEach((set: any) => {
                         if (set.weight > dailyMaxWeight) dailyMaxWeight = set.weight;
                         const e1rm = calculateE1RM(set.weight, set.reps);
                         if (e1rm > dailyBestE1RM) dailyBestE1RM = e1rm;
                      });
                  });
                  
                  if (dailyBestE1RM > 0) {
                    progressData.push({
                        date: new Date(workout.date).toLocaleDateString('en-CA'), // YYYY-MM-DD format
                        maxWeight: dailyMaxWeight,
                        e1RM: Math.round(dailyBestE1RM),
                    });
                  }
              }
          }
      });
      
      // Sort and remove duplicate dates, keeping the highest e1RM for that day
      const uniqueData = Array.from(progressData.reduce((map, item) => {
          const existing = map.get(item.date);
          if (!existing || item.e1RM > existing.e1RM) {
              map.set(item.date, item);
          }
          return map;
      }, new Map()).values());

      return uniqueData.sort((a,b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    },
    enabled: !!user?.id,
  });

  if (isLoading) return <div>Loading Chart Data...</div>;
  if (chartData.length < 2) return <p className="text-center text-text-secondary p-4">Not enough data for a chart. Log at least two sessions for this exercise.</p>;

  return (
    <Card className="glass-card border-0 shadow-card bg-transparent">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center">
          <i className="fas fa-chart-line text-electric mr-2"></i>
          Performance: {exerciseName}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={300}>
          <AreaChart data={chartData} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            {/* SVG Gradient Definition for the stock market glow */}
            <defs>
              <linearGradient id="colorE1RM" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--neon)" stopOpacity={0.8}/>
                <stop offset="95%" stopColor="var(--neon)" stopOpacity={0}/>
              </linearGradient>
               <linearGradient id="colorMaxWeight" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="var(--system-gold)" stopOpacity={0.6}/>
                <stop offset="95%" stopColor="var(--system-gold)" stopOpacity={0}/>
              </linearGradient>
            </defs>

            <CartesianGrid strokeDasharray="1 5" stroke="rgba(100, 255, 218, 0.1)" />
            <XAxis dataKey="date" fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" />
            <YAxis fontSize={12} tickLine={false} axisLine={false} stroke="var(--text-secondary)" domain={['dataMin - 10', 'auto']} />
            
            <Tooltip content={<CustomTooltip />} />
            <Legend />

            <Area type="monotone" dataKey="e1RM" name="Est. 1-Rep Max (kg)" stroke="var(--neon)" strokeWidth={3} fillOpacity={1} fill="url(#colorE1RM)" />
            <Area type="monotone" dataKey="maxWeight" name="Max Weight (kg)" stroke="var(--system-gold)" strokeWidth={2} fillOpacity={1} fill="url(#colorMaxWeight)" />
          
          </AreaChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}