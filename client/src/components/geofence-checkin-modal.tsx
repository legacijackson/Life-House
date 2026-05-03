import { useState, useEffect, useRef } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription 
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { 
  MapPin, 
  CheckCircle, 
  XCircle, 
  AlertTriangle,
  Navigation,
  Loader2
} from 'lucide-react';
import { toast } from "@/hooks/use-toast";

interface GeofenceCheckinModalProps {
  isOpen: boolean;
  onClose: () => void;
  propertyId: string;
  propertyName: string;
  propertyAddress?: string;
  onCheckinComplete: (success: boolean, overrideReason?: string) => void;
}

interface PropertyLocation {
  latitude: number;
  longitude: number;
  radius: number; // in meters
}


export function GeofenceCheckinModal({
  isOpen,
  onClose,
  propertyId,
  propertyName,
  propertyAddress,
  onCheckinComplete
}: GeofenceCheckinModalProps) {
  const [currentLocation, setCurrentLocation] = useState<GeolocationCoordinates | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [distance, setDistance] = useState<number | null>(null);
  const [isWithinGeofence, setIsWithinGeofence] = useState<boolean | null>(null);
  const [overrideReason, setOverrideReason] = useState('');
  const [showOverride, setShowOverride] = useState(false);
  const propertyLocRef = useRef<PropertyLocation | null>(null);

  useEffect(() => {
    if (!propertyId) return;
    fetch(`/api/properties/${propertyId}`)
      .then((r) => r.json())
      .then((p: any) => {
        if (p.latitude && p.longitude) {
          propertyLocRef.current = {
            latitude: parseFloat(p.latitude),
            longitude: parseFloat(p.longitude),
            radius: p.geofenceRadius ?? 100,
          };
        }
      })
      .catch(() => {});
  }, [propertyId]);

  // Calculate distance between two coordinates (Haversine formula)
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c; // Distance in meters
  };

  const checkLocation = () => {
    setIsLoading(true);
    setLocationError(null);
    
    if (!navigator.geolocation) {
      setLocationError('Geolocation is not supported by your browser');
      setIsLoading(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCurrentLocation(position.coords);
        const propertyLoc = propertyLocRef.current;
        if (propertyLoc) {
          const dist = calculateDistance(
            position.coords.latitude,
            position.coords.longitude,
            propertyLoc.latitude,
            propertyLoc.longitude
          );
          setDistance(Math.round(dist));
          setIsWithinGeofence(dist <= propertyLoc.radius);
        } else {
          setIsWithinGeofence(null);
        }
        setIsLoading(false);
      },
      (error) => {
        setIsLoading(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            setLocationError('Location permission denied. Please enable location services.');
            break;
          case error.POSITION_UNAVAILABLE:
            setLocationError('Location information unavailable.');
            break;
          case error.TIMEOUT:
            setLocationError('Location request timed out.');
            break;
          default:
            setLocationError('An unknown error occurred.');
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 0
      }
    );
  };

  useEffect(() => {
    if (isOpen) {
      checkLocation();
    }
  }, [isOpen]);

  const handleCheckin = () => {
    if (isWithinGeofence) {
      onCheckinComplete(true);
      toast({
        title: "Check-in successful",
        description: `You've been checked in at ${propertyName}`,
      });
      onClose();
    } else if (showOverride && overrideReason.trim()) {
      onCheckinComplete(true, overrideReason);
      toast({
        title: "Check-in recorded",
        description: "Manual check-in with override reason",
      });
      onClose();
    }
  };

  const handleClose = () => {
    setCurrentLocation(null);
    setLocationError(null);
    setDistance(null);
    setIsWithinGeofence(null);
    setOverrideReason('');
    setShowOverride(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="w-5 h-5" />
            Geofence Check-In
          </DialogTitle>
          <DialogDescription>
            Verify your location to check in at {propertyName}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          {/* Property Info */}
          <Card className="p-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Property:</span>
                <span className="font-medium">{propertyName}</span>
              </div>
              {propertyAddress && (
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Address:</span>
                  <span className="text-sm">{propertyAddress}</span>
                </div>
              )}
            </div>
          </Card>

          {/* Location Status */}
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-500" />
              <span className="ml-2 text-gray-600">Getting your location...</span>
            </div>
          ) : locationError ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>{locationError}</AlertDescription>
            </Alert>
          ) : currentLocation && (
            <>
              <Card className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Navigation className="w-4 h-4 text-blue-600" />
                    <span className="font-medium">Your Location</span>
                  </div>
                  <Badge variant={isWithinGeofence ? "secondary" : "destructive"}>
                    {isWithinGeofence ? 'Within Range' : 'Out of Range'}
                  </Badge>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Distance from property:</span>
                    <span className="font-medium">
                      {distance !== null ? `${distance}m` : 'Calculating...'}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">Required range:</span>
                    <span className="font-medium">Within 100m</span>
                  </div>
                </div>

                {isWithinGeofence ? (
                  <div className="mt-4 flex items-center gap-2 text-green-600">
                    <CheckCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">You are at the correct location</span>
                  </div>
                ) : (
                  <div className="mt-4 flex items-center gap-2 text-red-600">
                    <XCircle className="w-5 h-5" />
                    <span className="text-sm font-medium">You are too far from the property</span>
                  </div>
                )}
              </Card>

              {/* Manual Override Option */}
              {!isWithinGeofence && (
                <Alert>
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    If you're having technical issues or believe this is an error, you can request a manual check-in.
                  </AlertDescription>
                </Alert>
              )}

              {!isWithinGeofence && showOverride && (
                <div className="space-y-2">
                  <Label htmlFor="override-reason">Reason for manual check-in</Label>
                  <Textarea
                    id="override-reason"
                    placeholder="Please explain why you need to manually check in..."
                    value={overrideReason}
                    onChange={(e) => setOverrideReason(e.target.value)}
                    className="min-h-[80px]"
                  />
                </div>
              )}
            </>
          )}

          {/* Actions */}
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleClose} className="flex-1">
              Cancel
            </Button>
            
            {isLoading ? (
              <Button disabled className="flex-1">
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Checking...
              </Button>
            ) : locationError ? (
              <Button onClick={checkLocation} className="flex-1">
                Try Again
              </Button>
            ) : isWithinGeofence ? (
              <Button onClick={handleCheckin} className="flex-1">
                <CheckCircle className="w-4 h-4 mr-2" />
                Check In
              </Button>
            ) : !showOverride ? (
              <Button 
                onClick={() => setShowOverride(true)} 
                variant="secondary"
                className="flex-1"
              >
                Request Manual Check-In
              </Button>
            ) : (
              <Button 
                onClick={handleCheckin} 
                disabled={!overrideReason.trim()}
                className="flex-1"
              >
                Submit Manual Check-In
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}