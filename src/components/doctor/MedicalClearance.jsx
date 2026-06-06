import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const EMPTY_FORM = {
    date: new Date().toISOString().split('T')[0],
    cleared: true, restrictions: '', notes: '', validUntil: ''
}

export default function MedicalClearance({ athlete }) {
    const { user } = useAuth()
    const [clearances, setClearances] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)

    useEffect(() => { fetchClearances() }, [athlete])

    async function fetchClearances() {
        setLoading(true)
        const q = query(
            collection(db, 'medicalClearance'),
            where('athleteUid', '==', athlete.uid),
            orderBy('date', 'desc')
        )
        const snap = await getDocs(q)
        setClearances(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        try {
            await addDoc(collection(db, 'medicalClearance'), {
                athleteUid: athlete.uid,
                athleteEmail: athlete.email,
                doctorUid: user.uid,
                doctorEmail: user.email,
                date: form.date,
                cleared: form.cleared,
                restrictions: form.restrictions,
                notes: form.notes,
                validUntil: form.validUntil,
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            await fetchClearances()
            setTimeout(() => {
                setSaved(false)
                setShowForm(false)
                setForm(EMPTY_FORM)
            }, 1500)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const latest = clearances[0]

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Autorizaciones medicas</h2>
                    <p className="text-xs text-gray-400">{athlete.email}</p>
                </div>
                <button onClick={() => setShowForm(!showForm)} className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 transition">
                    + Nueva autorizacion
                </button>
            </div>

            {latest && (
                <div className={"rounded-2xl border p-5 space-y-2 " + (latest.cleared ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <div className="flex items-center gap-3">
                        <div className={"w-3 h-3 rounded-full " + (latest.cleared ? 'bg-green-500' : 'bg-red-500')} />
                        <p className={"text-lg font-bold " + (latest.cleared ? 'text-green-700' : 'text-red-700')}>
                            {latest.cleared ? 'APTO PARA ENTRENAR' : 'NO APTO PARA ENTRENAR'}
                        </p>
                    </div>
                    <p className={"text-xs " + (latest.cleared ? 'text-green-600' : 'text-red-600')}>Emitido el {latest.date} por {latest.doctorEmail}</p>
                    {latest.validUntil && <p className={"text-xs font-medium " + (latest.cleared ? 'text-green-700' : 'text-red-700')}>Valido hasta: {latest.validUntil}</p>}
                    {latest.restrictions && (
                        <div className="bg-white rounded-xl p-3 mt-2">
                            <p className="text-xs font-medium text-gray-700 mb-1">Restricciones</p>
                            <p className="text-sm text-gray-600">{latest.restrictions}</p>
                        </div>
                    )}
                    {latest.notes && <p className="text-xs text-gray-500 italic mt-1">{latest.notes}</p>}
                </div>
            )}

            {showForm && (
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <p className="text-sm font-bold text-gray-800">Nueva autorizacion</p>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Valido hasta</label>
                            <input type="date" value={form.validUntil} onChange={e => setForm({ ...form, validUntil: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">Estado</label>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setForm({ ...form, cleared: true })}
                                className={"flex-1 py-2.5 rounded-xl text-sm font-medium border transition " + (form.cleared ? 'bg-green-500 text-white border-green-500' : 'bg-white text-gray-600 border-gray-300 hover:border-green-400')}
                            >
                                Apto
                            </button>
                            <button
                                onClick={() => setForm({ ...form, cleared: false })}
                                className={"flex-1 py-2.5 rounded-xl text-sm font-medium border transition " + (!form.cleared ? 'bg-red-500 text-white border-red-500' : 'bg-white text-gray-600 border-gray-300 hover:border-red-400')}
                            >
                                No apto
                            </button>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Restricciones</label>
                        <textarea value={form.restrictions} onChange={e => setForm({ ...form, restrictions: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Actividades restringidas, limitaciones de carga..." />
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas</label>
                        <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Observaciones adicionales..." />
                    </div>
                    <button
                        onClick={handleSave}
                        disabled={saving}
                        className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-40')}
                    >
                        {saved ? 'Autorizacion emitida' : saving ? 'Guardando...' : 'Emitir autorizacion'}
                    </button>
                </div>
            )}

            {clearances.length > 1 && (
                <div className="space-y-2">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Historial</p>
                    {clearances.slice(1).map(c => (
                        <div key={c.id} className="bg-white rounded-xl border border-gray-200 p-3 flex items-center justify-between">
                            <div>
                                <p className="text-sm font-medium text-gray-700">{c.date}</p>
                                {c.restrictions && <p className="text-xs text-gray-400 mt-0.5">{c.restrictions}</p>}
                            </div>
                            <span className={"text-xs px-2 py-1 rounded-full font-medium " + (c.cleared ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                {c.cleared ? 'Apto' : 'No apto'}
              </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}