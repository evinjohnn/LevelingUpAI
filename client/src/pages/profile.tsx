import { useState, useRef, useEffect } from 'react';
import { useAuth } from "@/hooks/useAuth";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import BottomNavigation from "@/components/bottom-navigation";
import TrainingIntensityChart from "@/components/training-intensity-chart";
import { useLocation } from "wouter";
import { supabase } from '@/lib/supabase';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from "@/lib/queryClient";
import { SystemPanel } from "@/components/ui/system-panel";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

const CLASSES = [
    { name: "Powerlifter", icon: "fas fa-weight-hanging", desc: "Focuses on pure strength. Gains bonus XP from heavy compound lifts." },
    { name: "Bodybuilder", icon: "fas fa-child-reaching", desc: "Focuses on volume and aesthetics. Gains bonus Discipline." },
    { name: "Speedster", icon: "fas fa-bolt", desc: "Focuses on explosive power and cardio. Gains bonus Endurance." },
    { name: "Martial Artist", icon: "fas fa-hand-fist", desc: "A balanced warrior focusing on endurance and flexibility." },
];

export default function Profile() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isClassModalOpen, setClassModalOpen] = useState(false);
  const { userProfile: user, signOut } = useAuth();
  
  useEffect(() => {
    if (user && user.level >= 10 && !user.characterClass) {
      setClassModalOpen(true);
    }
  }, [user]);

  // FIXED: Updated mutation to use correct property names
  const updateProfileMutation = useMutation({
    mutationFn: async (data: { characterClass?: string; profileImageUrl?: string }) => {
      if (!user?.id) throw new Error("User not found");
      // Send the correct property name to the backend
      const payload = data.profileImageUrl 
        ? { profileImageUrl: data.profileImageUrl } 
        : { characterClass: data.characterClass };
      return await apiRequest("PATCH", "/api/profile", payload);
    },
    onSuccess: (_, variables) => {
      toast({ 
        title: "Profile Synchronized", 
        description: variables.characterClass 
          ? `You are now a ${variables.characterClass}!` 
          : "Avatar updated." 
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
      if (variables.characterClass) setClassModalOpen(false);
    },
    onError: (error: any) => toast({ 
      title: "Update Failed", 
      description: error.message, 
      variant: "destructive" 
    }),
  });
  
  // FIXED: Corrected upload logic with proper property names
  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user?.id) {
      toast({ 
        title: "Error", 
        description: "User not found or no file selected.", 
        variant: "destructive" 
      });
      return;
    }

    const fileExt = file.name.split('.').pop();
    // Create user-specific folder structure for RLS policy
    const filePath = `${user.id}/avatar.${fileExt}`;

    try {
      // First, try to remove any existing avatar files to prevent accumulation
      const existingFiles = [
        `${user.id}/avatar.jpg`,
        `${user.id}/avatar.jpeg`, 
        `${user.id}/avatar.png`,
        `${user.id}/avatar.webp`
      ];
      
      // Don't await this - it's okay if it fails (file might not exist)
      supabase.storage.from('avatars').remove(existingFiles);

      // Upload the new file
      const { data, error } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true, // Allow overwriting existing files
          contentType: file.type
        });

      if (error) {
        console.error('Upload error:', error);
        throw error;
      }

      // Get the public URL
      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(data.path);
      
      // FIXED: Use the correct property name that matches the backend schema
      updateProfileMutation.mutate({ profileImageUrl: urlData.publicUrl });

    } catch (err: any) {
      console.error('File upload failed:', err);
      toast({ 
        title: "Upload Failed", 
        description: err.message || "Failed to upload avatar", 
        variant: "destructive" 
      });
    }
  };

  const handleLogout = async () => {
    await signOut();
    setLocation("/");
  };
  
  if (!user) {
    return (
      <div className="min-h-screen system-theme flex items-center justify-center">
        <div className="font-mono text-electric">Loading System Data...</div>
      </div>
    );
  }

  return (
    <>
      <div className="min-h-screen system-theme pb-24">
        <div className="max-w-md mx-auto p-4 space-y-6">
          <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-text-primary">[ CHARACTER SHEET ]</h1>
              <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500 hover:bg-red-500/10">
                <i className="fas fa-sign-out-alt"></i>
              </Button>
          </div>
          <SystemPanel>
              <div className="flex items-center gap-4">
                  <div className="relative group">
                      <Avatar className="w-20 h-20 border-2 border-electric">
                        <AvatarImage src={user.profileImageUrl || ''} />
                        <AvatarFallback className="bg-system-lighter text-electric text-3xl">
                          {user.firstName?.charAt(0) || 'H'}
                        </AvatarFallback>
                      </Avatar>
                      <button 
                        onClick={() => fileInputRef.current?.click()} 
                        className="absolute inset-0 bg-black/60 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100" 
                        disabled={updateProfileMutation.isPending}
                      >
                        <i className={`text-white fas ${updateProfileMutation.isPending ? 'fa-spinner fa-spin' : 'fa-edit'}`}></i>
                      </button>
                      <input 
                        type="file" 
                        ref={fileInputRef} 
                        onChange={handleFileChange} 
                        accept="image/png, image/jpeg, image/jpg, image/webp" 
                        className="hidden" 
                      />
                  </div>
                  <div>
                      <h2 className="text-xl font-bold text-text-primary">
                        {user.firstName || "Hunter"} {user.lastName || ""}
                      </h2>
                      <p className="text-text-secondary font-mono">Level {user.level} • {user.rank}</p>
                      <div className="mt-1 px-3 py-1 text-xs inline-block rounded-full text-system-dark font-bold bg-system-gold">
                        {user.characterClass || "Class Unassigned"}
                      </div>
                  </div>
              </div>
          </SystemPanel>
          <SystemPanel>
               <h3 className="text-lg font-bold text-text-primary mb-4 font-mono">// CORE STATS</h3>
               <div className="grid grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-red-400 font-bold text-2xl">{user.strength}</p>
                    <p className="text-text-secondary text-xs">STR</p>
                  </div>
                  <div>
                    <p className="text-green-400 font-bold text-2xl">{user.endurance}</p>
                    <p className="text-text-secondary text-xs">END</p>
                  </div>
                  <div>
                    <p className="text-blue-400 font-bold text-2xl">{user.wisdom}</p>
                    <p className="text-text-secondary text-xs">WIS</p>
                  </div>
                  <div>
                    <p className="text-purple-400 font-bold text-2xl">{user.discipline}</p>
                    <p className="text-text-secondary text-xs">DISC</p>
                  </div>
               </div>
          </SystemPanel>
          <TrainingIntensityChart />
          <SystemPanel>
              <h3 className="text-lg font-bold text-text-primary mb-4 font-mono">// BIOMETRICS</h3>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-text-secondary">Height</span>
                    <span className="text-text-primary font-semibold">{user.height} cm</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-text-secondary">Weight</span>
                    <span className="text-text-primary font-semibold">{user.weight} kg</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-text-secondary">Body Fat</span>
                    <span className="text-text-primary font-semibold">{user.bodyFatPercentage || 'N/A'}%</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-1">
                    <span className="text-text-secondary">Fat Level</span>
                    <span className="text-text-primary font-semibold">{user.fatLevel || 'N/A'}</span>
                  </div>
              </div>
          </SystemPanel>
        </div>
      </div>
      <Dialog open={isClassModalOpen} onOpenChange={setClassModalOpen}>
        <DialogContent className="bg-system-dark border-electric max-w-md">
          <DialogHeader>
            <DialogTitle className="text-electric text-2xl text-center font-mono">
              [ CLASS PROMOTION ]
            </DialogTitle>
            <DialogDescription className="text-text-secondary text-center">
              You have reached Level 10. The System has granted you the right to choose a Class. This decision is permanent.
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 pt-4">
            {CLASSES.map((cls) => (
              <button 
                key={cls.name} 
                onClick={() => updateProfileMutation.mutate({ characterClass: cls.name })} 
                disabled={updateProfileMutation.isPending} 
                className="p-4 text-center rounded-lg border border-system-lighter hover:bg-electric/10 hover:border-electric transition-all disabled:opacity-50"
              >
                <i className={`${cls.icon} text-3xl text-electric mb-2`}></i>
                <h3 className="font-bold text-text-primary">{cls.name}</h3>
                <p className="text-xs text-text-secondary mt-1">{cls.desc}</p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
      <BottomNavigation currentPage="profile" />
    </>
  );
}