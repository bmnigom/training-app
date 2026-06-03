import { useEffect, useState } from 'react'
import { doc, updateDoc, getDocs, collection } from 'firebase/firestore'
import { db } from '../../firebase/config'

const EMPTY_EX = { exerciseId: '', exerciseName: '', sets: '', reps: '', load: '', unit: 'kg', rpeTarget: '', restTime: '', notes: '' }

export default function SessionPlanner({ session, mesocycle, onBack }) {
    const [exercises, setExercises] = useState(session.exercises || [])
    const [library, setLibrary] = useState([])
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [loadingLib, setLoadingLib] = useState(true)

    useEffect(() => { fetchLibrary() }, [])

    async function fetchLibrary() {
        const snap = await getDocs(collection(db, 'exercises'))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => a.name.localeCompare(b.name))
        setLibrary(data)
        setLoadingLib(false)
    }

    function addExercise() {
        setExercises([...exercises, { ...EMPTY_EX }])
    }

    function removeExercise(index) {
        setExercises(exercises.filter((_, i) => i !== index))
    }

    function updateExercise(index, field, value) {
        const updated = [...exercises]
        updated[index][field] = value
        if (field === 'exerciseId') {
            const found = library.find(e => e.id === value)
            if (found) updated[index].exerciseName = found.name
        }
        setExercises(updated)
    }

    async function handleSave() {
        setSaving(true)
        try {
            await updateDoc(
                doc(db, 'mesocycles', session.mesocycleId, 'plannedSessions', session.id),
                { exercises }
            )
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">← Volver</button>
                <div className="flex-1">
                    <h2 className="font-bold text-gray-800 text-lg">Disenar sesion</h2>
                    <p className="text-xs text-gray-400">{session.date} · {session.type}</p>
                </div>
            </div>

            {session.objective && (
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-700 font-medium">Objetivo</p>
                    <p className="text-sm text-blue-800">{session.objective}</p>
                </div>
            )}

            <div className="space-y-3">
                {exercises.map((ex, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Ejercicio {i + 1}</span>
                            <button onClick={() => removeExercise(i)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                        </div>

                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Seleccionar ejercicio</label>
                            {loadingLib ? (
                                <p className="text-xs text-gray-400">Cargando biblioteca...</p>
                            ) : (
                                <select
                                    value={ex.exerciseId}
                                    onChange={e => updateExercise(i, 'exerciseId', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="">Selecciona un ejercicio...</option>
                                    {library.map(libEx => (
                                        <option key={libEx.id} value={libEx.id}>{libEx.name} — {libEx.type}</option>
                                    ))}
                                </select>
                            )}
                        </div>

                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Series</label>
                                <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} placeholder="4" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Reps</label>
                                <input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} placeholder="8" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">RPE objetivo</label>
                                <input type="number" min="1" max="10" value={ex.rpeTarget} onChange={e => updateExercise(i, 'rpeTarget', e.target.value)} placeholder="7" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Carga prescrita</label>
                                <div className="flex gap-1">
                                    <input type="number" value={ex.load} onChange={e => updateExercise(i, 'load', e.target.value)} placeholder="80" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    <select value={ex.unit} onChange={e => updateExercise(i, 'unit', e.target.value)} className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none">
                                        <option>kg</option>
                                        <option>lb</option>
                                        <option>%</option>
                                        <option>seg</option>
                                    </select>
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Descanso (seg)</label>
                                <input type="number" value={ex.restTime} onChange={e => updateExercise(i, 'restTime', e.target.value)} placeholder="90" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>
                        </div>

                        <input type="text" value={ex.notes} onChange={e => updateExercise(i, 'notes', e.target.value)} placeholder="Notas para el atleta (opcional)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                ))}
            </div>

            <button onClick={addExercise} className="w-full border-2 border-dashed border-gray-300 text-gray-400 rounded-xl py-3 text-sm hover:border-blue-400 hover:text-blue-500 transition">
                + Agregar ejercicio
            </button>

            <button
                onClick={handleSave}
                disabled={saving || exercises.length === 0}
                className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
            >
                {saved ? 'Sesion guardada' : saving ? 'Guardando...' : 'Guardar sesion'}
            </button>
        </div>
    )
}