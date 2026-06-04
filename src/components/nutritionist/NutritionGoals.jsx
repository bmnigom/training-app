import { useEffect, useState } from 'react'
import { collection, getDocs, query, where, doc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const EMPTY_GOALS = { calories: '', protein: '', carbs: '', fat: '', water: '', notes: '' }

export default function NutritionGoals() {
    const [athletes, setAthletes] = useState([])
    const [selectedAthlete, setSelectedAthlete] = useState(null)
    const [goals, setGoals] = useState(EMPTY_GOALS)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => { fetchAthletes() }, [])

    async function fetchAthletes() {
        const snap = await getDocs(query(collection(db, 'users'), where('role', '==', 'athlete')))
        setAthletes(snap.docs.map(d => ({ uid: d.id, ...d.data() })))
        setLoading(false)
    }

    async function fetchGoals(athleteUid) {
        const snap = await getDocs(query(collection(db, 'nutritionGoals'), where('athleteUid', '==', athleteUid)))
        if (!snap.empty) {
            const data = snap.docs[0].data()
            setGoals({
                calories: data.calories || '',
                protein: data.protein || '',
                carbs: data.carbs || '',
                fat: data.fat || '',
                water: data.water || '',
                notes: data.notes || '',
            })
        } else {
            setGoals(EMPTY_GOALS)
        }
    }

    async function handleSelectAthlete(athlete) {
        setSelectedAthlete(athlete)
        await fetchGoals(athlete.uid)
    }

    async function handleSave() {
        if (!selectedAthlete || !goals.calories) return
        setSaving(true)
        try {
            await setDoc(doc(db, 'nutritionGoals', selectedAthlete.uid), {
                athleteUid: selectedAthlete.uid,
                athleteEmail: selectedAthlete.email,
                calories: parseFloat(goals.calories),
                protein: parseFloat(goals.protein) || 0,
                carbs: parseFloat(goals.carbs) || 0,
                fat: parseFloat(goals.fat) || 0,
                water: parseFloat(goals.water) || 0,
                notes: goals.notes,
                updatedAt: serverTimestamp(),
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    return (
        <div className="space-y-4">
            <div>
                <h2 className="font-bold text-gray-800 text-lg">Metas nutricionales por atleta</h2>
                <p className="text-xs text-gray-400 mt-0.5">Define los objetivos diarios de macronutrientes para cada atleta</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Selecciona el atleta</label>
                <div className="space-y-2">
                    {athletes.length === 0 && <p className="text-sm text-gray-400">No hay atletas registrados</p>}
                    {athletes.map(a => (
                        <div
                            key={a.uid}
                            onClick={() => handleSelectAthlete(a)}
                            className={"p-3 rounded-xl border cursor-pointer transition " + (selectedAthlete?.uid === a.uid ? 'border-blue-400 bg-blue-50' : 'border-gray-200 hover:border-blue-300')}
                        >
                            <p className="text-sm font-medium text-gray-800">{a.email}</p>
                        </div>
                    ))}
                </div>
            </div>

            {selectedAthlete && (
                <>
                    <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                        <p className="text-sm font-bold text-gray-800">Metas diarias para {selectedAthlete.email}</p>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Calorias totales (kcal) *</label>
                            <input type="number" value={goals.calories} onChange={e => setGoals({ ...goals, calories: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="2500" />
                        </div>
                        <div className="grid grid-cols-3 gap-3">
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Proteina (g)</label>
                                <input type="number" value={goals.protein} onChange={e => setGoals({ ...goals, protein: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="180" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Carbos (g)</label>
                                <input type="number" value={goals.carbs} onChange={e => setGoals({ ...goals, carbs: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="280" />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-600 mb-1">Grasa (g)</label>
                                <input type="number" value={goals.fat} onChange={e => setGoals({ ...goals, fat: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="70" />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Agua diaria (litros)</label>
                            <input type="number" value={goals.water} onChange={e => setGoals({ ...goals, water: e.target.value })} step="0.5" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="3.0" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Recomendaciones generales</label>
                            <textarea value={goals.notes} onChange={e => setGoals({ ...goals, notes: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Indicaciones especiales, suplementacion recomendada, restricciones..." />
                        </div>
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving || !goals.calories}
                        className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
                    >
                        {saved ? 'Metas guardadas' : saving ? 'Guardando...' : 'Guardar metas'}
                    </button>
                </>
            )}
        </div>
    )
}