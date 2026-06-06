import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const EMPTY_FORM = {
    date: new Date().toISOString().split('T')[0],
    motivo: '', diagnostico: '', tratamiento: '',
    apto: true, restricciones: '', proximaConsulta: '', notas: ''
}

export default function MedicalConsults({ athlete }) {
    const { user } = useAuth()
    const [consults, setConsults] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [expanded, setExpanded] = useState(null)

    useEffect(() => { fetchConsults() }, [athlete])

    async function fetchConsults() {
        setLoading(true)
        const q = query(
            collection(db, 'medicalConsults'),
            where('athleteUid', '==', athlete.uid),
            orderBy('date', 'desc')
        )
        const snap = await getDocs(q)
        setConsults(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    async function handleSave() {
        if (!form.date || !form.motivo) return
        setSaving(true)
        try {
            await addDoc(collection(db, 'medicalConsults'), {
                athleteUid: athlete.uid,
                athleteEmail: athlete.email,
                doctorUid: user.uid,
                doctorEmail: user.email,
                ...form,
                apto: form.apto === true || form.apto === 'true',
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            await fetchConsults()
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

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (showForm) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Nueva consulta</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Estado deportivo</label>
                            <select value={form.apto} onChange={e => setForm({ ...form, apto: e.target.value === 'true' })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400">
                                <option value="true">Apto para entrenar</option>
                                <option value="false">No apto</option>
                            </select>
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Motivo de consulta *</label>
                        <input type="text" value={form.motivo} onChange={e => setForm({ ...form, motivo: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" placeholder="Razon de la consulta" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Diagnostico</label>
                        <textarea value={form.diagnostico} onChange={e => setForm({ ...form, diagnostico: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" placeholder="Diagnostico clinico" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tratamiento</label>
                        <textarea value={form.tratamiento} onChange={e => setForm({ ...form, tratamiento: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" placeholder="Medicamentos, procedimientos, indicaciones..." />
                    </div>

                    {!form.apto && (
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Restricciones</label>
                            <textarea value={form.restricciones} onChange={e => setForm({ ...form, restricciones: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" placeholder="Que actividades debe evitar y por cuanto tiempo" />
                        </div>
                    )}

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Proxima consulta</label>
                        <input type="date" value={form.proximaConsulta} onChange={e => setForm({ ...form, proximaConsulta: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400" />
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Notas adicionales</label>
                        <textarea value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-400 resize-none" placeholder="Observaciones adicionales" />
                    </div>
                </div>

                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !form.motivo} className={"flex-1 rounded-xl py-2 text-sm font-medium transition " + (saved ? 'bg-green-500 text-white' : 'bg-red-500 text-white hover:bg-red-600 disabled:opacity-40')}>{saved ? 'Guardado' : saving ? 'Guardando...' : 'Guardar consulta'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Consultas medicas</h2>
                    <p className="text-xs text-gray-400">{athlete.email} · {consults.length} consultas</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-red-500 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-600 transition">+ Nueva consulta</button>
            </div>

            {consults.length > 0 && (
                <div className={"rounded-xl p-3 border " + (consults[0].apto ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200')}>
                    <p className={"text-sm font-bold " + (consults[0].apto ? 'text-green-700' : 'text-red-700')}>
                        Estado actual: {consults[0].apto ? 'Apto para entrenar' : 'No apto para entrenar'}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Segun consulta del {consults[0].date}</p>
                    {!consults[0].apto && consults[0].restricciones && (
                        <p className="text-xs text-red-600 mt-1">{consults[0].restricciones}</p>
                    )}
                </div>
            )}

            {consults.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="font-medium">Sin consultas registradas</p>
                    <p className="text-sm mt-1">Registra la primera consulta medica</p>
                </div>
            )}

            <div className="space-y-3">
                {consults.map(c => (
                    <div key={c.id} className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
                        <div onClick={() => setExpanded(expanded === c.id ? null : c.id)} className="p-4 cursor-pointer hover:bg-gray-50 transition">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="font-medium text-gray-800 text-sm">{c.motivo}</p>
                                    <p className="text-xs text-gray-400 mt-0.5">{c.date}</p>
                                </div>
                                <span className={"text-xs px-2 py-1 rounded-full font-medium " + (c.apto ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700')}>
                  {c.apto ? 'Apto' : 'No apto'}
                </span>
                            </div>
                        </div>
                        {expanded === c.id && (
                            <div className="border-t border-gray-100 p-4 space-y-3">
                                {c.diagnostico && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">Diagnostico</p>
                                        <p className="text-sm text-gray-700">{c.diagnostico}</p>
                                    </div>
                                )}
                                {c.tratamiento && (
                                    <div>
                                        <p className="text-xs font-medium text-gray-500 mb-1">Tratamiento</p>
                                        <p className="text-sm text-gray-700">{c.tratamiento}</p>
                                    </div>
                                )}
                                {c.restricciones && (
                                    <div className="bg-red-50 rounded-xl p-3">
                                        <p className="text-xs font-medium text-red-700 mb-1">Restricciones</p>
                                        <p className="text-sm text-red-700">{c.restricciones}</p>
                                    </div>
                                )}
                                {c.proximaConsulta && (
                                    <p className="text-xs text-gray-400">Proxima consulta: {c.proximaConsulta}</p>
                                )}
                                {c.notas && <p className="text-xs text-gray-400 italic">{c.notas}</p>}
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    )
}