import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'
import AthleteDashboard from './pages/athlete/Dashboard'

function AppRoutes() {
    const { user, role } = useAuth()

    if (!user) return <Login />

    if (role === 'athlete') return <AthleteDashboard />

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white rounded-2xl border border-gray-200 p-8 text-center">
                <h2 className="text-xl font-bold text-gray-800">Dashboard Entrenador</h2>
                <p className="text-gray-500 text-sm mt-2">Próximamente</p>
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