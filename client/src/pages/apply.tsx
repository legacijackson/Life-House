import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from "@/components/ui/animated-button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedInput } from "@/components/ui/animated-input";
import { AnimatedTextarea } from "@/components/ui/animated-textarea";
import { AnimatedSelect } from "@/components/ui/animated-select";
import { SelectItem } from "@/components/ui/select";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { Home, User, Phone, Mail, Calendar } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { useFormAnimation, formAnimationVariants, sectionAnimationVariants, fieldGroupVariants } from '@/hooks/use-form-animation';
import { validators } from '@/lib/validation';

export default function Apply() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    dateOfBirth: '',
    releaseDate: '',
    justiceStatus: '',
    emergencyContact: '',
    emergencyPhone: '',
    medicalNeeds: '',
    employmentGoals: '',
    hasChildren: false,
    agreedToTerms: false
  });

  const {
    formRef,
    isSubmitting,
    isSuccess,
    errors,
    setFieldError,
    clearErrors,
    setSubmitting,
    setSuccess,
    shakeForm,
    scrollToFirstError,
    getFieldProps,
  } = useFormAnimation();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();

    // Validate form
    const validationErrors: Record<string, string> = {};
    
    const nameValidation = validators.name(formData.name);
    if (!nameValidation.isValid) validationErrors.name = nameValidation.message!;
    
    const emailValidation = validators.email(formData.email);
    if (!emailValidation.isValid) validationErrors.email = emailValidation.message!;
    
    const phoneValidation = validators.phone(formData.phone);
    if (!phoneValidation.isValid) validationErrors.phone = phoneValidation.message!;
    
    const dobValidation = validators.dateOfBirth(formData.dateOfBirth);
    if (!dobValidation.isValid) validationErrors.dateOfBirth = dobValidation.message!;
    
    const releaseDateValidation = validators.releaseDate(formData.releaseDate);
    if (!releaseDateValidation.isValid) validationErrors.releaseDate = releaseDateValidation.message!;
    
    const justiceStatusValidation = validators.justiceStatus(formData.justiceStatus);
    if (!justiceStatusValidation.isValid) validationErrors.justiceStatus = justiceStatusValidation.message!;
    
    const emergencyContactValidation = validators.emergencyContact(formData.emergencyContact);
    if (!emergencyContactValidation.isValid) validationErrors.emergencyContact = emergencyContactValidation.message!;
    
    const emergencyPhoneValidation = validators.phone(formData.emergencyPhone);
    if (!emergencyPhoneValidation.isValid) validationErrors.emergencyPhone = emergencyPhoneValidation.message!;
    
    if (!formData.agreedToTerms) {
      validationErrors.agreedToTerms = 'You must agree to the terms and conditions';
    }

    // Set validation errors
    Object.entries(validationErrors).forEach(([field, error]) => {
      setFieldError(field, error);
    });

    if (Object.keys(validationErrors).length > 0) {
      shakeForm();
      scrollToFirstError();
      return;
    }

    setSubmitting(true);
    
    try {
      const response = await fetch('/api/public/apply', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setSuccess(true);
        alert(result.message || 'Application submitted successfully! We will contact you within 24-48 hours.');
        // Reset form
        setFormData({
          name: '',
          email: '',
          phone: '',
          dateOfBirth: '',
          releaseDate: '',
          justiceStatus: '',
          emergencyContact: '',
          emergencyPhone: '',
          medicalNeeds: '',
          employmentGoals: '',
          hasChildren: false,
          agreedToTerms: false
        });
      } else {
        throw new Error(result.message || 'Failed to submit application');
      }
    } catch (error) {
      console.error('Application submission error:', error);
      alert('There was an error submitting your application. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-blue-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
              <div className="flex items-center space-x-3 cursor-pointer">
                <Logo className="w-8 h-8" />
              </div>
            </Link>
            <Link href="/">
              <AnimatedButton variant="outline">Back to Home</AnimatedButton>
            </Link>
          </div>
        </div>
      </header>

      {/* Application Form */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
          <motion.div
            initial="hidden"
            animate="visible"
            variants={formAnimationVariants}
          >
            <Card className="shadow-xl">
              <CardHeader className="text-center">
                <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                  Apply for <span className="text-green-600">Housing</span>
                </CardTitle>
                <CardDescription className="text-lg">
                  Start your journey with Life House Reentry. We're here to help you rebuild with dignity and purpose.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  
                  <motion.div 
                    variants={fieldGroupVariants}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <AnimatedInput
                      label="Full Name"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      onValidation={validators.name}
                      {...getFieldProps('name')}
                    />
                    <AnimatedInput
                      label="Email Address"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                      onValidation={validators.email}
                      {...getFieldProps('email')}
                    />
                  </motion.div>

                  <motion.div 
                    variants={fieldGroupVariants}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <AnimatedInput
                      label="Phone Number"
                      type="tel"
                      value={formData.phone}
                      onChange={(e) => setFormData({...formData, phone: e.target.value})}
                      onValidation={validators.phone}
                      {...getFieldProps('phone')}
                    />
                    <AnimatedInput
                      label="Date of Birth"
                      type="date"
                      value={formData.dateOfBirth}
                      onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                      onValidation={validators.dateOfBirth}
                      {...getFieldProps('dateOfBirth')}
                    />
                  </motion.div>
                </div>

                {/* Justice System Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Justice System Information</h3>
                  
                  <motion.div 
                    variants={fieldGroupVariants}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <AnimatedInput
                      label="Release Date"
                      type="date"
                      value={formData.releaseDate}
                      onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                      onValidation={validators.releaseDate}
                      {...getFieldProps('releaseDate')}
                    />
                    <div className="space-y-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Current Status
                      </label>
                      <select
                        value={formData.justiceStatus}
                        onChange={(e) => setFormData({...formData, justiceStatus: e.target.value})}
                        className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="">Select your current status</option>
                        <option value="parole">Parole</option>
                        <option value="probation">Probation</option>
                        <option value="formerly_incarcerated">Formerly Incarcerated</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </motion.div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Emergency Contact</h3>
                  
                  <motion.div 
                    variants={fieldGroupVariants}
                    className="grid md:grid-cols-2 gap-4"
                  >
                    <AnimatedInput
                      label="Emergency Contact Name"
                      value={formData.emergencyContact}
                      onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                      onValidation={validators.emergencyContact}
                      {...getFieldProps('emergencyContact')}
                    />
                    <AnimatedInput
                      label="Emergency Contact Phone"
                      type="tel"
                      value={formData.emergencyPhone}
                      onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                      onValidation={validators.phone}
                      {...getFieldProps('emergencyPhone')}
                    />
                  </motion.div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
                  
                  <AnimatedTextarea
                    label="Medical or Special Needs"
                    value={formData.medicalNeeds}
                    onChange={(e) => setFormData({...formData, medicalNeeds: e.target.value})}
                    placeholder="Please describe any medical conditions, disabilities, or special accommodations needed..."
                    rows={3}
                    autoResize={true}
                    maxLength={500}
                    showCharCount={true}
                  />

                  <AnimatedTextarea
                    label="Employment Goals"
                    value={formData.employmentGoals}
                    onChange={(e) => setFormData({...formData, employmentGoals: e.target.value})}
                    placeholder="What type of work are you interested in? What are your career goals?"
                    rows={3}
                    autoResize={true}
                    maxLength={500}
                    showCharCount={true}
                  />

                  <AnimatedCheckbox
                    id="hasChildren"
                    checked={formData.hasChildren}
                    onCheckedChange={(checked) => setFormData({...formData, hasChildren: checked as boolean})}
                    label="I have children under 18"
                  />
                </div>

                {/* Terms and Conditions */}
                <motion.div 
                  variants={sectionAnimationVariants}
                  className="space-y-4"
                >
                  <AnimatedCheckbox
                    id="agreedToTerms"
                    checked={formData.agreedToTerms}
                    onCheckedChange={(checked) => setFormData({...formData, agreedToTerms: checked as boolean})}
                    label="I agree to the Life House program requirements and understand that housing is contingent on program participation and house rules compliance."
                    required={true}
                    {...getFieldProps('agreedToTerms')}
                  />
                </motion.div>

                <AnimatedButton 
                  type="submit" 
                  className="w-full text-lg py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  disabled={!formData.agreedToTerms}
                  loading={isSubmitting}
                  success={isSuccess}
                >
                  Submit Application
                </AnimatedButton>
              </form>

              <div className="mt-8 p-4 bg-blue-50 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>• We'll review your application within 24-48 hours</li>
                  <li>• Our intake coordinator will contact you for a brief interview</li>
                  <li>• If approved, we'll schedule your move-in date</li>
                  <li>• You'll receive orientation materials and program information</li>
                </ul>
              </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>
      </section>
    </div>
  );
}