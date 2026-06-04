import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, deleteDoc, doc, query, where, orderBy, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'
import { useAuth } from '../../contexts/AuthContext'

export default function NutritionLog() {
    const { user } = useAuth()
    const [foods, setFoods] = useState([])
    const [goals, setGoals] = useState(null)
    const [logs, setLogs] = useState([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().split('T')[0])
    const [search, setSearch] = useState('')
    const [selectedFood, setSelectedFood] = useState(null)
    const [amount, setAmount] = useState('')
    const [meal, setMeal] = useState('Desayuno')
    const [water, setWater] = useState('')
    const [saving, setSaving] = useState(false)

    const MEALS = ['Desayuno', 'Media manana', 'Almuerzo', 'Snack', 'Cena']

    useEffect(() => { fetchAll() }, [date])

    async function fetchAll() {
        setLoading(true)
        const [foodsSnap, goalsSnap, logsSnap] = await Promise.all([
            getDocs(collection(db, 'foods')),
            getDocs(query(collection(db, 'nutritionGoals'), where('athleteUid', '==', user.uid))),
            getDocs(query(collection(db, 'nutritionLogs'), where('userId', '==', user.uid), where('date', '==', date))),
        ])
        setFoods(foodsSnap.docs.map(d => ({ id: d.id, ...d.data() })).sort((a, b) => a.name.localeCompare(b.name)))
        setGoals(goalsSnap.empty ? null : goalsSnap.docs[0].data())
        setLogs(logsSnap.docs.map(d => ({ id: d.id, ...d.data() })))
        setLoading(false)
    }

    async function handleAddFood() {
        if (!selectedFood || !amount) return
        setSaving(true)
        const factor = parseFloat(amount) / 100
        try {
            await addDoc(collection(db, 'nutritionLogs'), {
                userId: user.uid,
                date,
                meal,
                foodId: selectedFood.id,
                foodName: selectedFood.name,
                amount: parseFloat(amount),
                unit: selectedFood.unit,
                calories: Math.round(selectedFood.calories * factor),
                protein: Math.round(selectedFood.protein * factor * 10) / 10,
                carbs: Math.round(selectedFood.carbs * factor * 10) / 10,
                fat: Math.round(selectedFood.fat * factor * 10) / 10,
                createdAt: serverTimestamp(),
            })
            setSelectedFood(null)
            setAmount('')
            setSearch('')
            await fetchAll()
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    async function handleDeleteLog(id) {
        try {
            await deleteDoc(doc(db, 'nutritionLogs', id))
            setLogs(prev => prev.filter(l => l.id !== id))
        } catch (err) {
            console.error(err)
        }
    }

    async function handleSaveWater() {
        if (!water) return
        setSaving(true)
        try {
            await addDoc(collection(db, 'nutritionLogs'), {
                userId: user.uid,
                date,
                meal: 'Agua',
                foodName: 'Agua',
                water: parseFloat(water),
                calories: 0, protein: 0, carbs: 0, fat: 0,
                createdAt: serverTimestamp(),
            })
            setWater('')
            await fetchAll()
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const totals = logs.reduce((acc, l) => ({
        calories: acc.calories + (l.calories || 0),
        protein: acc.protein + (l.protein || 0),
        carbs: acc.carbs + (l.carbs || 0),
        fat: acc.fat + (l.fat || 0),
        water: acc.water + (l.water || 0),
    }), { calories: 0, protein: 0, carbs: 0, fat: 0, water: 0 })

    const filteredFoods = foods.filter(f => f.name.toLowerCase().includes(search.toLowerCase())).slice(0, 8)

    const getLogsByMeal = (mealName) => logs.filter(l => l.meal === mealName)

    const MacroBar = ({ label, current, goal, color }) => {
        const pct = goal ? Math.min((current / goal) * 100, 100) : 0
        return (
            <div className="space-y-1">
                <div className="flex justify-between text-xs">
                    <span className="text-gray-600">{label}</span>
                    <span className="text-gray-500">{Math.round(current)}{goal ? ' / ' + goal + 'g' : 'g'}</span>
                </div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div className={"h-full rounded-full transition-all " + color} style={{ width: pct + '%' }} />
                </div>
            </div>
        )
    }

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <h2 className="font-bold text-gray-800 text-lg">Nutricion</h2>
                <input
                    type="date"
                    value={date}
                    onChange={e => setDate(e.target.value)}
                    className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <div className="flex items-center justify-between">
                    <p className="text-sm font-bold text-gray-800">Resumen del dia</p>
                    {goals && <p className="text-xs text-gray-400">Meta: {goals.calories} kcal</p>}
                </div>
                <div className="grid grid-cols-2 gap-2">
                    <div className={"rounded-xl p-3 text-center " + (goals && totals.calories >= goals.calories ? 'bg-green-50' : 'bg-blue-50')}>
                        <p className="text-xs text-gray-500">Calorias</p>
                        <p className="text-xl font-bold text-blue-700">{Math.round(totals.calories)}</p>
                        {goals && <p className="text-xs text-gray-400">de {goals.calories} kcal</p>}
                    </div>
                    <div className="bg-blue-50 rounded-xl p-3 text-center">
                        <p className="text-xs text-gray-500">Agua</p>
                        <p className="text-xl font-bold text-blue-700">{Math.round(totals.water * 10) / 10}</p>
                        {goals && <p className="text-xs text-gray-400">de {goals.water}L</p>}
                    </div>
                </div>
                <MacroBar label="Proteina" current={totals.protein} goal={goals?.protein} color="bg-red-400" />
                <MacroBar label="Carbohidratos" current={totals.carbs} goal={goals?.carbs} color="bg-yellow-400" />
                <MacroBar label="Grasa" current={totals.fat} goal={goals?.fat} color="bg-purple-400" />
                {goals?.notes && (
                    <div className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs font-medium text-gray-600 mb-1">Recomendaciones del nutricionista</p>
                        <p className="text-xs text-gray-500">{goals.notes}</p>
                    </div>
                )}
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-bold text-gray-800">Registrar agua</p>
                <div className="flex gap-2">
                    <input
                        type="number"
                        value={water}
                        onChange={e => setWater(e.target.value)}
                        step="0.25"
                        placeholder="0.5"
                        className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <span className="flex items-center text-sm text-gray-500 px-2">litros</span>
                    <button onClick={handleSaveWater} disabled={saving || !water} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40">
                        Agregar
                    </button>
                </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <p className="text-sm font-bold text-gray-800">Agregar alimento</p>
                <div className="grid grid-cols-2 gap-2">
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Momento del dia</label>
                        <select value={meal} onChange={e => setMeal(e.target.value)} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {MEALS.map(m => <option key={m}>{m}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs text-gray-500 mb-1">Cantidad (g o ml)</label>
                        <input type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="150" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                    </div>
                </div>
                <div>
                    <label className="block text-xs text-gray-500 mb-1">Buscar alimento</label>
                    <input type="text" value={search} onChange={e => { setSearch(e.target.value); setSelectedFood(null) }} placeholder="Ej: pollo, arroz, huevo..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                {search && !selectedFood && (
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        {filteredFoods.length === 0 && <p className="text-xs text-gray-400 p-3">No se encontraron alimentos</p>}
                        {filteredFoods.map(f => (
                            <div key={f.id} onClick={() => { setSelectedFood(f); setSearch(f.name) }} className="flex items-center justify-between p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 last:border-0">
                                <div>
                                    <p className="text-sm font-medium text-gray-800">{f.name}</p>
                                    <p className="text-xs text-gray-400">{f.calories} kcal · P:{f.protein}g C:{f.carbs}g G:{f.fat}g / {f.unit}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
                {selectedFood && amount && (
                    <div className="bg-blue-50 rounded-xl p-3">
                        <p className="text-xs font-medium text-blue-700 mb-1">Preview — {amount}g de {selectedFood.name}</p>
                        <div className="flex gap-3 text-xs text-blue-600">
                            <span>{Math.round(selectedFood.calories * parseFloat(amount) / 100)} kcal</span>
                            <span>P: {Math.round(selectedFood.protein * parseFloat(amount) / 10) / 10}g</span>
                            <span>C: {Math.round(selectedFood.carbs * parseFloat(amount) / 10) / 10}g</span>
                            <span>G: {Math.round(selectedFood.fat * parseFloat(amount) / 10) / 10}g</span>
                        </div>
                    </div>
                )}
                <button onClick={handleAddFood} disabled={saving || !selectedFood || !amount} className="w-full bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40">
                    {saving ? 'Guardando...' : 'Agregar alimento'}
                </button>
            </div>

            {MEALS.map(mealName => {
                const mealLogs = getLogsByMeal(mealName)
                if (mealLogs.length === 0) return null
                return (
                    <div key={mealName} className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                        <p className="text-sm font-bold text-gray-800">{mealName}</p>
                        {mealLogs.map(log => (
                            <div key={log.id} className="flex items-center justify-between text-sm">
                                <div>
                                    <p className="text-gray-700">{log.foodName} <span className="text-gray-400 text-xs">({log.amount}g)</span></p>
                                    <p className="text-xs text-gray-400">{log.calories} kcal · P:{log.protein}g C:{log.carbs}g G:{log.fat}g</p>
                                </div>
                                <button onClick={() => handleDeleteLog(log.id)} className="text-xs text-gray-400 hover:text-red-500 transition">Quitar</button>
                            </div>
                        ))}
                    </div>
                )
            })}

            {logs.filter(l => l.meal === 'Agua').length > 0 && (
                <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-2">
                    <p className="text-sm font-bold text-gray-800">Agua registrada</p>
                    {logs.filter(l => l.meal === 'Agua').map(log => (
                        <div key={log.id} className="flex items-center justify-between text-sm">
                            <p className="text-gray-700">{log.water}L</p>
                            <button onClick={() => handleDeleteLog(log.id)} className="text-xs text-gray-400 hover:text-red-500 transition">Quitar</button>
                        </div>
                    ))}
                </div>
            )}
        </div>
    )
}