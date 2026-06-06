import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const ALL_ROLES = ['athlete', 'coach', 'nutritionist', 'physio', 'doctor', 'admin']
const ROLE_LABELS = { athlete: 'Atleta', coach: 'Entrenador', nutritionist: 'Nutricionista', physio: 'Fisioterapeuta', doctor: 'Medico', admin: 'Admin' }
const ROLE_COLORS = {
    athlete: 'bg-blue-50 text-blue-700',
    coach: 'bg-green-50 text-green-700',
    nutritionist: 'bg-orange-50 text-orange-700',
    physio: 'bg-teal-50 text-teal-700',
    doctor: 'bg-red-50 text-red-700',
    admin: 'bg-purple-50 text-purple-700',
}

export default function UserManager() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState({})
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [search, setSearch] = useState('')

    useEffect(() => { fetchUsers() }, [])

    async function fetchUsers() {
        const snap = await getDocs(collection(db, 'users'))
        const data = snap.docs.map(d => {
            const user = { uid: d.id, ...d.data() }
            if (!Array.isArray(user.roles)) {
                user.roles = user.role ? [user.role] : []
            }
            return user
        })
        data.sort((a, b) => (a.email || '').localeCompare(b.email || ''))
        setUsers(data)
        setLoading(false)
    }

    async function toggleRole(uid, role) {
        setSaving(prev => ({ ...prev, [uid]: true }))
        try {
            const user = users.find(u => u.uid === uid)
            const currentRoles = Array.isArray(user.roles) ? user.roles : []
            const newRoles = currentRoles.includes(role)
                ? currentRoles.filter(r => r !== role)
                : [...currentRoles, role]
            await updateDoc(doc(db, 'users', uid), {
                roles: newRoles,
                role: newRoles[0] || null,
                updatedAt: serverTimestamp(),
            })
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, roles: newRoles } : u))
        } catch (err) {
            console.error(err)
        }
        setSaving(prev => ({ ...prev, [uid]: false }))
    }

    async function handleDelete() {
        if (!confirmDelete) return
        setDeleting(true)
        try {
            await deleteDoc(doc(db, 'users', confirmDelete))
            setUsers(prev => prev.filter(u => u.uid !== confirmDelete))
            setConfirmDelete(null)
        } catch (err) {
            console.error(err)
        }
        setDeleting(false)
    }

    const pending = users.filter(u => !u.roles || u.roles.length === 0)
    const filtered = users.filter(u => (u.email || '').toLowerCase().includes(search.toLowerCase()))

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando usuarios...</p>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Gestion de usuarios</h2>
                    <p className="text-xs text-gray-400">{users.length} usuarios registrados</p>
                </div>
            </div>

            {pending.length > 0 && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-bold text-yellow-800">{pending.length} usuario(s) sin rol asignado</p>
                    {pending.map(u => (
                        <div key={u.uid} className="bg-white rounded-xl p-3 border border-yellow-100">
                            <p className="text-sm text-gray-700 mb-2">{u.email}</p>
                            <div className="flex gap-2 flex-wrap">
                                {ALL_ROLES.map(r => (
                                    <button
                                        key={r}
                                        onClick={() => toggleRole(u.uid, r)}
                                        disabled={saving[u.uid]}
                                        className="text-xs px-3 py-1.5 rounded-lg border border-gray-300 text-gray-600 hover:bg-gray-50 transition disabled:opacity-40"
                                    >
                                        + {ROLE_LABELS[r]}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {confirmDelete && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">Eliminar este usuario del sistema?</p>
                    <p className="text-xs text-red-600">Solo se elimina de Firestore. El usuario no podra acceder a la app.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                        <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40">{deleting ? 'Eliminando...' : 'Si, eliminar'}</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-4">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por email..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="space-y-3">
                {filtered.map(u => (
                    <div key={u.uid} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                        <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{u.email}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{u.uid}</p>
                            </div>
                            <button
                                onClick={() => setConfirmDelete(u.uid)}
                                className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 px-2 py-1 rounded-lg transition shrink-0"
                            >
                                Eliminar
                            </button>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Roles activos</p>
                            {u.roles.length === 0 && (
                                <p className="text-xs text-yellow-600 bg-yellow-50 px-2 py-1 rounded-lg inline-block">Sin roles asignados</p>
                            )}
                            <div className="flex gap-2 flex-wrap">
                                {u.roles.map(r => (
                                    <span key={r} className={"text-xs px-2 py-1 rounded-full font-medium " + (ROLE_COLORS[r] || 'bg-gray-50 text-gray-600')}>
                    {ROLE_LABELS[r] || r}
                  </span>
                                ))}
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-2">Agregar o quitar roles</p>
                            <div className="flex gap-2 flex-wrap">
                                {ALL_ROLES.map(r => {
                                    const hasRole = u.roles.includes(r)
                                    return (
                                        <button
                                            key={r}
                                            onClick={() => toggleRole(u.uid, r)}
                                            disabled={saving[u.uid]}
                                            className={"text-xs px-3 py-1.5 rounded-lg border transition disabled:opacity-40 " + (hasRole ? 'bg-gray-100 text-gray-500 border-gray-200 hover:bg-red-50 hover:text-red-500 hover:border-red-200' : 'bg-white text-gray-600 border-gray-300 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-300')}
                                        >
                                            {hasRole ? '- ' : '+ '}{ROLE_LABELS[r]}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No hay usuarios</p>}
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Como agregar nuevos usuarios</p>
                <p className="text-xs text-gray-400">1. Ve a Firebase Console → Authentication → Users → Agregar usuario</p>
                <p className="text-xs text-gray-400">2. El usuario aparecera aqui sin roles cuando inicie sesion por primera vez</p>
                <p className="text-xs text-gray-400">3. Asignale uno o varios roles desde este panel</p>
            </div>
        </div>
    )
}