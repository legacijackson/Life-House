
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Home, Users, Calendar, FileText, CheckCircle } from "lucide-react";

interface ProgramOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApplyNow: () => void;
}

export function ProgramOverviewModal({ isOpen, onClose, onApplyNow }: ProgramOverviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-center mb-4">
            Life House Reentry Program Overview
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6">
          {/* Hero Section */}
          <div className="text-center bg-gradient-to-r from-green-50 to-blue-50 p-6 rounded-lg">
            <h3 className="text-xl font-semibold mb-2">
              Stable Housing • Life Transformation • Community Support
            </h3>
            <p className="text-gray-600">
              A comprehensive 90-day transitional housing program designed to help formerly incarcerated individuals 
              successfully reintegrate into society with dignity and support.
            </p>
          </div>

          {/* Program Stages */}
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border-l-4 border-l-blue-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Home className="w-5 h-5 mr-2 text-blue-500" />
                  Stage 1: Stabilization
                </CardTitle>
                <CardDescription>Days 1-30</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Immediate safe housing</li>
                  <li>• Basic needs assessment</li>
                  <li>• Case management intake</li>
                  <li>• Emergency services coordination</li>
                  <li>• Initial goal setting</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-green-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <Users className="w-5 h-5 mr-2 text-green-500" />
                  Stage 2: Development
                </CardTitle>
                <CardDescription>Days 31-60</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Skills development programs</li>
                  <li>• Employment preparation</li>
                  <li>• Financial literacy training</li>
                  <li>• Mental health support</li>
                  <li>• Community integration</li>
                </ul>
              </CardContent>
            </Card>

            <Card className="border-l-4 border-l-purple-500">
              <CardHeader>
                <CardTitle className="flex items-center text-lg">
                  <CheckCircle className="w-5 h-5 mr-2 text-purple-500" />
                  Stage 3: Transition
                </CardTitle>
                <CardDescription>Days 61-90</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="text-sm space-y-1">
                  <li>• Independent living preparation</li>
                  <li>• Permanent housing search</li>
                  <li>• Employment placement</li>
                  <li>• Ongoing support planning</li>
                  <li>• Program graduation</li>
                </ul>
              </CardContent>
            </Card>
          </div>

          {/* Key Services */}
          <Card>
            <CardHeader>
              <CardTitle>Comprehensive Support Services</CardTitle>
            </CardHeader>
            <CardContent className="grid md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Housing & Basic Needs</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Safe, furnished private rooms</li>
                  <li>• Shared common areas and kitchen</li>
                  <li>• Utilities and Wi-Fi included</li>
                  <li>• Basic furnishings provided</li>
                  <li>• Food assistance programs</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Professional Development</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Job readiness training</li>
                  <li>• Resume building workshops</li>
                  <li>• Interview preparation</li>
                  <li>• Skills assessment</li>
                  <li>• Employer partnerships</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Case Management</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Individual case planning</li>
                  <li>• Weekly check-ins</li>
                  <li>• Goal tracking and support</li>
                  <li>• Crisis intervention</li>
                  <li>• Resource coordination</li>
                </ul>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Life Skills & Wellness</h4>
                <ul className="text-sm space-y-1 text-gray-600">
                  <li>• Financial literacy education</li>
                  <li>• Mental health counseling</li>
                  <li>• Substance abuse support</li>
                  <li>• Health and wellness programs</li>
                  <li>• Peer support groups</li>
                </ul>
              </div>
            </CardContent>
          </Card>

          {/* Eligibility Requirements */}
          <Card className="bg-blue-50">
            <CardHeader>
              <CardTitle>Eligibility Requirements</CardTitle>
              <CardDescription>To qualify for the Life House program, applicants must meet:</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold mb-2 text-blue-800">Required Criteria</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Currently on parole or probation</li>
                    <li>• Release date within 30 days of application</li>
                    <li>• Valid California ID or documentation</li>
                    <li>• Commitment to program participation</li>
                    <li>• Willingness to follow house rules</li>
                  </ul>
                </div>
                <div>
                  <h4 className="font-semibold mb-2 text-green-800">Preferred Background</h4>
                  <ul className="text-sm space-y-1">
                    <li>• Motivation for positive change</li>
                    <li>• Interest in employment or education</li>
                    <li>• Stable mental health status</li>
                    <li>• No active substance abuse</li>
                    <li>• Sacramento County connection</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Success Metrics */}
          <div className="grid md:grid-cols-3 gap-4 text-center">
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">85%</div>
              <div className="text-sm text-gray-600">Program Completion Rate</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">92%</div>
              <div className="text-sm text-gray-600">Housing Retention</div>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">78%</div>
              <div className="text-sm text-gray-600">Employment Placement</div>
            </div>
          </div>

          {/* Call to Action */}
          <div className="text-center space-y-4 bg-gradient-to-r from-green-600 to-blue-600 text-white p-6 rounded-lg">
            <h3 className="text-xl font-bold">Ready to Start Your Journey?</h3>
            <p className="mb-4">
              Take the first step toward stable housing and a fresh start. Our team is here to support you every step of the way.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={onApplyNow}
                size="lg" 
                className="bg-white text-green-600 hover:bg-gray-100"
              >
                Apply Now
              </Button>
              <Button 
                onClick={() => window.open('tel:+18554543387')}
                size="lg" 
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-green-600"
              >
                Call (855) 4-LIFEUP
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
