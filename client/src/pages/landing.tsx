import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { UnifiedIntakeModal } from "@/components/unified-intake-modal";
import { Logo } from "@/components/logo";
import { PortalLoginModal } from "@/components/portal-login-modal";
import { ProgramInquiryModal } from "@/components/program-inquiry-modal";
import { PartnerSignupModal } from "@/components/partner-signup-modal";
import { Home, Users, Target, Heart, FileText, Phone, TrendingUp, Shield, DollarSign, Clock } from "lucide-react";

export default function Landing() {
  const [isIntakeModalOpen, setIsIntakeModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [isInquiryModalOpen, setIsInquiryModalOpen] = useState(false);
  const [isPartnerModalOpen, setIsPartnerModalOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-cream-50" style={{ background: 'linear-gradient(to bottom, #f0fdf4, #fffaeb)' }}>
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center">
            <Logo className="h-12" />
          </div>
          <div className="flex items-center space-x-6">
            <a href="#about" className="text-gray-600 hover:text-green-700">About</a>
            <a href="#programs" className="text-gray-600 hover:text-green-700">Programs</a>
            <a href="#contact" className="text-gray-600 hover:text-green-700">Contact</a>
            <Button 
              variant="outline" 
              onClick={() => setIsSignupModalOpen(true)} 
              className="border-green-600 text-green-600 hover:bg-green-50"
              data-testid="staff-login-button"
            >
              Portal Login
            </Button>
          </div>
        </nav>
      </header>
      {/* Hero Section */}
      <section id="about" className="container mx-auto px-4 py-20">
        <div className="grid lg:grid-cols-2 gap-16 items-center grid-rows-[auto_minmax(0,1fr)]">
          <div className="text-left">
            <Badge className="mb-6 bg-gradient-to-r from-green-100 to-blue-100 text-green-800 border-0 px-4 py-2 text-sm font-semibold">
              ✨ 7-Stage Reentry Program
            </Badge>
            <h1 className="text-5xl lg:text-6xl font-bold mb-6 leading-tight">
              <span className="bg-gradient-to-r from-gray-900 to-gray-700 bg-clip-text text-transparent">Home, for</span><br />
              <span className="bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent">Good.</span><br />
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent text-4xl">Life House</span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 leading-relaxed font-medium">
              Safe, structured housing and <span className="font-bold text-green-700">life-design support</span> for people returning from incarceration — 
              so they can rebuild with <span className="font-bold text-blue-700">dignity, purpose</span>, and a path to <span className="font-bold text-purple-700">financial independence</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 mb-8">
              <Button 
                size="lg" 
                className="text-lg px-8 py-4 bg-gradient-to-r from-green-600 to-green-700 hover:from-green-700 hover:to-green-800 shadow-lg transform hover:scale-105 transition-all duration-200"
                onClick={() => setIsIntakeModalOpen(true)}
              >
                <Home className="w-5 h-5 mr-2" />
                Apply Now
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 border-2 border-green-600 text-green-700 hover:bg-green-50 shadow-md transform hover:scale-105 transition-all duration-200"
                onClick={() => window.location.href = '/refer'}
              >
                <Users className="w-5 h-5 mr-2" />
                Refer a Resident
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="text-lg px-8 py-4 border-2 border-purple-600 text-purple-700 hover:bg-purple-50 shadow-md transform hover:scale-105 transition-all duration-200"
                onClick={() => window.location.href = '/donate'}
              >
                <DollarSign className="w-5 h-5 mr-2" />
                Donate Monthly
              </Button>
            </div>
            
            {/* Trust Bar */}
            <div className="bg-gradient-to-r from-green-50 to-blue-50 backdrop-blur-sm rounded-xl p-6 border border-green-100">
              <p className="text-sm text-gray-700 mb-2 font-bold">🤝 Partner-aligned with public and community programs:</p>
              <p className="text-sm text-gray-600 font-medium">STOP (CDCR) • CalAIM Community Supports • Enhanced Care Management (ECM) • Local reentry and workforce agencies</p>
            </div>
          </div>
          
          <div className="relative">
            <div className="w-full h-[500px] rounded-2xl overflow-hidden shadow-2xl transform hover:scale-105 transition-transform duration-300">
              <img 
                src="https://images.pexels.com/photos/745045/pexels-photo-745045.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Diverse family celebrating together outdoors, representing hope, community, and second chances"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-6 -right-6 bg-white p-6 rounded-xl shadow-xl border-l-4 border-green-500">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 rounded-full flex items-center justify-center bg-gradient-to-r from-green-500 to-green-600">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900 text-xl">90% Success Rate</p>
                  <p className="text-sm text-gray-600 font-medium">Housing stabilization within 48 hours</p>
                </div>
              </div>
            </div>
            <div className="absolute -top-6 -left-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl shadow-xl">
              <p className="font-bold text-lg">💪 Real Stories. Real Change.</p>
            </div>
          </div>
        </div>
      </section>
      {/* What We Do Cards */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-4xl font-bold text-center text-gray-900 mb-4">
          <span className="bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">What We Do</span>
        </h2>
        <p className="text-center text-gray-600 mb-12 text-lg">Three pillars of transformation that create lasting change</p>
        <div className="grid md:grid-cols-3 gap-8">
          <Card className="border-0 shadow-xl bg-gradient-to-br from-green-50 to-green-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-green-500 to-green-600 flex items-center justify-center">
                <Shield className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-green-800 font-bold">🏠 Stabilize</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Safe, structured, non-clinical transitional housing with clear house rules and <span className="font-bold text-green-700">24/7 support culture</span>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-center"><span className="text-green-600 mr-2">✓</span> Secure transitional housing (2 per room)</li>
                <li className="flex items-center"><span className="text-green-600 mr-2">✓</span> 24/7 supportive community culture</li>
                <li className="flex items-center"><span className="text-green-600 mr-2">✓</span> Clear expectations and structure</li>
                <li className="flex items-center"><span className="text-green-600 mr-2">✓</span> <span className="font-bold">Immediate stabilization within 48 hours</span></li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-50 to-blue-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center">
                <Target className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-blue-800 font-bold">📚 Skill Up</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Life design, financial literacy, credit repair, <span className="font-bold text-blue-700">career training</span>, and coaching.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Weekly workshops + biweekly coaching</li>
                <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> <span className="font-bold">Financial literacy & credit repair</span></li>
                <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Career preparation & placement</li>
                <li className="flex items-center"><span className="text-blue-600 mr-2">✓</span> Life design & identity work</li>
              </ul>
            </CardContent>
          </Card>

          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-purple-100 hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r from-purple-500 to-purple-600 flex items-center justify-center">
                <TrendingUp className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-purple-800 font-bold">🚀 Move Forward</CardTitle>
              <CardDescription className="text-gray-700 font-medium">
                Income-based program contributions, <span className="font-bold text-purple-700">savings & brokerage structure</span>, and a housing exit plan.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3 text-sm text-gray-700">
                <li className="flex items-center"><span className="text-purple-600 mr-2">✓</span> Income-based contributions (30% max)</li>
                <li className="flex items-center"><span className="text-purple-600 mr-2">✓</span> <span className="font-bold">25% saved, 5% brokerage investment</span></li>
                <li className="flex items-center"><span className="text-purple-600 mr-2">✓</span> Permanent housing transition plan</li>
                <li className="flex items-center"><span className="text-purple-600 mr-2">✓</span> Savings returned at program exit</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* 7-Stage Program Overview */}
      <section id="programs" className="py-16" style={{ backgroundColor: '#fffaeb' }}>
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4 text-gray-900">Our 7-Stage Resident Transformation</h2>
          <p className="text-center text-gray-600 mb-12 max-w-3xl mx-auto">
            Our evidence-informed approach meets people where they are and moves them toward income, savings, and permanent housing.
          </p>
          <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { stage: 1, title: "Intake", desc: "Stabilization, orientation, paperwork, benefits, ID, immediate needs", color: "bg-red-100 text-red-800" },
              { stage: 2, title: "Design", desc: "Life design, values, goals, spiritual grounding", color: "bg-orange-100 text-orange-800" },
              { stage: 3, title: "Training", desc: "Financial literacy, credit repair, credentials, accelerated programs", color: "bg-yellow-100 text-yellow-800" },
              { stage: 4, title: "Working", desc: "Sustainable income; resident contributes up to 30% (25% saved, 5% brokerage)", color: "bg-green-100 text-green-800" },
              { stage: 5, title: "Overflow", desc: "Income grows; above-cap contributions support program; peer mentoring starts", color: "bg-blue-100 text-blue-800" },
              { stage: 6, title: "Transition", desc: "Permanent rental or first-home purchase with savings returned", color: "bg-indigo-100 text-indigo-800" },
              { stage: 7, title: "Legacy", desc: "Alumni coaching, mentorship, community leadership", color: "bg-purple-100 text-purple-800" }
            ].map((stage) => (
              <Card key={stage.stage} className="text-center hover:shadow-md transition-shadow">
                <CardHeader className="p-4">
                  <Badge className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${stage.color} font-semibold`}>
                    {stage.stage}
                  </Badge>
                  <CardTitle className="text-sm font-semibold">{stage.title}</CardTitle>
                  <CardDescription className="text-xs leading-tight">{stage.desc}</CardDescription>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              Initial 90-day term with extensions based on progress (up to 24 months when appropriate)
            </p>
            <Button variant="outline" className="border-green-600 text-green-600 hover:bg-green-50" onClick={() => setIsInquiryModalOpen(true)}>
              Learn More About Our Programs
            </Button>
          </div>
        </div>
      </section>
      {/* Team & Community Section */}
      <section className="container mx-auto px-4 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-900 mb-12">Our Community</h2>
        <div className="grid md:grid-cols-3 gap-8 mb-12">
          {/* Case Manager */}
          <Card className="border-green-100 text-center">
            <CardHeader>
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/7688174/pexels-photo-7688174.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Professional case manager smiling"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-green-800">Dedicated Case Managers</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Our trained case managers provide personalized support, helping residents navigate each stage of their transformation with dignity and care.
              </p>
            </CardContent>
          </Card>

          {/* Residents */}
          <Card className="border-green-100 text-center">
            <CardHeader>
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/3184352/pexels-photo-3184352.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Diverse group of residents working together"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-green-800">Our Residents</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Adults returning from incarceration who are ready to rebuild their lives with purpose, develop job skills, and work toward permanent housing.
              </p>
            </CardContent>
          </Card>

          {/* Community Partners */}
          <Card className="border-green-100 text-center">
            <CardHeader>
              <div className="w-32 h-32 mx-auto mb-4 rounded-full overflow-hidden">
                <img 
                  src="https://images.pexels.com/photos/3810756/pexels-photo-3810756.jpeg?auto=compress&cs=tinysrgb&w=400"
                  alt="Community partners collaborating"
                  className="w-full h-full object-cover"
                />
              </div>
              <CardTitle className="text-green-800">Community Partners</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600 text-sm">
                Collaborating with parole officers, probation departments, STOP programs, ECM teams, and local CBOs to ensure comprehensive support.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Statistics Section */}
        <div className="grid md:grid-cols-2 gap-12">
          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-800">Why It Works</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4 mb-4">
                <img 
                  src="https://images.pexels.com/photos/4881619/pexels-photo-4881619.jpeg?auto=compress&cs=tinysrgb&w=200"
                  alt="Residents celebrating success"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-gray-600 mb-4">
                    Stable housing + targeted supports reduce recidivism and increase long-term income and wellbeing. 
                    We're a dignified "first step home" that stays with residents through work, savings, and permanent housing.
                  </p>
                </div>
              </div>
              <div className="space-y-2 text-sm">
                <p><strong>90%</strong> enter with no stable housing → <strong>100%</strong> stabilized within 48 hours</p>
                <p><strong>70%</strong> complete at least one credential or training in 90 days</p>
                <p><strong>60–80%</strong> employed by Day 90</p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-100">
            <CardHeader>
              <CardTitle className="text-green-800">Who We Serve</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-start space-x-4 mb-4">
                <img 
                  src="https://images.pexels.com/photos/6146978/pexels-photo-6146978.jpeg?auto=compress&cs=tinysrgb&w=200"
                  alt="Diverse residents studying together"
                  className="w-16 h-16 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <p className="text-gray-600 mb-4">
                    Adults returning home from incarceration in Sacramento County who are ready to do the work. 
                    Parole, probation, STOP, ECM, and community referrals welcome.
                  </p>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Able to live in a shared environment</li>
                <li>• Willing to follow house rules</li>
                <li>• Ready to engage in weekly workshops and coaching</li>
                <li>• Committed to job/education activities</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* For Caseworkers & Referrers */}
      <section className="py-16" style={{ backgroundColor: '#f0fdf4' }}>
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-center mb-8">
            <img 
              src="https://images.pexels.com/photos/5212703/pexels-photo-5212703.jpeg?auto=compress&cs=tinysrgb&w=300"
              alt="Professional working with community members"
              className="w-20 h-20 rounded-full object-cover mr-6"
            />
            <div>
              <h2 className="text-3xl font-bold text-gray-900">For Caseworkers & Referrers</h2>
              <p className="text-gray-600">Supporting your clients with reliable transitional housing</p>
            </div>
          </div>
          <div className="grid md:grid-cols-4 gap-6">
            <Card className="text-center border-green-100">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2E6F40' }}>
                  <Clock className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg text-green-800">Fast Response</CardTitle>
                <CardDescription>Intake within 24–72 hours as beds allow</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center border-green-100">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2E6F40' }}>
                  <FileText className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg text-green-800">Clear Eligibility</CardTitle>
                <CardDescription>Straightforward requirements and application process</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center border-green-100">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2E6F40' }}>
                  <TrendingUp className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg text-green-800">Consistent Reporting</CardTitle>
                <CardDescription>Weekly progress notes and compliance monitoring</CardDescription>
              </CardHeader>
            </Card>
            <Card className="text-center border-green-100">
              <CardHeader>
                <div className="w-12 h-12 mx-auto mb-2 rounded-full flex items-center justify-center" style={{ backgroundColor: '#2E6F40' }}>
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <CardTitle className="text-lg text-green-800">Evidence-Informed</CardTitle>
                <CardDescription>STOP, ECM, and CalAIM compatible programming</CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>
      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6 text-gray-900">Get Started</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5" style={{ color: '#2E6F40' }} />
                <span>(855) 4-LIFEUP (855-454-3387)</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5" style={{ color: '#2E6F40' }} />
                <span>Apply online - 1-2 business day response</span>
              </div>
              <div className="flex items-center space-x-3">
                <Heart className="w-5 h-5" style={{ color: '#2E6F40' }} />
                <span>Referrals from parole, probation, STOP, ECM, and CBOs</span>
              </div>
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <p className="text-sm text-gray-700">
                  <strong>Address:</strong><br />
                  8399 Folsom Blvd, Ste 1 #4014<br />
                  Sacramento, CA 95826
                </p>
              </div>
            </div>
          </div>
          
          <Card>
            <CardHeader>
              <CardTitle>Quick Contact</CardTitle>
              <CardDescription>
                Questions about our programs? Get in touch and we'll respond within 24 hours.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button 
                className="w-full text-white transform hover:scale-105 transition-all duration-200" 
                style={{ backgroundColor: '#2E6F40' }}
                onClick={() => window.location.href = '/apply'}
              >
                <Home className="w-4 h-4 mr-2" />
                Apply for Housing
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-green-600 text-green-600 hover:bg-green-50 transform hover:scale-105 transition-all duration-200"
                onClick={() => window.location.href = '/refer'}
              >
                <Users className="w-4 h-4 mr-2" />
                Refer a Resident
              </Button>
              <Button 
                variant="outline" 
                className="w-full border-purple-600 text-purple-600 hover:bg-purple-50 transform hover:scale-105 transition-all duration-200"
                onClick={() => setIsPartnerModalOpen(true)}
              >
                <Heart className="w-4 h-4 mr-2" />
                Partner with Us
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>
      {/* Footer */}
      <footer className="text-white py-12" style={{ backgroundColor: '#2E6F40' }}>
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Logo className="w-6 h-6" />
                <span className="text-xl font-bold">Life House Reentry</span>
              </div>
              <p className="text-green-100 text-sm">
                Home for Good. Safe, structured housing and life-design support for people returning from incarceration.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Our Mission</h3>
              <p className="text-green-100 text-sm">
                We provide safe, stable housing and personalized life-skills support to help formerly incarcerated individuals successfully reenter society with dignity, purpose, and a path to financial independence.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Get Involved</h3>
              <ul className="space-y-2 text-sm text-green-100">
                <li className="cursor-pointer hover:text-white" onClick={() => setIsIntakeModalOpen(true)}>• Apply for Housing</li>
                <li className="cursor-pointer hover:text-white" onClick={() => window.location.href = '/refer'}>• Refer a Resident</li>
                <li className="cursor-pointer hover:text-white" onClick={() => setIsPartnerModalOpen(true)}>• Partner With Us</li>
                <li className="cursor-pointer hover:text-white" onClick={() => window.location.href = '/donate'}>• Donate Monthly</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Contact</h3>
              <div className="space-y-2 text-sm text-green-100">
                <p>(855) 4-LIFEUP</p>
                <p>(855-454-3387)</p>
                <p>8399 Folsom Blvd, Ste 1</p>
                <p>Sacramento, CA 95826</p>
              </div>
            </div>
          </div>
          
          <div className="border-t border-green-600 mt-8 pt-8 text-center text-sm text-green-100">
            <p>&copy; 2024 Life House Reentry Inc. All rights reserved. • <a href="#" className="hover:text-white">Non-Discrimination</a> • <a href="#" className="hover:text-white">Privacy</a> • <a href="#" className="hover:text-white">Terms</a></p>
          </div>
        </div>
      </footer>
      {/* Modals */}
      <UnifiedIntakeModal 
        isOpen={isIntakeModalOpen} 
        onClose={() => setIsIntakeModalOpen(false)} 
      />
      <PortalLoginModal
        isOpen={isSignupModalOpen}
        onClose={() => setIsSignupModalOpen(false)}
      />
      <ProgramInquiryModal
        isOpen={isInquiryModalOpen}
        onClose={() => setIsInquiryModalOpen(false)}
      />
      <PartnerSignupModal
        isOpen={isPartnerModalOpen}
        onClose={() => setIsPartnerModalOpen(false)}
      />
    </div>
  );
}