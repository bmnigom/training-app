import { useEffect, useState } from 'react'
import { collection, query, where, orderBy, getDocs, addDoc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'
import WorkloadChart from '../shared/WorkloadChart'

export default function AthleteSessionReview({ athleteEmail, athleteUid, onBack }) {
  const { user } = useAuth()
  const [sessions, setSessions] = useState([])
  const [loading, setLoading] = useState(true)
  const [feedbackText, setFeedbackText] = useState({})
  const [saving, setSaving] = useState({})
  const [saved, setSaved] = useState({})

  useEffect(() => { fetchSessions() }, [])

  async function fetchSessions() {
    const q = query(
        collection(db, 'executedSessions'),
        where('userEmail', '==', athleteEmail),
        orderBy('date', 'desc')
    )
    const snap = await getDocs(q)
    setSessions(snap.docs.map(d => ({ id: d.id, ...d.data() })))
    setLoading(false)
  }

  async function sendFeedback(sessionId) {
    const text = feedbackText[sessionId]
    if (!text || !text.trim()) return
    setSaving(prev => ({ ...prev, [sessionId]: true }))
    try {
      await addDoc(collection(db, 'feedback'), {
        sessionId,
        athleteEmail,
        coachEmail: user.email,
        coachUid: user.uid,
        text,
        createdAt: serverTimestamp(),
      })
      setSaved(prev => ({ ...prev, [sessionId]: true }))
      setFeedbackText(prev => ({ ...prev, [sessionId]: '' }))
      setTimeout(() => setSaved(prev => ({ ...prev, [sessionId]: false })), 3000)
    } catch (err) {
      console.error(err)
    }
    setSaving(prev => ({ ...prev, [sessionId]: false }))
  }

  if (loading) return <p className="text-center text-gray-400 py-12">Cargando sesiones...</p>

  return (
      <div className="space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
          <div>
            <h2 className="font-bold text-gray-800 text-lg">Sesiones del atleta</h2>
            <p className="text-xs text-gray-400">{athleteEmail}</p>
          </div>
        </div>

        <WorkloadChart userEmail={athleteEmail} />

        {sessions.length === 0 && (
            <div className="text-center text-gray-400 py-12">
              <p className="font-medium">Sin sesiones registradas</p>
              <p className="text-sm mt-1">El atleta aun no ha completado ninguna sesion</p>
            </div>
        )}

        {sessions.map(function(s) {
          return (
              <div key={s.id} className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-800">{s.sessionType}</p>
                    <p className="text-xs text-gray-400 mt-1">{s.date}</p>
                  </div>
                  <div className="text-right space-y-1">
                <span className="text-xs bg-blue-50 text-blue-600 px-2 py-1 rounded-full font-medium block">
                  RPE {s.rpe && s.rpe.value} - {s.rpe && s.rpe.scale}
                </span>
                    {s.bodyWeight && <p className="text-xs text-gray-400">{s.bodyWeight} kg</p>}
                  </div>
                </div>

                {s.exercises && s.exercises.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">Ejercicios</p>
                      {s.exercises.map(function(ex, i) {
                        return (
                            <div key={i} className="bg-gray-50 rounded-xl p-3 space-y-1">
                              <p className="text-sm font-medium text-gray-800">{ex.exerciseName}</p>
                              <div className="flex gap-4 text-xs">
                                {ex.prescribed && ex.prescribed.sets && (
                                    <span className="text-gray-400">
                            Prescrito: {ex.prescribed.sets}x{ex.prescribed.reps}
                                      {ex.prescribed.load ? ' @ ' + ex.prescribed.load + ex.prescribed.unit : ''}
                          </span>
                                )}
                                {ex.actual && ex.actual.sets && (
                                    <span className="text-blue-600">
                            Real: {ex.actual.sets}x{ex.actual.reps}
                                      {ex.actual.load ? ' @ ' + ex.actual.load + ex.actual.unit : ''}
                          </span>
                                )}
                              </div>
                              {ex.actual && ex.actual.notes && (
                                  <p className="text-xs text-gray-400 italic">{ex.actual.notes}</p>
                              )}
                            </div>
                        )
                      })}
                    </div>
                )}

                {s.notes && (
                    <div className="bg-yellow-50 rounded-xl px-4 py-3">
                      <p className="text-xs font-medium text-yellow-700 mb-1">Notas del atleta</p>
                      <p className="text-sm text-yellow-800">{s.notes}</p>
                    </div>
                )}

                <div className="border-t border-gray-100 pt-3 space-y-2">
                  <p className="text-xs font-medium text-gray-600">Feedback del entrenador</p>
                  <textarea
                      value={feedbackText[s.id] || ''}
                      onChange={function(e) { setFeedbackText(function(prev) { return { ...prev, [s.id]: e.target.value } }) }}
                      rows={2}
                      placeholder="Escribe tu retroalimentacion para esta sesion..."
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                  />
                  <button
                      onClick={function() { sendFeedback(s.id) }}
                      disabled={saving[s.id] || !feedbackText[s.id] || !feedbackText[s.id].trim()}
                      className={"w-full py-2 rounded-xl text-sm font-medium transition " + (saved[s.id] ? 'bg-green-500 text-white' : 'bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-40')}
                  >
                    {saved[s.id] ? 'Feedback enviado' : saving[s.id] ? 'Enviando...' : 'Enviar feedback'}
                  </button>
                </div>
              </div>
          )
        })}
      </div>
  )
}