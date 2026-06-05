import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const MUSCLE_ZONES = ['Core', 'Cuadriceps', 'Isquiotibiales', 'Gluteo', 'Pantorrilla', 'Pecho', 'Espalda', 'Hombro', 'Brazo', 'Cadera']
const FATIGUE_LABELS = { 1: 'Sin fatiga', 2: 'Muy leve', 3: 'Leve', 4: 'Moderada', 5: 'Alta' }
const FATIGUE_COLORS = { 1: 'bg-green-100 text-green-700', 2: 'bg-lime-100 text-lime-700', 3: 'bg-yellow-100 text-yellow-700', 4: 'bg-orange-100 text-orange-700', 5: 'bg-red-100 text-red-700' }

export default function RecoveryLog() {
    const { user } = useAuth()
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({
        date: new Date().toISOString().split('T')[0],
        sleepHours: '',
        sleepQuality: 7,
        hrv: '',
        fatigueByZone: {},
        notes: '',
    })

    useEffect(() => { fetchLogs() }, [])

    async function fetchLogs() {
        const q = query(
            collection(db, 'recoveryLogs'),
            where('userId', '==', user.uid),
            orderBy('date', 'desc')
        )
        const snap = await getDocs(q)
        setLogs(snap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    function setFatigue(zone, value) {
        setForm(prev => ({
            ...prev,
            fatigueByZone: { ...prev.fatigueByZone, [zone]: value }
        }))
    }

    async function handleSave() {
        if (!form.sleepHours) return
        setSaving(true)
        try {
            await addDoc(collection(db, 'recoveryLogs'), {
                userId: user.uid,
                date: form.date,
                sleepHours: parseFloat(form.sleepHours),
                sleepQuality: form.sleepQuality,
                hrv: form.hrv ? parseFloat(form.hrv) : null,
                fatigueByZone: form.fatigueByZone,
                notes: form.notes,
                createdAt: serverTimestamp(),
            })
            setSaved(true)
            await fetchLogs()
            setTimeout(() => {
                setSaved(false)
                setShowForm(false)
                setForm({
                    date: new Date().toISOString().split('T')[0],
                    sleepHours: '',
                    sleepQuality: 7,
                    hrv: '',
                    fatigueByZone: {},
                    notes: '',
                })
            }, 1500)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const getSleepColor = (hours) => {
        if (hours >= 8) return 'text-green-600'
        if (hours >= 7) return 'text-lime-600'
        if (hours >= 6) return 'text-yellow-600'
        return 'text-red-500'
    }

    const getHrvColor = (hrv) => {
        if (!hrv) return 'text-gray-400'
        if (hrv >= 60) return 'text-green-600'
        if (hrv >= 45) return 'text-yellow-600'
        return 'text-red-500'
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (showForm) {
        return (
            <div className="space-y-4">
                <div className="flex items-center justify-between">
                    <h2 className="font-bold text-gray-800 text-lg">Registro de recuperacion</h2>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                        <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Horas de sueno</label>
                            <input type="number" value={form.sleepHours} onChange={e => setForm({ ...form, sleepHours: e.target.value })} step="0.5" placeholder="8" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">HRV (ms) — opcional</label>
                            <input type="number" value={form.hrv} onChange={e => setForm({ ...form, hrv: e.target.value })} placeholder="55" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>

                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-2">
                            Calidad del sueno — <span className="text-blue-600">{form.sleepQuality}/10</span>
                        </label>
                        <input type="range" min="1" max="10" value={form.sleepQuality} onChange={e => setForm({ ...form, sleepQuality: parseInt(e.target.value) })} className="w-full" />
                        <div className="flex justify-between text-xs text-gray-400 mt-1">
                            <span>Muy malo</span>
                            <span>Excelente</span>
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-3">
                    <p className="text-sm font-bold text-gray-800">Fatiga por zona muscular</p>
                    <p className="text-xs text-gray-400">1 = Sin fatiga · 5 = Alta fatiga</p>
                    <div className="space-y-3">
                        {MUSCLE_ZONES.map(zone => (
                            <div key={zone} className="flex items-center gap-3">
                                <span className="text-xs text-gray-700 w-28 shrink-0">{zone}</span>
                                <div className="flex gap-1 flex-1">
                                    {[1, 2, 3, 4, 5].map(val => (
                                        <button
                                            key={val}
                                            onClick={() => setFatigue(zone, val)}
                                            className={"flex-1 py-1.5 rounded-lg text-xs font-medium border transition " + (form.fatigueByZone[zone] === val ? FATIGUE_COLORS[val] + ' border-transparent' : 'bg-white text-gray-400 border-gray-200 hover:bg-gray-50')}
                                        >
                                            {val}
                                        </button>
                                    ))}
                                </div>
                                {form.fatigueByZone[zone] && (
                                    <span className={"text-xs px-2 py-0.5 rounded-full " + FATIGUE_COLORS[form.fatigueByZone[zone]]}>
                    {FATIGUE_LABELS[form.fatigueByZone[zone]]}
                  </span>
                                )}
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-2xl border border-gray-200 p-4">
                    <label className="block text-xs font-medium text-gray-600 mb-2">Notas</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} placeholder="Como te sientes hoy? Algo que destacar..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none" />
                </div>

                <button
                    onClick={handleSave}
                    disabled={saving || !form.sleepHours}
                    className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
                >
                    {saved ? 'Registro guardado' : saving ? 'Guardando...' : 'Guardar registro'}
                </button>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Recuperacion</h2>
                    <p className="text-xs text-gray-400">{logs.length} registros</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">
                    + Registrar hoy
                </button>
            </div>

            {logs.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="font-medium">Sin registros de recuperacion</p>
                    <p className="text-sm mt-1">Registra cada manana como amaneciste</p>
                </div>
            )}

            <div className="space-y-3">
                {logs.map(log => (
                    <div key={log.id} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                            <p className="font-medium text-gray-800 text-sm">{log.date}</p>
                            <div className="flex items-center gap-3">
                                <div className="text-right">
                                    <p className={"text-lg font-bold " + getSleepColor(log.sleepHours)}>{log.sleepHours}h</p>
                                    <p className="text-xs text-gray-400">sueno · {log.sleepQuality}/10</p>
                                </div>
                                {log.hrv && (
                                    <div className="text-right">
                                        <p className={"text-lg font-bold " + getHrvColor(log.hrv)}>{log.hrv}</p>
                                        <p className="text-xs text-gray-400">HRV ms</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {log.fatigueByZone && Object.keys(log.fatigueByZone).length > 0 && (
                            <div className="flex gap-2 flex-wrap">
                                {Object.entries(log.fatigueByZone).filter(([, v]) => v > 1).map(([zone, val]) => (
                                    <span key={zone} className={"text-xs px-2 py-0.5 rounded-full " + FATIGUE_COLORS[val]}>
                    {zone}: {FATIGUE_LABELS[val]}
                  </span>
                                ))}
                                {Object.values(log.fatigueByZone).every(v => v <= 1) && (
                                    <span className="text-xs text-green-600 bg-green-50 px-2 py-0.5 rounded-full">Sin fatiga muscular</span>
                                )}
                            </div>
                        )}

                        {log.notes && <p className="text-xs text-gray-400 italic">{log.notes}</p>}
                    </div>
                ))}
            </div>
        </div>
    )
}