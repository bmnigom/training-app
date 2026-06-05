import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'
import { useAthletes } from '../../hooks/useAthletes'
import ExerciseLibrary from '../../components/coach/ExerciseLibrary'
import PlanningModule from '../../components/coach/PlanningModule'
import AthletesModule from '../../components/coach/AthletesModule'
import RoleSwitcher from '../../components/shared/RoleSwitcher'

export default function CoachDashboard() {
    const { user } = useAuth()
    const { athletes, loading: loadingAthletes } = useAthletes()
    const [activeTab, setActiveTab] = useState('library')
    const [selectedAthlete, setSelectedAthlete] = useState(null)

    const tabs = [
        { id: 'library', label: 'Biblioteca' },
        { id: 'planning', label: 'Planificacion' },
        { id: 'athletes', label: 'Atletas' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Training App</h1>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <div className="flex items-center gap-3">
                    <RoleSwitcher />
                    <button onClick={() => signOut(auth)} className="text-sm text-gray-500 hover:text-red-500 transition">
                        Cerrar sesion
                    </button>
                </div>
            </header>

            {athletes.length > 0 && (
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-3">
                    <p className="text-xs text-blue-700 font-medium shrink-0">Atleta activo:</p>
                    <select
                        value={selectedAthlete?.uid || ''}
                        onChange={e => {
                            const found = athletes.find(a => a.uid === e.target.value)
                            setSelectedAthlete(found || null)
                        }}
                        className="flex-1 border border-blue-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                        <option value="">Selecciona un atleta...</option>
                        {athletes.map(a => (
                            <option key={a.uid} value={a.uid}>{a.email}</option>
                        ))}
                    </select>
                </div>
            )}

            {!loadingAthletes && athletes.length === 0 && (
                <div className="bg-yellow-50 border-b border-yellow-100 px-4 py-2">
                    <p className="text-xs text-yellow-700">Sin atletas asignados. Contacta al administrador.</p>
                </div>
            )}

            <div className="bg-white border-b border-gray-200 px-4">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={"px-4 py-3 text-sm font-medium border-b-2 transition " + (activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-4xl mx-auto px-4 py-6">
                {activeTab === 'library' && <ExerciseLibrary />}
                {activeTab === 'planning' && <PlanningModule selectedAthlete={selectedAthlete} />}
                {activeTab === 'athletes' && <AthletesModule selectedAthlete={selectedAthlete} />}
            </main>
        </div>
    )
}