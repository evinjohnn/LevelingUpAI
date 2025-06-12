import { useForm, useFieldArray } from "react-hook-form";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import { useLocation } from "wouter";
import { PPL_WORKOUT_PLAN } from "@/lib/workout-plan";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import ExerciseProgressChart from "@/components/exercise-progress-chart";
import { z } from "zod";
import { SystemPanel } from "@/components/ui/system-panel";

// Schemas...
const setSchema = z.object({
  reps: z.number().min(0, "Reps must be 0 or more"),
  weight: z.number().min(0, "Weight must be 0 or more"),
});

const exerciseSchema = z.object({
  name: z.string(),
  sets: z.array(setSchema).min(1, "Log at least one set"),
});

const workoutFormSchema = z.object({
  exercises: z.array(exerciseSchema),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
});

type WorkoutFormData = z.infer<typeof workoutFormSchema>;

export default function WorkoutLogger() {
    const [, setLocation] = useLocation();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const dayOfWeek = new Date().getDay();
    const todaysWorkout = PPL_WORKOUT_PLAN[dayOfWeek];

    const form = useForm<WorkoutFormData>({
        defaultValues: {
            exercises: todaysWorkout.exercises.map(ex => ({
                name: ex.name,
                sets: Array.from({ length: ex.sets }, () => ({ reps: 0, weight: 0 })),
            })),
            duration: 60,
        },
    });

    const { fields } = useFieldArray({ control: form.control, name: "exercises" });

    const createWorkoutMutation = useMutation({
        mutationFn: async (data: WorkoutFormData) => {
            const totalVolume = data.exercises.reduce((sum, ex) => sum + ex.sets.reduce((setSum, s) => setSum + s.weight * s.reps, 0), 0);
            return await apiRequest("POST", "/api/workouts", { ...data, totalVolume: totalVolume.toString() });
        },
        onSuccess: async (res) => {
            const result = await res.json();
            toast({ title: result.analysis.progressiveOverload ? "Progressive Overload!" : "Workout Logged", description: result.analysis.message });
            queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
            queryClient.invalidateQueries({ queryKey: ["/api/stats"] });
            queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
            setLocation("/");
        },
        onError: (error) => toast({ title: "Error", description: error.message, variant: "destructive" }),
    });

    if (todaysWorkout.muscleGroup === "REST") {
        return (
            <div className="min-h-screen system-theme flex flex-col items-center justify-center p-4">
                <SystemPanel><div className="text-center p-4"><i className="fas fa-bed text-system-gold text-4xl mb-4"></i><h1 className="text-2xl font-bold text-system-gold">Rest Day</h1><p className="text-text-secondary mt-2">Recovery is critical for growth, Hunter.</p><Button onClick={() => setLocation('/')} className="mt-6">Dashboard</Button></div></SystemPanel>
                <BottomNavigation currentPage="workouts" />
            </div>
        );
    }

    return (
        <div className="min-h-screen system-theme pb-24">
            <div className="max-w-md mx-auto p-4">
                <SystemPanel>
                    <div className="flex items-center justify-between mb-4">
                        <h1 className="text-2xl font-bold text-text-primary">[ {todaysWorkout.muscleGroup} PROTOCOL ]</h1>
                        <div className="w-12 h-12 gradient-electric rounded-lg flex items-center justify-center"><i className="fas fa-dumbbell text-system-dark text-xl"></i></div>
                    </div>
                    <Form {...form}>
                        <form onSubmit={form.handleSubmit(data => createWorkoutMutation.mutate(data))} className="space-y-6">
                            <Accordion type="single" collapsible className="w-full space-y-3" defaultValue="item-0">
                                {fields.map((field, index) => {
                                    const exInfo = todaysWorkout.exercises[index];
                                    return (
                                        <AccordionItem value={`item-${index}`} key={field.id} className="bg-system-dark/50 rounded-lg border border-system-lighter overflow-hidden">
                                            <AccordionTrigger className="p-4 hover:no-underline text-left">
                                                <div>
                                                    <p className="font-bold text-text-primary">{exInfo.name}</p>
                                                    <p className="text-xs text-text-secondary">{exInfo.sets} sets x {exInfo.reps} reps</p>
                                                </div>
                                            </AccordionTrigger>
                                            <AccordionContent className="p-4 pt-0">
                                                <p className="text-xs text-text-secondary mb-3 italic">{exInfo.cues}</p>
                                                <div className="space-y-2">
                                                    {Array.from({ length: exInfo.sets }).map((_, setIndex) => (
                                                        <div key={setIndex} className="flex items-end gap-3"><span className="font-mono text-text-secondary w-12 pt-1">Set {setIndex + 1}</span><div className="flex-1"><FormLabel className="text-xs text-text-secondary">Weight (kg)</FormLabel><FormField control={form.control} name={`exercises.${index}.sets.${setIndex}.weight`} render={({ field }) => (<Input type="number" placeholder="0" {...field} value={field.value || ''} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} className="bg-system-gray"/>)} /></div><div className="flex-1"><FormLabel className="text-xs text-text-secondary">Reps</FormLabel><FormField control={form.control} name={`exercises.${index}.sets.${setIndex}.reps`} render={({ field }) => (<Input type="number" placeholder="0" {...field} value={field.value || ''} onChange={e => field.onChange(parseInt(e.target.value, 10) || 0)} className="bg-system-gray"/>)} /></div></div>
                                                    ))}
                                                </div>
                                            </AccordionContent>
                                        </AccordionItem>
                                    );
                                })}
                            </Accordion>
                            <FormField control={form.control} name="duration" render={({ field }) => (<FormItem><FormLabel className="text-text-primary">Duration (min)</FormLabel><FormControl><Input type="number" {...field} value={field.value || ''} onChange={e => field.onChange(parseInt(e.target.value) || 0)} className="bg-system-lighter"/></FormControl></FormItem>)}/>
                            <Button type="submit" disabled={createWorkoutMutation.isPending} className="w-full gradient-electric text-system-dark font-semibold py-3 hover:shadow-glow">{createWorkoutMutation.isPending ? "Logging Session..." : "Complete & Log Session"}</Button>
                        </form>
                    </Form>
                </SystemPanel>
            </div>
            <BottomNavigation currentPage="workouts" />
        </div>
    );
}