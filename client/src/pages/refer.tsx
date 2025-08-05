import { useState } from 'react';
import { motion } from 'framer-motion';
import { AnimatedButton } from "@/components/ui/animated-button";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AnimatedInput } from "@/components/ui/animated-input";
import { AnimatedTextarea } from "@/components/ui/animated-textarea";
import { AnimatedSelect } from "@/components/ui/animated-select";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AnimatedCheckbox } from "@/components/ui/animated-checkbox";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Home, Users, Phone, Mail, FileText } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "@/components/logo";
import { useFormAnimation, formAnimationVariants, sectionAnimationVariants, fieldGroupVariants } from '@/hooks/use-form-animation';
import { validators } from '@/lib/validation';

export default function Refer() {
  const [formData, setFormData] = useState({
    // Referrer Information
    referrerName: '',
    referrerTitle: '',
    organization: '',
    referrerEmail: '',
    referrerPhone: '',
    
    // Client Information
    clientName: '',
    clientEmail: '',
    clientPhone: '',
    clientDOB: '',
    releaseDate: '',
    justiceStatus: '',
    urgency: '',
    
    // Referral Details
    currentSituation: '',
    whyReferred: '',
    specialNeeds: '',
    hasConsent: false
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
    try {
      const response = await fetch('/api/public/refer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        alert(result.message || 'Referral submitted successfully! We will contact you and the client within 24 hours.');
        // Reset form
        setFormData({
          referrerName: '',
          referrerTitle: '',
          organization: '',
          referrerEmail: '',
          referrerPhone: '',
          clientName: '',
          clientEmail: '',
          clientPhone: '',
          clientDOB: '',
          releaseDate: '',
          justiceStatus: '',
          urgency: '',
          currentSituation: '',
          whyReferred: '',
          specialNeeds: '',
          hasConsent: false
        });
      } else {
        throw new Error(result.message || 'Failed to submit referral');
      }
    } catch (error) {
      console.error('Referral submission error:', error);
      alert('There was an error submitting your referral. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-green-50">
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

      {/* Referral Form */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-4xl mx-auto">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Refer a <span className="text-blue-600">Resident</span>
              </CardTitle>
              <CardDescription className="text-lg">
                Help someone start their journey with Life House Reentry. For case managers, parole officers, and community partners.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-8">
                {/* Referrer Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <Users className="w-5 h-5 mr-2 text-blue-600" />
                    Referrer Information
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="referrerName">Your Name *</Label>
                      <Input
                        id="referrerName"
                        value={formData.referrerName}
                        onChange={(e) => setFormData({...formData, referrerName: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="referrerTitle">Your Title *</Label>
                      <Input
                        id="referrerTitle"
                        value={formData.referrerTitle}
                        onChange={(e) => setFormData({...formData, referrerTitle: e.target.value})}
                        placeholder="e.g., Case Manager, Parole Officer"
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="organization">Organization *</Label>
                      <Input
                        id="organization"
                        value={formData.organization}
                        onChange={(e) => setFormData({...formData, organization: e.target.value})}
                        placeholder="e.g., CDCR, Sacramento County Probation"
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="referrerEmail">Your Email *</Label>
                      <Input
                        id="referrerEmail"
                        type="email"
                        value={formData.referrerEmail}
                        onChange={(e) => setFormData({...formData, referrerEmail: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="referrerPhone">Your Phone *</Label>
                      <Input
                        id="referrerPhone"
                        type="tel"
                        value={formData.referrerPhone}
                        onChange={(e) => setFormData({...formData, referrerPhone: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Client Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2 flex items-center">
                    <FileText className="w-5 h-5 mr-2 text-green-600" />
                    Client Information
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="clientName">Client Name *</Label>
                      <Input
                        id="clientName"
                        value={formData.clientName}
                        onChange={(e) => setFormData({...formData, clientName: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientEmail">Client Email</Label>
                      <Input
                        id="clientEmail"
                        type="email"
                        value={formData.clientEmail}
                        onChange={(e) => setFormData({...formData, clientEmail: e.target.value})}
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4">
                    <div>
                      <Label htmlFor="clientPhone">Client Phone *</Label>
                      <Input
                        id="clientPhone"
                        type="tel"
                        value={formData.clientPhone}
                        onChange={(e) => setFormData({...formData, clientPhone: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="clientDOB">Date of Birth *</Label>
                      <Input
                        id="clientDOB"
                        type="date"
                        value={formData.clientDOB}
                        onChange={(e) => setFormData({...formData, clientDOB: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="releaseDate">Release Date *</Label>
                      <Input
                        id="releaseDate"
                        type="date"
                        value={formData.releaseDate}
                        onChange={(e) => setFormData({...formData, releaseDate: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="justiceStatus">Justice System Status *</Label>
                      <Select value={formData.justiceStatus} onValueChange={(value) => setFormData({...formData, justiceStatus: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="parole">Parole</SelectItem>
                          <SelectItem value="probation">Probation</SelectItem>
                          <SelectItem value="stop">STOP Program</SelectItem>
                          <SelectItem value="ecm">Enhanced Care Management</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label htmlFor="urgency">Urgency Level *</Label>
                      <Select value={formData.urgency} onValueChange={(value) => setFormData({...formData, urgency: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select urgency" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="immediate">Immediate (homeless/unstable)</SelectItem>
                          <SelectItem value="urgent">Urgent (within 1 week)</SelectItem>
                          <SelectItem value="standard">Standard (within 2 weeks)</SelectItem>
                          <SelectItem value="planning">Planning (within 30 days)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Referral Details */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Referral Details</h3>
                  
                  <div>
                    <Label htmlFor="currentSituation">Current Housing Situation *</Label>
                    <Textarea
                      id="currentSituation"
                      value={formData.currentSituation}
                      onChange={(e) => setFormData({...formData, currentSituation: e.target.value})}
                      placeholder="Where is the client currently staying? Any immediate housing concerns?"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="whyReferred">Why are you referring this client? *</Label>
                    <Textarea
                      id="whyReferred"
                      value={formData.whyReferred}
                      onChange={(e) => setFormData({...formData, whyReferred: e.target.value})}
                      placeholder="What specific needs does this client have? Why is Life House a good fit?"
                      required
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="specialNeeds">Special Needs or Considerations</Label>
                    <Textarea
                      id="specialNeeds"
                      value={formData.specialNeeds}
                      onChange={(e) => setFormData({...formData, specialNeeds: e.target.value})}
                      placeholder="Medical conditions, disabilities, special accommodations, behavioral concerns, etc."
                      className="mt-1"
                    />
                  </div>
                </div>

                {/* Consent */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasConsent"
                      checked={formData.hasConsent}
                      onCheckedChange={(checked) => setFormData({...formData, hasConsent: checked as boolean})}
                      required
                    />
                    <Label htmlFor="hasConsent" className="text-sm">
                      I confirm that the client has given consent for this referral and understands that Life House will contact them directly. *
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-lg py-3 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800"
                  disabled={!formData.hasConsent}
                >
                  Submit Referral
                </Button>
              </form>

              <div className="mt-8 p-4 bg-green-50 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">What happens next?</h4>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• We'll review the referral within 24 hours</li>
                  <li>• Our intake team will contact the client directly</li>
                  <li>• We'll update you on the client's application status</li>
                  <li>• If accepted, we'll coordinate with you on the transition plan</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}