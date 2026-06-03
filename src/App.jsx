import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import Login from './pages/Login'

function AppRoutes() {
    const { user, role } = useAuth()

    if (!user) return <Login />

    return (
        <Routes>
            <Route path="*" element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-8 text-center">
                        <h2 className="text-xl font-bold text-gray-800">
                            Bienvenido {role === 'coach' ? 'Entrenador' : 'Atleta'}
                        </h2>
                        <p className="text-gray-500 text-sm mt-2">{user.email}</p>
                    </div>
                </div>
            } />
        </Routes>
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