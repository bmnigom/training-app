import { useEffect, useState } from 'react'
import { collection, getDocs, addDoc, updateDoc, doc, serverTimestamp } from 'firebase/firestore'
import { db } from '../../firebase/config'

const CATEGORIES = ['Todos', 'Cereales', 'Tuberculos', 'Proteinas', 'Lacteos', 'Legumbres', 'Frutas', 'Verduras', 'Grasas', 'Suplementos', 'Otro']
const EMPTY_FORM = { name: '', calories: '', protein: '', carbs: '', fat: '', unit: '100g', category: 'Proteinas' }

export default function FoodDatabase() {
    const [foods, setFoods] = useState([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [editingId, setEditingId] = useState(null)
    const [form, setForm] = useState(EMPTY_FORM)
    const [saving, setSaving] = useState(false)
    const [search, setSearch] = useState('')
    const [filterCategory, setFilterCategory] = useState('Todos')

    useEffect(() => { fetchFoods() }, [])

    async function fetchFoods() {
        const snap = await getDocs(collection(db, 'foods'))
        const data = snap.docs.map(d => ({ id: d.id, ...d.data() }))
        data.sort((a, b) => a.name.localeCompare(b.name))
        setFoods(data)
        setLoading(false)
    }

    function openNew() {
        setForm(EMPTY_FORM)
        setEditingId(null)
        setShowForm(true)
    }

    function openEdit(food) {
        setForm({
            name: food.name || '',
            calories: food.calories || '',
            protein: food.protein || '',
            carbs: food.carbs || '',
            fat: food.fat || '',
            unit: food.unit || '100g',
            category: food.category || 'Otro',
        })
        setEditingId(food.id)
        setShowForm(true)
    }

    async function handleSave() {
        if (!form.name || !form.calories) return
        setSaving(true)
        try {
            const data = {
                name: form.name,
                calories: parseFloat(form.calories),
                protein: parseFloat(form.protein) || 0,
                carbs: parseFloat(form.carbs) || 0,
                fat: parseFloat(form.fat) || 0,
                unit: form.unit,
                category: form.category,
            }
            if (editingId) {
                await updateDoc(doc(db, 'foods', editingId), { ...data, updatedAt: serverTimestamp() })
            } else {
                await addDoc(collection(db, 'foods'), { ...data, createdAt: serverTimestamp() })
            }
            await fetchFoods()
            setShowForm(false)
            setForm(EMPTY_FORM)
            setEditingId(null)
        } catch (err) {
            console.error(err)
        }
        setSaving(false)
    }

    const filtered = foods.filter(f => {
        const matchCat = filterCategory === 'Todos' || f.category === filterCategory
        const matchSearch = f.name.toLowerCase().includes(search.toLowerCase())
        return matchCat && matchSearch
    })

    if (loading) return <p className="text-center text-gray-400 py-12">Cargando...</p>

    if (showForm) {
        return (
            <div className="space-y-4 max-w-lg mx-auto">
                <div className="flex items-center justify-between">
                    <h3 className="font-bold text-gray-800 text-lg">{editingId ? 'Editar alimento' : 'Nuevo alimento'}</h3>
                    <button onClick={() => setShowForm(false)} className="text-gray-400 hover:text-gray-600 text-sm">Volver</button>
                </div>
                <div className="bg-white rounded-2xl border border-gray-200 p-5 space-y-4">
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Nombre *</label>
                        <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="Ej: Pechuga de pollo cocida" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Categoria</label>
                            <select value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                {CATEGORIES.filter(c => c !== 'Todos').map(c => <option key={c}>{c}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Unidad de medida</label>
                            <select value={form.unit} onChange={e => setForm({ ...form, unit: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                                <option>100g</option>
                                <option>100ml</option>
                                <option>porcion</option>
                                <option>unidad</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1">Calorias (kcal) *</label>
                        <input type="number" value={form.calories} onChange={e => setForm({ ...form, calories: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="165" />
                    </div>
                    <div className="grid grid-cols-3 gap-2">
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Proteina (g)</label>
                            <input type="number" value={form.protein} onChange={e => setForm({ ...form, protein: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="31" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Carbos (g)</label>
                            <input type="number" value={form.carbs} onChange={e => setForm({ ...form, carbs: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="0" />
                        </div>
                        <div>
                            <label className="block text-xs font-medium text-gray-600 mb-1">Grasa (g)</label>
                            <input type="number" value={form.fat} onChange={e => setForm({ ...form, fat: e.target.value })} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" placeholder="3.6" />
                        </div>
                    </div>
                </div>
                <div className="flex gap-3">
                    <button onClick={() => setShowForm(false)} className="flex-1 border border-gray-300 text-gray-600 rounded-xl py-2 text-sm hover:bg-gray-50 transition">Cancelar</button>
                    <button onClick={handleSave} disabled={saving || !form.name || !form.calories} className="flex-1 bg-blue-600 text-white rounded-xl py-2 text-sm font-medium hover:bg-blue-700 transition disabled:opacity-40">{saving ? 'Guardando...' : 'Guardar alimento'}</button>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="font-bold text-gray-800 text-lg">Base de alimentos</h2>
                    <p className="text-xs text-gray-400">{foods.length} alimentos registrados</p>
                </div>
                <button onClick={openNew} className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-blue-700 transition">+ Nuevo alimento</button>
            </div>
            <div className="bg-white rounded-2xl border border-gray-200 p-4 space-y-3">
                <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar alimento..." className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                <div className="flex gap-2 flex-wrap">
                    {CATEGORIES.map(c => (
                        <button key={c} onClick={() => setFilterCategory(c)} className={"px-3 py-1 rounded-full text-xs font-medium border transition " + (filterCategory === c ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400')}>{c}</button>
                    ))}
                </div>
            </div>
            <div className="space-y-2">
                {filtered.map(food => (
                    <div key={food.id} className="bg-white rounded-xl border border-gray-200 p-4 flex items-center justify-between gap-3">
                        <div className="flex-1">
                            <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-800 text-sm">{food.name}</p>
                                <span className="text-xs px-2 py-0.5 rounded-full bg-gray-100 text-gray-600">{food.category}</span>
                            </div>
                            <div className="flex gap-3 mt-1 text-xs text-gray-400">
                                <span>{food.calories} kcal</span>
                                <span>P: {food.protein}g</span>
                                <span>C: {food.carbs}g</span>
                                <span>G: {food.fat}g</span>
                                <span>/{food.unit}</span>
                            </div>
                        </div>
                        <button onClick={() => openEdit(food)} className="text-xs text-gray-400 hover:text-blue-600 transition shrink-0">Editar</button>
                    </div>
                ))}
                {filtered.length === 0 && <p className="text-center text-gray-400 py-8 text-sm">No hay alimentos con esos filtros</p>}
            </div>
        </div>
    )
}