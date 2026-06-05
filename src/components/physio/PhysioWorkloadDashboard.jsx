import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

function getWeekLabel(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    const monday = new Date(d)
    monday.setDate(d.getDate() + diff)
    return monday.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

const COLORS = ['#0d9488', '#3b82f6', '#f97316', '#8b5cf6', '#ef4444', '#22c55e', '#eab308', '#ec4899']

export default function PhysioWorkloadDashboard({ athlete }) {
    const [sessions, setSessions] = useState([])
    const [loading, setLoading] = useState(true)
    const [weeklyData, setWeeklyData] = useState([])
    const [muscleGroups, setMuscleGroups] = useState([])

    useEffect(() => { fetchSessions() }, [athlete])

    async function fetchSessions() {
        setLoading(true)
        const q = query(
            collection(db, 'physioSessions'),
            where('athleteUid', '==', athlete.uid),
            orderBy('date', 'asc')
        )
        const snap = await getDocs(q)
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        setSessions(data)
        processData(data)
        setLoading(false)
    }

    function processData(data) {
        const allGroups = new Set()
        data.forEach(s => {
            if (s.muscleGroupSummary) {
                Object.keys(s.muscleGroupSummary).forEach(g => allGroups.add(g))
            }
        })
        const groups = Array.from(allGroups)
        setMuscleGroups(groups)

        const weeks = {}
        data.forEach(s => {
            const label = getWeekLabel(s.date)
            if (!weeks[label]) {
                weeks[label] = { week: label, total: 0 }
                groups.forEach(g => { weeks[label][g] = 0 })
            }
            weeks[label].total += s.totalVolume || 0
            if (s.muscleGroupSummary) {
                Object.entries(s.muscleGroupSummary).forEach(([g, v]) => {
                    weeks[label][g] = (weeks[label][g] || 0) + Math.round(v)
                })
            }
        })
        setWeeklyData(Object.values(weeks))
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (sessions.length === 0) return (
        <div className="text-center text-gray-400 py-12">
            <p className="font-medium">Sin datos de carga</p>
            <p className="text-sm mt-1">Registra sesiones para ver el dashboard</p>
        </div>
    )

    const totalByMuscle = muscleGroups.map(g => ({
        group: g,
        total: sessions.reduce((acc, s) => acc + (s.muscleGroupSummary?.[g] || 0), 0)
    })).sort((a, b) => b.total - a.total)

    return (
        <div className="space-y-4">
            <h2 className="font-bold text-gray-800 text-lg">Carga muscular por microciclo</h2>

            <div className="grid grid-cols-2 gap-3">
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-teal-600 font-medium">Sesiones totales</p>
                    <p className="text-2xl font-bold text-teal-700">{sessions.length}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium">Volumen total</p>
                    <p className="text-2xl font-bold text-blue-700">{sessions.reduce((a, s) => a + (s.totalVolume || 0), 0).toLocaleString()}</p>
                    <p className="text-xs text-blue-400">kg</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-sm font-bold text-gray-800 mb-3">Volumen por grupo muscular por semana</p>
                <ResponsiveContainer width="100%" height={240}>
                    <BarChart data={weeklyData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                        <Tooltip />
                        <Legend wrapperStyle={{ fontSize: '11px' }} />
                        {muscleGroups.slice(0, 6).map((g, i) => (
                            <Bar key={g} dataKey={g} stackId="a" fill={COLORS[i % COLORS.length]} radius={i === muscleGroups.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]} />
                        ))}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-bold text-gray-800">Carga acumulada por grupo muscular</p>
                {totalByMuscle.map((item, i) => (
                    <div key={item.group} className="space-y-1">
                        <div className="flex justify-between text-xs">
                            <span className="text-gray-700 font-medium">{item.group}</span>
                            <span className="text-gray-500">{Math.round(item.total).toLocaleString()} kg</span>
                        </div>
                        <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                            <div
                                className="h-full rounded-full"
                                style={{
                                    width: (item.total / totalByMuscle[0].total * 100) + '%',
                                    backgroundColor: COLORS[i % COLORS.length]
                                }}
                            />
                        </div>
                    </div>
                ))}
            </div>

            <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide">Ultimas recomendaciones de recuperacion</p>
                {sessions.filter(s => s.recoveryRecommendations).slice(0, 3).map(s => (
                    <div key={s.id} className="bg-yellow-50 rounded-xl p-3">
                        <p className="text-xs text-yellow-600 font-medium mb-1">{s.date}</p>
                        <p className="text-sm text-yellow-800">{s.recoveryRecommendations}</p>
                    </div>
                ))}
            </div>
        </div>
    )
}