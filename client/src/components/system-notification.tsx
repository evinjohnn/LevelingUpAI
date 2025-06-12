import { useSystemNotification } from '@/hooks/use-system-notification';
import { SystemPanel } from '@/components/ui/system-panel';
import { Button } from '@/components/ui/button';

export function SystemNotification() {
  const { isOpen, title, message, onAccept, hide } = useSystemNotification();

  if (!isOpen) {
    return null;
  }

  const handleAccept = () => {
    if (onAccept) {
      onAccept();
    }
    hide();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-system-dark/80 backdrop-blur-sm">
      <SystemPanel className="w-full max-w-lg">
        <div className="text-center space-y-4">
          <div className="flex items-center justify-center gap-3 border border-electric/50 px-4 py-2 rounded-lg max-w-xs mx-auto">
            <i className="fas fa-exclamation-circle text-electric text-xl animate-pulse"></i>
            <h1 className="text-2xl font-black tracking-widest text-electric">{title.toUpperCase()}</h1>
          </div>

          <p className="text-text-secondary text-lg font-mono leading-relaxed whitespace-pre-wrap">
            {message}
          </p>
        </div>
        
        <div className="mt-8 flex justify-center">
            <Button onClick={handleAccept} className="gradient-electric text-system-dark font-bold py-3 px-8 text-lg hover:shadow-glow transition-all duration-300 font-mono">
                [ ACCEPT ]
            </Button>
        </div>
      </SystemPanel>
    </div>
  );
}