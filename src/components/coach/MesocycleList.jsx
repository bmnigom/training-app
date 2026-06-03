import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const METHODS = ['Hipertrofia', 'Fuerza máxima', 'Potencia', 'Resistencia', 'Técnico-táctico', 'Rehabilitación', 'Mixto']
const EMPTY_FORM = { name: '', athleteEmail: '', startDate: '', endDate: '', objective: '', method: 'Hipertrofia', weeks: 4 }

export default function MesocycleList({ onSelect }) {
    const [mesocycles, setMesocycles] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)

    useEffect(() => { fetchMesocycles() }, [])

    async function fetchMesocycles() {
        const snap = await getDocs(collection(db, 'mesocycles'))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => new Date(b.startDate) - new Date(a.startDate))
        setMesocycles(data)
        setLoading(false)
    }

    async function handleSave() {
        if (!form.name || !form.startDate || !form.endDate) return
        setSaving(true)
        try {
            const docRef = await addDoc(collection(db, 'mesocycles'), {
                ...form,
                weeks: parseInt(form.weeks),
                createdAt: serverTimestamp(),
            })
            await fetchMesocycles()
            setShowForm(false)
            setForm(EMPTY_FORM)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    if (showForm) {
        return (
            <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Nuevo mesociclo</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre del ciclo *</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Pretemporada 2026" />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Email del atleta</label>
                        <input type="email" value={form.athleteEmail} onChange={e => setForm({ ...form, athleteEmail: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="atleta@correo.com" />
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
                    <button onClick={handleSave} disabled={saving || !form.name || !form.startDate || !form.endDate} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40">{saving ? 'Guardando...' : 'Crear mesociclo'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Planificacion</h2>
                    <p className="text-xs text-gray-400">{mesocycles.length} mesociclos registrados</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">+ Nuevo mesociclo</button>
            </div>
            {loading && <p className="text-center text-gray-400 py-12">Cargando...</p>}
            {!loading && mesocycles.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="text-lg font-medium">Sin mesociclos</p>
                    <p className="text-sm mt-1">Crea el primero para empezar a planificar</p>
                </div>
            )}
            <div className="space-y-3">
                {mesocycles.map(meso => (
                    <div key={meso.id} onClick={() => onSelect(meso)} className="bg-white rounded-2xl border border-gray-200 p-5 cursor-pointer hover:border-blue-300 hover:shadow-sm transition">
                        <div className="flex items-start justify-between">
                            <div>
                                <p className="font-bold text-gray-800">{meso.name}</p>
                                <p className="text-xs text-gray-500 mt-1">{meso.athleteEmail || 'Sin atleta asignado'}</p>
                            </div>
                            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full font-medium">{meso.method}</span>
                        </div>
                        <div className="flex gap-4 mt-3">
                            <p className="text-xs text-gray-400">{meso.startDate} → {meso.endDate}</p>
                        </div>
                        {meso.objective && <p className="text-xs text-gray-500 mt-2 italic">{meso.objective}</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}