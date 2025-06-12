import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SystemPanelProps {
  children: React.ReactNode;
  className?: string;
}

export function SystemPanel({ children, className }: SystemPanelProps) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.98, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      className={cn("system-panel-frame", className)}
    >
      <div className="system-panel-content">
        {children}
      </div>
    </motion.div>
  );
}