// client/src/pages/system-chat.tsx

import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import BottomNavigation from "@/components/bottom-navigation";
import { SystemPanel } from "@/components/ui/system-panel";

export default function SystemChat() {
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: messages = [], isLoading } = useQuery({
    queryKey: ["/api/system/messages"],
    select: (response: any) => response.data || [], // Ensure it's always an array
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (userMessage: string) => {
      // Optimistically update the UI with the user's message
      // The server sends newest-first, so we add the new message to the start of the array.
      queryClient.setQueryData(["/api/system/messages"], (old: any) => {
        const oldData = old?.data || [];
        return { 
          success: true, 
          data: [{ role: 'user', content: userMessage, id: Date.now() }, ...oldData] 
        };
      });
      setMessage("");
      return apiRequest("POST", "/api/system/chat", { message: userMessage });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/system/messages"] });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/user"] });
    },
    onError: (error) => {
      toast({ title: "Communication Error", description: error.message, variant: "destructive" });
      queryClient.invalidateQueries({ queryKey: ["/api/system/messages"] });
    },
  });

  const handleSendMessage = () => {
    if (message.trim() && !sendMessageMutation.isPending) {
      sendMessageMutation.mutate(message);
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="min-h-screen system-theme flex flex-col p-4 pb-24">
      <SystemPanel className="flex flex-col flex-1 h-full w-full max-w-md mx-auto">
        <div className="flex-shrink-0 flex items-center justify-between mb-4">
          <h1 className="text-xl font-bold text-text-primary">[ SYSTEM CHANNEL ]</h1>
          <div className="w-10 h-10 gradient-electric rounded-lg flex items-center justify-center pulse-glow"><i className="fas fa-terminal text-system-dark"></i></div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-4 pr-2">
          {isLoading && <p className="text-center text-text-secondary">Establishing secure connection...</p>}
          
          {/* --- FIX: Restored the .reverse() to show oldest messages first --- */}
          {[...messages].reverse().map((msg: any) => (
            <div key={msg.id} className={`flex items-end gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === 'assistant' && <i className="fas fa-robot text-electric text-lg mb-2"></i>}
              <div className={`max-w-[85%] rounded-lg p-3 ${msg.role === "user" ? "gradient-electric rounded-br-none user-chat-bubble" : "bg-system-lighter text-text-primary rounded-bl-none"}`}>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              </div>
            </div>
          ))}

          {sendMessageMutation.isPending && (
            <div className="flex items-end gap-2 justify-start">
              <i className="fas fa-robot text-electric text-lg mb-2"></i>
              <div className="bg-system-lighter rounded-lg p-3 rounded-bl-none">
                <p className="text-sm text-text-secondary animate-pulse">System is processing...</p>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="flex-shrink-0 mt-4 flex gap-3">
          <Input value={message} onChange={(e) => setMessage(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()} placeholder="Transmit message..." className="flex-1 bg-system-gray border-gray-600 text-white" disabled={sendMessageMutation.isPending} />
          <Button onClick={handleSendMessage} disabled={!message.trim() || sendMessageMutation.isPending} className="gradient-electric text-system-dark">
            {sendMessageMutation.isPending ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-paper-plane"></i>}
          </Button>
        </div>
      </SystemPanel>
      <BottomNavigation currentPage="system" />
    </div>
  );
}