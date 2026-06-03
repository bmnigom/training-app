import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'
import SessionForm from '../../components/athlete/SessionForm'
import SessionHistory from '../../components/athlete/SessionHistory'

export default function AthleteDashboard() {
    const { user } = useAuth()
    const [activeTab, setActiveTab] = useState('register')

    const tabs = [
        { id: 'register', label: 'Registrar sesión' },
        { id: 'history', label: 'Historial' },
        { id: 'progress', label: 'Progreso' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Training App</h1>
                    <p className="text-xs text-gray-500">{user.email}</p>
                </div>
                <button
                    onClick={() => signOut(auth)}
                    className="text-sm text-gray-500 hover:text-red-500 transition"
                >
                    Cerrar sesión
                </button>
            </header>

            {/* Tabs */}
            <div className="bg-white border-b border-gray-200 px-4">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={`px-4 py-3 text-sm font-medium border-b-2 transition ${
                                activeTab === tab.id
                                    ? 'border-blue-600 text-blue-600'
                                    : 'border-transparent text-gray-500 hover:text-gray-700'
                            }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* Content */}
            <main className="max-w-2xl mx-auto px-4 py-6">
                {activeTab === 'register' && <SessionForm />}
                {activeTab === 'history' && <SessionHistory />}
                {activeTab === 'progress' && (
                    <div className="text-center text-gray-400 py-12">
                        Gráficas de progreso — próximamente
                    </div>
                )}
            </main>
        </div>
    )
}