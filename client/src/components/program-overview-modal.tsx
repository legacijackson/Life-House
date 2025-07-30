import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X, Home, Users, GraduationCap, Briefcase, DollarSign, Heart, Phone, Mail, MapPin } from "lucide-react";
import _3 from "@assets/3.png";
// Using direct path to the logo in public directory

interface ProgramOverviewModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function ProgramOverviewModal({ isOpen, onClose }: ProgramOverviewModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0" aria-describedby="program-overview-description">
        <DialogHeader className="sr-only">
          <DialogTitle>Life House Reentry Program Overview</DialogTitle>
          <DialogDescription id="program-overview-description">
            Comprehensive information about Life House Reentry services, programs, and mission
          </DialogDescription>
        </DialogHeader>
        <div className="relative">
          {/* Header with Life House Branding */}
          <div className="bg-gradient-to-r from-green-600 via-blue-600 to-purple-600 text-white p-6 rounded-t-lg">
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-white hover:text-gray-200 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            <div className="flex items-center space-x-4 mb-4">
              <img src={_3} alt="Life House Logo" className="w-16 h-16" />
              <div>
                
                <p className="text-green-100">Program Overview & Services</p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-6 space-y-6">
            {/* Mission Statement */}
            <Card className="border-green-100 bg-gradient-to-br from-green-50 to-blue-50">
              <CardHeader>
                <CardTitle className="text-green-800 flex items-center">
                  <Heart className="w-6 h-6 mr-2" />
                  Our Mission & Vision
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <p className="text-gray-700">
                    <strong>Mission:</strong> Provide safe, structured housing and holistic life-design support for formerly incarcerated individuals, 
                    empowering reintegration with dignity, purpose, and financial independence.
                  </p>
                  <p className="text-gray-700">
                    <strong>Vision:</strong> Break cycles of incarceration so every person returning home has access to healing, housing, work, 
                    and the opportunity to design a fulfilling life.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* 7-Stage Transformation Model */}
            <Card className="border-purple-100">
              <CardHeader>
                <CardTitle className="text-purple-800 flex items-center">
                  <GraduationCap className="w-6 h-6 mr-2" />
                  7-Stage Resident Transformation Model
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <Badge className="bg-green-100 text-green-800">Stage 1</Badge>
                    <h4 className="font-semibold text-green-800">Intake</h4>
                    <p className="text-sm text-gray-600">Assessment, stabilization, documents, benefits, initial plan</p>
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-blue-100 text-blue-800">Stage 2</Badge>
                    <h4 className="font-semibold text-blue-800">Design</h4>
                    <p className="text-sm text-gray-600">Individualized goals, services map, accountability schedule</p>
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-purple-100 text-purple-800">Stage 3</Badge>
                    <h4 className="font-semibold text-purple-800">Training</h4>
                    <p className="text-sm text-gray-600">Life skills, CBT-informed groups, education/certifications, financial literacy</p>
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-green-100 text-green-800">Stage 4</Badge>
                    <h4 className="font-semibold text-green-800">Working</h4>
                    <p className="text-sm text-gray-600">Job placement, income stabilization, 30% contribution (25% reimbursable savings)</p>
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-blue-100 text-blue-800">Stage 5</Badge>
                    <h4 className="font-semibold text-blue-800">Overflow</h4>
                    <p className="text-sm text-gray-600">Step-down independence, continued coaching, housing search</p>
                  </div>
                  <div className="space-y-2">
                    <Badge className="bg-purple-100 text-purple-800">Stage 6</Badge>
                    <h4 className="font-semibold text-purple-800">Transition</h4>
                    <p className="text-sm text-gray-600">Permanent housing secured; move-out readiness</p>
                  </div>
                  <div className="space-y-2 md:col-span-2 lg:col-span-1">
                    <Badge className="bg-yellow-100 text-yellow-800">Stage 7</Badge>
                    <h4 className="font-semibold text-yellow-800">Legacy</h4>
                    <p className="text-sm text-gray-600">Alumni network, mentoring, aftercare check-ins</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Core Services */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-blue-100">
                <CardHeader>
                  <CardTitle className="text-blue-800 flex items-center">
                    <Home className="w-6 h-6 mr-2" />
                    Core Services (Non-Clinical)
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-gray-700">
                    <li>• <strong>Transitional housing</strong> (90–730 days)</li>
                    <li>• <strong>Case management</strong> and life design planning</li>
                    <li>• <strong>Documents & benefits</strong> (ID/SSN, Medi-Cal, CalFresh, GA, SSI/SSDI)</li>
                    <li>• <strong>Financial literacy</strong> and credit repair</li>
                    <li>• <strong>Job readiness</strong>, employer partnerships, apprenticeships/trades</li>
                    <li>• <strong>Education</strong> (GED/credentials)</li>
                    <li>• <strong>Reentry basics</strong> (transportation, clothing, digital literacy)</li>
                    <li>• <strong>Permanent housing</strong> navigation</li>
                  </ul>
                </CardContent>
              </Card>

              <Card className="border-green-100">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center">
                    <Users className="w-6 h-6 mr-2" />
                    Referral Pathways & Funding
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-semibold text-green-800 mb-2">Referrals Welcome From:</h4>
                      <ul className="space-y-1 text-sm text-gray-700">
                        <li>• Parole/Probation departments</li>
                        <li>• STOP prime contractors</li>
                        <li>• Medi-Cal Managed Care Plans (CalAIM ECM & Community Supports)</li>
                        <li>• Community-based organizations (CBOs)</li>
                      </ul>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <p className="text-sm text-blue-800">
                        <strong>Note:</strong> Clinical care is coordinated via licensed external providers; 
                        Life House is non-clinical.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Leadership & Contact */}
            <div className="grid md:grid-cols-2 gap-6">
              <Card className="border-purple-100">
                <CardHeader>
                  <CardTitle className="text-purple-800 flex items-center">
                    <Briefcase className="w-6 h-6 mr-2" />
                    Leadership Team
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-semibold text-purple-800">Julius Deshon Jackson</h4>
                      <p className="text-sm text-gray-600">CEO/Board Chair</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800">Kairia Shariff</h4>
                      <p className="text-sm text-gray-600">CFO/Board Treasurer</p>
                    </div>
                    <div>
                      <h4 className="font-semibold text-purple-800">Brittney Jackson</h4>
                      <p className="text-sm text-gray-600">COO/Board Secretary</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-green-100">
                <CardHeader>
                  <CardTitle className="text-green-800 flex items-center">
                    <Phone className="w-6 h-6 mr-2" />
                    Contact Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center space-x-3">
                      <Phone className="w-4 h-4 text-green-600" />
                      <span className="text-sm">(855) 4-LIFEUP (855-454-3387)</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <Mail className="w-4 h-4 text-green-600" />
                      <span className="text-sm">info@lifehousereentry.org</span>
                    </div>
                    <div className="flex items-start space-x-3">
                      <MapPin className="w-4 h-4 text-green-600 mt-0.5" />
                      <div className="text-sm">
                        <p>8399 Folsom Blvd, STE 1 #4014</p>
                        <p>Sacramento, CA 95826</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Compliance & Governance */}
            <Card className="border-gray-200 bg-gray-50">
              <CardHeader>
                <CardTitle className="text-gray-800">Governance & Compliance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• California Nonprofit Public Benefit Corporation</li>
                    <li>• 501(c)(3) compliant</li>
                    <li>• Conflict-of-interest controls for related-party leases</li>
                    <li>• HIPAA-grade privacy</li>
                  </ul>
                  <ul className="space-y-1 text-sm text-gray-600">
                    <li>• ADA/Fair Housing compliance</li>
                    <li>• Data tracking for attendance, services, outcomes</li>
                    <li>• Audit-ready reporting</li>
                    <li>• Evidence-informed programming</li>
                  </ul>
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4 pt-4 border-t">
              <Button 
                className="bg-green-600 hover:bg-green-700 text-white"
                onClick={() => window.location.href = '/apply'}
              >
                <Home className="w-4 h-4 mr-2" />
                Apply for Housing
              </Button>
              <Button 
                variant="outline"
                className="border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => window.location.href = '/refer'}
              >
                <Users className="w-4 h-4 mr-2" />
                Refer a Resident
              </Button>
              <Button 
                variant="outline"
                className="border-purple-600 text-purple-600 hover:bg-purple-50"
                onClick={() => window.location.href = '/donate'}
              >
                <Heart className="w-4 h-4 mr-2" />
                Support Our Mission
              </Button>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}