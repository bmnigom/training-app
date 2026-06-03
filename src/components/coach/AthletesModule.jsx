import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import AthleteSessionReview from './AthleteSessionReview'

export default function AthletesModule() {
    const [athletes, setAthletes] = useState([])
    const [loading, setLoading] = useState(true)
    const [selected, setSelected] = useState(null)

    useEffect(() => { fetchAthletes() }, [])

    async function fetchAthletes() {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'athlete')))
        const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
        setAthletes(data)
        setLoading(false)
    }

    if (selected) {
        return (
            <AthleteSessionReview
                athleteEmail={selected.email}
                athleteUid={selected.uid}
                onBack={() => setSelected(null)}
            />
        )
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando atletas...</p>

    if (athletes.length === 0) return (
        <div className="text-center text-gray-400 py-12">
            <p className="font-medium">Sin atletas registrados</p>
        </div>
    )

    return (
        <div className="space-y-4">
            <div>
                <h2 className="font-bold text-gray-800 text-lg">Atletas</h2>
                <p className="text-xs text-gray-400">{athletes.length} atletas registrados</p>
            </div>
            <div className="space-y-3">
                {athletes.map(athlete => (
                    <div
                        key={athlete.uid}
                        onClick={() => setSelected(athlete)}
                        className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition"
                    >
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="font-bold text-gray-800">{athlete.email}</p>
                                <p className="text-xs text-gray-400 mt-1">Atleta</p>
                            </div>
                            <p className="text-xs text-blue-500">Ver sesiones →</p>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    )
}