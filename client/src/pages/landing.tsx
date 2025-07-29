import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Home, Users, Target, Heart, FileText, Phone } from "lucide-react";

export default function Landing() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Header */}
      <header className="container mx-auto px-4 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Home className="w-8 h-8 text-blue-600" />
            <span className="text-2xl font-bold text-gray-900">Home for Good</span>
          </div>
          <div className="flex items-center space-x-6">
            <a href="#about" className="text-gray-600 hover:text-blue-600">About</a>
            <a href="#programs" className="text-gray-600 hover:text-blue-600">Programs</a>
            <a href="#contact" className="text-gray-600 hover:text-blue-600">Contact</a>
            <Button variant="outline" onClick={() => window.location.href = '/app'}>
              Portal Login
            </Button>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="container mx-auto px-4 py-16 text-center">
        <h1 className="text-5xl font-bold text-gray-900 mb-6">
          Home for Good
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Transitional housing and wraparound services to help justice-involved individuals 
          stabilize, develop skills, and move forward to permanent housing and employment.
        </p>
        <div className="flex justify-center space-x-4">
          <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
            Apply for Housing
          </Button>
          <Button size="lg" variant="outline">
            Make a Referral
          </Button>
          <Button size="lg" variant="outline">
            Donate
          </Button>
        </div>
      </section>

      {/* Value Cards */}
      <section className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-3 gap-8">
          <Card>
            <CardHeader>
              <Home className="w-12 h-12 text-blue-600 mb-4" />
              <CardTitle>Stabilize</CardTitle>
              <CardDescription>
                Safe, transitional housing with 24/7 support and basic needs assistance
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Secure transitional housing</li>
                <li>• Case management support</li>
                <li>• Basic needs assistance</li>
                <li>• Community connections</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Target className="w-12 h-12 text-green-600 mb-4" />
              <CardTitle>Skill Up</CardTitle>
              <CardDescription>
                Employment training, life skills, and educational opportunities
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Job readiness training</li>
                <li>• Life skills workshops</li>
                <li>• Educational support</li>
                <li>• Financial literacy</li>
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <Users className="w-12 h-12 text-purple-600 mb-4" />
              <CardTitle>Move Forward</CardTitle>
              <CardDescription>
                Transition to permanent housing and sustainable employment
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2 text-sm text-gray-600">
                <li>• Housing placement assistance</li>
                <li>• Employment connections</li>
                <li>• Ongoing support services</li>
                <li>• Alumni network</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* 7-Stage Program Overview */}
      <section id="programs" className="bg-gray-50 py-16">
        <div className="container mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-12">Our 7-Stage Program</h2>
          <div className="grid md:grid-cols-4 lg:grid-cols-7 gap-4">
            {[
              { stage: 1, title: "Intake & Assessment", color: "bg-red-100 text-red-800" },
              { stage: 2, title: "Stabilization", color: "bg-orange-100 text-orange-800" },
              { stage: 3, title: "Skill Building", color: "bg-yellow-100 text-yellow-800" },
              { stage: 4, title: "Job Readiness", color: "bg-green-100 text-green-800" },
              { stage: 5, title: "Housing Search", color: "bg-blue-100 text-blue-800" },
              { stage: 6, title: "Transition Prep", color: "bg-indigo-100 text-indigo-800" },
              { stage: 7, title: "Independent Living", color: "bg-purple-100 text-purple-800" }
            ].map((stage) => (
              <Card key={stage.stage} className="text-center">
                <CardHeader>
                  <Badge className={`mx-auto w-8 h-8 rounded-full flex items-center justify-center ${stage.color}`}>
                    {stage.stage}
                  </Badge>
                  <CardTitle className="text-sm">{stage.title}</CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <p className="text-gray-600 mb-4">
              Program length: 90 days to 24 months, based on individual needs and progress
            </p>
            <Button variant="outline">Learn More About Our Programs</Button>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="container mx-auto px-4 py-16">
        <div className="grid md:grid-cols-2 gap-12">
          <div>
            <h2 className="text-3xl font-bold mb-6">Get Started</h2>
            <div className="space-y-4">
              <div className="flex items-center space-x-3">
                <Phone className="w-5 h-5 text-blue-600" />
                <span>(510) 555-0123</span>
              </div>
              <div className="flex items-center space-x-3">
                <FileText className="w-5 h-5 text-blue-600" />
                <span>Apply online - 72 hour response time</span>
              </div>
              <div className="flex items-center space-x-3">
                <Heart className="w-5 h-5 text-blue-600" />
                <span>Referrals accepted from parole, probation, and CBOs</span>
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
              <Button className="w-full bg-blue-600 hover:bg-blue-700">
                Apply for Housing
              </Button>
              <Button variant="outline" className="w-full">
                Make a Referral
              </Button>
              <Button variant="outline" className="w-full">
                Partner with Us
              </Button>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <Home className="w-6 h-6" />
                <span className="text-xl font-bold">Home for Good</span>
              </div>
              <p className="text-gray-400 text-sm">
                Providing transitional housing and wraparound services for justice-involved individuals.
              </p>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Programs</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>STOP Program</li>
                <li>CalAIM ECM</li>
                <li>Community Supports</li>
                <li>Workforce Development</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Get Involved</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Apply for Housing</li>
                <li>Make a Referral</li>
                <li>Volunteer</li>
                <li>Donate</li>
              </ul>
            </div>
            
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
                <li>Non-Discrimination</li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-sm text-gray-400">
            <p>&copy; 2024 Home for Good. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}