import { useState, useCallback } from "react";

export function useUserLocation() {
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!navigator.geolocation) throw new Error("Geolocation not supported");
      const pos = await new Promise<GeolocationPosition>((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, { timeout: 10000 })
      );
      const loc = { latitude: pos.coords.latitude, longitude: pos.coords.longitude };
      setLocation(loc);
      return loc;
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unable to get your location";
      setError(msg);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { location, loading, error, requestLocation };
}
