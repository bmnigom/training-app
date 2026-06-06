import { useEffect, useState } from 'react'
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

const BLOOD_TYPES = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
const EMPTY = {
    bloodType: '', allergies: '', currentMedications: '',
    personalHistory: '', familyHistory: '', surgeries: '',
    specialConditions: '', notes: ''
}

export default function ClinicalHistory({ athlete }) {
    const { user } = useAuth()
    const [form, setForm] = useState(EMPTY)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [saved, setSaved] = useState(false)

    useEffect(() => { fetchHistory() }, [athlete])

    async function fetchHistory() {
        setLoading(true)
        const snap = await getDoc(doc(db, 'clinicalHistory', athlete.uid))
        if (snap.exists()) {
            const data = snap.data()
            setForm({
                bloodType: data.bloodType || '',
                allergies: data.allergies || '',
                currentMedications: data.currentMedications || '',
                personalHistory: data.personalHistory || '',
                familyHistory: data.familyHistory || '',
                surgeries: data.surgeries || '',
                specialConditions: data.specialConditions || '',
                notes: data.notes || '',
            })
        } else {
            setForm(EMPTY)
        }
        setLoading(false)
    }

    async function handleSave() {
        setSaving(true)
        try {
            await setDoc(doc(db, 'clinicalHistory', athlete.uid), {
                athleteUid: athlete.uid,
                athleteEmail: athlete.email,
                doctorUid: user.uid,
                doctorEmail: user.email,
                ...form,
                updatedAt: serverTimestamp(),
            })
            setSaved(true)
            setTimeout(() => setSaved(false), 3000)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Historia clinica</h2>
                    <p className="text-xs text-gray-400">{athlete.email}</p>
                </div>
                <div className="bg-red-50 border border-red-100 rounded-xl px-3 py-1.5">
                    <p className="text-xs text-red-600 font-medium">Informacion confidencial</p>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <p className="text-sm font-bold text-gray-800">Datos generales</p>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Grupo sanguineo</label>
                    <select value={form.bloodType} onChange={e => setForm({ ...form, bloodType: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500">
                        <option value="">Selecciona...</option>
                        {BLOOD_TYPES.map(t => <option key={t}>{t}</option>)}
                    </select>
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Alergias</label>
                    <textarea value={form.allergies} onChange={e => setForm({ ...form, allergies: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Medicamentos, alimentos, materiales..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Medicamentos actuales</label>
                    <textarea value={form.currentMedications} onChange={e => setForm({ ...form, currentMedications: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Nombre, dosis, frecuencia..." />
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <p className="text-sm font-bold text-gray-800">Antecedentes</p>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Antecedentes personales</label>
                    <textarea value={form.personalHistory} onChange={e => setForm({ ...form, personalHistory: e.target.value })} rows={3} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Enfermedades previas, condiciones cronicas..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Antecedentes familiares</label>
                    <textarea value={form.familyHistory} onChange={e => setForm({ ...form, familyHistory: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Enfermedades cardiacas, diabetes, hipertension..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Cirugias previas</label>
                    <textarea value={form.surgeries} onChange={e => setForm({ ...form, surgeries: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Tipo, fecha, resultado..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Condiciones especiales</label>
                    <textarea value={form.specialConditions} onChange={e => setForm({ ...form, specialConditions: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Condiciones que afectan el entrenamiento..." />
                </div>
                <div>
                    <label className="block text-xs font-medium text-gray-600 mb-1">Notas adicionales</label>
                    <textarea value={form.notes} onChange={e => setForm({ ...form, notes: e.target.value })} rows={2} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none" placeholder="Observaciones del medico..." />
                </div>
            </div>

            <button
                onClick={handleSave}
                disabled={saving}
                className={"w-full py-3 rounded-2xl font-medium text-sm transition " + (saved ? 'bg-green-500 text-white' : 'bg-red-600 text-white hover:bg-red-700 disabled:opacity-40')}
            >
                {saved ? 'Historia guardada' : saving ? 'Guardando...' : 'Guardar historia clinica'}
            </button>
        </div>
    )
}