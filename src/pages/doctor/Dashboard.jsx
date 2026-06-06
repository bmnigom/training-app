import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'
import { useAthletes } from '../../hooks/useAthletes'
import RoleSwitcher from '../../components/shared/RoleSwitcher'
import ClinicalHistory from '../../components/doctor/ClinicalHistory'
import InjuryLog from '../../components/doctor/InjuryLog'
import MedicalClearance from '../../components/doctor/MedicalClearance'

export default function DoctorDashboard() {
    const { user } = useAuth()
    const { athletes } = useAthletes()
    const [activeTab, setActiveTab] = useState('history')
    const [selectedAthlete, setSelectedAthlete] = useState(null)

    const tabs = [
        { id: 'history', label: 'Historia clinica' },
        { id: 'injuries', label: 'Lesiones' },
        { id: 'clearance', label: 'Autorizaciones' },
    ]

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Training App</h1>
                    <p className="text-xs text-gray-500">{user.email} · Medico deportologo</p>
                </div>
                <div className="flex items-center gap-3">
                    <RoleSwitcher />
                    <button onClick={() => signOut(auth)} className="text-sm text-gray-500 hover:text-red-500 transition">
                        Cerrar sesion
                    </button>
                </div>
            </header>

            {athletes.length > 0 && (
                <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center gap-3">
                    <p className="text-xs text-red-700 font-medium shrink-0">Atleta activo:</p>
                    <select
                        value={selectedAthlete?.uid || ''}
                        onChange={e => setSelectedAthlete(athletes.find(a => a.uid === e.target.value) || null)}
                        className="flex-1 border border-red-200 rounded-lg px-3 py-1.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
                    >
                        <option value="">Selecciona un atleta...</option>
                        {athletes.map(a => <option key={a.uid} value={a.uid}>{a.email}</option>)}
                    </select>
                </div>
            )}

            <div className="bg-white border-b border-gray-200 px-4">
                <div className="flex gap-1">
                    {tabs.map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            className={"px-4 py-3 text-sm font-medium border-b-2 transition " + (activeTab === tab.id ? 'border-red-600 text-red-600' : 'border-transparent text-gray-500 hover:text-gray-700')}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <main className="max-w-3xl mx-auto px-4 py-6">
                {!selectedAthlete ? (
                    <div className="text-center text-gray-400 py-12">
                        <p className="font-medium">Selecciona un atleta</p>
                        <p className="text-sm mt-1">Elige un atleta en la barra superior para continuar</p>
                    </div>
                ) : (
                    <>
                        {activeTab === 'history' && <ClinicalHistory athlete={selectedAthlete} />}
                        {activeTab === 'injuries' && <InjuryLog athlete={selectedAthlete} />}
                        {activeTab === 'clearance' && <MedicalClearance athlete={selectedAthlete} />}
                    </>
                )}
            </main>
        </div>
    )
}