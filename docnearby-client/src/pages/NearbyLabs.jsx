import React, { useEffect, useState } from 'react'
import { labApi } from '../services/api.js'
import { useLocation } from '../hooks/useLocation.js'
import Spinner from '../components/common/Spinner.jsx'

export default function NearbyLabs() {
  const { coords, useBrowserLocation } = useLocation()
  const [labs, setLabs] = useState([])
  const [loading, setLoading] = useState(false)
  const [search, setSearch] = useState('')

  const fetchLabs = async (params = {}) => {
    setLoading(true)
    try {
      const data = await labApi.list(params)
      setLabs(data)
    } catch (err) {
      console.error('Failed to fetch labs', err)
      setLabs([])
    } finally {
      setLoading(false)
    }
  }

  // Initial load
  useEffect(() => {
    if (coords) {
      fetchLabs({ lat: coords.lat, lng: coords.lng, radius: 5000 })
    } else {
      fetchLabs({})
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const handleUseMyLocation = async () => {
    try {
      const location = await useBrowserLocation()
      await fetchLabs({ lat: location.lat, lng: location.lng, radius: 5000 })
    } catch (err) {
      console.error('Browser location error', err)
    }
  }

  const handleSearch = async (e) => {
    e.preventDefault()
    const base = coords ? { lat: coords.lat, lng: coords.lng, radius: 5000 } : {}
    await fetchLabs({ ...base, testName: search })
  }

  return (
    <div className="p-4 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Nearby Diagnostic Labs</h1>
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 mb-4">
        <button
          onClick={handleUseMyLocation}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Use my location
        </button>
        <form onSubmit={handleSearch} className="flex-1 w-full">
          <input
            type="text"
            placeholder="Search test name..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full border rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </form>
      </div>
      {loading ? (
        <Spinner className="mx-auto" />
      ) : labs.length === 0 ? (
        <p className="text-center text-gray-600">No labs found near you.</p>
      ) : (
        <div className="space-y-6">
          {labs.map((lab) => (
            <div key={lab.id} className="border rounded p-4 shadow-sm">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-xl font-semibold">{lab.name}</h2>
                  <p className="text-sm text-gray-500">{lab.city}</p>
                </div>
                {lab.distanceInKm !== undefined && (
                  <span className="text-sm text-gray-600">{lab.distanceInKm} km away</span>
                )}
              </div>
              <div className="mt-2 flex items-center space-x-4 text-sm text-gray-700">
                <span>Rating: ⭐ {lab.rating?.toFixed(1) ?? 'N/A'}</span>
                <span>{lab.openTime} – {lab.closeTime}</span>
                <a href={`tel:${lab.phone}`} className="text-blue-600 hover:underline">
                  {lab.phone}
                </a>
              </div>
              <div className="mt-3">
                <h3 className="font-medium mb-1">Tests</h3>
                <ul className="space-y-1">
                  {lab.tests && lab.tests.map((test) => (
                    <li key={test.id} className="flex justify-between items-center">
                      <span>{test.name}</span>
                      <div className="flex items-center space-x-2">
                        <span>₹{test.price}</span>
                        {test.homeCollection && (
                          <span className="bg-green-100 text-green-800 text-xs px-2 py-0.5 rounded">
                            Home collection
                          </span>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
