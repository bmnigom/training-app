import { createContext, useContext, useEffect, useState } from 'react'
import { onAuthStateChanged } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { auth, db } from '../firebase/config'

const AuthContext = createContext()

export function useAuth() {
    return useContext(AuthContext)
}

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [roles, setRoles] = useState([])
    const [activeRole, setActiveRole] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            if (firebaseUser) {
                const docRef = doc(db, 'users', firebaseUser.uid)
                const docSnap = await getDoc(docRef)
                if (docSnap.exists()) {
                    const data = docSnap.data()
                    const userRoles = Array.isArray(data.roles)
                        ? data.roles
                        : data.role
                            ? [data.role]
                            : []
                    setRoles(userRoles)
                    const saved = localStorage.getItem('activeRole_' + firebaseUser.uid)
                    setActiveRole(saved && userRoles.includes(saved) ? saved : userRoles[0] || null)
                }
                setUser(firebaseUser)
            } else {
                setUser(null)
                setRoles([])
                setActiveRole(null)
            }
            setLoading(false)
        })
        return unsubscribe
    }, [])

    function switchRole(role) {
        if (roles.includes(role)) {
            setActiveRole(role)
            localStorage.setItem('activeRole_' + user.uid, role)
        }
    }

    return (
        <AuthContext.Provider value={{ user, roles, role: activeRole, activeRole, switchRole, loading }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}