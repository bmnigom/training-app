import { useState } from 'react'
import MesocycleList from './MesocycleList'
import MesocycleDetail from './MesocycleDetail'
import SessionPlanner from './SessionPlanner'

export default function PlanningModule({ selectedAthlete }) {
    const [view, setView] = useState('list')
    const [selectedMeso, setSelectedMeso] = useState(null)
    const [selectedSession, setSelectedSession] = useState(null)

    if (!selectedAthlete) {
        return (
            <div className="text-center text-gray-400 py-12">
                <p className="font-medium">Selecciona un atleta</p>
                <p className="text-sm mt-1">Elige un atleta en la barra superior para ver su planificacion</p>
            </div>
        )
    }

    if (view === 'session' && selectedSession) {
        return (
            <SessionPlanner
                session={selectedSession}
                mesocycle={selectedMeso}
                onBack={() => setView('detail')}
            />
        )
    }

    if (view === 'detail' && selectedMeso) {
        return (
            <MesocycleDetail
                mesocycle={selectedMeso}
                onBack={() => { setView('list'); setSelectedMeso(null) }}
                onOpenSession={(session) => { setSelectedSession(session); setView('session') }}
            />
        )
    }

    return (
        <MesocycleList
            selectedAthlete={selectedAthlete}
            onSelect={(meso) => { setSelectedMeso(meso); setView('detail') }}
        />
    )
}