import { useState } from 'react'
import MesocycleList from './MesocycleList'
import MesocycleDetail from './MesocycleDetail'
import SessionPlanner from './SessionPlanner'

export default function PlanningModule() {
    const [view, setView] = useState('list')
    const [selectedMeso, setSelectedMeso] = useState(null)
    const [selectedSession, setSelectedSession] = useState(null)

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
            onSelect={(meso) => { setSelectedMeso(meso); setView('detail') }}
        />
    )
}