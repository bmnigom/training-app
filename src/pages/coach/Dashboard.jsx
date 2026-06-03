import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'
import ExerciseLibrary from '../../components/coach/ExerciseLibrary'
import PlanningModule from '../../components/coach/PlanningModule'

export default function CoachDashboard() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('library')

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
                    <p className="text-xs text-gray-500">{user.email} · Entrenador</p>
                </div>
                <button onClick={() => signOut(auth)} className="text-sm text-gray-500 hover:text-red-500 transition">
                    Cerrar sesion
                </button>
            </header>

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
                {activeTab === 'planning' && <PlanningModule />}
                {activeTab === 'athletes' && (
                    <div className="text-center text-gray-400 py-12">Gestion de atletas — proximamente</div>
                )}
            </main>
        </div>
    )
}