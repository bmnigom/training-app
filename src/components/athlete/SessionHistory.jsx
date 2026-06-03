import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

export default function SessionHistory() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetchSessions() {
            const q = query(
                collection(db, 'sessions'),
                where('userId', '==', user.uid),
                orderBy('date', 'desc')
            )
            const snap = await getDocs(q)
            setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        }
        fetchSessions()
    }, [user.uid])

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (sessions.length === 0) return (
        <div className="text-center text-gray-400 py-12">
            <p className="text-lg">Sin sesiones registradas</p>
            <p className="text-sm mt-1">Registra tu primera sesión en la pestaña anterior</p>
        </div>
    )

    return (
        <div className="space-y-4">
            {sessions.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5">
                    <div className="flex items-start justify-between mb-3">
                        <div>
                            <p className="font-bold text-gray-800">{s.sessionType}</p>
                            <p className="text-xs text-gray-500">{s.date} {s.duration ? `· ${s.duration} min` : ''}</p>
                        </div>
                        <div className="text-right">
              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium">
                RPE {s.rpe?.value} ({s.rpe?.scale})
              </span>
                            {s.bodyWeight && (
                                <p className="text-xs text-gray-400 mt-1">{s.bodyWeight} kg</p>
                            )}
                        </div>
                    </div>

                    {s.exercises?.length > 0 && (
                        <div className="space-y-1">
                            {s.exercises.map((ex, i) => (
                                <div key={i} className="flex items-center justify-between text-sm">
                                    <span className="text-gray-700">{ex.name}</span>
                                    <span className="text-gray-400 text-xs">
                    {ex.sets && ex.reps ? `${ex.sets}×${ex.reps}` : ''}
                                        {ex.weight ? ` @ ${ex.weight}${ex.unit}` : ''}
                  </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {s.notes && (
                        <p className="text-xs text-gray-400 mt-3 border-t border-gray-100 pt-2">{s.notes}</p>
                    )}
                </div>
            ))}
        </div>
    )
}