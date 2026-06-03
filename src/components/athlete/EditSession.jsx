import { useState } from 'react'
import { doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const RPE_SCALES = {
    rpe10: { label: 'RPE 1-10', min: 1, max: 10 },
    rpe20: { label: 'Borg 6-20', min: 6, max: 20 },
    percent: { label: 'Esfuerzo %', min: 0, max: 100 },
}

export default function EditSession({ session, onBack, onDeleted }) {
    const [execData, setExecData] = useState(session.exercises || [])
    const [rpeScale, setRpeScale] = useState(session.rpe?.scale || 'rpe10')
    const [rpeValue, setRpeValue] = useState(session.rpe?.value || 5)
    const [bodyWeight, setBodyWeight] = useState(session.bodyWeight || '')
    const [sessionNotes, setSessionNotes] = useState(session.notes || '')
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(false)

    function updateActual(index, field, value) {
        const updated = [...execData]
        updated[index].actual[field] = value
        setExecData(updated)
    }

    async function handleSave() {
        setSaving(true)
        try {
            await updateDoc(doc(db, 'executedSessions', session.id), {
                bodyWeight: bodyWeight ? parseFloat(bodyWeight) : null,
                rpe: { scale: rpeScale, value: rpeValue },
                exercises: execData,
                notes: sessionNotes,
                updatedAt: serverTimestamp(),
            })
            setSaved(true)
            setTimeout(() => { setSaved(false); onBack() }, 1500)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    async function handleDelete() {
        setDeleting(true)
        try {
            await deleteDoc(doc(db, 'executedSessions', session.id))
            onDeleted()
        } catch (err) {
            console.error(err)
            setDeleting(false)
        }
    }

    const scale = RPE_SCALES[rpeScale]

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                <div className="flex-1">
                    <h2 className="font-bold text-gray-800 text-lg">Editar sesion</h2>
                    <p className="text-xs text-gray-400">{session.date} · {session.sessionType}</p>
                </div>
                <button
                    onClick={() => setConfirmDelete(true)}
                    className="text-xs text-red-400 hover:text-red-600 border border-red-200 px-3 py-1.5 rounded-lg transition"
                >
                    Eliminar
                </button>
            </div>

            {confirmDelete && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">Eliminar esta sesion permanentemente?</p>
                    <p className="text-xs text-red-600">Esta accion no se puede deshacer.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                        <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40">
                            {deleting ? 'Eliminando...' : 'Si, eliminar'}
                        </button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <h3 className="font-bold text-gray-800 text-sm">Datos generales</h3>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Peso corporal (kg)</label>
                    <input
                        type="number"
                        value={bodyWeight}
                        onChange={e => setBodyWeight(e.target.value)}
                        step="0.1"
                        placeholder="75.5"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div>
                    <p className="text-xs font-medium text-gray-600 mb-2">Escala RPE</p>
                    <div className="flex gap-2 mb-3">
                        {Object.entries(RPE_SCALES).map(([key, s]) => (
                            <button
                                key={key}
                                onClick={() => { setRpeScale(key); setRpeValue(s.min) }}
                                className={"flex-1 py-1.5 rounded-lg text-xs font-medium border transition " + (rpeScale === key ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300')}
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
                            value={rpeValue}
                            onChange={e => setRpeValue(Number(e.target.value))}
                            className="flex-1"
                        />
                        <span className="text-2xl font-bold text-blue-600 min-w-[2.5rem] text-right">{rpeValue}</span>
                    </div>
                </div>
            </div>

            {execData.map((ex, i) => (
                <div key={i} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                    <p className="font-medium text-gray-800 text-sm">{ex.exerciseName}</p>
                    {ex.prescribed && ex.prescribed.sets && (
                        <div className="bg-gray-50 rounded-xl p-3">
                            <p className="text-xs font-medium text-gray-500 mb-1">Prescrito</p>
                            <div className="flex gap-4 text-xs text-gray-600">
                                {ex.prescribed.sets && <span>{ex.prescribed.sets} series</span>}
                                {ex.prescribed.reps && <span>{ex.prescribed.reps} reps</span>}
                                {ex.prescribed.load && <span>{ex.prescribed.load} {ex.prescribed.unit}</span>}
                            </div>
                        </div>
                    )}
                    <p className="text-xs font-medium text-gray-600">Ejecutado</p>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Series</label>
                            <input
                                type="number"
                                value={ex.actual?.sets || ''}
                                onChange={e => updateActual(i, 'sets', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Reps</label>
                            <input
                                type="number"
                                value={ex.actual?.reps || ''}
                                onChange={e => updateActual(i, 'reps', e.target.value)}
                                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                        <div>
                            <label className="block text-xs text-gray-500 mb-1">Carga real</label>
                            <div className="flex gap-1">
                                <input
                                    type="number"
                                    value={ex.actual?.load || ''}
                                    onChange={e => updateActual(i, 'load', e.target.value)}
                                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                                <select
                                    value={ex.actual?.unit || 'kg'}
                                    onChange={e => updateActual(i, 'unit', e.target.value)}
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
                        value={ex.actual?.notes || ''}
                        onChange={e => updateActual(i, 'notes', e.target.value)}
                        placeholder="Notas del ejercicio..."
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
            ))}

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <label className="block text-xs font-medium text-gray-600 mb-2">Notas de la sesion</label>
                <textarea
                    value={sessionNotes}
                    onChange={e => setSessionNotes(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                />
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
            >
                {saved ? 'Cambios guardados' : saving ? 'Guardando...' : 'Guardar cambios'}
            </button>
        </div>
    )
}