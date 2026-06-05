import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function RecoveryChart({ userId }) {
    const [data, setData] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => { fetchLogs() }, [userId])

    async function fetchLogs() {
        const q = query(
            collection(db, 'recoveryLogs'),
            where('userId', '==', userId),
            orderBy('date', 'asc')
        )
        const snap = await getDocs(q)
        const logs = snap.docs.map(d => d.data())
        setData(logs.map(l => ({
            date: l.date,
            sueno: l.sleepHours,
            calidad: l.sleepQuality,
            hrv: l.hrv || null,
        })))
        setLoading(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-8">Cargando...</p>
    if (data.length < 2) return null

    return (
        <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
            <p className="text-sm font-bold text-gray-800">Tendencia de recuperacion</p>
            <ResponsiveContainer width="100%" height={200}>
                <LineChart data={data} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <YAxis tick={{ fontSize: 10, fill: '#9ca3af' }} />
                    <Tooltip />
                    <Legend wrapperStyle={{ fontSize: '11px' }} />
                    <Line type="monotone" dataKey="sueno" stroke="#3b82f6" strokeWidth={2} dot={false} name="Horas sueno" />
                    <Line type="monotone" dataKey="calidad" stroke="#22c55e" strokeWidth={2} dot={false} name="Calidad sueno" />
                    {data.some(d => d.hrv) && (
                        <Line type="monotone" dataKey="hrv" stroke="#f97316" strokeWidth={2} dot={false} name="HRV" />
                    )}
                </LineChart>
            </ResponsiveContainer>
        </div>
    )
}