import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'
import UserManager from '../../components/admin/UserManager'

export default function AdminDashboard() {
    const { user } = useAuth()

    return (
        <div className="min-h-screen bg-gray-50">
            <header className="bg-white border-b border-gray-200 px-4 py-3 flex items-center justify-between">
                <div>
                    <h1 className="text-lg font-bold text-gray-800">Training App</h1>
                    <p className="text-xs text-gray-500">{user.email} · Administrador</p>
                </div>
                <button onClick={() => signOut(auth)} className="text-sm text-gray-500 hover:text-red-500 transition">
                    Cerrar sesion
                </button>
            </header>
            <main className="max-w-3xl mx-auto px-4 py-6">
                <UserManager />
            </main>
        </div>
    )
}