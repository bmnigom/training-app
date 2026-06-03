import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const MAIN_EXERCISES = [
    'Sentadilla por detrás',
    'Sentadilla por delante',
    'Press de banca con barra',
    'Peso muerto',
    'Press militar',
    'Sentadilla búlgara',
    'Hip thrust',
]

export default function RMTracker() {
    const { user } = useAuth()
    const [records, setRecords] = useState([])
    const [exercises, setExercises] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ exerciseName: '', weight: '', unit: 'kg', date: new Date().toISOString().split('T')[0], notes: '' })
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => {
        fetchAll()
    }, [])

    async function fetchAll() {
        const [rmSnap, exSnap] = await Promise.all([
            getDocs(query(
                collection(db, 'rmRecords'),
                where('userId', '==', user.uid),
                orderBy('date', 'desc')
            )),
            getDocs(collection(db, 'exercises'))
        ])
        setRecords(rmSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        const exData = exSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        exData.sort((a, b) => a.name.localeCompare(b.name))
        setExercises(exData)
        setLoading(false)
    }

    async function handleSave() {
        if (!form.exerciseName || !form.weight) return
        setSaving(true)
        try {
            await addDoc(collection(db, 'rmRecords'), {
                userId: user.uid,
                userEmail: user.email,
                exerciseName: form.exerciseName,
                weight: parseFloat(form.weight),
                unit: form.unit,
                date: form.date,
                notes: form.notes,
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            await fetchAll()
            setTimeout(() => {
                setSaved(false)
                setShowForm(false)
                setForm({ exerciseName: '', weight: '', unit: 'kg', date: new Date().toISOString().split('T')[0], notes: '' })
            }, 1500)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const getLatestByExercise = () => {
        const map = {}
        records.forEach(r => {
            if (!map[r.exerciseName] || r.date > map[r.exerciseName].date) {
                map[r.exerciseName] = r
            }
        })
        return Object.values(map).sort((a, b) => a.exerciseName.localeCompare(b.exerciseName))
    }

    const getHistoryForExercise = (name) => records.filter(r => r.exerciseName === name)

    const [expandedExercise, setExpandedExercise] = useState(null)

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando registros...</p>

    if (showForm) {
        return (
            <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Nuevo RM</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Ejercicio *</label>
                        <select
                            value={form.exerciseName}
                            onChange={e => setForm({ ...form, exerciseName: e.target.value })}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                            <option value="">Selecciona un ejercicio...</option>
                            <optgroup label="Principales">
                                {MAIN_EXERCISES.map(ex => (
                                    <option key={ex} value={ex}>{ex}</option>
                                ))}
                            </optgroup>
                            <optgroup label="Todos los ejercicios">
                                {exercises.filter(ex => !MAIN_EXERCISES.includes(ex.name)).map(ex => (
                                    <option key={ex.id} value={ex.name}>{ex.name}</option>
                                ))}
                            </optgroup>
                        </select>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Peso 1RM *</label>
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    value={form.weight}
                                    onChange={e => setForm({ ...form, weight: e.target.value })}
                                    step="0.5"
                                    placeholder="100"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={form.unit}
                                    onChange={e => setForm({ ...form, unit: e.target.value })}
                                    className="border border-gray-300 rounded-lg px-2 py-2 text-xs focus:outline-none"
                                >
                                    <option>kg</option>
                                    <option>lb</option>
                                </select>
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                            <input
                                type="date"
                                value={form.date}
                                onChange={e => setForm({ ...form, date: e.target.value })}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas (opcional)</label>
                        <input
                            type="text"
                            value={form.notes}
                            onChange={e => setForm({ ...form, notes: e.target.value })}
                            placeholder="Condiciones, como te sentiste..."
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button
                        onClick={handleSave}
                        disabled={saving || !form.exerciseName || !form.weight}
                        className={"flex-1 rounded-xl py-2 text-sm font-medium transition " + (saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
                    >
                        {saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar RM'}
                    </button>
                </div>
            </div>
        )
    }

    const latest = getLatestByExercise()

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Registros de RM</h2>
                    <p className="text-xs text-gray-400">{latest.length} ejercicios con registro</p>
                </div>
                <button
                    onClick={() => setShowForm(true)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition"
                >
                    + Nuevo RM
                </button>
            </div>

            {latest.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="font-medium">Sin registros de RM</p>
                    <p className="text-sm mt-1">Registra tu primer maximo para hacer seguimiento</p>
                </div>
            )}

            <div className="space-y-2">
                {latest.map(record => {
                    const history = getHistoryForExercise(record.exerciseName)
                    const isExpanded = expandedExercise === record.exerciseName
                    const best = Math.max(...history.map(r => r.weight))
                    return (
                        <div key={record.exerciseName} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                            <div
                                onClick={() => setExpandedExercise(isExpanded ? null : record.exerciseName)}
                                className="p-4 cursor-pointer hover:bg-gray-50 transition"
                            >
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium text-gray-800 text-sm">{record.exerciseName}</p>
                                        <p className="text-xs text-gray-400 mt-0.5">Ultimo: {record.date}</p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-2xl font-bold text-blue-600">{record.weight}<span className="text-sm font-normal text-gray-400 ml-1">{record.unit}</span></p>
                                        {best > record.weight && (
                                            <p className="text-xs text-green-600">Mejor: {best}{record.unit}</p>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {isExpanded && history.length > 1 && (
                                <div className="border-t border-gray-100 px-4 pb-4">
                                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mt-3 mb-2">Historial</p>
                                    <div className="space-y-1">
                                        {history.map((h, i) => (
                                            <div key={h.id} className="flex items-center justify-between text-sm">
                                                <span className="text-gray-500 text-xs">{h.date}</span>
                                                <div className="flex items-center gap-2">
                                                    {i === 0 && <span className="text-xs bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Actual</span>}
                                                    {h.weight === best && i > 0 && <span className="text-xs bg-green-50 text-green-600 px-1.5 py-0.5 rounded">Mejor</span>}
                                                    <span className="font-medium text-gray-800">{h.weight} {h.unit}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}