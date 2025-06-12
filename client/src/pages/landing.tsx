import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { SystemPanel } from "@/components/ui/system-panel"; // <-- IMPORT NEW COMPONENT

const authSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

type AuthFormData = z.infer<typeof authSchema>;

export default function Landing() {
  const [isSignUp, setIsSignUp] = useState(true); // Default to signing up
  const { signIn, signUp, isLoading } = useAuth();
  const { toast } = useToast();

  const form = useForm<AuthFormData>({
    resolver: zodResolver(authSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: AuthFormData) => {
    try {
      if (isSignUp) {
        await signUp(data.email, data.password);
        toast({
          title: "Registration Alert",
          description: "The System has acknowledged your request. Check your inbox for verification.",
        });
      } else {
        await signIn(data.email, data.password);
      }
    } catch (error: any) {
      toast({
        title: "Access Denied",
        description: error.message || "Authentication failed.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen system-theme relative overflow-hidden flex items-center justify-center p-4">
      <SystemPanel className="w-full max-w-lg">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 border border-electric/50 px-4 py-2 rounded-lg max-w-xs mx-auto">
            <i className="fas fa-exclamation-circle text-electric text-xl animate-pulse"></i>
            <h1 className="text-2xl font-black tracking-widest text-electric">NOTIFICATION</h1>
          </div>

          <p className="text-text-secondary text-lg font-mono leading-relaxed">
            You have acquired the qualifications to be a <strong className="text-white">Player</strong>.
            <br />
            Will you accept?
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="mt-8 space-y-4">
            <FormField control={form.control} name="email" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary font-mono text-sm">Hunter ID (Email)</FormLabel>
                <FormControl><Input type="email" {...field} className="bg-system-dark/50 border-system-lighter text-text-primary" placeholder="hunter@system.net" /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <FormField control={form.control} name="password" render={({ field }) => (
              <FormItem>
                <FormLabel className="text-text-secondary font-mono text-sm">Access Code</FormLabel>
                <FormControl><Input type="password" {...field} className="bg-system-dark/50 border-system-lighter text-text-primary" placeholder="••••••••" /></FormControl>
                <FormMessage />
              </FormItem>
            )}/>
            <Button type="submit" disabled={isLoading} className="w-full gradient-electric text-system-dark font-bold py-3 text-lg hover:shadow-glow transition-all duration-300 font-mono mt-4">
              {isLoading ? 'Processing...' : (isSignUp ? '[ ACCEPT ]' : '[ ACCESS SYSTEM ]')}
            </Button>
          </form>
        </Form>

        <div className="mt-6 text-center">
          <Button variant="link" onClick={() => setIsSignUp(!isSignUp)} className="text-text-secondary hover:text-electric font-mono text-xs">
            {isSignUp ? "Already a Player? Access System" : "Not a Player? Register Now"}
          </Button>
        </div>
      </SystemPanel>
    </div>
  );
}