import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Home, Heart, DollarSign, Users, Shield, Target } from "lucide-react";
import { Link } from "wouter";
import { Logo } from "@/components/logo";

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

  const predefinedAmounts = {
    monthly: ['50', '100', '250', '500', 'custom'],
    oneTime: ['50', '400', '1000', '2500', 'custom']
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const finalAmount = amount === 'custom' ? customAmount : amount;
    
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
          alert(`Thank you for your donation of $${finalAmount}! Your submission has been received and will be processed.`);
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
                <Logo variant="color" layout="icon" className="w-8 h-8" />
                <span className="text-xl font-bold text-gray-900">Life House Reentry</span>
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
                <form onSubmit={handleSubmit} className="space-y-6">
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
                    {amount === 'custom' && (
                      <div className="mt-3">
                        <Label htmlFor="customAmount">Custom Amount</Label>
                        <Input
                          id="customAmount"
                          type="number"
                          min="1"
                          placeholder="Enter amount"
                          value={customAmount}
                          onChange={(e) => setCustomAmount(e.target.value)}
                          className="mt-1"
                          required
                        />
                      </div>
                    )}
                  </div>

                  {/* Donor Information */}
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">Donor Information</h3>
                    
                    <div className="grid md:grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="firstName">First Name *</Label>
                        <Input
                          id="firstName"
                          value={formData.firstName}
                          onChange={(e) => setFormData({...formData, firstName: e.target.value})}
                          required={!formData.isAnonymous}
                          disabled={formData.isAnonymous}
                          className="mt-1"
                        />
                      </div>
                      <div>
                        <Label htmlFor="lastName">Last Name *</Label>
                        <Input
                          id="lastName"
                          value={formData.lastName}
                          onChange={(e) => setFormData({...formData, lastName: e.target.value})}
                          required={!formData.isAnonymous}
                          disabled={formData.isAnonymous}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-4">
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
                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          value={formData.phone}
                          onChange={(e) => setFormData({...formData, phone: e.target.value})}
                          className="mt-1"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="dedication">Dedication (Optional)</Label>
                      <Input
                        id="dedication"
                        value={formData.dedication}
                        onChange={(e) => setFormData({...formData, dedication: e.target.value})}
                        placeholder="In honor of... or In memory of..."
                        className="mt-1"
                      />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="isAnonymous"
                          checked={formData.isAnonymous}
                          onCheckedChange={(checked) => setFormData({...formData, isAnonymous: checked as boolean})}
                        />
                        <Label htmlFor="isAnonymous">Make this donation anonymous</Label>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="mailingList"
                          checked={formData.mailingList}
                          onCheckedChange={(checked) => setFormData({...formData, mailingList: checked as boolean})}
                        />
                        <Label htmlFor="mailingList">Send me updates about Life House impact</Label>
                      </div>
                    </div>
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full text-lg py-3 bg-gradient-to-r from-purple-600 to-green-600 hover:from-purple-700 hover:to-green-700"
                  >
                    <Heart className="w-5 h-5 mr-2" />
                    Donate ${amount === 'custom' ? customAmount || '0' : amount} {donationType === 'monthly' ? 'Monthly' : 'Now'}
                  </Button>
                </form>
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