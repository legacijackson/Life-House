import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Check, Circle } from 'lucide-react';

interface FormStepIndicatorProps {
  steps: string[];
  currentStep: number;
  completedSteps?: number[];
  className?: string;
}

export function FormStepIndicator({
  steps,
  currentStep,
  completedSteps = [],
  className,
}: FormStepIndicatorProps) {
  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-center justify-between">
        {steps.map((step, index) => {
          const stepNumber = index + 1;
          const isCompleted = completedSteps.includes(stepNumber);
          const isCurrent = stepNumber === currentStep;
          const isUpcoming = stepNumber > currentStep;

          return (
            <div key={index} className="flex items-center flex-1">
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center relative',
                    'border-2 transition-all duration-300',
                    isCompleted && 'bg-green-600 border-green-600',
                    isCurrent && 'bg-blue-600 border-blue-600',
                    isUpcoming && 'bg-gray-100 border-gray-300'
                  )}
                  initial={false}
                  animate={{
                    scale: isCurrent ? 1.1 : 1,
                    backgroundColor: isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#f3f4f6',
                    borderColor: isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#d1d5db',
                  }}
                  transition={{ duration: 0.3, ease: 'easeOut' }}
                >
                  {/* Step Content */}
                  {isCompleted ? (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{ duration: 0.2, delay: 0.1 }}
                    >
                      <Check className="w-5 h-5 text-white" />
                    </motion.div>
                  ) : (
                    <motion.span
                      className={cn(
                        'text-sm font-semibold',
                        isCurrent ? 'text-white' : 'text-gray-600'
                      )}
                      animate={{
                        color: isCurrent ? '#ffffff' : '#4b5563',
                      }}
                      transition={{ duration: 0.2 }}
                    >
                      {stepNumber}
                    </motion.span>
                  )}

                  {/* Pulse animation for current step */}
                  {isCurrent && (
                    <motion.div
                      className="absolute inset-0 rounded-full border-2 border-blue-400"
                      animate={{
                        scale: [1, 1.2, 1],
                        opacity: [1, 0.5, 1],
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: 'easeInOut',
                      }}
                    />
                  )}
                </motion.div>

                {/* Step Label */}
                <motion.span
                  className={cn(
                    'text-xs font-medium mt-2 text-center max-w-20',
                    isCompleted && 'text-green-600',
                    isCurrent && 'text-blue-600',
                    isUpcoming && 'text-gray-500'
                  )}
                  animate={{
                    color: isCompleted ? '#16a34a' : isCurrent ? '#2563eb' : '#6b7280',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  {step}
                </motion.span>
              </div>

              {/* Progress Line */}
              {index < steps.length - 1 && (
                <div className="flex-1 h-0.5 mx-4 bg-gray-200 relative overflow-hidden">
                  <motion.div
                    className="h-full bg-green-600"
                    initial={{ width: '0%' }}
                    animate={{
                      width: isCompleted || (isCurrent && index < currentStep - 1) ? '100%' : '0%',
                    }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Progress Bar at Bottom */}
      <div className="mt-6 w-full bg-gray-200 rounded-full h-1 overflow-hidden">
        <motion.div
          className="h-full bg-gradient-to-r from-blue-600 to-green-600"
          initial={{ width: '0%' }}
          animate={{
            width: `${((currentStep - 1) / (steps.length - 1)) * 100}%`,
          }}
          transition={{ duration: 0.5, ease: 'easeOut' }}
        />
      </div>
    </div>
  );
}