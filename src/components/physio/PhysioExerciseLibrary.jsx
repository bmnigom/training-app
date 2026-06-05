import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const TYPES = ['Todos', 'Ejercicio', 'Procedimiento clinico', 'Rehabilitacion']
const MUSCLE_GROUPS = ['Core', 'Cuadriceps', 'Isquiotibiales', 'Gluteo', 'Pantorrilla', 'Pecho', 'Espalda', 'Hombro', 'Brazo', 'Cadera', 'Columna', 'Tobillo', 'Rodilla', 'General']
const EMPTY_FORM = { name: '', type: 'Ejercicio', muscleGroup: '', description: '', objective: '', videoUrl: '', executionTime: '', restTime: '' }

const TYPE_COLORS = {
    'Ejercicio': 'bg-blue-50 text-blue-700',
    'Procedimiento clinico': 'bg-purple-50 text-purple-700',
    'Rehabilitacion': 'bg-teal-50 text-teal-700',
}

export default function PhysioExerciseLibrary() {
    const [exercises, setExercises] = useState([])
    const [loading, setLoading] = useState(true)
    const [filterType, setFilterType] = useState('Todos')
    const [search, setSearch] = useState('')
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchExercises() }, [])

    async function fetchExercises() {
        const snap = await getDocs(collection(db, 'physioExercises'))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => a.name.localeCompare(b.name))
        setExercises(data)
        setLoading(false)
    }

    function openNew() {
        setForm(EMPTY_FORM)
        setEditingId(null)
        setShowForm(true)
    }

    function openEdit(ex) {
        setForm({
            name: ex.name || '',
            type: ex.type || 'Ejercicio',
            muscleGroup: ex.muscleGroup || '',
            description: ex.description || '',
            objective: ex.objective || '',
            videoUrl: ex.videoUrl || '',
            executionTime: ex.executionTime || '',
            restTime: ex.restTime || '',
        })
        setEditingId(ex.id)
        setShowForm(true)
    }

    async function handleSave() {
        if (!form.name.trim()) return
        setSaving(true)
        try {
            if (editingId) {
                await updateDoc(doc(db, 'physioExercises', editingId), { ...form, updatedAt: serverTimestamp() })
            } else {
                await addDoc(collection(db, 'physioExercises'), { ...form, createdAt: serverTimestamp() })
            }
            await fetchExercises()
            setShowForm(false)
            setForm(EMPTY_FORM)
            setEditingId(null)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const filtered = exercises.filter(ex => {
        const matchType = filterType === 'Todos' || ex.type === filterType
        const matchSearch = ex.name.toLowerCase().includes(search.toLowerCase())
        return matchType && matchSearch
    })

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (showForm) {
        return (
            <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar' : 'Nuevo'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Nombre del procedimiento o ejercicio" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option>Ejercicio</option>
                                <option>Procedimiento clinico</option>
                                <option>Rehabilitacion</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Zona muscular</label>
                            <select value={form.muscleGroup} onChange={e => setForm({ ...form, muscleGroup: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500">
                                <option value="">Selecciona...</option>
                                {MUSCLE_GROUPS.map(g => <option key={g}>{g}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo</label>
                        <input type="text" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="Para que se utiliza" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion / Protocolo</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 resize-none" placeholder="Descripcion detallada del procedimiento o ejecucion" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tiempo ejecucion (seg)</label>
                            <input type="number" value={form.executionTime} onChange={e => setForm({ ...form, executionTime: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="30" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Descanso (seg)</label>
                            <input type="number" value={form.restTime} onChange={e => setForm({ ...form, restTime: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="60" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Video de referencia (YouTube)</label>
                        <input type="url" value={form.videoUrl} onChange={e => setForm({ ...form, videoUrl: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" placeholder="https://youtube.com/watch?v=..." />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !form.name.trim()} className="flex-1 bg-teal-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-teal-700 transition disabled:opacity-40">{saving ? 'Guardando...' : 'Guardar'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Biblioteca fisio</h2>
                    <p className="text-xs text-gray-400">{exercises.length} procedimientos y ejercicios</p>
                </div>
                <button onClick={openNew} className="bg-teal-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-teal-700 transition">+ Nuevo</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                <div className="flex gap-2 flex-wrap">
                    {TYPES.map(t => (
                        <button key={t} onClick={() => setFilterType(t)} className={"px-3 py-1 rounded-full text-xs font-medium border transition " + (filterType === t ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400')}>{t}</button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                {filtered.map(ex => (
                    <div key={ex.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                                <p className="font-medium text-gray-800 text-sm">{ex.name}</p>
                                <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (TYPE_COLORS[ex.type] || 'bg-gray-100 text-gray-600')}>{ex.type}</span>
                                {ex.muscleGroup && <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{ex.muscleGroup}</span>}
                            </div>
                            {ex.objective && <p className="text-xs text-gray-500 mt-1 italic">{ex.objective}</p>}
                            {ex.videoUrl && (
                                <a href={ex.videoUrl} target="_blank" rel="noreferrer" className="text-xs text-teal-500 hover:underline mt-1 inline-block">Ver video</a>
                            )}
                        </div>
                        <button onClick={() => openEdit(ex)} className="text-xs text-gray-400 hover:text-teal-600 transition shrink-0">Editar</button>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">Sin resultados</p>}
            </div>
        </div>
    )
}