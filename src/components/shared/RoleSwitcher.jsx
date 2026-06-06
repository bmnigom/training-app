import { useAuth } from '../../contexts/AuthContext'
import { auth } from '../../firebase/config'
import { signOut } from 'firebase/auth'

const ROLE_LABELS = {
    athlete: 'Atleta',
    coach: 'Entrenador',
    nutritionist: 'Nutricionista',
    physio: 'Fisioterapeuta',
    doctor: 'Medico',
    admin: 'Admin',
}

const ROLE_COLORS = {
    athlete: 'bg-blue-100 text-blue-700',
    coach: 'bg-green-100 text-green-700',
    nutritionist: 'bg-orange-100 text-orange-700',
    physio: 'bg-teal-100 text-teal-700',
    doctor: 'bg-red-100 text-red-700',
    admin: 'bg-purple-100 text-purple-700',
}

export default function RoleSwitcher() {
    const { roles, activeRole, switchRole } = useAuth()
    if (roles.length <= 1) return null

    return (
        <div className="flex items-center gap-1 flex-wrap">
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