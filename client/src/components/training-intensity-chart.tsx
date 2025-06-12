// client/src/components/training-intensity-chart.tsx

import { useQuery } from "@tanstack/react-query";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function TrainingIntensityChart() {
  const { data: weeklyVolume = [], isLoading } = useQuery<{week: string, totalVolume: number}[]>({
    queryKey: ["/api/stats/intensity"]
  });

  if (isLoading) return <div>Loading Chart...</div>;
  if (weeklyVolume.length === 0) return null;

  return (
    <Card className="glass-card border-0 shadow-card mb-6">
      <CardHeader>
        <CardTitle className="text-text-primary flex items-center">
          <i className="fas fa-chart-bar text-electric mr-2"></i>
          Weekly Training Volume (kg)
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={weeklyVolume} margin={{ top: 5, right: 20, left: -10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(100, 255, 218, 0.1)" />
            <XAxis dataKey="week" fontSize={12} tickLine={false} axisLine={false} />
            <YAxis fontSize={12} tickLine={false} axisLine={false} />
            <Tooltip
              cursor={{ fill: 'rgba(100, 255, 218, 0.1)' }}
              contentStyle={{
                background: 'var(--system-gray)',
                border: '1px solid var(--system-lighter)',
                borderRadius: 'var(--radius)',
              }}
            />
            <Bar dataKey="totalVolume" name="Total Volume" fill="var(--electric)" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}