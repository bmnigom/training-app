import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { auth } from './firebase/config'
import { signOut } from 'firebase/auth'
import Login from './pages/Login'
import AthleteDashboard from './pages/athlete/Dashboard'
import CoachDashboard from './pages/coach/Dashboard'
import AdminDashboard from './pages/admin/Dashboard'
import NutritionistDashboard from './pages/nutritionist/Dashboard'
import PhysioDashboard from './pages/physio/Dashboard'

const ROLE_LABELS = {
    athlete: 'Atleta',
    coach: 'Entrenador',
    nutritionist: 'Nutricionista',
    physio: 'Fisioterapeuta',
    admin: 'Admin',
}

const ROLE_COLORS = {
    athlete: 'bg-blue-100 text-blue-700',
    coach: 'bg-green-100 text-green-700',
    nutritionist: 'bg-orange-100 text-orange-700',
    physio: 'bg-teal-100 text-teal-700',
    admin: 'bg-purple-100 text-purple-700',
}

export function RoleSwitcher() {
    const { roles, activeRole, switchRole } = useAuth()
    if (roles.length <= 1) return null

    return (
        <div className="flex items-center gap-1">
            {roles.map(r => (
                <button
                    key={r}
                    onClick={() => switchRole(r)}
                    className={"text-xs px-2 py-1 rounded-lg font-medium transition " + (activeRole === r ? ROLE_COLORS[r] : 'bg-gray-100 text-gray-400 hover:bg-gray-200')}
                >
                    {ROLE_LABELS[r] || r}
                </button>
            ))}
        </div>
    )
}

function AppRoutes() {
    const { user, role } = useAuth()

    if (!user) return <Login />

    if (!role) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
                <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center max-w-sm w-full">
                    <h2 className="text-xl font-bold text-gray-800">Cuenta pendiente</h2>
                    <p className="text-gray-500 text-sm mt-2">Tu cuenta esta siendo revisada. Vuelve en unos minutos.</p>
                    <button onClick={() => signOut(auth)} className="mt-4 text-sm text-red-400 hover:text-red-600">Cerrar sesion</button>
                </div>
            </div>
        )
    }

    return (
        <>
            {role === 'athlete' && <AthleteDashboard />}
            {role === 'coach' && <CoachDashboard />}
            {role === 'admin' && <AdminDashboard />}
            {role === 'nutritionist' && <NutritionistDashboard />}
            {role === 'physio' && <PhysioDashboard />}
        </>
    )
}

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}