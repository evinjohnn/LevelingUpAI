// client/src/pages/onboarding.tsx

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { SystemPanel } from "@/components/ui/system-panel"; // Updated: Use SystemPanel
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { updateUserProfileSchema, type UpdateUserProfile } from "@shared/schema";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/lib/supabase";
import { z } from "zod";

const onboardingFormSchema = updateUserProfileSchema.extend({
  avatarFile: z.instanceof(File).optional(),
});

type OnboardingFormData = z.infer<typeof onboardingFormSchema>;

const stepOneFields: (keyof OnboardingFormData)[] = ["firstName", "age", "gender", "height", "weight"];
const stepTwoFields: (keyof OnboardingFormData)[] = ["fitnessLevel", "fitnessGoal", "bodyFatPercentage"];

export default function Onboarding() {
  const [step, setStep] = useState(1);
  const { toast } = useToast();
  const { userProfile } = useAuth();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();

  const form = useForm<OnboardingFormData>({
    resolver: zodResolver(onboardingFormSchema),
    mode: "onChange",
    defaultValues: {
      firstName: "",
      age: undefined,
      gender: "",
      height: undefined,
      weight: undefined,
      bodyFatPercentage: undefined,
      fitnessLevel: "",
      fitnessGoal: "",
      onboardingCompleted: false,
    },
  });

  const updateProfileMutation = useMutation({
    mutationFn: async (data: UpdateUserProfile) => {
      return await apiRequest("PATCH", "/api/profile", data);
    },
    onSuccess: () => {
      toast({
        title: "Profile Synchronized",
        description: "Welcome to The System, Hunter. Your training begins now.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      setLocation("/", { replace: true });
    },
    onError: (error) => {
      toast({
        title: "Synchronization Error",
        description: error.message,
        variant: "destructive",
      });
    },
  });
  
  const processForm = async (data: OnboardingFormData) => {
    const avatarFile = data.avatarFile;
    let profileImageUrl: string | undefined = undefined;

    if (avatarFile && userProfile?.id) {
      try {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `${userProfile.id}/avatar.${fileExt}`;
        
        await supabase.storage.from('avatars').upload(filePath, avatarFile, { upsert: true });

        const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(filePath);
        profileImageUrl = urlData.publicUrl;
      } catch (error: any) {
        toast({ title: "Avatar Upload Failed", description: error.message, variant: "destructive" });
      }
    }

    updateProfileMutation.mutate({
      ...data,
      onboardingCompleted: true,
      profileImageUrl,
    });
  };
  
  const handleNextStep = async () => {
    const fieldsToValidate = step === 1 ? stepOneFields : stepTwoFields;
    const isValid = await form.trigger(fieldsToValidate);

    if (isValid) {
      setStep(step + 1);
    } else {
       toast({ title: "Incomplete Data", description: "Please fill in all required fields to proceed.", variant: "destructive" });
    }
  };

  const handlePreviousStep = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  return (
    <div className="min-h-screen system-theme relative overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-0 left-0 w-96 h-96 bg-electric rounded-full filter blur-3xl transform -translate-x-48 -translate-y-48"></div>
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-neon rounded-full filter blur-3xl transform translate-x-48 translate-y-48"></div>
      </div>
      <div className="relative z-10 min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          {/* --- UI CHANGE START: Replaced Card with SystemPanel --- */}
          <SystemPanel>
            <div className="text-center">
              <div className="w-16 h-16 gradient-electric rounded-xl mx-auto mb-4 flex items-center justify-center">
                <i className="fas fa-user-shield text-system-dark text-2xl"></i>
              </div>
              <h2 className="text-2xl font-bold text-text-primary">Hunter Registration</h2>
              <p className="text-text-secondary text-sm font-mono">[SYSTEM INITIALIZATION] Step {step} of 3</p>
            </div>
            
            <Form {...form}>
              <form onSubmit={form.handleSubmit(processForm)} className="space-y-6 mt-6">
                {step === 1 && (
                  <div className="space-y-4 text-left">
                     <FormField control={form.control} name="firstName" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-text-primary">Name</FormLabel>
                          <FormControl><Input type="text" {...field} className="bg-system-gray" placeholder="e.g., Sung Jinwoo" /></FormControl>
                          <FormMessage />
                        </FormItem>
                     )}/>
                     <FormField control={form.control} name="age" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-text-primary">Age</FormLabel>
                          <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} className="bg-system-gray" placeholder="e.g., 25" /></FormControl>
                          <FormMessage />
                        </FormItem>
                     )}/>
                     <FormField control={form.control} name="gender" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-text-primary">Gender</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-system-gray"><SelectValue placeholder="Select gender" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-system-gray"><SelectItem value="Male">Male</SelectItem><SelectItem value="Female">Female</SelectItem><SelectItem value="Other">Other</SelectItem></SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                     )}/>
                     <div className="grid grid-cols-2 gap-4">
                       <FormField control={form.control} name="height" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-primary">Height (cm)</FormLabel>
                            <FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || undefined)} className="bg-system-gray" placeholder="e.g., 180" /></FormControl>
                            <FormMessage />
                          </FormItem>
                       )}/>
                       <FormField control={form.control} name="weight" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-primary">Weight (kg)</FormLabel>
                            <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} className="bg-system-gray" placeholder="e.g., 75.5" /></FormControl>
                            <FormMessage />
                          </FormItem>
                       )}/>
                     </div>
                  </div>
                )}

                {step === 2 && (
                   <div className="space-y-4 text-left">
                      <FormField control={form.control} name="fitnessLevel" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-text-primary">Current Fitness Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-system-gray"><SelectValue placeholder="Select your current level" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-system-gray"><SelectItem value="Beginner">Beginner</SelectItem><SelectItem value="Intermediate">Intermediate</SelectItem><SelectItem value="Advanced">Advanced</SelectItem></SelectContent>
                          </Select>
                           <FormMessage />
                        </FormItem>
                     )}/>
                      <FormField control={form.control} name="fitnessGoal" render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-text-primary">Primary Fitness Goal</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger className="bg-system-gray"><SelectValue placeholder="Choose your path" /></SelectTrigger></FormControl>
                            <SelectContent className="bg-system-gray"><SelectItem value="Muscle Gain">Muscle Gain</SelectItem><SelectItem value="Fat Loss">Fat Loss</SelectItem><SelectItem value="Recomposition">Body Recomposition</SelectItem></SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}/>
                      <FormField control={form.control} name="bodyFatPercentage" render={({ field }) => (
                         <FormItem>
                          <FormLabel className="text-text-primary">Body Fat % (optional)</FormLabel>
                          <FormControl><Input type="number" step="0.1" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || undefined)} className="bg-system-gray" placeholder="e.g., 15.5" /></FormControl>
                           <FormMessage />
                        </FormItem>
                     )}/>
                  </div>
                )}
                
                {step === 3 && (
                  <div className="space-y-4 text-left">
                    <FormField control={form.control} name="avatarFile" render={({ field }) => (
                          <FormItem>
                            <FormLabel className="text-text-primary">Profile Avatar (optional)</FormLabel>
                            <FormControl><Input type="file" accept="image/png, image/jpeg, image/webp" onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)} className="bg-system-gray file:text-text-secondary file:font-mono" /></FormControl>
                            <FormMessage />
                          </FormItem>
                    )}/>
                    <div className="bg-system-lighter rounded-xl p-4 mt-6">
                      <p className="text-electric text-sm font-mono mb-2">[SYSTEM MESSAGE]</p>
                      <p className="text-text-primary text-sm">Registration complete. You will be assigned to E-Rank and begin your hunter training immediately.</p>
                    </div>
                  </div>
                )}

                <div className="flex gap-3 pt-4">
                  {step > 1 && (
                    <Button type="button" onClick={handlePreviousStep} variant="outline" className="flex-1 border-gray-600 text-text-secondary hover:text-text-primary hover:border-electric">Back</Button>
                  )}
                  
                  {step < 3 && (
                     <Button type="button" onClick={handleNextStep} className="flex-1 gradient-electric text-system-dark font-semibold hover:shadow-glow">
                        Next <i className="fas fa-arrow-right ml-2"></i>
                     </Button>
                  )}

                  {step === 3 && (
                    <Button type="submit" disabled={updateProfileMutation.isPending} className="flex-1 gradient-electric text-system-dark font-semibold hover:shadow-glow">
                      {updateProfileMutation.isPending ? (
                        <span className="flex items-center"><i className="fas fa-spinner fa-spin mr-2"></i>Processing...</span>
                      ) : (
                        <span className="flex items-center"><i className="fas fa-check mr-2"></i>Complete Registration</span>
                      )}
                    </Button>
                  )}
                </div>
              </form>
            </Form>
          </SystemPanel>
          {/* --- UI CHANGE END --- */}
        </div>
      </div>
    </div>
  );
}