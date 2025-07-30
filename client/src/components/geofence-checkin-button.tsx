
import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { MapPin, CheckCircle, AlertCircle, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface GeofenceCheckinButtonProps {
  propertyId: string;
  propertyName: string;
  targetLatitude: number;
  targetLongitude: number;
  radiusMeters?: number;
  className?: string;
}

export function GeofenceCheckinButton({
  propertyId,
  propertyName,
  targetLatitude,
  targetLongitude,
  radiusMeters = 91, // Default 91 meters as specified
  className
}: GeofenceCheckinButtonProps) {
  const [isChecking, setIsChecking] = useState(false);
  const [lastCheckIn, setLastCheckIn] = useState<Date | null>(null);
  const { toast } = useToast();

  // Haversine formula to calculate distance between two coordinates
  const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
    const R = 6371e3; // Earth's radius in meters
    const φ1 = lat1 * Math.PI / 180;
    const φ2 = lat2 * Math.PI / 180;
    const Δφ = (lat2 - lat1) * Math.PI / 180;
    const Δλ = (lon2 - lon1) * Math.PI / 180;

    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) +
              Math.cos(φ1) * Math.cos(φ2) *
              Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));

    return R * c; // Distance in meters
  };

  const handleCheckIn = async () => {
    setIsChecking(true);

    try {
      // Get user's current location
      const position = await new Promise<GeolocationPosition>((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error('Geolocation not supported'));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          resolve,
          reject,
          {
            enableHighAccuracy: true,
            timeout: 10000,
            maximumAge: 60000
          }
        );
      });

      const userLatitude = position.coords.latitude;
      const userLongitude = position.coords.longitude;

      // Calculate distance from target location
      const distance = calculateDistance(
        userLatitude,
        userLongitude,
        targetLatitude,
        targetLongitude
      );

      // Check if within allowed radius
      if (distance > radiusMeters) {
        toast({
          title: "Out of Range",
          description: `You must be within ${radiusMeters}m of ${propertyName} to check in. You are ${Math.round(distance)}m away.`,
          variant: "destructive",
        });
        return;
      }

      // Submit check-in to server
      const response = await fetch('/api/check-in', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          propertyId,
          latitude: userLatitude,
          longitude: userLongitude,
          distance: Math.round(distance),
        }),
      });

      if (!response.ok) {
        throw new Error('Check-in failed');
      }

      const result = await response.json();
      
      setLastCheckIn(new Date());
      toast({
        title: "Check-in Successful",
        description: `Successfully checked in at ${propertyName}`,
        variant: "default",
      });

    } catch (error: any) {
      console.error('Check-in error:', error);
      
      let errorMessage = "Check-in failed. Please try again.";
      
      if (error.code === error.PERMISSION_DENIED) {
        errorMessage = "Location permission denied. Please enable location access and try again.";
      } else if (error.code === error.POSITION_UNAVAILABLE) {
        errorMessage = "Unable to determine your location. Please try again.";
      } else if (error.code === error.TIMEOUT) {
        errorMessage = "Location request timed out. Please try again.";
      }

      toast({
        title: "Check-in Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsChecking(false);
    }
  };

  const getStatusBadge = () => {
    if (lastCheckIn) {
      const hoursSinceCheckIn = (Date.now() - lastCheckIn.getTime()) / (1000 * 60 * 60);
      if (hoursSinceCheckIn < 24) {
        return (
          <Badge variant="secondary" className="bg-green-100 text-green-800">
            <CheckCircle className="w-3 h-3 mr-1" />
            Checked In
          </Badge>
        );
      }
    }
    
    return (
      <Badge variant="outline" className="text-gray-600">
        <AlertCircle className="w-3 h-3 mr-1" />
        Check-in Required
      </Badge>
    );
  };

  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <MapPin className="w-4 h-4 text-gray-500" />
          <span className="text-sm font-medium">{propertyName}</span>
        </div>
        {getStatusBadge()}
      </div>
      
      <Button
        onClick={handleCheckIn}
        disabled={isChecking}
        className="w-full"
        variant={lastCheckIn ? "outline" : "default"}
      >
        {isChecking ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Checking Location...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Check In
          </>
        )}
      </Button>
      
      {lastCheckIn && (
        <p className="text-xs text-gray-500 text-center">
          Last check-in: {lastCheckIn.toLocaleString()}
        </p>
      )}
    </div>
  );
}
