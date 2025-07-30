import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Sidebar } from "@/components/sidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  MapPin, 
  Clock, 
  CheckCircle, 
  XCircle,
  AlertTriangle,
  Users,
  Calendar,
  Loader2
} from 'lucide-react';

interface LocationData {
  latitude: number;
  longitude: number;
  accuracy: number;
  timestamp: string;
}

interface CheckInSession {
  id: string;
  name: string;
  type: 'daily' | 'group' | 'meeting';
  startTime: string;
  endTime: string;
  location: {
    name: string;
    address: string;
    coordinates: {
      lat: number;
      lng: number;
    };
    radius: number; // in meters
  };
  status: 'upcoming' | 'active' | 'completed';
  checkedIn?: boolean;
}

export default function CheckIn() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useState<LocationData | null>(null);
  const [isGettingLocation, setIsGettingLocation] = useState(false);

  // Fetch today's check-in sessions
  const { data: sessions = [], isLoading } = useQuery<CheckInSession[]>({
    queryKey: ['/api/check-in/sessions'],
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async (data: { sessionId: string; location: LocationData }) => {
      return apiRequest('POST', '/api/check-in', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/check-in/sessions'] });
      toast({
        title: "Check-in successful",
        description: "Your attendance has been recorded.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Check-in failed",
        description: error.message || "Please try again or contact staff.",
        variant: "destructive",
      });
    },
  });

  const getCurrentLocation = () => {
    setIsGettingLocation(true);
    
    if (!navigator.geolocation) {
      toast({
        title: "Location not supported",
        description: "Your browser doesn't support location services.",
        variant: "destructive",
      });
      setIsGettingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const locationData: LocationData = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };
        setLocation(locationData);
        setIsGettingLocation(false);
      },
      (error) => {
        setIsGettingLocation(false);
        let message = "Unable to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            message = "Please enable location permissions to check in.";
            break;
          case error.POSITION_UNAVAILABLE:
            message = "Location information is unavailable.";
            break;
          case error.TIMEOUT:
            message = "Location request timed out.";
            break;
        }
        
        toast({
          title: "Location error",
          description: message,
          variant: "destructive",
        });
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0,
      }
    );
  };

  const handleCheckIn = (sessionId: string) => {
    if (!location) {
      toast({
        title: "Location required",
        description: "Please enable location to check in.",
        variant: "destructive",
      });
      return;
    }

    checkInMutation.mutate({ sessionId, location });
  };

  const activeSessions = sessions.filter(s => s.status === 'active');
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      
      <main className="flex-1 overflow-y-auto">
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Check-In</h1>
                <p className="text-sm text-gray-600">Mark your attendance for programs and sessions</p>
              </div>
              <div className="flex items-center space-x-2">
                <Calendar className="w-5 h-5 text-gray-500" />
                <span className="text-sm text-gray-600">
                  {new Date().toLocaleDateString('en-US', { 
                    weekday: 'long', 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </span>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 space-y-6">
          {/* Location Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <MapPin className="w-5 h-5 mr-2" />
                Location Status
              </CardTitle>
            </CardHeader>
            <CardContent>
              {location ? (
                <div className="space-y-2">
                  <div className="flex items-center text-green-600">
                    <CheckCircle className="w-5 h-5 mr-2" />
                    <span>Location enabled</span>
                  </div>
                  <p className="text-sm text-gray-600">
                    Accuracy: {Math.round(location.accuracy)} meters
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <Alert>
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Location services are required for check-in. Please enable location access to continue.
                    </AlertDescription>
                  </Alert>
                  <Button 
                    onClick={getCurrentLocation}
                    disabled={isGettingLocation}
                    className="w-full"
                  >
                    {isGettingLocation ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Getting location...
                      </>
                    ) : (
                      <>
                        <MapPin className="w-4 h-4 mr-2" />
                        Enable Location
                      </>
                    )}
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Active Sessions */}
          {activeSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Active Sessions</h2>
              {activeSessions.map((session) => (
                <Card key={session.id} className="border-green-200">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <Badge variant="default" className="bg-green-600">
                        Active Now
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {session.startTime} - {session.endTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {session.location.name} - {session.location.address}
                      </div>
                      {session.type === 'group' && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Users className="w-4 h-4 mr-2" />
                          Group Session
                        </div>
                      )}
                      
                      {session.checkedIn ? (
                        <div className="flex items-center text-green-600 font-medium">
                          <CheckCircle className="w-5 h-5 mr-2" />
                          Checked In
                        </div>
                      ) : (
                        <Button 
                          onClick={() => handleCheckIn(session.id)}
                          disabled={!location || checkInMutation.isPending}
                          className="w-full"
                        >
                          {checkInMutation.isPending ? (
                            <>
                              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              Checking in...
                            </>
                          ) : (
                            'Check In Now'
                          )}
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Upcoming Sessions</h2>
              {upcomingSessions.map((session) => (
                <Card key={session.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <Badge variant="outline">
                        Starts at {session.startTime}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center text-sm text-gray-600">
                        <Clock className="w-4 h-4 mr-2" />
                        {session.startTime} - {session.endTime}
                      </div>
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="w-4 h-4 mr-2" />
                        {session.location.name}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Completed Sessions */}
          {completedSessions.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900">Completed Today</h2>
              {completedSessions.map((session) => (
                <Card key={session.id} className="opacity-75">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{session.name}</CardTitle>
                      <Badge variant="secondary">
                        {session.checkedIn ? (
                          <><CheckCircle className="w-3 h-3 mr-1" /> Attended</>
                        ) : (
                          <><XCircle className="w-3 h-3 mr-1" /> Missed</>
                        )}
                      </Badge>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}

          {/* No sessions message */}
          {isLoading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
              <p className="text-gray-500">Loading sessions...</p>
            </div>
          ) : sessions.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-1">No sessions today</h3>
                <p className="text-sm text-gray-500">Check back tomorrow for scheduled activities.</p>
              </CardContent>
            </Card>
          ) : null}
        </div>
      </main>
    </div>
  );
}