import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const METHODS = ['Hipertrofia', 'Fuerza maxima', 'Potencia', 'Resistencia', 'Tecnico-tactico', 'Rehabilitacion', 'Mixto']
const EMPTY_FORM = { name: '', athleteEmail: '', startDate: '', endDate: '', objective: '', method: 'Hipertrofia' }

export default function MesocycleList({ onSelect, selectedAthlete }) {
    const [mesocycles, setMesocycles] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { fetchMesocycles() }, [selectedAthlete])

    async function fetchMesocycles() {
        if (!selectedAthlete) return
        setLoading(true)
        const snap = await getDocs(
            query(
                collection(db, 'mesocycles'),
                where('athleteEmail', '==', selectedAthlete.email)
            )
        )
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        setMesocycles(data)
        setLoading(false)
    }

    function openNew() {
        setForm({ ...EMPTY_FORM, athleteEmail: selectedAthlete?.email || '' })
        setEditingId(null)
        setShowForm(true)
    }

    function openEdit(e, meso) {
        e.stopPropagation()
        setForm({
            name: meso.name || '',
            athleteEmail: meso.athleteEmail || '',
            startDate: meso.startDate || '',
            endDate: meso.endDate || '',
            objective: meso.objective || '',
            method: meso.method || 'Hipertrofia',
        })
        setEditingId(meso.id)
        setShowForm(true)
    }

    async function handleSave() {
        if (!form.name || !form.startDate || !form.endDate) return
        setSaving(true)
        try {
            if (editingId) {
                await updateDoc(doc(db, 'mesocycles', editingId), { ...form, updatedAt: serverTimestamp() })
            } else {
                await addDoc(collection(db, 'mesocycles'), { ...form, createdAt: serverTimestamp() })
            }
            await fetchMesocycles()
            setShowForm(false)
            setForm(EMPTY_FORM)
            setEditingId(null)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    async function handleDelete() {
        if (!confirmDelete) return
        setDeleting(true)
        try {
            await deleteDoc(doc(db, 'mesocycles', confirmDelete))
            await fetchMesocycles()
            setConfirmDelete(null)
        } catch (err) {
            console.error(err)
        }
        setDeleting(false)
    }

    if (showForm) {
        return (
            <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar mesociclo' : 'Nuevo mesociclo'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del ciclo *</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Pretemporada 2026" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Atleta</label>
                        <input type="text" value={form.athleteEmail} readOnly className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm bg-gray-50 text-gray-500" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha inicio *</label>
                            <input type="date" value={form.startDate} onChange={e => setForm({ ...form, startDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha fin *</label>
                            <input type="date" value={form.endDate} onChange={e => setForm({ ...form, endDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Metodo de entrenamiento</label>
                        <select value={form.method} onChange={e => setForm({ ...form, method: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {METHODS.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo del ciclo</label>
                        <textarea value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" placeholder="Que quieres lograr en este ciclo" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !form.name || !form.startDate || !form.endDate} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Crear mesociclo'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Planificacion</h2>
                    <p className="text-xs text-gray-400">{selectedAthlete?.email} · {mesocycles.length} mesociclos</p>
                </div>
                <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">+ Nuevo mesociclo</button>
            </div>

            {loading && <p className="text-center text-gray-400 py-12">Cargando...</p>}

            {confirmDelete && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">Eliminar este mesociclo permanentemente?</p>
                    <p className="text-xs text-red-600">Se eliminara el ciclo pero las sesiones ejecutadas del atleta se conservan.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                        <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40">{deleting ? 'Eliminando...' : 'Si, eliminar'}</button>
                    </div>
                </div>
            )}

            {!loading && mesocycles.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="font-medium">Sin mesociclos</p>
                    <p className="text-sm mt-1">Crea el primero para empezar a planificar</p>
                </div>
            )}

            <div className="space-y-3">
                {mesocycles.map(meso => (
                    <div key={meso.id} onClick={() => onSelect(meso)} className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition">
                        <div className="flex items-start justify-between">
                            <div className="flex-1">
                                <p className="font-bold text-gray-800">{meso.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{meso.athleteEmail}</p>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{meso.method}</span>
                                <button onClick={e => openEdit(e, meso)} className="text-xs text-gray-400 hover:text-blue-600 border border-gray-200 px-2 py-1 rounded-lg transition">Editar</button>
                                <button onClick={e => { e.stopPropagation(); setConfirmDelete(meso.id) }} className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 px-2 py-1 rounded-lg transition">Eliminar</button>
                            </div>
                        </div>
                        <div className="mt-3">
                            <p className="text-xs text-gray-400">{meso.startDate} a {meso.endDate}</p>
                        </div>
                        {meso.objective && <p className="text-xs text-gray-500 mt-2 italic">{meso.objective}</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}