import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts'

function getWeekLabel(dateStr) {
    const d = new Date(dateStr + 'T12:00:00')
    const monday = new Date(d)
    const day = d.getDay()
    const diff = day === 0 ? -6 : 1 - day
    monday.setDate(d.getDate() + diff)
    return monday.toLocaleDateString('es-CO', { day: 'numeric', month: 'short' })
}

function calculateVolume(exercises) {
    let total = 0
    if (!exercises) return 0
    exercises.forEach(ex => {
        const sets = parseFloat(ex.actual && ex.actual.sets ? ex.actual.sets : ex.sets || 0)
        const reps = parseFloat(ex.actual && ex.actual.reps ? ex.actual.reps : ex.reps || 0)
        const load = parseFloat(ex.actual && ex.actual.load ? ex.actual.load : ex.load || 0)
        const unit = ex.actual && ex.actual.unit ? ex.actual.unit : ex.unit || 'kg'
        const loadKg = unit === 'lb' ? load * 0.453592 : load
        if (sets && reps && loadKg) total += sets * reps * loadKg
    })
    return Math.round(total)
}

function groupByWeek(sessions) {
    const weeks = {}
    sessions.forEach(s => {
        const label = getWeekLabel(s.date)
        if (!weeks[label]) weeks[label] = { week: label, volumen: 0, sesiones: 0, rpePromedio: 0, rpeSum: 0 }
        weeks[label].volumen += calculateVolume(s.exercises)
        weeks[label].sesiones += 1
        if (s.rpe && s.rpe.value) {
            weeks[label].rpeSum += parseFloat(s.rpe.value)
            weeks[label].rpePromedio = Math.round((weeks[label].rpeSum / weeks[label].sesiones) * 10) / 10
        }
    })
    return Object.values(weeks)
}

const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white border border-gray-200 rounded-xl p-3 shadow-sm text-xs space-y-1">
                <p className="font-medium text-gray-800">Semana del {label}</p>
                <p className="text-blue-600">Volumen: {payload[0] && payload[0].value.toLocaleString()} kg</p>
                {payload[1] && <p className="text-orange-500">RPE promedio: {payload[1].value}</p>}
            </div>
        )
    }
    return null
}

export default function WorkloadChart({ userEmail, userId }) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)
    const [view, setView] = useState('volumen')

    useEffect(() => {
        fetchSessions()
    }, [userId, userEmail])

    async function fetchSessions() {
        try {
            const field = userEmail ? 'userEmail' : 'userId'
            const value = userEmail || userId
            const q = query(
                collection(db, 'executedSessions'),
                where(field, '==', value),
                orderBy('date', 'asc')
            )
            const snap = await getDocs(q)
            const sessions = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setData(groupByWeek(sessions))
        } catch (err) {
            console.error(err)
        }
        setLoading(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-8">Cargando datos...</p>

    if (data.length === 0) return (
        <div className="text-center text-gray-400 py-8">
            <p className="font-medium">Sin datos de carga</p>
            <p className="text-sm mt-1">Completa sesiones para ver el grafico</p>
        </div>
    )

    const maxVolumen = Math.max(...data.map(d => d.volumen))
    const avgVolumen = Math.round(data.reduce((a, b) => a + b.volumen, 0) / data.length)

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h3 className="font-bold text-gray-800">Carga semanal</h3>
                    <p className="text-xs text-gray-400">Volumen total en kg por semana</p>
                </div>
                <div className="flex gap-1">
                    {['volumen', 'rpe'].map(v => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            className={"px-3 py-1 rounded-lg text-xs font-medium border transition " + (view === v ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300')}
                        >
                            {v === 'volumen' ? 'Volumen' : 'RPE'}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-blue-600 font-medium">Semanas</p>
                    <p className="text-xl font-bold text-blue-700 mt-1">{data.length}</p>
                </div>
                <div className="bg-green-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-green-600 font-medium">Promedio</p>
                    <p className="text-xl font-bold text-green-700 mt-1">{avgVolumen.toLocaleString()}</p>
                    <p className="text-xs text-green-500">kg/sem</p>
                </div>
                <div className="bg-orange-50 rounded-xl p-3 text-center">
                    <p className="text-xs text-orange-600 font-medium">Maximo</p>
                    <p className="text-xl font-bold text-orange-700 mt-1">{maxVolumen.toLocaleString()}</p>
                    <p className="text-xs text-orange-500">kg/sem</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <ResponsiveContainer width="100%" height={220}>
                    <BarChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                        <XAxis dataKey="week" tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <YAxis tick={{ fontSize: 11, fill: '#9ca3af' }} />
                        <Tooltip content={<CustomTooltip />} />
                        {view === 'volumen' && (
                            <>
                                <ReferenceLine y={avgVolumen} stroke="#22c55e" strokeDasharray="4 4" label={{ value: 'Promedio', position: 'right', fontSize: 10, fill: '#22c55e' }} />
                                <Bar dataKey="volumen" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                            </>
                        )}
                        {view === 'rpe' && (
                            <Bar dataKey="rpePromedio" fill="#f97316" radius={[4, 4, 0, 0]} />
                        )}
                    </BarChart>
                </ResponsiveContainer>
            </div>

            <div className="space-y-2">
                {data.map((d, i) => {
                    const isPeak = d.volumen === maxVolumen
                    const isHigh = d.volumen > avgVolumen * 1.2
                    return (
                        <div key={i} className={"flex items-center justify-between rounded-xl px-4 py-3 " + (isPeak ? 'bg-orange-50 border border-orange-200' : 'bg-white border border-gray-100')}>
                            <div>
                                <p className="text-sm font-medium text-gray-800">Semana del {d.week}</p>
                                <p className="text-xs text-gray-400">{d.sesiones} sesiones · RPE prom: {d.rpePromedio || '-'}</p>
                            </div>
                            <div className="text-right">
                                <p className={"text-sm font-bold " + (isPeak ? 'text-orange-600' : isHigh ? 'text-yellow-600' : 'text-gray-800')}>
                                    {d.volumen.toLocaleString()} kg
                                </p>
                                {isPeak && <p className="text-xs text-orange-500">Pico de carga</p>}
                                {isHigh && !isPeak && <p className="text-xs text-yellow-500">Carga alta</p>}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}