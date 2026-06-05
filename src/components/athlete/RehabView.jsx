import { useEffect, useState } from 'react'
import { collection, query, where, getDocs, updateDoc, doc, arrayUnion } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

export default function RehabView() {
    const { user } = useAuth()
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [completing, setCompleting] = useState({})

    useEffect(() => { fetchPrescriptions() }, [])

    async function fetchPrescriptions() {
        const snap = await getDocs(
            query(collection(db, 'rehabPrescriptions'),
                where('athleteUid', '==', user.uid),
                where('active', '==', true)
            )
        )
        setPrescriptions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    async function markCompleted(id) {
        setCompleting(prev => ({ ...prev, [id]: true }))
        const today = new Date().toISOString().split('T')[0]
        try {
            await updateDoc(doc(db, 'rehabPrescriptions', id), {
                completedDates: arrayUnion(today)
            })
            setPrescriptions(prev => prev.map(p =>
                p.id === id
                    ? { ...p, completedDates: [...(p.completedDates || []), today] }
                    : p
            ))
        } catch (err) {
            console.error(err)
        }
        setCompleting(prev => ({ ...prev, [id]: false }))
    }

    const today = new Date().toISOString().split('T')[0]

    if (loading) return <p className="text-center text-gray-400 py-8">Cargando...</p>

    if (prescriptions.length === 0) return (
        <div className="text-center text-gray-400 py-8">
            <p className="font-medium">Sin ejercicios de rehabilitacion</p>
            <p className="text-sm mt-1">Tu fisioterapeuta no ha prescrito ejercicios aun</p>
        </div>
    )

    return (
        <div className="space-y-3">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ejercicios de rehabilitacion activos</p>
            {prescriptions.map(p => {
                const doneToday = p.completedDates?.includes(today)
                return (
                    <div key={p.id} className={"bg-white rounded-2xl border p-4 space-y-3 " + (doneToday ? 'border-green-200' : 'border-gray-200')}>
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-medium text-gray-800 text-sm">{p.exerciseName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{p.frequency} · {p.sets && p.reps ? p.sets + ' series x ' + p.reps + ' reps' : ''}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-teal-600 font-medium">{p.completedDates?.length || 0}x completado</p>
                                {p.endDate && <p className="text-xs text-gray-400 mt-0.5">Hasta {p.endDate}</p>}
                            </div>
                        </div>
                        {p.notes && (
                            <div className="bg-teal-50 rounded-xl p-3">
                                <p className="text-xs font-medium text-teal-700 mb-1">Indicaciones del fisio</p>
                                <p className="text-xs text-teal-700">{p.notes}</p>
                            </div>
                        )}
                        <button
                            onClick={() => !doneToday && markCompleted(p.id)}
                            disabled={doneToday || completing[p.id]}
                            className={"w-full py-2 rounded-xl text-sm font-medium transition " + (doneToday ? 'bg-green-100 text-green-700 cursor-default' : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40')}
                        >
                            {doneToday ? 'Completado hoy' : completing[p.id] ? 'Guardando...' : 'Marcar como completado hoy'}
                        </button>
                    </div>
                )
            })}
        </div>
    )
}