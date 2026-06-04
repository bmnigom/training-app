import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const RELATION_TYPES = ['Principal', 'Fuerza', 'Fisioterapia', 'Tecnico-tactico', 'Otro']

export default function RelationshipManager() {
    const [athletes, setAthletes] = useState([])
    const [coaches, setCoaches] = useState([])
    const [relationships, setRelationships] = useState([])
    const [loading, setLoading] = useState(true)
    const [form, setForm] = useState({ athleteUid: '', coachUid: '', type: 'Principal' })
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(null)

    useEffect(() => { fetchAll() }, [])

    async function fetchAll() {
        const snap = await getDocs(collection(db, 'users'))
        const users = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
        setAthletes(users.filter(u => u.role === 'athlete'))
        setCoaches(users.filter(u => u.role === 'coach'))
        const relSnap = await getDocs(collection(db, 'relationships'))
        setRelationships(relSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    async function handleSave() {
        if (!form.athleteUid || !form.coachUid) return
        const exists = relationships.find(r => r.athleteUid === form.athleteUid && r.coachUid === form.coachUid && r.type === form.type)
        if (exists) return
        setSaving(true)
        try {
            const athleteUser = athletes.find(a => a.uid === form.athleteUid)
            const coachUser = coaches.find(c => c.uid === form.coachUid)
            await addDoc(collection(db, 'relationships'), {
                athleteUid: form.athleteUid,
                athleteEmail: athleteUser?.email || '',
                coachUid: form.coachUid,
                coachEmail: coachUser?.email || '',
                type: form.type,
                createdAt: serverTimestamp(),
            })
            await fetchAll()
            setForm({ athleteUid: '', coachUid: '', type: 'Principal' })
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    async function handleDelete(id) {
        try {
            await deleteDoc(doc(db, 'relationships', id))
            setRelationships(prev => prev.filter(r => r.id !== id))
            setConfirmDelete(null)
        } catch (err) {
            console.error(err)
        }
    }

    const getAthleteRelations = (athleteUid) => relationships.filter(r => r.athleteUid === athleteUid)

    if (loading) return <p className="text-center text-gray-400 py-8">Cargando...</p>

    return (
        <div className="space-y-6">
            <div>
                <h3 className="font-bold text-gray-800 text-lg">Vincular atletas y entrenadores</h3>
                <p className="text-xs text-gray-400 mt-0.5">Asigna uno o varios entrenadores a cada atleta</p>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <p className="text-sm font-medium text-gray-700">Nueva vinculacion</p>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Atleta</label>
                    <select
                        value={form.athleteUid}
                        onChange={e => setForm({ ...form, athleteUid: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecciona un atleta...</option>
                        {athletes.map(a => <option key={a.uid} value={a.uid}>{a.email}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Entrenador</label>
                    <select
                        value={form.coachUid}
                        onChange={e => setForm({ ...form, coachUid: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecciona un entrenador...</option>
                        {coaches.map(c => <option key={c.uid} value={c.uid}>{c.email}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de relacion</label>
                    <select
                        value={form.type}
                        onChange={e => setForm({ ...form, type: e.target.value })}
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        {RELATION_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving || !form.athleteUid || !form.coachUid}
                    className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40"
                >
                    {saving ? 'Vinculando...' : 'Crear vinculacion'}
                </button>
            </div>

            <div className="space-y-3">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Vinculaciones actuales</p>
                {athletes.length === 0 && <p className="text-sm text-gray-400">No hay atletas registrados</p>}
                {athletes.map(athlete => {
                    const relations = getAthleteRelations(athlete.uid)
                    return (
                        <div key={athlete.uid} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                            <p className="font-medium text-gray-800 text-sm">{athlete.email}</p>
                            {relations.length === 0 && (
                                <p className="text-xs text-gray-400">Sin entrenadores asignados</p>
                            )}
                            {relations.map(r => (
                                <div key={r.id} className="flex items-center justify-between bg-gray-50 rounded-xl px-3 py-2">
                                    <div>
                                        <p className="text-xs text-gray-700">{r.coachEmail}</p>
                                        <span className="text-xs text-blue-600 font-medium">{r.type}</span>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(r.id)}
                                        className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 px-2 py-1 rounded-lg transition"
                                    >
                                        Quitar
                                    </button>
                                </div>
                            ))}
                        </div>
                    )
                })}
            </div>
        </div>
    )
}