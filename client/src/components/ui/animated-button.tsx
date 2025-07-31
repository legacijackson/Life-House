import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from './button';
import { cn } from '@/lib/utils';
import { Loader2, Check } from 'lucide-react';

interface AnimatedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  loading?: boolean;
  success?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function AnimatedButton({
  variant = 'default',
  size = 'default',
  loading = false,
  success = false,
  children,
  className,
  disabled,
  ...props
}: AnimatedButtonProps) {
  const isDisabled = disabled || loading;

  return (
    <motion.div
      whileHover={!isDisabled ? { scale: 1.02 } : {}}
      whileTap={!isDisabled ? { scale: 0.98 } : {}}
      transition={{ duration: 0.1 }}
    >
      <Button
        variant={variant}
        size={size}
        disabled={isDisabled}
        className={cn(
          'relative overflow-hidden transition-all duration-200',
          success && 'bg-green-600 hover:bg-green-700 border-green-600',
          className
        )}
        {...props}
      >
        {/* Background pulse animation for loading */}
        {loading && (
          <motion.div
            className="absolute inset-0 bg-white/20"
            animate={{
              opacity: [0.5, 0.2, 0.5],
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: 'easeInOut',
            }}
          />
        )}

        {/* Content with animations */}
        <div className="flex items-center space-x-2">
          <AnimatePresence mode="wait">
            {loading && (
              <motion.div
                key="loading"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Loader2 className="w-4 h-4 animate-spin" />
              </motion.div>
            )}
            {success && !loading && (
              <motion.div
                key="success"
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-4 h-4" />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.span
            animate={{
              opacity: loading ? 0.7 : 1,
            }}
            transition={{ duration: 0.2 }}
          >
            {children}
          </motion.span>
        </div>

        {/* Success ripple effect */}
        {success && (
          <motion.div
            className="absolute inset-0 bg-green-400/30 rounded"
            initial={{ scale: 0, opacity: 1 }}
            animate={{ scale: 2, opacity: 0 }}
            transition={{ duration: 0.6 }}
          />
        )}
      </Button>
    </motion.div>
  );
}