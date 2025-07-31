import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Checkbox } from './checkbox';
import { Label } from './label';
import { cn } from '@/lib/utils';
import { Check } from 'lucide-react';

interface AnimatedCheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  label?: string;
  description?: string;
  error?: string;
  disabled?: boolean;
  required?: boolean;
  className?: string;
  size?: 'sm' | 'default' | 'lg';
}

export function AnimatedCheckbox({
  id,
  checked = false,
  onCheckedChange,
  label,
  description,
  error,
  disabled = false,
  required = false,
  className,
  size = 'default',
}: AnimatedCheckboxProps) {
  const handleCheckedChange = (newChecked: boolean) => {
    if (!disabled) {
      onCheckedChange?.(newChecked);
    }
  };

  const sizeClasses = {
    sm: 'w-3 h-3',
    default: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const iconSizes = {
    sm: 'w-2 h-2',
    default: 'w-3 h-3',
    lg: 'w-4 h-4',
  };

  return (
    <motion.div
      className={cn('flex items-start space-x-3', className)}
      whileHover={!disabled ? { scale: 1.02 } : {}}
      transition={{ duration: 0.1 }}
    >
      {/* Custom Checkbox */}
      <div className="flex items-center">
        <motion.div
          className={cn(
            'relative border-2 rounded cursor-pointer transition-all duration-200',
            sizeClasses[size],
            checked
              ? 'bg-blue-600 border-blue-600'
              : 'bg-white border-gray-300 hover:border-blue-400',
            error && 'border-red-500',
            disabled && 'opacity-50 cursor-not-allowed'
          )}
          onClick={() => handleCheckedChange(!checked)}
          whileTap={!disabled ? { scale: 0.9 } : {}}
          animate={{
            backgroundColor: checked ? '#2563eb' : '#ffffff',
            borderColor: error ? '#ef4444' : checked ? '#2563eb' : '#d1d5db',
          }}
          transition={{ duration: 0.2 }}
        >
          <AnimatePresence>
            {checked && (
              <motion.div
                className="absolute inset-0 flex items-center justify-center"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ duration: 0.15, ease: 'easeOut' }}
              >
                <Check className={cn('text-white', iconSizes[size])} />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Ripple effect on check */}
          {checked && (
            <motion.div
              className="absolute inset-0 rounded bg-blue-400/30"
              initial={{ scale: 0, opacity: 1 }}
              animate={{ scale: 2, opacity: 0 }}
              transition={{ duration: 0.4 }}
            />
          )}
        </motion.div>

        {/* Hidden native checkbox for accessibility */}
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={handleCheckedChange}
          disabled={disabled}
          className="sr-only"
        />
      </div>

      {/* Label and Description */}
      {(label || description) && (
        <div className="flex-1">
          {label && (
            <motion.div
              animate={{
                color: error ? '#ef4444' : '#374151',
              }}
              transition={{ duration: 0.2 }}
            >
              <Label
                htmlFor={id}
                className={cn(
                  'cursor-pointer transition-colors duration-200',
                  disabled && 'cursor-not-allowed opacity-50',
                  error && 'text-red-500'
                )}
                onClick={() => !disabled && handleCheckedChange(!checked)}
              >
                {label}
                {required && <span className="text-red-500 ml-1">*</span>}
              </Label>
            </motion.div>
          )}

          {description && (
            <motion.p
              className={cn(
                'text-sm text-gray-500 mt-1',
                disabled && 'opacity-50'
              )}
              animate={{
                opacity: disabled ? 0.5 : 1,
              }}
              transition={{ duration: 0.2 }}
            >
              {description}
            </motion.p>
          )}

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.p
                initial={{ opacity: 0, y: -5, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -5, height: 0 }}
                transition={{ duration: 0.2 }}
                className="text-sm text-red-500 mt-1"
              >
                {error}
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      )}
    </motion.div>
  );
}