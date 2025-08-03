import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AnimatedButton } from "@/components/ui/animated-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedInput } from "@/components/ui/animated-input";
import { AnimatedSelect } from "@/components/ui/animated-select";
import { SelectItem } from "@/components/ui/select";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Home, Heart, DollarSign, Users, Shield, Target } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { useFormAnimation, formAnimationVariants, sectionAnimationVariants, fieldGroupVariants } from '@/hooks/use-form-animation';
import { validators } from '@/lib/validation';

export default function Donate() {
  const [donationType, setDonationType] = useState('monthly');
  const [amount, setAmount] = useState('50');
  const [customAmount, setCustomAmount] = useState('');
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    isAnonymous: false,
    dedication: '',
    mailingList: true
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

  const predefinedAmounts = {
    monthly: ['50', '100', '250', '500', 'custom'],
    oneTime: ['50', '400', '1000', '2500', 'custom']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearErrors();
    
    const finalAmount = amount === 'custom' ? customAmount : amount;
    
    // Validate form
    const validationErrors: Record<string, string> = {};
    
    if (!formData.isAnonymous) {
      const firstNameValidation = validators.name(formData.firstName);
      if (!firstNameValidation.isValid) validationErrors.firstName = firstNameValidation.message!;
      
      const lastNameValidation = validators.name(formData.lastName);
      if (!lastNameValidation.isValid) validationErrors.lastName = lastNameValidation.message!;
      
      const emailValidation = validators.email(formData.email);
      if (!emailValidation.isValid) validationErrors.email = emailValidation.message!;
      
      if (formData.phone) {
        const phoneValidation = validators.phone(formData.phone);
        if (!phoneValidation.isValid) validationErrors.phone = phoneValidation.message!;
      }
    }
    
    const amountValidation = validators.donationAmount(finalAmount);
    if (!amountValidation.isValid) validationErrors.amount = amountValidation.message!;

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
      // For monthly donations, redirect to Stripe
      if (donationType === 'monthly') {
        const response = await fetch('/api/create-subscription', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            amount: finalAmount,
            frequency: 'monthly'
          }),
        });

        const result = await response.json();

        if (response.ok && result.url) {
          // Redirect to Stripe Checkout
          window.location.href = result.url;
        } else {
          throw new Error(result.message || 'Failed to create subscription');
        }
      } else {
        // Handle one-time donations through existing flow
        const response = await fetch('/api/public/donate', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            ...formData,
            amount: finalAmount,
            frequency: 'one_time'
          }),
        });

        const result = await response.json();

        if (response.ok) {
          setSuccess(true);
          alert(result.message || `Thank you for your donation of $${finalAmount}! Your submission has been received and will be processed.`);
          // Reset form
          setFormData({
            firstName: '',
            lastName: '',
            email: '',
            phone: '',
            dedication: '',
            isAnonymous: false,
            mailingList: true
          });
          setAmount('50');
          setCustomAmount('');
        } else {
          throw new Error(result.message || 'Failed to process donation');
        }
      }
    } catch (error) {
      console.error('Donation submission error:', error);
      alert('There was an error processing your donation. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-purple-50 to-green-50">
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
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Donation Form */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          {/* Impact Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">
              <span className="bg-gradient-to-r from-purple-600 to-green-600 bg-clip-text text-transparent">Support Second Chances</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8">
              Your donation directly supports <span className="font-bold text-green-700">housing stability</span>, 
              <span className="font-bold text-blue-700"> job training</span>, and 
              <span className="font-bold text-purple-700"> life transformation</span> for formerly incarcerated individuals.
            </p>
            
            {/* Impact Stats */}
            <div className="grid md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <Card className="border-0 bg-gradient-to-br from-green-100 to-green-50">
                <CardContent className="p-4 text-center">
                  <Shield className="w-8 h-8 mx-auto mb-2 text-green-600" />
                  <p className="font-bold text-2xl text-green-800">$50/month</p>
                  <p className="text-sm text-green-700">Supports stable housing</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-blue-100 to-blue-50">
                <CardContent className="p-4 text-center">
                  <Target className="w-8 h-8 mx-auto mb-2 text-blue-600" />
                  <p className="font-bold text-2xl text-blue-800">$400</p>
                  <p className="text-sm text-blue-700">Helps with job training and certification</p>
                </CardContent>
              </Card>
              <Card className="border-0 bg-gradient-to-br from-purple-100 to-purple-50">
                <CardContent className="p-4 text-center">
                  <Heart className="w-8 h-8 mx-auto mb-2 text-purple-600" />
                  <p className="font-bold text-2xl text-purple-800">$2,500</p>
                  <p className="text-sm text-purple-700">Sponsors a resident's full support</p>
                </CardContent>
              </Card>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Donation Form */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-gray-900 flex items-center">
                  <DollarSign className="w-6 h-6 mr-2 text-green-600" />
                  Make a Donation
                </CardTitle>
                <CardDescription>
                  Choose your contribution to help transform lives in Sacramento County.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <motion.form 
                  ref={formRef} 
                  onSubmit={handleSubmit} 
                  variants={formAnimationVariants}
                  initial="hidden"
                  animate="visible"
                  className="space-y-6"
                >
                  {/* Donation Type */}
                  <div>
                    <Label className="text-base font-semibold">Donation Type</Label>
                    <div className="flex gap-4 mt-2">
                      <Button
                        type="button"
                        variant={donationType === 'monthly' ? 'default' : 'outline'}
                        className={donationType === 'monthly' ? 'bg-green-600 hover:bg-green-700' : ''}
                        onClick={() => setDonationType('monthly')}
                      >
                        Monthly (Recurring)
                      </Button>
                      <Button
                        type="button"
                        variant={donationType === 'oneTime' ? 'default' : 'outline'}
                        className={donationType === 'oneTime' ? 'bg-blue-600 hover:bg-blue-700' : ''}
                        onClick={() => setDonationType('oneTime')}
                      >
                        One-Time
                      </Button>
                    </div>
                    {donationType === 'monthly' && (
                      <Badge className="mt-2 bg-green-100 text-green-800">💪 Sustained impact - the most helpful!</Badge>
                    )}
                  </div>

                  {/* Amount Selection */}
                  <div>
                    <Label className="text-base font-semibold">Amount</Label>
                    <div className="grid grid-cols-3 gap-2 mt-2">
                      {predefinedAmounts[donationType as keyof typeof predefinedAmounts].map((amt) => (
                        <Button
                          key={amt}
                          type="button"
                          variant={amount === amt ? 'default' : 'outline'}
                          className={amount === amt ? 'bg-purple-600 hover:bg-purple-700' : ''}
                          onClick={() => setAmount(amt)}
                        >
                          {amt === 'custom' ? 'Custom' : `$${amt}`}
                        </Button>
                      ))}
                    </div>
                    <AnimatePresence>
                      {amount === 'custom' && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-3"
                        >
                          <AnimatedInput
                            label="Custom Amount"
                            type="number"
                            min="1"
                            placeholder="Enter amount"
                            value={customAmount}
                            onChange={(e) => setCustomAmount(e.target.value)}
                            onValidation={validators.donationAmount}
                            {...getFieldProps('amount')}
                            required
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Donor Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Donor Information</h3>
                    
                    <motion.div 
                      variants={fieldGroupVariants}
                      className="grid md:grid-cols-2 gap-4"
                    >
                      <AnimatedInput
                        label="First Name"
                        value={formData.firstName}
                        onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                        onValidation={validators.name}
                        disabled={formData.isAnonymous}
                        required={!formData.isAnonymous}
                        {...getFieldProps('firstName')}
                      />
                      <AnimatedInput
                        label="Last Name"
                        value={formData.lastName}
                        onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                        onValidation={validators.name}
                        disabled={formData.isAnonymous}
                        required={!formData.isAnonymous}
                        {...getFieldProps('lastName')}
                      />
                    </motion.div>

                    <motion.div 
                      variants={fieldGroupVariants}
                      className="grid md:grid-cols-2 gap-4"
                    >
                      <AnimatedInput
                        label="Email Address"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        onValidation={validators.email}
                        disabled={formData.isAnonymous}
                        required={!formData.isAnonymous}
                        {...getFieldProps('email')}
                      />
                      <AnimatedInput
                        label="Phone Number"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        onValidation={validators.phone}
                        disabled={formData.isAnonymous}
                        {...getFieldProps('phone')}
                      />
                    </motion.div>

                    <AnimatedInput
                      label="Dedication (Optional)"
                      value={formData.dedication}
                      onChange={(e) => setFormData({...formData, dedication: e.target.value})}
                      placeholder="In honor of... or In memory of..."
                      disabled={formData.isAnonymous}
                    />

                    <motion.div 
                      variants={sectionAnimationVariants}
                      className="space-y-3"
                    >
                      <AnimatedCheckbox
                        id="isAnonymous"
                        checked={formData.isAnonymous}
                        onCheckedChange={(checked) => setFormData({...formData, isAnonymous: checked as boolean})}
                        label="Make this donation anonymous"
                      />

                      <AnimatedCheckbox
                        id="mailingList"
                        checked={formData.mailingList}
                        onCheckedChange={(checked) => setFormData({...formData, mailingList: checked as boolean})}
                        label="Send me updates about Life House impact"
                      />
                    </motion.div>
                  </div>

                  <AnimatedButton 
                    type="submit" 
                    className="w-full text-lg py-3 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700"
                    loading={isSubmitting}
                    success={isSuccess}
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Donate ${amount === 'custom' ? customAmount || '0' : amount} {donationType === 'monthly' ? 'Monthly' : 'Now'}
                  </AnimatedButton>
                </motion.form>
              </CardContent>
            </Card>

            {/* Impact Story */}
            <div className="space-y-6">
              <Card className="bg-gradient-to-br from-green-50 to-blue-50 border-0">
                <CardHeader>
                  <CardTitle className="text-xl text-green-800">Your Impact</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-green-600 font-bold">1</span>
                      </div>
                      <div>
                        <p className="font-semibold text-green-800">Immediate Stabilization</p>
                        <p className="text-sm text-green-700">Safe housing within 48 hours for someone fresh out of incarceration</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-blue-600 font-bold">2</span>
                      </div>
                      <div>
                        <p className="font-semibold text-blue-800">Skills & Training</p>
                        <p className="text-sm text-blue-700">Job preparation, financial literacy, and life design coaching</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3">
                      <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0">
                        <span className="text-purple-600 font-bold">3</span>
                      </div>
                      <div>
                        <p className="font-semibold text-purple-800">Long-term Success</p>
                        <p className="text-sm text-purple-700">Savings, permanent housing, and community leadership</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gradient-to-br from-yellow-50 to-orange-50">
                <CardContent className="p-6">
                  <h3 className="font-bold text-gray-900 mb-3">💡 Why Monthly Donations?</h3>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• Predictable funding helps us plan long-term programs</li>
                    <li>• Lower processing fees = more of your gift goes to residents</li>
                    <li>• Sustained support creates lasting transformation</li>
                    <li>• Cancel anytime with one click</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-0 bg-gray-900 text-white">
                <CardContent className="p-6">
                  <h3 className="font-bold mb-3">📊 Our Transparency Promise</h3>
                  <div className="space-y-2 text-sm">
                    <p><strong>85%</strong> - Direct program costs (housing, coaching, training)</p>
                    <p><strong>10%</strong> - Operations (utilities, insurance, admin)</p>
                    <p><strong>5%</strong> - Fundraising & communications</p>
                  </div>
                  <p className="text-xs text-gray-300 mt-3">
                    Life House Reentry Inc. is a 501(c)(3) nonprofit. All donations are tax-deductible.
                  </p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}