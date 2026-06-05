import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'

const TYPE_COLORS = {
    'Ejercicio': 'bg-blue-50 text-blue-700',
    'Procedimiento clinico': 'bg-purple-50 text-purple-700',
    'Rehabilitacion': 'bg-teal-50 text-teal-700',
}

export default function PhysioProceduresView({ athlete }) {
    const [sessions, setSessions] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [expanded, setExpanded] = useState(null)

    useEffect(() => { fetchAll() }, [athlete])

    async function fetchAll() {
        setLoading(true)
        const [sessSnap, prescSnap] = await Promise.all([
            getDocs(query(collection(db, 'physioSessions'), where('athleteUid', '==', athlete.uid), orderBy('date', 'desc'))),
            getDocs(query(collection(db, 'rehabPrescriptions'), where('athleteUid', '==', athlete.uid))),
        ])
        setSessions(sessSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setPrescriptions(prescSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-8">Cargando...</p>

    return (
        <div className="space-y-4">
            <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-3">
                <p className="text-xs text-yellow-700 font-medium">Vista de solo lectura — informacion del fisioterapeuta</p>
            </div>

            {prescriptions.length > 0 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Rehabilitacion activa</p>
                    {prescriptions.map(p => (
                        <div key={p.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-800">{p.exerciseName}</p>
                                <p className="text-xs text-gray-400">{p.frequency} · {p.startDate}{p.endDate ? ' → ' + p.endDate : ''}</p>
                            </div>
                            <span className={"text-xs px-2 py-0.5 rounded-full " + (p.active ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-400')}>
                {p.active ? 'Activo' : 'Finalizado'}
              </span>
                        </div>
                    ))}
                </div>
            )}

            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Sesiones de fisioterapia</p>
                {sessions.length === 0 && <p className="text-sm text-gray-400 py-4 text-center">Sin sesiones registradas</p>}
                {sessions.map(s => (
                    <div key={s.id} className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                        <div onClick={() => setExpanded(expanded === s.id ? null : s.id)} className="p-3 cursor-pointer hover:bg-gray-50 transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{s.date}</p>
                                    <p className="text-xs text-gray-400">{s.exercises?.length || 0} procedimientos · {s.totalVolume ? s.totalVolume.toLocaleString() + ' kg' : ''}</p>
                                </div>
                                <div className="flex gap-1 flex-wrap justify-end">
                                    {s.muscleGroupSummary && Object.keys(s.muscleGroupSummary).slice(0, 3).map(g => (
                                        <span key={g} className="text-xs bg-teal-50 text-teal-700 px-2 py-0.5 rounded-full">{g}</span>
                                    ))}
                                </div>
                            </div>
                        </div>
                        {expanded === s.id && (
                            <div className="border-t border-gray-100 p-3 space-y-2">
                                {s.exercises?.map((ex, i) => (
                                    <div key={i} className="flex items-center justify-between text-xs">
                                        <span className="text-gray-700">{ex.exerciseName}</span>
                                        <span className={"px-2 py-0.5 rounded-full " + (TYPE_COLORS[ex.type] || 'bg-gray-100 text-gray-500')}>
                      {ex.type || 'Ejercicio'}
                    </span>
                                    </div>
                                ))}
                                {s.recoveryRecommendations && (
                                    <div className="bg-yellow-50 rounded-lg p-2 mt-2">
                                        <p className="text-xs font-medium text-yellow-700 mb-1">Recomendaciones</p>
                                        <p className="text-xs text-yellow-700">{s.recoveryRecommendations}</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}