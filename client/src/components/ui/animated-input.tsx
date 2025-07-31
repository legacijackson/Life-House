import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from './input';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Check, AlertCircle, Eye, EyeOff } from 'lucide-react';

interface AnimatedInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  success?: boolean;
  helperText?: string;
  showPasswordToggle?: boolean;
  onValidation?: (value: string) => { isValid: boolean; message?: string };
}

export function AnimatedInput({
  label,
  error,
  success,
  helperText,
  showPasswordToggle = false,
  onValidation,
  className,
  type: initialType = 'text',
  ...props
}: AnimatedInputProps) {
  const [isFocused, setIsFocused] = useState(false);
  const [hasValue, setHasValue] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [validationState, setValidationState] = useState<{
    isValid: boolean;
    message?: string;
  } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const type = showPasswordToggle && showPassword ? 'text' : initialType;
  const isPassword = initialType === 'password';

  useEffect(() => {
    if (inputRef.current) {
      setHasValue(!!inputRef.current.value);
    }
  }, [props.value, props.defaultValue]);

  const handleFocus = () => {
    setIsFocused(true);
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    setIsFocused(false);
    setHasValue(!!e.target.value);
    
    if (onValidation && e.target.value) {
      const result = onValidation(e.target.value);
      setValidationState(result);
    }
    
    props.onBlur?.(e);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setHasValue(!!e.target.value);
    
    // Clear validation state on input change
    if (validationState) {
      setValidationState(null);
    }
    
    props.onChange?.(e);
  };

  const isSuccess = success || validationState?.isValid;
  const errorMessage = error || (validationState && !validationState.isValid ? validationState.message : undefined);

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
            color: isFocused ? 'rgb(59 130 246)' : errorMessage ? 'rgb(239 68 68)' : 'rgb(107 114 128)',
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
              errorMessage && 'text-red-500'
            )}
          >
            {label}
          </Label>
        </motion.div>
      )}

      {/* Input Container */}
      <div className="relative">
        <motion.div
          initial={false}
          animate={{
            scale: isFocused ? 1.02 : 1,
          }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
        >
          <Input
            ref={inputRef}
            type={type}
            className={cn(
              'transition-all duration-200 pr-10',
              isFocused && 'ring-2 ring-blue-500 border-blue-500 shadow-lg',
              errorMessage && 'border-red-500 focus:ring-red-500',
              isSuccess && 'border-green-500 focus:ring-green-500',
              className
            )}
            onFocus={handleFocus}
            onBlur={handleBlur}
            onChange={handleChange}
            {...props}
          />
        </motion.div>

        {/* Icons */}
        <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1">
          <AnimatePresence mode="wait">
            {isSuccess && (
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
            {errorMessage && (
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

          {showPasswordToggle && isPassword && (
            <motion.button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="text-gray-400 hover:text-gray-600 transition-colors"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              {showPassword ? (
                <EyeOff className="w-4 h-4" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </motion.button>
          )}
        </div>
      </div>

      {/* Helper Text / Error Message */}
      <AnimatePresence>
        {(errorMessage || helperText || validationState?.message) && (
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
                errorMessage ? 'text-red-500' : isSuccess ? 'text-green-500' : 'text-gray-500'
              )}
            >
              {errorMessage || validationState?.message || helperText}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}