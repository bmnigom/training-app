import { useState } from 'react'
import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const RPE_SCALES = {
    rpe10: { label: 'RPE 1-10', min: 1, max: 10 },
    rpe20: { label: 'Borg 6-20', min: 6, max: 20 },
    percent: { label: 'Esfuerzo %', min: 0, max: 100 },
}

export default function TodaySession({ session, mesocycleId, onBack }) {
    const { user } = useAuth()
    const [execData, setExecData] = useState(
        (session.exercises || []).map(ex => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            prescribed: { sets: ex.sets, reps: ex.reps, load: ex.load, unit: ex.unit, rpeTarget: ex.rpeTarget, restTime: ex.restTime },
            actual: { sets: ex.sets || '', reps: ex.reps || '', load: '', unit: ex.unit || 'kg', notes: '' },
        }))
    )
    const [rpeScale, setRpeScale] = useState('rpe10')
    const [rpeValue, setRpeValue] = useState(5)
    const [bodyWeight, setBodyWeight] = useState('')
    const [sessionNotes, setSessionNotes] = useState('')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    function updateActual(index, field, value) {
        const updated = [...execData]
        updated[index].actual[field] = value
        setExecData(updated)
    }

    async function handleSave() {
        setSaving(true)
        try {
            await addDoc(collection(db, 'executedSessions'), {
                userId: user.uid,
                userEmail: user.email,
                mesocycleId,
                plannedSessionId: session.id,
                date: session.date,
                sessionType: session.type,
                bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
                rpe: { scale: rpeScale, value: rpeValue },
                exercises: execData,
                notes: sessionNotes,
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            setTimeout(() => { setSaved(false); onBack() }, 2000)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const scale = RPE_SCALES[rpeScale]

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">← Volver</button>
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">{session.type}</h2>
                    <p className="text-xs text-gray-400">{session.date}</p>
                </div>
            </div>

            {session.objective && (
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-700 font-medium">Objetivo de la sesion</p>
                    <p className="text-sm text-blue-800">{session.objective}</p>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-bold text-gray-800 text-sm">Datos generales</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Peso corporal (kg)</label>
                    <input type="number" value={bodyWeight} onChange={e => setBodyWeight(e.target.value)} step="0.1" placeholder="75.5" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Escala RPE</p>
                    <div className="flex gap-2 mb-3">
                        {Object.entries(RPE_SCALES).map(([key, s]) => (
                            <button key={key} onClick={() => { setRpeScale(key); setRpeValue(s.min) }} className={"flex-1 py-1.5 rounded-lg text-xs font-medium border transition " + (rpeScale === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}>
                                {s.label}
                            </button>
                        ))}
                    </div>
                    <div className="flex items-center gap-4">
                        <input type="range" min={scale.min} max={scale.max} value={rpeValue} onChange={e => setRpeValue(Number(e.target.value))} className="flex-1" />
                        <span className="text-2xl font-bold text-blue-600 min-w-[2.5rem] text-right">{rpeValue}</span>
                    </div>
                </div>
            </div>

            {execData.map((ex, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                    <p className="font-medium text-gray-800 text-sm">{ex.exerciseName}</p>
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-medium text-gray-500 mb-1">Prescrito por el entrenador</p>
                        <div className="flex gap-4 text-xs text-gray-600">
                            {ex.prescribed.sets && <span>{ex.prescribed.sets} series</span>}
                            {ex.prescribed.reps && <span>{ex.prescribed.reps} reps</span>}
                            {ex.prescribed.load && <span>{ex.prescribed.load} {ex.prescribed.unit}</span>}
                            {ex.prescribed.rpeTarget && <span>RPE objetivo: {ex.prescribed.rpeTarget}</span>}
                            {ex.prescribed.restTime && <span>Descanso: {ex.prescribed.restTime}seg</span>}
                        </div>
                    </div>
                    <p className="text-xs font-medium text-gray-600">Lo que ejecutaste</p>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Series</label>
                            <input type="number" value={ex.actual.sets} onChange={e => updateActual(i, 'sets', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Reps</label>
                            <input type="number" value={ex.actual.reps} onChange={e => updateActual(i, 'reps', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Carga real</label>
                            <div className="flex gap-1">
                                <input type="number" value={ex.actual.load} onChange={e => updateActual(i, 'load', e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                <select value={ex.actual.unit} onChange={e => updateActual(i, 'unit', e.target.value)} className="border border-gray-300 rounded-lg px-1 py-2 text-xs focus:outline-none">
                                    <option>kg</option>
                                    <option>lb</option>
                                    <option>%</option>
                                </select>
                            </div>
                        </div>
                    </div>
                    <input type="text" value={ex.actual.notes} onChange={e => updateActual(i, 'notes', e.target.value)} placeholder="Notas del ejercicio (como te sentiste, dificultad...)" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
            ))}

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Notas de la sesion</label>
                <textarea value={sessionNotes} onChange={e => setSessionNotes(e.target.value)} rows={3} placeholder="Como te sentiste en general, algo importante a destacar..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
            >
                {saved ? 'Sesion registrada' : saving ? 'Guardando...' : 'Registrar sesion'}
            </button>
        </div>
    )
}