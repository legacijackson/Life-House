import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Textarea } from './textarea';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Check, AlertCircle } from 'lucide-react';

interface AnimatedTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  maxLength?: number;
  showCharCount?: boolean;
  autoResize?: boolean;
}

export function AnimatedTextarea({
  label,
  error,
  success,
  helperText,
  maxLength,
  showCharCount = false,
  autoResize = false,
  className,
  ...props
}: AnimatedTextareaProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [charCount, setCharCount] = useState(0);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (textareaRef.current) {
      setHasValue(!!textareaRef.current.value);
      setCharCount(textareaRef.current.value.length);
    }
  }, [props.value, props.defaultValue]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLTextAreaElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setHasValue(!!e.target.value);
    setCharCount(e.target.value.length);
    
    // Auto-resize functionality
    if (autoResize && textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${textareaRef.current.scrollHeight}px`;
    }
    
    props.onChange?.(e);
  };

  const isNearLimit = maxLength && charCount > maxLength * 0.8;
  const isOverLimit = maxLength && charCount > maxLength;

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
          </Label>
        </motion.div>
      )}

      {/* Textarea Container */}
      <div className="relative">
        <motion.div
          initial={false}
          animate={{
            scale: isFocused ? 1.01 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Textarea
            ref={textareaRef}
            className={cn(
              'transition-all duration-200 pr-10 resize-none',
              isFocused && 'ring-2 ring-blue-500 border-blue-500 shadow-lg',
              error && 'border-red-500 focus:ring-red-500',
              success && 'border-green-500 focus:ring-green-500',
              autoResize && 'overflow-hidden',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            maxLength={maxLength}
            {...props}
          />
        </motion.div>

        {/* Status Icons */}
        <div className="absolute right-3 top-3 flex items-center space-x-1">
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

      {/* Character Count and Helper Text */}
      <div className="flex justify-between items-start mt-1">
        <AnimatePresence>
          {(error || helperText) && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -5 }}
              transition={{ duration: 0.2 }}
              className="flex-1"
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

        {/* Character Counter */}
        {showCharCount && maxLength && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: isFocused || hasValue ? 1 : 0.5 }}
            transition={{ duration: 0.2 }}
            className="ml-2"
          >
            <span
              className={cn(
                'text-xs font-medium transition-colors duration-200',
                isOverLimit ? 'text-red-500' : isNearLimit ? 'text-yellow-500' : 'text-gray-400'
              )}
            >
              {charCount}/{maxLength}
            </span>
          </motion.div>
        )}
      </div>

      {/* Character limit warning animation */}
      <AnimatePresence>
        {isOverLimit && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="absolute inset-0 border-2 border-red-400 rounded pointer-events-none"
            style={{
              animation: 'pulse 2s infinite',
            }}
          />
        )}
      </AnimatePresence>
    </div>
  );
}