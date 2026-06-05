import { useEffect, useState } from 'react'
import { collection, query, where, onSnapshot, doc, updateDoc } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

export function useNotifications() {
    const { user } = useAuth()
    const [notifications, setNotifications] = useState([])
    const [unread, setUnread] = useState(0)

    useEffect(() => {
        if (!user) return
        const q = query(
            collection(db, 'notifications'),
            where('userId', '==', user.uid),
            where('read', '==', false)
        )
        const unsub = onSnapshot(q, snap => {
            const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
            setNotifications(data)
            setUnread(data.length)
        })
        return unsub
    }, [user])

    async function markAllRead() {
        for (const n of notifications) {
            await updateDoc(doc(db, 'notifications', n.id), { read: true })
        }
    }

    async function markRead(id) {
        await updateDoc(doc(db, 'notifications', id), { read: true })
    }

    return { notifications, unread, markAllRead, markRead }
}