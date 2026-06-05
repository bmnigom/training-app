import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const SESSION_TYPES = ['Fuerza', 'Balonmano', 'Mixto', 'Velocidad y salto', 'Fisioterapia', 'Descanso', 'Otro']

function PhysioLoadSummary({ athleteEmail }) {
    const [load, setLoad] = useState(null)

    useEffect(() => {
        async function fetchLoad() {
            const weekStart = new Date()
            const day = weekStart.getDay()
            weekStart.setDate(weekStart.getDate() - (day === 0 ? 6 : day - 1))
            const weekStartStr = weekStart.toISOString().split('T')[0]
            const snap = await getDocs(
                query(
                    collection(db, 'physioSessions'),
                    where('athleteEmail', '==', athleteEmail),
                    where('date', '>=', weekStartStr)
                )
            )
            const sessions = snap.docs.map(d => d.data())
            const totalVol = sessions.reduce((a, s) => a + (s.totalVolume || 0), 0)
            const groups = {}
            sessions.forEach(s => {
                if (s.muscleGroupSummary) {
                    Object.entries(s.muscleGroupSummary).forEach(([g, v]) => {
                        groups[g] = (groups[g] || 0) + Math.round(v)
                    })
                }
            })
            setLoad({
                sessions: sessions.length,
                totalVol,
                groups,
                recs: sessions.filter(s => s.recoveryRecommendations).map(s => s.recoveryRecommendations)
            })
        }
        if (athleteEmail) fetchLoad()
    }, [athleteEmail])

    if (!load || load.sessions === 0) return null

    return (
        <div className="bg-teal-50 border border-teal-100 rounded-xl p-3 space-y-2">
            <p className="text-xs font-bold text-teal-700">Carga de fisioterapia esta semana</p>
            <div className="flex gap-4 text-xs text-teal-600">
                <span>{load.sessions} sesiones</span>
                <span>Volumen: {load.totalVol.toLocaleString()} kg</span>
            </div>
            {Object.keys(load.groups).length > 0 && (
                <div className="flex gap-2 flex-wrap">
                    {Object.entries(load.groups).map(([g, v]) => (
                        <span key={g} className="bg-teal-100 text-teal-800 text-xs px-2 py-0.5 rounded-full">{g}: {v}kg</span>
                    ))}
                </div>
            )}
            {load.recs.length > 0 && (
                <div className="bg-yellow-50 rounded-lg p-2">
                    <p className="text-xs font-medium text-yellow-700 mb-1">Recomendaciones fisio activas</p>
                    {load.recs.map((r, i) => <p key={i} className="text-xs text-yellow-700">{r}</p>)}
                </div>
            )}
        </div>
    )
}

