import { useState } from 'react'
import AthleteSessionReview from './AthleteSessionReview'
import PhysioProceduresView from './PhysioProceduresView'

export default function AthletesModule({ selectedAthlete }) {
    const [activeTab, setActiveTab] = useState('sessions')

    if (!selectedAthlete) {
        return (
            <div className="text-center text-gray-400 py-12">
                <p className="font-medium">Selecciona un atleta</p>
                <p className="text-sm mt-1">Elige un atleta en la barra superior para ver sus sesiones</p>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex gap-2">
                <button
                    onClick={() => setActiveTab('sessions')}
                    className={"px-4 py-2 rounded-xl text-sm font-medium border transition " + (activeTab === 'sessions' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}
                >
                    Sesiones ejecutadas
                </button>
                <button
                    onClick={() => setActiveTab('physio')}
                    className={"px-4 py-2 rounded-xl text-sm font-medium border transition " + (activeTab === 'physio' ? 'bg-teal-600 text-white border-teal-600' : 'bg-white text-gray-600 border-gray-300 hover:border-teal-400')}
                >
                    Fisioterapia
                </button>
            </div>

            {activeTab === 'sessions' && (
                <AthleteSessionReview
                    athleteEmail={selectedAthlete.email}
                    athleteUid={selectedAthlete.uid}
                    onBack={() => {}}
                />
            )}
            {activeTab === 'physio' && (
                <PhysioProceduresView athlete={selectedAthlete} />
            )}
        </div>
    )
}