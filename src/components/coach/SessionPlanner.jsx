import { useEffect, useState } from 'react'
import { doc, updateDoc, getDocs, collection, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const EMPTY_EX = { exerciseId: '', exerciseName: '', sets: '', reps: '', load: '', unit: 'kg', rpeTarget: '', restTime: '', notes: '' }

export default function SessionPlanner({ session, mesocycle, onBack }) {
    const [exercises, setExercises] = useState(session.exercises && session.exercises.length > 0 ? session.exercises : [{ ...EMPTY_EX }])
    const [library, setLibrary] = useState([])
    const [templates, setTemplates] = useState([])
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [savingTemplate, setSavingTemplate] = useState(false)
    const [savedTemplate, setSavedTemplate] = useState(false)
    const [templateName, setTemplateName] = useState('')
    const [showTemplateForm, setShowTemplateForm] = useState(false)
    const [showTemplateList, setShowTemplateList] = useState(false)
    const [loadingLib, setLoadingLib] = useState(true)

    useEffect(() => { fetchLibraryAndTemplates() }, [])

    async function fetchLibraryAndTemplates() {
        const [exSnap, tmSnap] = await Promise.all([
            getDocs(collection(db, 'exercises')),
            getDocs(collection(db, 'sessionTemplates')),
        ])
        const exData = exSnap.docs.map(d => ({ id: d.id, ...d.data() }))
        exData.sort((a, b) => a.name.localeCompare(b.name))
        setLibrary(exData)
        setTemplates(tmSnap.docs.map(d => ({ id: d.id, ...d.data() })))
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

    function applyTemplate(template) {
        setExercises(template.exercises || [])
        setShowTemplateList(false)
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

    async function handleSaveTemplate() {
        if (!templateName.trim()) return
        setSavingTemplate(true)
        try {
            await addDoc(collection(db, 'sessionTemplates'), {
                name: templateName,
                sessionType: session.type,
                exercises,
                createdAt: serverTimestamp(),
            })
            setSavedTemplate(true)
            setShowTemplateForm(false)
            setTemplateName('')
            await fetchLibraryAndTemplates()
            setTimeout(() => setSavedTemplate(false), 3000)
        } catch (err) {
            console.error(err)
        }
        setSavingTemplate(false)
    }

    if (showTemplateList) {
        return (
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <button onClick={() => setShowTemplateList(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                    <h2 className="font-bold text-gray-800 text-lg">Usar plantilla</h2>
                </div>
                {templates.length === 0 && (
                    <div className="text-center text-gray-400 py-12">
                        <p className="font-medium">Sin plantillas guardadas</p>
                        <p className="text-sm mt-1">Diseña una sesion y guardala como plantilla</p>
                    </div>
                )}
                <div className="space-y-3">
                    {templates.map(t => (
                        <div
                            key={t.id}
                            onClick={() => applyTemplate(t)}
                            className="bg-white rounded-2xl border border-gray-200 p-4 cursor-pointer hover:border-blue-300 hover:shadow-sm transition"
                        >
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-800">{t.name}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{t.sessionType} · {t.exercises && t.exercises.length} ejercicios</p>
                                </div>
                                <p className="text-xs text-blue-500">Aplicar →</p>
                            </div>
                            {t.exercises && t.exercises.length > 0 && (
                                <div className="mt-2 space-y-0.5">
                                    {t.exercises.slice(0, 3).map((ex, i) => (
                                        <p key={i} className="text-xs text-gray-400">{ex.exerciseName}</p>
                                    ))}
                                    {t.exercises.length > 3 && (
                                        <p className="text-xs text-gray-300">+{t.exercises.length - 3} mas...</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                <div className="flex-1">
                    <h2 className="font-bold text-gray-800 text-lg">Disenar sesion</h2>
                    <p className="text-xs text-gray-400">{session.date} · {session.type}</p>
                </div>
                <button
                    onClick={() => setShowTemplateList(true)}
                    className="text-xs text-blue-600 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-50 transition"
                >
                    Usar plantilla
                </button>
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
                                        <option key={libEx.id} value={libEx.id}>{libEx.name} - {libEx.type}</option>
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

            {showTemplateForm && (
                <div className="bg-white rounded-2xl border border-blue-200 p-4 space-y-3">
                    <p className="text-sm font-medium text-gray-800">Nombre de la plantilla</p>
                    <input
                        type="text"
                        value={templateName}
                        onChange={e => setTemplateName(e.target.value)}
                        placeholder="Ej: Fuerza tren inferior semana 1"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <div className="flex gap-2">
                        <button onClick={() => setShowTemplateForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                        <button
                            onClick={handleSaveTemplate}
                            disabled={savingTemplate || !templateName.trim()}
                            className={"flex-1 rounded-xl py-2 text-sm font-medium transition " + (savedTemplate ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
                        >
                            {savedTemplate ? 'Guardada' : savingTemplate ? 'Guardando...' : 'Guardar plantilla'}
                        </button>
                    </div>
                </div>
            )}

            <div className="flex gap-3">
                {!showTemplateForm && (
                    <button
                        onClick={() => setShowTemplateForm(true)}
                        disabled={exercises.length === 0 || !exercises[0].exerciseName}
                        className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2.5 text-sm hover:bg-gray-50 transition disabled:opacity-40"
                    >
                        Guardar como plantilla
                    </button>
                )}
                <button
                    onClick={handleSave}
                    disabled={saving || exercises.length === 0}
                    className={"flex-1 py-2.5 rounded-xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
                >
                    {saved ? 'Sesion guardada' : saving ? 'Guardando...' : 'Guardar sesion'}
                </button>
            </div>
        </div>
    )
}