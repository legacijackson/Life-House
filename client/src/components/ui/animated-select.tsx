import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, ChevronDown } from 'lucide-react';

interface AnimatedSelectProps {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  placeholder?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
  className?: string;
  required?: boolean;
}

export function AnimatedSelect({
  label,
  error,
  success,
  helperText,
  placeholder,
  value,
  onValueChange,
  children,
  className,
  required = false,
}: AnimatedSelectProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const hasValue = !!value;

  const handleValueChange = (newValue: string) => {
    onValueChange?.(newValue);
  };

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    setIsFocused(open);
  };

  return (
    <div className="relative">
      {/* Label */}
      {label && (
        <motion.div
          className="relative"
          initial={false}
          animate={{
            scale: isFocused || hasValue ? 0.85 : 1,
            y: isFocused || hasValue ? -20 : 0,
            color: isFocused ? 'rgb(59 130 246)' : error ? 'rgb(239 68 68)' : 'rgb(107 114 128)',
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            transformOrigin: 'left center',
            position: isFocused || hasValue ? 'absolute' : 'relative',
            pointerEvents: 'none',
            zIndex: 10,
          }}
        >
          <Label
            className={cn(
              'font-medium transition-colors duration-200',
              isFocused && 'text-blue-500',
              error && 'text-red-500'
            )}
          >
            {label}
            {required && <span className="text-red-500 ml-1">*</span>}
          </Label>
        </motion.div>
      )}

      {/* Select Container */}
      <div className="relative">
        <motion.div
          initial={false}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Select value={value} onValueChange={handleValueChange} onOpenChange={handleOpenChange}>
            <SelectTrigger
              className={cn(
                'transition-all duration-200 pr-10',
                isFocused && 'ring-2 ring-blue-500 border-blue-500 shadow-lg',
                error && 'border-red-500 focus:ring-red-500',
                success && 'border-green-500 focus:ring-green-500',
                className
              )}
            >
              <SelectValue placeholder={placeholder} />
              
              {/* Custom chevron with animation */}
              <motion.div
                className="absolute right-3 top-1/2 -translate-y-1/2"
                animate={{ rotate: isOpen ? 180 : 0 }}
                transition={{ duration: 0.2 }}
              >
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </motion.div>
            </SelectTrigger>
            
            <AnimatePresence>
              {isOpen && (
                <SelectContent asChild>
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {children}
                  </motion.div>
                </SelectContent>
              )}
            </AnimatePresence>
          </Select>
        </motion.div>

        {/* Status Icons */}
        <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          <AnimatePresence mode="wait">
            {success && (
              <motion.div
                key="success"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <Check className="w-4 h-4 text-green-500" />
              </motion.div>
            )}
            {error && (
              <motion.div
                key="error"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
              >
                <AlertCircle className="w-4 h-4 text-red-500" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Helper Text / Error Message */}
      <AnimatePresence>
        {(error || helperText) && (
          <motion.div
            initial={{ opacity: 0, y: -5, height: 0 }}
            animate={{ opacity: 1, y: 0, height: 'auto' }}
            exit={{ opacity: 0, y: -5, height: 0 }}
            transition={{ duration: 0.2 }}
            className="mt-1"
          >
            <p
              className={cn(
                'text-sm transition-colors duration-200',
                error ? 'text-red-500' : success ? 'text-green-500' : 'text-gray-500'
              )}
            >
              {error || helperText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}