import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'
import WeekPlan from '../../components/athlete/WeekPlan'
import SessionHistory from '../../components/athlete/SessionHistory'
import RMTracker from '../../components/athlete/RMTracker'
import WorkloadChart from '../../components/shared/WorkloadChart'
import NutritionLog from '../../components/athlete/NutritionLog'
import PhysioAthleteView from '../../components/physio/PhysioAthleteView'

export default function AthleteDashboard() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('plan')

    const tabs = [
        { id: 'plan', label: 'Mi plan' },
        { id: 'history', label: 'Historial' },
        { id: 'rm', label: 'Mis RM' },
        { id: 'progress', label: 'Progreso' },
        { id: 'nutrition', label: 'Nutricion' },
        { id: 'physio', label: 'Fisioterapia' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Training App</h1>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button onClick={() => signOut(auth)} className="text-sm text-gray-500 hover:text-red-500 transition">
                    Cerrar sesion
                </button>
            </header>

            <div className="bg-white border-b border-gray-200 px-4">
                <div className="flex gap-1 overflow-x-auto">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={"px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap " + (activeTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-2xl mx-auto px-4 py-6">
                {activeTab === 'plan' && <WeekPlan />}
                {activeTab === 'history' && <SessionHistory />}
                {activeTab === 'rm' && <RMTracker />}
                {activeTab === 'progress' && <WorkloadChart userId={user.uid} />}
                {activeTab === 'nutrition' && <NutritionLog />}
                {activeTab === 'physio' && <PhysioAthleteView />}
            </main>
        </div>
    )
}