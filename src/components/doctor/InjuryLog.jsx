import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const INJURY_ZONES = ['Tobillo', 'Rodilla', 'Cadera', 'Columna lumbar', 'Columna cervical', 'Hombro', 'Codo', 'Muneca', 'Muslo', 'Pantorrilla', 'Pie', 'Cabeza', 'Otro']
const INJURY_TYPES = ['Muscular', 'Ligamentosa', 'Osea', 'Tendinosa', 'Articular', 'Contusion', 'Otro']
const INJURY_STATUS = ['Activa', 'En tratamiento', 'Resuelta']

const STATUS_COLORS = {
    'Activa': 'bg-red-50 text-red-700',
    'En tratamiento': 'bg-yellow-50 text-yellow-700',
    'Resuelta': 'bg-green-50 text-green-700',
}

const EMPTY_FORM = {
    date: new Date().toISOString().split('T')[0],
    zone: '', type: '', description: '',
    treatment: '', status: 'Activa', returnDate: ''
}

export default function InjuryLog({ athlete }) {
    const { user } = useAuth()
    const [injuries, setInjuries] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [editingId, setEditingId] = useState(null)

    useEffect(() => { fetchInjuries() }, [athlete])

    async function fetchInjuries() {
        setLoading(true)
        const q = query(
            collection(db, 'injuries'),
            where('athleteUid', '==', athlete.uid),
            orderBy('date', 'desc')
        )
        const snap = await getDocs(q)
        setInjuries(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    function openNew() {
        setForm(EMPTY_FORM)
        setEditingId(null)
        setShowForm(true)
    }

    function openEdit(injury) {
        setForm({
            date: injury.date || '',
            zone: injury.zone || '',
            type: injury.type || '',
            description: injury.description || '',
            treatment: injury.treatment || '',
            status: injury.status || 'Activa',
            returnDate: injury.returnDate || '',
        })
        setEditingId(injury.id)
        setShowForm(true)
    }

    async function handleSave() {
        if (!form.zone || !form.type) return
        setSaving(true)
        try {
            if (editingId) {
                await updateDoc(doc(db, 'injuries', editingId), { ...form, updatedAt: serverTimestamp() })
            } else {
                await addDoc(collection(db, 'injuries'), {
                    athleteUid: athlete.uid,
                    athleteEmail: athlete.email,
                    doctorUid: user.uid,
                    ...form,
                    createdAt: serverTimestamp(),
                })
            }
            await fetchInjuries()
            setShowForm(false)
            setForm(EMPTY_FORM)
            setEditingId(null)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (showForm) {
        return (
            <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar lesion' : 'Nueva lesion'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Estado</label>
                            <select value={form.status} onChange={e => setForm({ ...form, status: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                                {INJURY_STATUS.map(s => <option key={s}>{s}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Zona *</label>
                            <select value={form.zone} onChange={e => setForm({ ...form, zone: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="">Selecciona...</option>
                                {INJURY_ZONES.map(z => <option key={z}>{z}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Tipo *</label>
                            <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                                <option value="">Selecciona...</option>
                                {INJURY_TYPES.map(t => <option key={t}>{t}</option>)}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Descripcion</label>
                        <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Mecanismo de lesion, sintomas, hallazgos clinicos..." />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tratamiento</label>
                        <textarea value={form.treatment} onChange={e => setForm({ ...form, treatment: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Protocolo de tratamiento indicado..." />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha estimada de retorno</label>
                        <input type="date" value={form.returnDate} onChange={e => setForm({ ...form, returnDate: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !form.zone || !form.type} className="flex-1 bg-red-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-700 transition disabled:opacity-40">{saving ? 'Guardando...' : editingId ? 'Guardar cambios' : 'Registrar lesion'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Registro de lesiones</h2>
                    <p className="text-xs text-gray-400">{injuries.length} lesiones registradas</p>
                </div>
                <button onClick={openNew} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition">+ Nueva lesion</button>
            </div>

            {injuries.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="font-medium">Sin lesiones registradas</p>
                    <p className="text-sm mt-1">El atleta no tiene lesiones en su historial</p>
                </div>
            )}

            <div className="space-y-3">
                {injuries.map(injury => (
                    <div key={injury.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                        <div className="flex items-start justify-between">
                            <div>
                                <div className="flex items-center gap-2">
                                    <p className="font-medium text-gray-800 text-sm">{injury.zone} — {injury.type}</p>
                                    <span className={"text-xs px-2 py-0.5 rounded-full font-medium " + (STATUS_COLORS[injury.status] || 'bg-gray-50 text-gray-600')}>{injury.status}</span>
                                </div>
                                <p className="text-xs text-gray-400 mt-0.5">{injury.date}</p>
                            </div>
                            <button onClick={() => openEdit(injury)} className="text-xs text-gray-400 hover:text-red-600 transition">Editar</button>
                        </div>
                        {injury.description && <p className="text-xs text-gray-600">{injury.description}</p>}
                        {injury.treatment && (
                            <div className="bg-gray-50 rounded-lg p-2">
                                <p className="text-xs font-medium text-gray-600 mb-0.5">Tratamiento</p>
                                <p className="text-xs text-gray-500">{injury.treatment}</p>
                            </div>
                        )}
                        {injury.returnDate && (
                            <p className="text-xs text-blue-600">Retorno estimado: {injury.returnDate}</p>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}