import { useEffect, useMemo, useState } from 'react'
import { doctorApi } from '../services/api.js'

export function useDoctors(params) {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [doctors, setDoctors] = useState([])

  const requestParams = useMemo(() => params || {}, [params])
  const key = useMemo(() => JSON.stringify(requestParams), [requestParams])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError('')
      try {
        const res = await doctorApi.list(requestParams)
        if (!cancelled) setDoctors(res?.data?.doctors || [])
      } catch (e) {
        if (!cancelled) setError(e?.message || 'Failed to load doctors')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, requestParams])

  return { loading, error, doctors }
}
