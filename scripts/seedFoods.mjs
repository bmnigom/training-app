import { initializeApp } from 'firebase/app'
import { getFirestore, collection, addDoc } from 'firebase/firestore'
import { readFileSync } from 'fs'

const env = Object.fromEntries(
    readFileSync('.env', 'utf8')
        .split('\n')
        .filter(l => l.includes('='))
        .map(l => l.split('=').map(s => s.trim()))
)

const app = initializeApp({
    apiKey: env.VITE_FIREBASE_API_KEY,
    authDomain: env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: env.VITE_FIREBASE_APP_ID,
})

const db = getFirestore(app)

const foods = [
    { name: 'Arroz blanco cocido', calories: 130, protein: 2.7, carbs: 28, fat: 0.3, unit: '100g', category: 'Cereales' },
    { name: 'Arroz integral cocido', calories: 111, protein: 2.6, carbs: 23, fat: 0.9, unit: '100g', category: 'Cereales' },
    { name: 'Papa cocida', calories: 87, protein: 1.9, carbs: 20, fat: 0.1, unit: '100g', category: 'Tuberculos' },
    { name: 'Yuca cocida', calories: 112, protein: 0.9, carbs: 27, fat: 0.2, unit: '100g', category: 'Tuberculos' },
    { name: 'Platano maduro', calories: 122, protein: 1.3, carbs: 31, fat: 0.4, unit: '100g', category: 'Frutas' },
    { name: 'Platano verde cocido', calories: 116, protein: 1.2, carbs: 28, fat: 0.2, unit: '100g', category: 'Tuberculos' },
    { name: 'Pechuga de pollo cocida', calories: 165, protein: 31, carbs: 0, fat: 3.6, unit: '100g', category: 'Proteinas' },
    { name: 'Carne de res magra cocida', calories: 215, protein: 26, carbs: 0, fat: 12, unit: '100g', category: 'Proteinas' },
    { name: 'Atun en agua', calories: 116, protein: 26, carbs: 0, fat: 1, unit: '100g', category: 'Proteinas' },
    { name: 'Huevo entero', calories: 155, protein: 13, carbs: 1.1, fat: 11, unit: '100g', category: 'Proteinas' },
    { name: 'Clara de huevo', calories: 52, protein: 11, carbs: 0.7, fat: 0.2, unit: '100g', category: 'Proteinas' },
    { name: 'Leche entera', calories: 61, protein: 3.2, carbs: 4.8, fat: 3.3, unit: '100ml', category: 'Lacteos' },
    { name: 'Leche descremada', calories: 34, protein: 3.4, carbs: 5, fat: 0.1, unit: '100ml', category: 'Lacteos' },
    { name: 'Yogur natural', calories: 59, protein: 3.5, carbs: 4.7, fat: 3.3, unit: '100g', category: 'Lacteos' },
    { name: 'Queso campesino', calories: 350, protein: 18, carbs: 3, fat: 28, unit: '100g', category: 'Lacteos' },
    { name: 'Frijoles cocidos', calories: 127, protein: 8.7, carbs: 22, fat: 0.5, unit: '100g', category: 'Legumbres' },
    { name: 'Lentejas cocidas', calories: 116, protein: 9, carbs: 20, fat: 0.4, unit: '100g', category: 'Legumbres' },
    { name: 'Aguacate', calories: 160, protein: 2, carbs: 9, fat: 15, unit: '100g', category: 'Grasas' },
    { name: 'Aceite de oliva', calories: 884, protein: 0, carbs: 0, fat: 100, unit: '100ml', category: 'Grasas' },
    { name: 'Banano', calories: 89, protein: 1.1, carbs: 23, fat: 0.3, unit: '100g', category: 'Frutas' },
    { name: 'Mango', calories: 60, protein: 0.8, carbs: 15, fat: 0.4, unit: '100g', category: 'Frutas' },
    { name: 'Naranja', calories: 47, protein: 0.9, carbs: 12, fat: 0.1, unit: '100g', category: 'Frutas' },
    { name: 'Manzana', calories: 52, protein: 0.3, carbs: 14, fat: 0.2, unit: '100g', category: 'Frutas' },
    { name: 'Avena en hojuelas', calories: 389, protein: 17, carbs: 66, fat: 7, unit: '100g', category: 'Cereales' },
    { name: 'Pan integral', calories: 247, protein: 8, carbs: 41, fat: 4, unit: '100g', category: 'Cereales' },
    { name: 'Pasta cocida', calories: 131, protein: 5, carbs: 25, fat: 1.1, unit: '100g', category: 'Cereales' },
    { name: 'Proteina en polvo whey', calories: 120, protein: 24, carbs: 3, fat: 1.5, unit: '100g', category: 'Suplementos' },
    { name: 'Creatina monohidrato', calories: 0, protein: 0, carbs: 0, fat: 0, unit: '100g', category: 'Suplementos' },
    { name: 'Espinaca', calories: 23, protein: 2.9, carbs: 3.6, fat: 0.4, unit: '100g', category: 'Verduras' },
    { name: 'Brocoli', calories: 34, protein: 2.8, carbs: 7, fat: 0.4, unit: '100g', category: 'Verduras' },
    { name: 'Zanahoria', calories: 41, protein: 0.9, carbs: 10, fat: 0.2, unit: '100g', category: 'Verduras' },
    { name: 'Tomate', calories: 18, protein: 0.9, carbs: 3.9, fat: 0.2, unit: '100g', category: 'Verduras' },
]

async function seed() {
    console.log('Cargando alimentos...')
    for (const food of foods) {
        await addDoc(collection(db, 'foods'), {
            ...food,
            createdAt: new Date().toISOString(),
            createdBy: 'seed',
        })
        console.log('Agregado:', food.name)
    }
    console.log(`\nListo — ${foods.length} alimentos cargados`)
    process.exit(0)
}

seed().catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
})