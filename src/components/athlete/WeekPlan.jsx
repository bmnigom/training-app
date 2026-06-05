import { useEffect, useState } from 'react'
import { collection, getDocs, query, where } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import TodaySession from './TodaySession'

const TYPE_COLORS = {
    'Fuerza': 'bg-blue-50 text-blue-700 border-blue-200',
    'Balonmano': 'bg-green-50 text-green-700 border-green-200',
    'Mixto': 'bg-purple-50 text-purple-700 border-purple-200',
    'Velocidad y salto': 'bg-orange-50 text-orange-700 border-orange-200',
    'Fisioterapia': 'bg-pink-50 text-pink-700 border-pink-200',
    'Descanso': 'bg-gray-50 text-gray-400 border-gray-200',
    'Otro': 'bg-yellow-50 text-yellow-700 border-yellow-200',
}

export default function WeekPlan() {
    const { user } = useAuth()
    const [sessions, setSessions] = useState([])
    const [allSessions, setAllSessions] = useState([])
    const [mesocycle, setMesocycle] = useState(null)
    const [loading, setLoading] = useState(true)
    const [selectedSession, setSelectedSession] = useState(null)
    const [weekRange, setWeekRange] = useState({ start: '', end: '' })

    const today = new Date().toISOString().split('T')[0]

    const getWeekRange = () => {
        const now = new Date()
        const day = now.getDay()
        const diffToMonday = (day === 0 ? -6 : 1 - day)
        const monday = new Date(now)
        monday.setDate(now.getDate() + diffToMonday)
        const sunday = new Date(monday)
        sunday.setDate(monday.getDate() + 6)
        return {
            start: monday.toISOString().split('T')[0],
            end: sunday.toISOString().split('T')[0],
        }
    }

    useEffect(() => { fetchPlan() }, [])

    async function fetchPlan() {
        try {
            const mesoSnap = await getDocs(
                query(collection(db, 'mesocycles'), where('athleteEmail', '==', user.email))
            )
            console.log('Mesociclos encontrados:', mesoSnap.size)
            if (mesoSnap.empty) { setLoading(false); return }

            const sorted = mesoSnap.docs.sort((a, b) =>
                new Date(b.data().startDate) - new Date(a.data().startDate)
            )
            const mesoDoc = sorted[0]
            const meso = { id: mesoDoc.id, ...mesoDoc.data() }
            console.log('Mesociclo seleccionado:', meso.name, meso.id)
            setMesocycle(meso)

            const sessionSnap = await getDocs(
                collection(db, 'mesocycles', meso.id, 'plannedSessions')
            )
            console.log('Sesiones totales:', sessionSnap.size)

            const all = sessionSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            all.sort((a, b) => new Date(a.date) - new Date(b.date))
            setAllSessions(all)
            console.log('Fechas sesiones:', all.map(s => s.date))

            const range = getWeekRange()
            setWeekRange(range)
            console.log('Rango semana:', range.start, 'a', range.end)

            const week = all.filter(s => s.date >= range.start && s.date <= range.end)
            console.log('Sesiones esta semana:', week.length)
            setSessions(week)
        } catch (err) {
            console.error('Error fetchPlan:', err)
        }
        setLoading(false)
    }

    const formatDate = (dateStr) => {
        const d = new Date(dateStr + 'T12:00:00')
        return d.toLocaleDateString('es-CO', { weekday: 'long', day: 'numeric', month: 'short' })
    }

    if (selectedSession) {
        return (
            <TodaySession
                session={selectedSession}
                mesocycleId={mesocycle.id}
                onBack={() => { setSelectedSession(null); fetchPlan() }}
            />
        )
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando tu plan...</p>

    if (!mesocycle) {
        return (
            <div className="text-center text-gray-400 py-12">
                <p className="text-lg font-medium">Sin plan asignado</p>
                <p className="text-sm mt-1">Tu entrenador aun no ha creado tu plan</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wide">Ciclo actual</p>
                <p className="font-bold text-gray-800 mt-1">{mesocycle.name}</p>
                <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{mesocycle.method}</span>
                    <span className="text-xs text-gray-400">{mesocycle.startDate} → {mesocycle.endDate}</span>
                </div>
                {mesocycle.objective && <p className="text-xs text-gray-500 mt-2 italic">{mesocycle.objective}</p>}
            </div>

            {allSessions.length > 0 && sessions.length === 0 && (
                <div className="bg-yellow-50 rounded-xl p-3">
                    <p className="text-xs text-yellow-700 font-medium">Hay {allSessions.length} sesiones en el ciclo pero ninguna esta semana ({weekRange.start} a {weekRange.end})</p>
                    <p className="text-xs text-yellow-600 mt-1">Fechas disponibles: {allSessions.map(s => s.date).join(', ')}</p>
                </div>
            )}

            <div>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-3">Esta semana</p>
                {sessions.length === 0 && (
                    <div className="text-center text-gray-400 py-8">
                        <p className="font-medium">Sin sesiones esta semana</p>
                        <p className="text-sm mt-1">Tu entrenador aun no ha planificado esta semana</p>
                    </div>
                )}
                <div className="space-y-2">
                    {sessions.map(session => {
                        const isToday = session.date === today
                        const isPast = session.date < today
                        return (
                            <div
                                key={session.id}
                                onClick={() => session.type !== 'Descanso' && setSelectedSession(session)}
                                className={"rounded-2xl border p-4 transition " + (
                                    session.type === 'Descanso'
                                        ? 'bg-gray-50 border-gray-200 cursor-default'
                                        : isToday
                                            ? 'bg-white border-blue-400 shadow-sm cursor-pointer hover:shadow-md'
                                            : 'bg-white border-gray-200 cursor-pointer hover:border-blue-300'
                                )}
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex items-center gap-3">
                                        {isToday && (
                                            <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded-full font-medium">Hoy</span>
                                        )}
                                        {isPast && !isToday && (
                                            <span className="text-xs bg-gray-100 text-gray-400 px-2 py-0.5 rounded-full">Pasado</span>
                                        )}
                                        <div>
                                            <p className="text-sm font-medium text-gray-800 capitalize">{formatDate(session.date)}</p>
                                            {session.objective && <p className="text-xs text-gray-400 mt-0.5">{session.objective}</p>}
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                    <span className={"text-xs px-2 py-1 rounded-lg border font-medium " + (TYPE_COLORS[session.type] || 'bg-gray-50 text-gray-600 border-gray-200')}>
                      {session.type}
                    </span>
                                    </div>
                                </div>
                                {session.type !== 'Descanso' && (
                                    <div className="flex items-center justify-between mt-3">
                                        <p className="text-xs text-gray-400">{session.exercises?.length || 0} ejercicios prescritos</p>
                                        <p className="text-xs text-blue-500">{isToday ? 'Iniciar sesion →' : 'Ver sesion →'}</p>
                                    </div>
                                )}
                            </div>
                        )
                    })}
                </div>
            </div>
        </div>
    )
}