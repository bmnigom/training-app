import { useEffect, useState } from 'react'
import { collection, query, where, getDocs } from 'firebase/firestore'
import { db } from '../firebase/config'
import { useAuth } from '../contexts/AuthContext'

export function useAthletes() {
    const { user } = useAuth()
    const [athletes, setAthletes] = useState([])
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function fetch() {
            const relSnap = await getDocs(
                query(collection(db, 'relationships'), where('coachUid', '==', user.uid))
            )
            const relations = relSnap.docs.map(d => ({ id: d.id, ...d.data() }))
            const uniqueAthletes = []
            const seen = new Set()
            relations.forEach(r => {
                if (!seen.has(r.athleteUid)) {
                    seen.add(r.athleteUid)
                    uniqueAthletes.push({
                        uid: r.athleteUid,
                        email: r.athleteEmail,
                        relations: relations.filter(rel => rel.athleteUid === r.athleteUid),
                    })
                }
            })
            setAthletes(uniqueAthletes)
            setLoading(false)
        }
        if (user) fetch()
    }, [user])

    return { athletes, loading }
}