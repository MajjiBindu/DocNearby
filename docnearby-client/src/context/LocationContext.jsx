import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const LocationContext = createContext(null);

export function LocationProvider({ children }) {
  const [city, setCity] = useState(() => localStorage.getItem("dn_city") || "");
  const [coords, setCoords] = useState(() => {
    const saved = localStorage.getItem("dn_coords");
    return saved ? JSON.parse(saved) : null;
  });
  const [radius, setRadius] = useState(
    () => Number(localStorage.getItem("dn_radius")) || 5000,
  );
  const [isManual, setIsManual] = useState(
    () => localStorage.getItem("dn_is_manual") === "true",
  );

  useEffect(() => {
    localStorage.setItem("dn_city", city);
  }, [city]);

  useEffect(() => {
    if (coords) localStorage.setItem("dn_coords", JSON.stringify(coords));
    else localStorage.removeItem("dn_coords");
  }, [coords]);

  useEffect(() => {
    localStorage.setItem("dn_radius", radius.toString());
  }, [radius]);

  useEffect(() => {
    localStorage.setItem("dn_is_manual", isManual.toString());
  }, [isManual]);

  const getBrowserLocation = useCallback(async (options = {}) => {
    if (!navigator.geolocation) throw new Error("Geolocation not supported");
    const timeout = options.timeout || 15000;
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
          setCoords(next);
          setIsManual(false);
          resolve(next);
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout },
      );
    });
  }, []);

  useEffect(() => {
    // Only auto-detect if not manual and no coords exist yet
    if (isManual || coords) return;

    let cancelled = false;

    async function detectLocation() {
      try {
        const next = await getBrowserLocation({ timeout: 8000 });
        if (!cancelled) {
          setCoords(next);
          setIsManual(false);
        }
      } catch {
        // Silent fallback: the app can still show unfiltered results.
      }
    }

    detectLocation();
    return () => {
      cancelled = true;
    };
  }, [getBrowserLocation, isManual, coords]);

  const value = useMemo(
    () => ({
      city,
      setCity,
      coords,
      setCoords,
      radius,
      setRadius,
      isManual,
      setIsManual,
      getBrowserLocation,
    }),
    [city, coords, radius, isManual, getBrowserLocation],
  );

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const ctx = useContext(LocationContext);
  if (!ctx) throw new Error("useLocation must be used within LocationProvider");
  return ctx;
}
