import { useState } from 'react'
import { useNotifications } from '../../hooks/useNotifications'

export default function NotificationBell() {
    const { notifications, unread, markAllRead, markRead } = useNotifications()
    const [open, setOpen] = useState(false)

    function formatDate(ts) {
        if (!ts) return ''
        const d = ts.toDate ? ts.toDate() : new Date(ts)
        return d.toLocaleDateString('es-CO', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })
    }

    return (
        <div className="relative">
            <button
                onClick={() => { setOpen(!open); if (!open && unread > 0) markAllRead() }}
                className="relative p-1.5 rounded-lg hover:bg-gray-100 transition"
            >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gray-600">
                    <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
                    <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
                </svg>
                {unread > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center font-bold leading-none">
            {unread > 9 ? '9+' : unread}
          </span>
                )}
            </button>

            {open && (
                <div className="absolute right-0 top-10 w-72 bg-white rounded-2xl border border-gray-200 shadow-lg z-50 overflow-hidden">
                    <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                        <p className="text-sm font-bold text-gray-800">Notificaciones</p>
                        <button onClick={() => setOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg leading-none">×</button>
                    </div>
                    {notifications.length === 0 ? (
                        <div className="px-4 py-6 text-center">
                            <p className="text-sm text-gray-400">Sin notificaciones nuevas</p>
                        </div>
                    ) : (
                        <div className="max-h-80 overflow-y-auto">
                            {notifications.map(n => (
                                <div
                                    key={n.id}
                                    onClick={() => markRead(n.id)}
                                    className="px-4 py-3 border-b border-gray-50 hover:bg-gray-50 cursor-pointer"
                                >
                                    <div className="flex items-start gap-2">
                                        <span className={"mt-1 w-2 h-2 rounded-full shrink-0 " + (n.type === 'feedback' ? 'bg-blue-500' : 'bg-green-500')} />
                                        <div>
                                            <p className="text-sm text-gray-800">{n.message}</p>
                                            <p className="text-xs text-gray-400 mt-0.5">{formatDate(n.createdAt)}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}