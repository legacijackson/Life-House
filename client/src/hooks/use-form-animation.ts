import { useState, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';

interface FormAnimationState {
  isSubmitting: boolean;
  isSuccess: boolean;
  errors: Record<string, string>;
  fieldStates: Record<string, 'idle' | 'validating' | 'valid' | 'error'>;
}

export function useFormAnimation() {
  const [state, setState] = useState<FormAnimationState>({
    isSubmitting: false,
    isSuccess: false,
    errors: {},
    fieldStates: {},
  });

  const formRef = useRef<HTMLFormElement>(null);

  // Field validation state management
  const setFieldState = useCallback((fieldName: string, state: 'idle' | 'validating' | 'valid' | 'error') => {
    setState(prev => ({
      ...prev,
      fieldStates: {
        ...prev.fieldStates,
        [fieldName]: state,
      },
    }));
  }, []);

  const setFieldError = useCallback((fieldName: string, error?: string) => {
    setState(prev => ({
      ...prev,
      errors: {
        ...prev.errors,
        [fieldName]: error || '',
      },
      fieldStates: {
        ...prev.fieldStates,
        [fieldName]: error ? 'error' : 'valid',
      },
    }));
  }, []);

  const clearErrors = useCallback(() => {
    setState(prev => ({
      ...prev,
      errors: {},
      fieldStates: {},
    }));
  }, []);

  // Form submission states
  const setSubmitting = useCallback((submitting: boolean) => {
    setState(prev => ({
      ...prev,
      isSubmitting: submitting,
      isSuccess: false,
    }));
  }, []);

  const setSuccess = useCallback((success: boolean) => {
    setState(prev => ({
      ...prev,
      isSuccess: success,
      isSubmitting: false,
    }));

    if (success) {
      // Trigger success animation
      setTimeout(() => {
        setState(prev => ({ ...prev, isSuccess: false }));
      }, 3000);
    }
  }, []);

  // Form shake animation for errors
  const shakeForm = useCallback(() => {
    if (formRef.current) {
      formRef.current.style.animation = 'shake 0.5s ease-in-out';
      setTimeout(() => {
        if (formRef.current) {
          formRef.current.style.animation = '';
        }
      }, 500);
    }
  }, []);

  // Scroll to first error
  const scrollToFirstError = useCallback(() => {
    const firstErrorField = Object.keys(state.errors)[0];
    if (firstErrorField) {
      const element = document.querySelector(`[name="${firstErrorField}"]`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    }
  }, [state.errors]);

  // Get field props for animated components
  const getFieldProps = useCallback((fieldName: string) => {
    return {
      error: state.errors[fieldName],
      success: state.fieldStates[fieldName] === 'valid',
    };
  }, [state.errors, state.fieldStates]);

  return {
    formRef,
    isSubmitting: state.isSubmitting,
    isSuccess: state.isSuccess,
    errors: state.errors,
    fieldStates: state.fieldStates,
    setFieldState,
    setFieldError,
    clearErrors,
    setSubmitting,
    setSuccess,
    shakeForm,
    scrollToFirstError,
    getFieldProps,
  };
}

// Animation variants for form containers
export const formAnimationVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { 
      duration: 0.5,
      staggerChildren: 0.1,
    },
  },
  exit: { 
    opacity: 0, 
    y: -20,
    transition: { duration: 0.3 },
  },
};

// Animation variants for form sections
export const sectionAnimationVariants = {
  hidden: { opacity: 0, x: -20 },
  visible: { 
    opacity: 1, 
    x: 0,
    transition: { duration: 0.3 },
  },
};

// Animation variants for field groups
export const fieldGroupVariants = {
  hidden: { opacity: 0 },
  visible: { 
    opacity: 1,
    transition: { 
      staggerChildren: 0.05,
    },
  },
};

// Animation variants for individual fields
export const fieldVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { 
    opacity: 1, 
    y: 0,
    transition: { duration: 0.2 },
  },
};

// Success animation
export const successVariants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { 
    scale: 1, 
    opacity: 1,
    transition: { 
      type: 'spring',
      stiffness: 300,
      damping: 20,
    },
  },
};

// CSS for shake animation
export const shakeAnimation = `
  @keyframes shake {
    0%, 100% { transform: translateX(0); }
    10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
    20%, 40%, 60%, 80% { transform: translateX(5px); }
  }
`;