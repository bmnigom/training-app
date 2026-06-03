import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

export default function SessionFeedback({ sessionId }) {
    const { user } = useAuth()
    const [feedbacks, setFeedbacks] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetch() {
            const q = query(
                collection(db, 'feedback'),
                where('sessionId', '==', sessionId),
                orderBy('createdAt', 'desc')
            )
            const snap = await getDocs(q)
            setFeedbacks(snap.docs.map(d => ({ id: d.id, ...d.data() })))
            setLoading(false)
        }
        fetch()
    }, [sessionId])

    if (loading || feedbacks.length === 0) return null

    return (
        <div className="space-y-2 mt-3 border-t border-gray-100 pt-3">
            <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Feedback del entrenador</p>
            {feedbacks.map(f => (
                <div key={f.id} className="bg-green-50 rounded-xl px-4 py-3">
                    <p className="text-xs text-green-700 font-medium mb-1">{f.coachEmail}</p>
                    <p className="text-sm text-green-800">{f.text}</p>
                </div>
            ))}
        </div>
    )
}