export default function MesocycleDetail({ mesocycle, onBack, onOpenSession }) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ date: '', type: 'Fuerza', objective: '', weekNumber: 1 })
    const [saving, setSaving] = useState(false)
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)

    useEffect(() => { fetchSessions() }, [])

    async function fetchSessions() {
        const snap = await getDocs(collection(db, 'mesocycles', mesocycle.id, 'plannedSessions'))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => new Date(a.date) - new Date(b.date))
        setSessions(data)
        setLoading(false)
    }

    async function handleAddSession() {
        if (!form.date || !form.type) return
        setSaving(true)
        try {
            await addDoc(collection(db, 'mesocycles', mesocycle.id, 'plannedSessions'), {
                ...form,
                exercises: [],
                createdAt: serverTimestamp(),
            })
            await fetchSessions()
            setShowForm(false)
            setForm({ date: '', type: 'Fuerza', objective: '', weekNumber: 1 })
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    async function handleDeleteSession() {
        if (!confirmDelete) return
        setDeleting(true)
        try {
            await deleteDoc(doc(db, 'mesocycles', mesocycle.id, 'plannedSessions', confirmDelete))
            await fetchSessions()
            setConfirmDelete(null)
        } catch (err) {
            console.error(err)
        }
        setDeleting(false)
    }

    const weeks = [...new Set(sessions.map(s => s.weekNumber))].sort((a, b) => a - b)
    if (!weeks.length) weeks.push(1)

    const getSessionsForWeek = (week) => sessions.filter(s => s.weekNumber === week)

    const getTypeColor = (type) => {
        const colors = {
            'Fuerza': 'bg-blue-50 text-blue-700 border-blue-200',
            'Balonmano': 'bg-green-50 text-green-700 border-green-200',
            'Mixto': 'bg-purple-50 text-purple-700 border-purple-200',
            'Velocidad y salto': 'bg-orange-50 text-orange-700 border-orange-200',
            'Fisioterapia': 'bg-pink-50 text-pink-700 border-pink-200',
            'Descanso': 'bg-gray-50 text-gray-400 border-gray-200',
            'Otro': 'bg-yellow-50 text-yellow-700 border-yellow-200',
        }
        return colors[type] || 'bg-gray-50 text-gray-600 border-gray-200'
    }

    if (showForm) {
        return (
            <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">Nueva sesion</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Fecha</label>
                            <input type="date" value={form.date} onChange={e => setForm({ ...form, date: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Semana numero</label>
                            <input type="number" min="1" value={form.weekNumber} onChange={e => setForm({ ...form, weekNumber: parseInt(e.target.value) })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Tipo de sesion</label>
                        <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {SESSION_TYPES.map(t => <option key={t}>{t}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Objetivo de la sesion</label>
                        <input type="text" value={form.objective} onChange={e => setForm({ ...form, objective: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Que se busca lograr en esta sesion" />
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleAddSession} disabled={saving || !form.date} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40">{saving ? 'Guardando...' : 'Agregar sesion'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                <div className="flex-1">
                    <h2 className="font-bold text-gray-800 text-lg">{mesocycle.name}</h2>
                    <p className="text-xs text-gray-400">{mesocycle.method} · {mesocycle.startDate} a {mesocycle.endDate}</p>
                </div>
                <button onClick={() => setShowForm(true)} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">+ Sesion</button>
            </div>

            {mesocycle.objective && (
                <div className="bg-blue-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-blue-700 font-medium">Objetivo</p>
                    <p className="text-sm text-blue-800 mt-0.5">{mesocycle.objective}</p>
                </div>
            )}

            <PhysioLoadSummary athleteEmail={mesocycle.athleteEmail} />

            {confirmDelete && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">Eliminar esta sesion planificada?</p>
                    <p className="text-xs text-red-600">Las sesiones ya ejecutadas por el atleta no se veran afectadas.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                        <button onClick={handleDeleteSession} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40">{deleting ? 'Eliminando...' : 'Si, eliminar'}</button>
                    </div>
                </div>
            )}

            {loading && <p className="text-center text-gray-400 py-8">Cargando...</p>}

            {!loading && sessions.length === 0 && (
                <div className="text-center text-gray-400 py-12">
                    <p className="font-medium">Sin sesiones planificadas</p>
                    <p className="text-sm mt-1">Agrega la primera sesion de este ciclo</p>
                </div>
            )}

            {weeks.map(week => (
                <div key={week} className="space-y-2">
                    <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">Semana {week}</span>
                        <div className="flex-1 h-px bg-gray-200"></div>
                    </div>
                    {getSessionsForWeek(week).map(session => (
                        <div key={session.id} className="bg-white rounded-xl border border-gray-200 p-4">
                            <div className="flex items-center justify-between">
                                <div
                                    className="flex items-center gap-3 flex-1 cursor-pointer"
                                    onClick={() => onOpenSession({ ...session, mesocycleId: mesocycle.id })}
                                >
                  <span className={"text-xs px-2 py-1 rounded-lg border font-medium " + getTypeColor(session.type)}>
                    {session.type}
                  </span>
                                    <div>
                                        <p className="text-sm font-medium text-gray-800">{session.date}</p>
                                        {session.objective && <p className="text-xs text-gray-400 mt-0.5">{session.objective}</p>}
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <p className="text-xs text-gray-400">{session.exercises?.length || 0} ejercicios</p>
                                    <button
                                        onClick={e => { e.stopPropagation(); setConfirmDelete(session.id) }}
                                        className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 px-2 py-1 rounded-lg transition"
                                    >
                                        Eliminar
                                    </button>
                                    <p
                                        className="text-xs text-blue-500 cursor-pointer"
                                        onClick={() => onOpenSession({ ...session, mesocycleId: mesocycle.id })}
                                    >
                                        Disenar
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ))}
        </div>
    )
}