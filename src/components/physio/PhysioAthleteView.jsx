import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

export default function PhysioAthleteView() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(null)

    useEffect(() => { fetchSessions() }, [])

    async function fetchSessions() {
        const q = query(
            collection(db, 'physioSessions'),
            where('athleteUid', '==', user.uid),
            orderBy('date', 'desc')
        )
        const snap = await getDocs(q)
        setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (sessions.length === 0) return (
        <div className="text-center text-gray-400 py-12">
            <p className="font-medium">Sin sesiones de fisioterapia</p>
            <p className="text-sm mt-1">Aqui apareceran tus sesiones registradas por el fisioterapeuta</p>
        </div>
    )

    return (
        <div className="space-y-3">
            <h2 className="font-bold text-gray-800 text-lg">Mis sesiones de fisioterapia</h2>
            {sessions.map(s => (
                <div key={s.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                    <div
                        onClick={() => setExpanded(expanded === s.id ? null : s.id)}
                        className="p-4 cursor-pointer hover:bg-gray-50 transition"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-medium text-gray-800 text-sm">{s.date}</p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                    {s.startTime && s.endTime ? s.startTime + ' - ' + s.endTime + ' · ' : ''}
                                    {s.exercises?.length || 0} ejercicios
                                </p>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold text-teal-600">{s.totalVolume?.toLocaleString()} kg</p>
                                <p className="text-xs text-gray-400">volumen</p>
                            </div>
                        </div>
                        {s.muscleGroupSummary && (
                            <div className="flex gap-2 mt-2 flex-wrap">
                                {Object.keys(s.muscleGroupSummary).map(g => (
                                    <span key={g} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{g}</span>
                                ))}
                            </div>
                        )}
                    </div>

                    {expanded === s.id && (
                        <div className="border-t border-gray-100 p-4 space-y-3">
                            {s.exercises?.map((ex, i) => (
                                <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
                                    <p className="text-sm font-medium text-gray-800">{ex.exerciseName}</p>
                                    <p className="text-xs text-teal-600">{ex.muscleGroup}</p>
                                    <div className="flex gap-3 text-xs text-gray-500 flex-wrap">
                                        {ex.sets && <span>{ex.sets} series</span>}
                                        {ex.reps && <span>{ex.reps} reps</span>}
                                        {ex.weight && <span>{ex.weight} {ex.unit}</span>}
                                        {ex.rir !== '' && ex.rir !== undefined && <span>RIR: {ex.rir}</span>}
                                        {ex.rpe !== '' && ex.rpe !== undefined && <span>RPE: {ex.rpe}</span>}
                                    </div>
                                    {ex.notes && <p className="text-xs text-gray-400 italic">{ex.notes}</p>}
                                </div>
                            ))}

                            {s.recoveryRecommendations && (
                                <div className="bg-yellow-50 rounded-xl p-3">
                                    <p className="text-xs font-medium text-yellow-700 mb-1">Recomendaciones de recuperacion</p>
                                    <p className="text-sm text-yellow-800">{s.recoveryRecommendations}</p>
                                </div>
                            )}

                            {s.notes && <p className="text-xs text-gray-400 italic">{s.notes}</p>}
                        </div>
                    )}
                </div>
            ))}
        </div>
    )
}