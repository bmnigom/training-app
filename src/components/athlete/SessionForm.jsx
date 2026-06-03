import { useState } from 'react'
import { collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const SESSION_TYPES = [
    'Fuerza',
    'Balonmano — técnico-táctico',
    'Mixto (fuerza + deporte)',
    'Velocidad y salto',
    'Fisioterapia',
    'Otro',
]

const RPE_SCALES = {
    rpe10: { label: 'RPE 1-10', min: 1, max: 10, step: 1 },
    rpe20: { label: 'Borg 6-20', min: 6, max: 20, step: 1 },
    percent: { label: 'Esfuerzo %', min: 0, max: 100, step: 5 },
}

const EMPTY_EXERCISE = {
    name: '', sets: '', reps: '', weight: '', unit: 'kg', notes: ''
}

export default function SessionForm() {
    const { user } = useAuth()
    const [sessionType, setSessionType] = useState('')
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [bodyWeight, setBodyWeight] = useState('')
    const [rpeScale, setRpeScale] = useState('rpe10')
    const [rpeValue, setRpeValue] = useState(5)
    const [duration, setDuration] = useState('')
    const [exercises, setExercises] = useState([{ ...EMPTY_EXERCISE }])
    const [notes, setNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    function addExercise() {
        setExercises([...exercises, { ...EMPTY_EXERCISE }])
    }

    function removeExercise(index) {
        setExercises(exercises.filter((_, i) => i !== index))
    }

    function updateExercise(index, field, value) {
        const updated = [...exercises]
        updated[index][field] = value
        setExercises(updated)
    }

    async function handleSubmit() {
        if (!sessionType || !date) return
        setSaving(true)
        try {
            await addDoc(collection(db, 'sessions'), {
                userId: user.uid,
                date,
                sessionType,
                bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
                rpe: { scale: rpeScale, value: rpeValue },
                duration: duration ? parseInt(duration) : null,
                exercises: exercises.filter(e => e.name.trim() !== ''),
                notes,
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
            setExercises([{ ...EMPTY_EXERCISE }])
            setNotes('')
            setBodyWeight('')
            setDuration('')
            setRpeValue(5)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const scale = RPE_SCALES[rpeScale]

    return (
        <div className="space-y-6">
            {/* Info básica */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <h2 className="font-bold text-gray-800">Información de la sesión</h2>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                        <input
                            type="date"
                            value={date}
                            onChange={e => setDate(e.target.value)}
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Duración (min)</label>
                        <input
                            type="number"
                            value={duration}
                            onChange={e => setDuration(e.target.value)}
                            placeholder="90"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de sesión</label>
                    <select
                        value={sessionType}
                        onChange={e => setSessionType(e.target.value)}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecciona un tipo...</option>
                        {SESSION_TYPES.map(t => (
                            <option key={t} value={t}>{t}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Peso corporal (kg)</label>
                    <input
                        type="number"
                        value={bodyWeight}
                        onChange={e => setBodyWeight(e.target.value)}
                        placeholder="75.5"
                        step="0.1"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            </div>

            {/* RPE */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                <h2 className="font-bold text-gray-800">Carga interna (RPE)</h2>
                <div className="flex gap-2">
                    {Object.entries(RPE_SCALES).map(([key, s]) => (
                        <button
                            key={key}
                            onClick={() => { setRpeScale(key); setRpeValue(s.min) }}
                            className={`flex-1 py-1.5 rounded-lg text-xs font-medium border transition ${
                                rpeScale === key
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400'
                            }`}
                        >
                            {s.label}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-4">
                    <input
                        type="range"
                        min={scale.min}
                        max={scale.max}
                        step={scale.step}
                        value={rpeValue}
                        onChange={e => setRpeValue(Number(e.target.value))}
                        className="flex-1"
                    />
                    <span className="text-2xl font-bold text-blue-600 min-w-[3rem] text-right">
            {rpeValue}
          </span>
                </div>
                <p className="text-xs text-gray-400">{scale.label}: {scale.min} (mínimo) → {scale.max} (máximo)</p>
            </div>

            {/* Ejercicios */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-800">Ejercicios</h2>
                    <button
                        onClick={addExercise}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                    >
                        + Agregar
                    </button>
                </div>

                {exercises.map((ex, i) => (
                    <div key={i} className="border border-gray-100 rounded-xl p-4 space-y-3 bg-gray-50">
                        <div className="flex items-center justify-between">
                            <span className="text-xs font-medium text-gray-500">Ejercicio {i + 1}</span>
                            {exercises.length > 1 && (
                                <button
                                    onClick={() => removeExercise(i)}
                                    className="text-xs text-red-400 hover:text-red-600"
                                >
                                    Eliminar
                                </button>
                            )}
                        </div>
                        <input
                            type="text"
                            value={ex.name}
                            onChange={e => updateExercise(i, 'name', e.target.value)}
                            placeholder="Nombre del ejercicio"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                        <div className="grid grid-cols-3 gap-2">
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Series</label>
                                <input
                                    type="number"
                                    value={ex.sets}
                                    onChange={e => updateExercise(i, 'sets', e.target.value)}
                                    placeholder="4"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Reps</label>
                                <input
                                    type="number"
                                    value={ex.reps}
                                    onChange={e => updateExercise(i, 'reps', e.target.value)}
                                    placeholder="8"
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                            <div>
                                <label className="block text-xs text-gray-500 mb-1">Carga</label>
                                <div className="flex gap-1">
                                    <input
                                        type="number"
                                        value={ex.weight}
                                        onChange={e => updateExercise(i, 'weight', e.target.value)}
                                        placeholder="80"
                                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                    <select
                                        value={ex.unit}
                                        onChange={e => updateExercise(i, 'unit', e.target.value)}
                                        className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none"
                                    >
                                        <option>kg</option>
                                        <option>lb</option>
                                        <option>%</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                        <input
                            type="text"
                            value={ex.notes}
                            onChange={e => updateExercise(i, 'notes', e.target.value)}
                            placeholder="Notas del ejercicio (opcional)"
                            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                    </div>
                ))}
            </div>

            {/* Notas */}
            <div className="bg-white rounded-2xl border border-gray-200 p-5">
                <h2 className="font-bold text-gray-800 mb-3">Notas de la sesión</h2>
                <textarea
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="¿Cómo te sentiste? ¿Algo importante a destacar?"
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            {/* Guardar */}
            <button
                onClick={handleSubmit}
                disabled={saving || !sessionType}
                className={`w-full py-3 rounded-2xl font-medium text-sm transition ${
                    saved
                        ? 'bg-green-500 text-white'
                        : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40'
                }`}
            >
                {saved ? '✓ Sesión guardada' : saving ? 'Guardando...' : 'Guardar sesión'}
            </button>
        </div>
    )
}