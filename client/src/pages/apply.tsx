import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Home, User, Phone, Mail, Calendar } from "lucide-react";
import { Link } from "wouter";

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
        alert('Application submitted successfully! We will contact you within 24-48 hours.');
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
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#2E6F40' }}>
                  <Home className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold text-gray-900">Life House Reentry</span>
              </div>
            </Link>
            <Link href="/">
              <Button variant="outline">Back to Home</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Application Form */}
      <section className="container mx-auto px-4 py-12">
        <div className="max-w-3xl mx-auto">
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
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Personal Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({...formData, name: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({...formData, email: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="phone">Phone Number *</Label>
                      <Input
                        id="phone"
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({...formData, phone: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                      <Input
                        id="dateOfBirth"
                        type="date"
                        value={formData.dateOfBirth}
                        onChange={(e) => setFormData({...formData, dateOfBirth: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Justice System Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Justice System Information</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
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
                    <div>
                      <Label htmlFor="justiceStatus">Current Status *</Label>
                      <Select value={formData.justiceStatus} onValueChange={(value) => setFormData({...formData, justiceStatus: value})}>
                        <SelectTrigger className="mt-1">
                          <SelectValue placeholder="Select your current status" />
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
                  </div>
                </div>

                {/* Emergency Contact */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Emergency Contact</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="emergencyContact">Emergency Contact Name *</Label>
                      <Input
                        id="emergencyContact"
                        value={formData.emergencyContact}
                        onChange={(e) => setFormData({...formData, emergencyContact: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                    <div>
                      <Label htmlFor="emergencyPhone">Emergency Contact Phone *</Label>
                      <Input
                        id="emergencyPhone"
                        type="tel"
                        value={formData.emergencyPhone}
                        onChange={(e) => setFormData({...formData, emergencyPhone: e.target.value})}
                        required
                        className="mt-1"
                      />
                    </div>
                  </div>
                </div>

                {/* Additional Information */}
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-gray-900 border-b pb-2">Additional Information</h3>
                  
                  <div>
                    <Label htmlFor="medicalNeeds">Medical or Special Needs</Label>
                    <Textarea
                      id="medicalNeeds"
                      value={formData.medicalNeeds}
                      onChange={(e) => setFormData({...formData, medicalNeeds: e.target.value})}
                      placeholder="Please describe any medical conditions, disabilities, or special accommodations needed..."
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label htmlFor="employmentGoals">Employment Goals</Label>
                    <Textarea
                      id="employmentGoals"
                      value={formData.employmentGoals}
                      onChange={(e) => setFormData({...formData, employmentGoals: e.target.value})}
                      placeholder="What type of work are you interested in? What are your career goals?"
                      className="mt-1"
                    />
                  </div>

                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="hasChildren"
                      checked={formData.hasChildren}
                      onCheckedChange={(checked) => setFormData({...formData, hasChildren: checked as boolean})}
                    />
                    <Label htmlFor="hasChildren">I have children under 18</Label>
                  </div>
                </div>

                {/* Terms and Conditions */}
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="agreedToTerms"
                      checked={formData.agreedToTerms}
                      onCheckedChange={(checked) => setFormData({...formData, agreedToTerms: checked as boolean})}
                      required
                    />
                    <Label htmlFor="agreedToTerms" className="text-sm">
                      I agree to the Life House program requirements and understand that housing is contingent on program participation and house rules compliance. *
                    </Label>
                  </div>
                </div>

                <Button 
                  type="submit" 
                  className="w-full text-lg py-3 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800"
                  disabled={!formData.agreedToTerms}
                >
                  Submit Application
                </Button>
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
        </div>
      </section>
    </div>
  );
}