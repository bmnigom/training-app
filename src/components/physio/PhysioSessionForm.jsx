import { useState, useEffect } from 'react'
import { collection, addDoc, getDocs, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const MUSCLE_GROUPS = ['Core', 'Cuadriceps', 'Isquiotibiales', 'Gluteo', 'Pantorrilla', 'Pecho', 'Espalda', 'Hombro', 'Biceps', 'Triceps', 'Cadera', 'Columna', 'Tobillo', 'Rodilla', 'Otro']
const EMPTY_EX = { exerciseId: '', exerciseName: '', muscleGroup: '', sets: '', reps: '', weight: '', unit: 'kg', rir: '', rpe: '', notes: '' }

export default function PhysioSessionForm({ athlete }) {
    const { user } = useAuth()
    const [library, setLibrary] = useState([])
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [startTime, setStartTime] = useState('')
    const [endTime, setEndTime] = useState('')
    const [exercises, setExercises] = useState([{ ...EMPTY_EX }])
    const [recoveryRecs, setRecoveryRecs] = useState('')
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => { fetchLibrary() }, [])

    async function fetchLibrary() {
        const [physioSnap, exSnap] = await Promise.all([
            getDocs(collection(db, 'physioExercises')),
            getDocs(collection(db, 'exercises')),
        ])
        const physio = physioSnap.docs.map(d => ({ id: d.id, source: 'physio', ...d.data() }))
        const general = exSnap.docs.map(d => ({ id: d.id, source: 'general', ...d.data() })).filter(e => e.type === 'Fisioterapia')
        const all = [...physio, ...general].sort((a, b) => a.name.localeCompare(b.name))
        setLibrary(all)
    }

    function addExercise() {
        setExercises([...exercises, { ...EMPTY_EX }])
    }

    function removeExercise(i) {
        setExercises(exercises.filter((_, idx) => idx !== i))
    }

    function updateExercise(i, field, value) {
        const updated = [...exercises]
        updated[i][field] = value
        if (field === 'exerciseId') {
            const found = library.find(e => e.id === value)
            if (found) {
                updated[i].exerciseName = found.name
                updated[i].muscleGroup = found.muscleGroup || ''
            }
        }
        setExercises(updated)
    }

    function calculateVolume(ex) {
        const sets = parseFloat(ex.sets) || 0
        const reps = parseFloat(ex.reps) || 0
        const weight = parseFloat(ex.weight) || 0
        return sets * reps * weight
    }

    const totalVolume = exercises.reduce((acc, ex) => acc + calculateVolume(ex), 0)

    const muscleGroupSummary = exercises.reduce((acc, ex) => {
        if (ex.muscleGroup) {
            acc[ex.muscleGroup] = (acc[ex.muscleGroup] || 0) + calculateVolume(ex)
        }
        return acc
    }, {})

    async function handleSave() {
        setSaving(true)
        try {
            await addDoc(collection(db, 'physioSessions'), {
                physioUid: user.uid,
                physioEmail: user.email,
                athleteUid: athlete.uid,
                athleteEmail: athlete.email,
                date,
                startTime,
                endTime,
                exercises: exercises.filter(e => e.exerciseName),
                totalVolume: Math.round(totalVolume),
                muscleGroupSummary,
                recoveryRecommendations: recoveryRecs,
                notes,
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            setExercises([{ ...EMPTY_EX }])
            setRecoveryRecs('')
            setNotes('')
            setStartTime('')
            setEndTime('')
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-lg">Nueva sesion de fisioterapia</h2>
                <p className="text-xs text-teal-600 bg-teal-50 px-2 py-1 rounded-full">{athlete.email}</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-800">Informacion de la sesion</h3>
                <div className="grid grid-cols-3 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                        <input type="date" value={date} onChange={e => setDate(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hora inicio</label>
                        <input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Hora fin</label>
                        <input type="time" value={endTime} onChange={e => setEndTime(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                </div>
            </div>

            <div className="space-y-3">
                {exercises.map((ex, i) => (
                    <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Ejercicio {i + 1}</span>
                            {exercises.length > 1 && (
                                <button onClick={() => removeExercise(i)} className="text-xs text-red-400 hover:text-red-600">Eliminar</button>
                            )}
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Ejercicio</label>
                            <select value={ex.exerciseId} onChange={e => updateExercise(i, 'exerciseId', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="">Selecciona un ejercicio...</option>
                                {library.map(e => <option key={e.id} value={e.id}>{e.name}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Grupo muscular</label>
                            <select value={ex.muscleGroup} onChange={e => updateExercise(i, 'muscleGroup', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="">Selecciona...</option>
                                {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Series</label>
                                <input type="number" value={ex.sets} onChange={e => updateExercise(i, 'sets', e.target.value)} placeholder="4" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Reps</label>
                                <input type="number" value={ex.reps} onChange={e => updateExercise(i, 'reps', e.target.value)} placeholder="12" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Peso</label>
                                <div className="flex gap-1">
                                    <input type="number" value={ex.weight} onChange={e => updateExercise(i, 'weight', e.target.value)} placeholder="20" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                                    <select value={ex.unit} onChange={e => updateExercise(i, 'unit', e.target.value)} className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none">
                                        <option>kg</option>
                                        <option>lb</option>
                                        <option>%</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">RIR (0-4)</label>
                                <input type="number" min="0" max="4" value={ex.rir} onChange={e => updateExercise(i, 'rir', e.target.value)} placeholder="2" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">RPE (1-10)</label>
                                <input type="number" min="1" max="10" value={ex.rpe} onChange={e => updateExercise(i, 'rpe', e.target.value)} placeholder="7" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                            </div>
                        </div>
                        {calculateVolume(ex) > 0 && (
                            <p className="text-xs text-teal-600 font-medium">Volumen: {Math.round(calculateVolume(ex))} kg</p>
                        )}
                        <input type="text" value={ex.notes} onChange={e => updateExercise(i, 'notes', e.target.value)} placeholder="Notas del ejercicio..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                    </div>
                ))}
            </div>

            <button onClick={addExercise} className="w-full border-2 border-dashed border-gray-300 text-gray-400 rounded-xl py-3 text-sm hover:border-teal-400 hover:text-teal-500 transition">
                + Agregar ejercicio
            </button>

            {totalVolume > 0 && (
                <div className="bg-teal-50 rounded-2xl border border-teal-100 p-4 space-y-2">
                    <p className="text-sm font-bold text-teal-800">Resumen de carga</p>
                    <p className="text-xs text-teal-700">Volumen total: <span className="font-bold">{Math.round(totalVolume)} kg</span></p>
                    {Object.entries(muscleGroupSummary).map(([group, vol]) => (
                        <div key={group} className="flex justify-between text-xs text-teal-600">
                            <span>{group}</span>
                            <span className="font-medium">{Math.round(vol)} kg</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h3 className="text-sm font-bold text-gray-800">Recomendaciones de recuperacion</h3>
                <textarea
                    value={recoveryRecs}
                    onChange={e => setRecoveryRecs(e.target.value)}
                    rows={3}
                    placeholder="Ej: Aplicar hielo 15 min, reposo relativo, evitar cargas de impacto 48h..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    rows={2}
                    placeholder="Notas generales de la sesion..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none"
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving || exercises.filter(e => e.exerciseName).length === 0}
                className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-teal-600 text-white hover:bg-teal-700 disabled:opacity-40')}
            >
                {saved ? 'Sesion guardada' : saving ? 'Guardando...' : 'Guardar sesion'}
            </button>
        </div>
    )
}