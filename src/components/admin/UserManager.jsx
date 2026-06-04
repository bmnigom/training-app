import { useEffect, useState } from 'react'
import { collection, getDocs, doc, updateDoc, deleteDoc, setDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config.js'

const ROLES = ['pending', 'athlete', 'coach', 'admin']
const ROLE_LABELS = { pending: 'Pendiente', athlete: 'Atleta', coach: 'Entrenador', admin: 'Admin' }
const ROLE_COLORS = {
    pending: 'bg-yellow-50 text-yellow-700',
    athlete: 'bg-blue-50 text-blue-700',
    coach: 'bg-green-50 text-green-700',
    admin: 'bg-purple-50 text-purple-700',
}

export default function UserManager() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState({})
    const [confirmDelete, setConfirmDelete] = useState(null)
    const [deleting, setDeleting] = useState(false)
    const [filterRole, setFilterRole] = useState('all')
    const [search, setSearch] = useState('')

    useEffect(() => { fetchUsers() }, [])

    async function fetchUsers() {
        const snap = await getDocs(collection(db, 'users'))
        const data = snap.docs.map(d => ({ uid: d.id, ...d.data() }))
        data.sort((a, b) => (a.email || '').localeCompare(b.email || ''))
        setUsers(data)
        setLoading(false)
    }

    async function updateRole(uid, newRole) {
        setSaving(prev => ({ ...prev, [uid]: true }))
        try {
            await updateDoc(doc(db, 'users', uid), {
                role: newRole,
                updatedAt: serverTimestamp(),
            })
            setUsers(prev => prev.map(u => u.uid === uid ? { ...u, role: newRole } : u))
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

    const filtered = users.filter(u => {
        const matchRole = filterRole === 'all' || u.role === filterRole
        const matchSearch = (u.email || '').toLowerCase().includes(search.toLowerCase())
        return matchRole && matchSearch
    })

    const pending = users.filter(u => !u.role || u.role === 'pending')

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
                    <p className="text-sm font-bold text-yellow-800">{pending.length} usuario(s) pendiente(s) de asignacion</p>
                    {pending.map(u => (
                        <div key={u.uid} className="flex items-center justify-between bg-white rounded-xl p-3 border border-yellow-100">
                            <p className="text-sm text-gray-700">{u.email}</p>
                            <div className="flex gap-2">
                                <button onClick={() => updateRole(u.uid, 'athlete')} disabled={saving[u.uid]} className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700 transition disabled:opacity-40">
                                    Atleta
                                </button>
                                <button onClick={() => updateRole(u.uid, 'coach')} disabled={saving[u.uid]} className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700 transition disabled:opacity-40">
                                    Entrenador
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {confirmDelete && (
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4 space-y-3">
                    <p className="text-sm font-medium text-red-800">Eliminar este usuario del sistema?</p>
                    <p className="text-xs text-red-600">Solo se elimina de Firestore, no de Firebase Auth. El usuario no podra acceder a la app.</p>
                    <div className="flex gap-2">
                        <button onClick={() => setConfirmDelete(null)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                        <button onClick={handleDelete} disabled={deleting} className="flex-1 bg-red-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-red-600 transition disabled:opacity-40">{deleting ? 'Eliminando...' : 'Si, eliminar'}</button>
                    </div>
                </div>
            )}

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <input
                    type="text"
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Buscar por email..."
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 flex-wrap">
                    {['all', ...ROLES].map(r => (
                        <button
                            key={r}
                            onClick={() => setFilterRole(r)}
                            className={"px-3 py-1 rounded-full text-xs font-medium border transition " + (filterRole === r ? 'bg-gray-800 text-white border-gray-800' : 'bg-white text-gray-600 border-gray-300 hover:border-gray-500')}
                        >
                            {r === 'all' ? 'Todos' : ROLE_LABELS[r]}
                        </button>
                    ))}
                </div>
            </div>

            <div className="space-y-2">
                {filtered.map(u => (
                    <div key={u.uid} className="bg-white rounded-xl border border-gray-200 p-4">
                        <div className="flex items-center justify-between gap-3">
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-gray-800 truncate">{u.email}</p>
                                <p className="text-xs text-gray-400 mt-0.5 truncate">{u.uid}</p>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                <span className={"text-xs px-2 py-1 rounded-full font-medium " + (ROLE_COLORS[u.role] || 'bg-gray-50 text-gray-500')}>
                  {ROLE_LABELS[u.role] || 'Sin rol'}
                </span>
                                <select
                                    value={u.role || 'pending'}
                                    onChange={e => updateRole(u.uid, e.target.value)}
                                    disabled={saving[u.uid]}
                                    className="border border-gray-300 rounded-lg px-2 py-1 text-xs focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-40"
                                >
                                    {ROLES.map(r => <option key={r} value={r}>{ROLE_LABELS[r]}</option>)}
                                </select>
                                <button
                                    onClick={() => setConfirmDelete(u.uid)}
                                    className="text-xs text-gray-400 hover:text-red-500 border border-gray-200 px-2 py-1 rounded-lg transition"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                ))}
                {filtered.length === 0 && (
                    <p className="text-center text-gray-400 py-8 text-sm">No hay usuarios con esos filtros</p>
                )}
            </div>

            <div className="bg-gray-50 rounded-2xl border border-gray-200 p-4">
                <p className="text-xs font-medium text-gray-600 mb-1">Como agregar nuevos usuarios</p>
                <p className="text-xs text-gray-400">1. Ve a Firebase Console → Authentication → Users → Agregar usuario</p>
                <p className="text-xs text-gray-400">2. El usuario aparecera aqui como pendiente cuando inicie sesion por primera vez</p>
                <p className="text-xs text-gray-400">3. Asignale el rol correspondiente desde este panel</p>
            </div>
        </div>
    )
}