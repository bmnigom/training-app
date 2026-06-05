import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const FREQUENCIES = ['1x por dia', '2x por dia', '3x por semana', '2x por semana', 'Segun tolerancia']

export default function RehabPrescription({ athlete }) {
    const { user } = useAuth()
    const [exercises, setExercises] = useState([])
    const [prescriptions, setPrescriptions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [form, setForm] = useState({
        exerciseId: '', exerciseName: '', sets: '', reps: '',
        frequency: '1x por dia', startDate: new Date().toISOString().split('T')[0],
        endDate: '', notes: '',
    })

    useEffect(() => { fetchAll() }, [athlete])

    async function fetchAll() {
        setLoading(true)
        const [exSnap, prescSnap] = await Promise.all([
            getDocs(query(collection(db, 'physioExercises'), where('type', '==', 'Rehabilitacion'))),
            getDocs(query(collection(db, 'rehabPrescriptions'), where('athleteUid', '==', athlete.uid))),
        ])
        setExercises(exSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
        const prescs = prescSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        prescs.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        setPrescriptions(prescs)
        setLoading(false)
    }

    async function handleSave() {
        if (!form.exerciseId || !form.startDate) return
        setSaving(true)
        try {
            await addDoc(collection(db, 'rehabPrescriptions'), {
                athleteUid: athlete.uid,
                athleteEmail: athlete.email,
                physioUid: user.uid,
                physioEmail: user.email,
                exerciseId: form.exerciseId,
                exerciseName: form.exerciseName,
                sets: form.sets,
                reps: form.reps,
                frequency: form.frequency,
                startDate: form.startDate,
                endDate: form.endDate,
                notes: form.notes,
                completedDates: [],
                active: true,
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            await fetchAll()
            setTimeout(() => {
                setSaved(false)
                setShowForm(false)
                setForm({ exerciseId: '', exerciseName: '', sets: '', reps: '', frequency: '1x por dia', startDate: new Date().toISOString().split('T')[0], endDate: '', notes: '' })
            }, 1500)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-8">Cargando...</p>

    if (showForm) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800">Prescribir ejercicio de rehab</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ejercicio de rehabilitacion</label>
                        {exercises.length === 0 ? (
                            <p className="text-xs text-yellow-600 bg-yellow-50 p-3 rounded-lg">No hay ejercicios de rehabilitacion en la biblioteca. Agrega primero desde la pestana Biblioteca.</p>
                        ) : (
                            <select
                                value={form.exerciseId}
                                onChange={e => {
                                    const found = exercises.find(ex => ex.id === e.target.value)
                                    setForm({ ...form, exerciseId: e.target.value, exerciseName: found?.name || '' })
                                }}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                            >
                                <option value="">Selecciona un ejercicio...</option>
                                {exercises.map(ex => <option key={ex.id} value={ex.id}>{ex.name}</option>)}
                            </select>
                        )}
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Series</label>
                            <input type="number" value={form.sets} onChange={e => setForm({ ...form, sets: e.target.value })} placeholder="3" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Repeticiones</label>
                            <input type="number" value={form.reps} onChange={e => setForm({ ...form, reps: e.target.value })} placeholder="15" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Frecuencia</label>
                        <select value={form.frequency} onChange={e => setForm({ ...form, frequency: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                            {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio</label>
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin</label>
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Indicaciones para el atleta</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="Como debe ejecutar el ejercicio, que sensaciones son normales..." />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !form.exerciseId} className={"flex-1 rounded-xl py-2 text-sm font-medium transition " + (saved ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40')}>{saved ? 'Prescrito' : saving ? 'Guardando...' : 'Prescribir ejercicio'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800">Rehabilitacion de {athlete.email}</h3>
                    <p className="text-xs text-gray-400">{prescriptions.length} prescripciones</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition">+ Prescribir</button>
            </div>
            {prescriptions.length === 0 && (
                <div className="text-center text-gray-400 py-8">
                    <p className="font-medium">Sin prescripciones activas</p>
                    <p className="text-sm mt-1">Prescribe ejercicios de rehabilitacion al atleta</p>
                </div>
            )}
            <div className="space-y-3">
                {prescriptions.map(p => (
                    <div key={p.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-medium text-gray-800 text-sm">{p.exerciseName}</p>
                                <p className="text-xs text-gray-400 mt-0.5">{p.frequency} · {p.sets && p.reps ? p.sets + 'x' + p.reps : ''}</p>
                            </div>
                            <div className="text-right">
                                <p className="text-xs text-gray-400">{p.startDate}{p.endDate ? ' → ' + p.endDate : ''}</p>
                                <span className={"text-xs px-2 py-0.5 rounded-full mt-1 inline-block " + (p.active ? 'bg-teal-50 text-teal-700' : 'bg-gray-100 text-gray-400')}>
                  {p.active ? 'Activo' : 'Finalizado'}
                </span>
                            </div>
                        </div>
                        {p.notes && <p className="text-xs text-gray-500 italic">{p.notes}</p>}
                        <p className="text-xs text-teal-600">{p.completedDates?.length || 0} veces completado</p>
                    </div>
                ))}
            </div>
        </div>
    )
}