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

function AppRoutes() {
    const { user, role } = useAuth()

    if (!user) return <Login />
    if (role === 'athlete') return <AthleteDashboard />
    if (role === 'coach') return <CoachDashboard />
    if (role === 'admin') return <AdminDashboard />
    if (role === 'nutritionist') return <NutritionistDashboard />
    if (role === 'physio') return <PhysioDashboard />

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

export default function App() {
    return (
        <BrowserRouter>
            <AuthProvider>
                <AppRoutes />
            </AuthProvider>
        </BrowserRouter>
    )
}