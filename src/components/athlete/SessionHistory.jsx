import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import SessionFeedback from './SessionFeedback'
import EditSession from './EditSession'

export default function SessionHistory() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [editing, setEditing] = useState(null)

    useEffect(() => { fetchSessions() }, [])

    async function fetchSessions() {
        setLoading(true)
        const q = query(
            collection(db, 'executedSessions'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        )
        const snap = await getDocs(q)
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    if (editing) {
        return (
            <EditSession
                session={editing}
                onBack={() => { setEditing(null); fetchSessions() }}
                onDeleted={() => { setEditing(null); fetchSessions() }}
            />
        )
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (sessions.length === 0) return (
        <div className="text-center text-gray-400 py-12">
            <p className="text-lg font-medium">Sin sesiones registradas</p>
            <p className="text-sm mt-1">Completa tu primera sesion del plan</p>
        </div>
    )

    return (
        <div className="space-y-4">
            {sessions.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-bold text-gray-800">{s.sessionType}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{s.date}</p>
                        </div>
                        <div className="flex items-start gap-3">
                            <div className="text-right space-y-1">
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium block">
                  RPE {s.rpe && s.rpe.value} - {s.rpe && s.rpe.scale}
                </span>
                                {s.bodyWeight && <p className="text-xs text-gray-400">{s.bodyWeight} kg</p>}
                            </div>
                            <button
                                onClick={() => setEditing(s)}
                                className="text-xs text-gray-400 hover:text-blue-600 border border-gray-200 px-2 py-1 rounded-lg transition"
                            >
                                Editar
                            </button>
                        </div>
                    </div>

                    {s.exercises && s.exercises.length > 0 && (
                        <div className="space-y-2">
                            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ejercicios</p>
                            {s.exercises.map(function(ex, i) {
                                return (
                                    <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
                                        <p className="text-sm font-medium text-gray-800">{ex.exerciseName}</p>
                                        <div className="flex gap-4 text-xs">
                                            {ex.prescribed && ex.prescribed.sets && (
                                                <span className="text-gray-400">
                          Prescrito: {ex.prescribed.sets}x{ex.prescribed.reps}
                                                    {ex.prescribed.load ? ' @ ' + ex.prescribed.load + ex.prescribed.unit : ''}
                        </span>
                                            )}
                                            {ex.actual && ex.actual.sets && (
                                                <span className="text-blue-600">
                          Real: {ex.actual.sets}x{ex.actual.reps}
                                                    {ex.actual.load ? ' @ ' + ex.actual.load + ex.actual.unit : ''}
                        </span>
                                            )}
                                        </div>
                                        {ex.actual && ex.actual.notes && (
                                            <p className="text-xs text-gray-400 italic">{ex.actual.notes}</p>
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}

                    {s.notes && (
                        <div className="border-t border-gray-100 pt-3">
                            <p className="text-xs text-gray-400 italic">{s.notes}</p>
                        </div>
                    )}

                    <SessionFeedback sessionId={s.id} />
                </div>
            ))}
        </div>
    )
}