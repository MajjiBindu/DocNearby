import { createContext, useCallback, useContext, useMemo, useState } from 'react'

const LocationContext = createContext(null)

export function LocationProvider({ children }) {
  const [city, setCity] = useState('')
  const [coords, setCoords] = useState(null) // { lat, lng }

  const useBrowserLocation = useCallback(async () => {
    if (!navigator.geolocation) throw new Error('Geolocation not supported')
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
          setCoords(next)
          resolve(next)
        },
        (err) => reject(err),
        { enableHighAccuracy: true, timeout: 15000 },
      )
    })
  }, [])

  const value = useMemo(
    () => ({ city, setCity, coords, setCoords, useBrowserLocation }),
    [city, coords, useBrowserLocation],
  )

  return <LocationContext.Provider value={value}>{children}</LocationContext.Provider>
}

export function useLocation() {
  const ctx = useContext(LocationContext)
  if (!ctx) throw new Error('useLocation must be used within LocationProvider')
  return ctx
}

