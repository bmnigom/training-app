import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'
import { useAthletes } from '../../hooks/useAthletes'
import RoleSwitcher from '../../components/shared/RoleSwitcher'
import PhysioSessionForm from '../../components/physio/PhysioSessionForm'
import PhysioHistory from '../../components/physio/PhysioHistory'
import PhysioWorkloadDashboard from '../../components/physio/PhysioWorkloadDashboard'
import PhysioExerciseLibrary from '../../components/physio/PhysioExerciseLibrary'
import RehabPrescription from '../../components/physio/RehabPrescription'

export default function PhysioDashboard() {
    const { user } = useAuth()
    const { athletes } = useAthletes()
    const [activeTab, setActiveTab] = useState('session')
    const [selectedAthlete, setSelectedAthlete] = useState(null)

    const tabs = [
        { id: 'session', label: 'Nueva sesion' },
        { id: 'history', label: 'Historial' },
        { id: 'workload', label: 'Carga muscular' },
        { id: 'rehab', label: 'Rehabilitacion' },
        { id: 'library', label: 'Biblioteca' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Training App</h1>
                    <p className="text-xs text-gray-500">{user.email} · Fisioterapeuta</p>
                </div>
                <div className="flex items-center gap-3">
                    <RoleSwitcher />
                    <button onClick={() => signOut(auth)} className="text-sm text-gray-500 hover:text-red-500 transition">
                        Cerrar sesion
                    </button>
                </div>
            </header>

            {athletes.length > 0 && (
                <div className="bg-teal-50 border-b border-teal-100 px-4 py-2 flex items-center gap-3">
                    <p className="text-xs text-teal-700 font-medium shrink-0">Atleta activo:</p>
                    <select
                        value={selectedAthlete?.uid || ''}
                        onChange={e => setSelectedAthlete(athletes.find(a => a.uid === e.target.value) || null)}
                        className="flex-1 border border-teal-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-teal-500"
                    >
                        <option value="">Selecciona un atleta...</option>
                        {athletes.map(a => <option key={a.uid} value={a.uid}>{a.email}</option>)}
                    </select>
                </div>
            )}

            <div className="bg-white border-b border-gray-200 px-4 overflow-x-auto">
                <div className="flex gap-1 min-w-max">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={"px-4 py-3 text-sm font-medium border-b-2 transition whitespace-nowrap " + (activeTab === tab.id ? 'border-teal-600 text-teal-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-6">
                {activeTab === 'library' ? (
                    <PhysioExerciseLibrary />
                ) : !selectedAthlete ? (
                    <div className="text-center text-gray-400 py-12">
                        <p className="font-medium">Selecciona un atleta</p>
                        <p className="text-sm mt-1">Elige un atleta en la barra superior para continuar</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'session' && <PhysioSessionForm athlete={selectedAthlete} />}
                        {activeTab === 'history' && <PhysioHistory athlete={selectedAthlete} />}
                        {activeTab === 'workload' && <PhysioWorkloadDashboard athlete={selectedAthlete} />}
                        {activeTab === 'rehab' && <RehabPrescription athlete={selectedAthlete} />}
                    </>
                )}
            </main>
        </div>
    )
}