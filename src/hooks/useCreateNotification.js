import { addDoc, collection, serverTimestamp } from 'firebase/firestore'
import { db } from '../firebase/config'

export async function createNotification({ userId, type, message, sessionId = null }) {
    try {
        await addDoc(collection(db, 'notifications'), {
            userId,
            type,
            message,
            sessionId,
            read: false,
            createdAt: serverTimestamp(),
        })
    } catch (err) {
        console.error('Error creando notificacion:', err)
    }
}