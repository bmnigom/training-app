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

const exercises = [
    { name: 'Abd de cadera desde sentadilla con elástico encima de la rodilla', category: 'Calentamiento', muscleGroup: 'Cadera', type: 'Fisioterapia' },
    { name: 'Abducción de cadera en máquina sentado', category: 'Central', muscleGroup: 'Cadera', type: 'Fuerza' },
    { name: 'Abducciones de hombro', category: 'Central', muscleGroup: 'Hombro', type: 'Fuerza' },
    { name: 'Aducción de cadera en máquina sentado', category: 'Central', muscleGroup: 'Cadera', type: 'Fuerza' },
    { name: 'Avanzada', category: 'Central', muscleGroup: 'Pierna', type: 'Fuerza' },
    { name: 'Bíceps complex', category: 'Central', muscleGroup: 'Brazo', type: 'Fuerza' },
    { name: 'Bird dog con mano a hombro contrario', category: 'Calentamiento', muscleGroup: 'Core', type: 'Fisioterapia' },
    { name: 'Escaladores', category: 'Calentamiento', muscleGroup: 'Core', type: 'Físico' },
    { name: 'Extensión de pierna monopodal', category: 'Central', muscleGroup: 'Cuádriceps', type: 'Fuerza' },
    { name: 'Flexión de pierna en polea', category: 'Central', muscleGroup: 'Isquiotibiales', type: 'Fuerza' },
    { name: 'Fondos en cajón', category: 'Central', muscleGroup: 'Tríceps', type: 'Fuerza' },
    { name: 'Hip thrust', category: 'Central', muscleGroup: 'Glúteo', type: 'Fuerza' },
    { name: 'Levantamiento de cadera monopodal alternando sobre talón', category: 'Calentamiento', muscleGroup: 'Glúteo', type: 'Fisioterapia' },
    { name: 'Levantamiento de caderas llevo talones adelante y atrás', category: 'Calentamiento', muscleGroup: 'Glúteo', type: 'Fisioterapia' },
    { name: 'McGill alternado', category: 'Calentamiento', muscleGroup: 'Core', type: 'Fisioterapia' },
    { name: 'McGill Apreto pelota con mano y rodilla', category: 'Calentamiento', muscleGroup: 'Core', type: 'Fisioterapia' },
    { name: 'Nadadores adelante y atrás', category: 'Calentamiento', muscleGroup: 'Espalda', type: 'Fisioterapia' },
    { name: 'Payasitos', category: 'Calentamiento', muscleGroup: 'Cadera', type: 'Físico' },
    { name: 'Pecho en cabina', category: 'Central', muscleGroup: 'Pecho', type: 'Fuerza' },
    { name: 'Peso muerto', category: 'Central', muscleGroup: 'Posterior', type: 'Fuerza' },
    { name: 'Pies juntos a sentadilla', category: 'Calentamiento', muscleGroup: 'Pierna', type: 'Físico' },
    { name: 'Plancha abro y cierro piernas', category: 'Calentamiento', muscleGroup: 'Core', type: 'Físico' },
    { name: 'Plancha con retroversión de cadera', category: 'Calentamiento', muscleGroup: 'Core', type: 'Fisioterapia' },
    { name: 'Plancha en Antebrazos', category: 'Calentamiento', muscleGroup: 'Core', type: 'Físico' },
    { name: 'Plancha en antebrazos rodilla al codo', category: 'Calentamiento', muscleGroup: 'Core', type: 'Físico' },
    { name: 'Plancha lateral', category: 'Calentamiento', muscleGroup: 'Core', type: 'Físico' },
    { name: 'Plancha mano a hombro contrario', category: 'Calentamiento', muscleGroup: 'Core', type: 'Físico' },
    { name: 'Plancha pesa adelante y pesa atrás', category: 'Central', muscleGroup: 'Core', type: 'Fuerza' },
    { name: 'Plancha sobre manos abro y cierro manos', category: 'Calentamiento', muscleGroup: 'Core', type: 'Físico' },
    { name: 'Press de banca con barra', category: 'Central', muscleGroup: 'Pecho', type: 'Fuerza' },
    { name: 'Press militar', category: 'Central', muscleGroup: 'Hombro', type: 'Fuerza' },
    { name: 'Push up', category: 'Central', muscleGroup: 'Pecho', type: 'Físico' },
    { name: 'Remo horizontal en polea', category: 'Central', muscleGroup: 'Espalda', type: 'Fuerza' },
    { name: 'Remo inverso', category: 'Central', muscleGroup: 'Espalda', type: 'Fuerza' },
    { name: 'Remo serrucho', category: 'Central', muscleGroup: 'Espalda', type: 'Fuerza' },
    { name: 'Remo vertical en polea', category: 'Central', muscleGroup: 'Espalda', type: 'Fuerza' },
    { name: 'Sentadilla búlgara', category: 'Central', muscleGroup: 'Pierna', type: 'Fuerza' },
    { name: 'Sentadilla por delante', category: 'Central', muscleGroup: 'Cuádriceps', type: 'Fuerza' },
    { name: 'Sentadilla por detrás', category: 'Central', muscleGroup: 'Cuádriceps', type: 'Fuerza' },
    { name: 'Sentadilla sostenida con elástico encima de rodillas', category: 'Calentamiento', muscleGroup: 'Pierna', type: 'Fisioterapia' },
    { name: 'Sentadilla sostenida sobre punta de pies', category: 'Calentamiento', muscleGroup: 'Pierna', type: 'Físico' },
    { name: 'Sentadilla turca', category: 'Central', muscleGroup: 'Pierna', type: 'Fuerza' },
    { name: 'Tríceps en polea', category: 'Central', muscleGroup: 'Tríceps', type: 'Fuerza' },
    { name: 'Plancha en antebrazos con basculación escapular', category: 'Calentamiento', muscleGroup: 'Core', type: 'Fisioterapia' },
    { name: 'Soldadito', category: 'Calentamiento', muscleGroup: 'Cadera', type: 'Físico' },
    { name: 'Kazashov', category: 'Calentamiento', muscleGroup: 'Cadera', type: 'Físico' },
]

async function seed() {
    console.log('Cargando ejercicios...')
    for (const ex of exercises) {
        await addDoc(collection(db, 'exercises'), {
            ...ex,
            description: '',
            objective: '',
            videoUrl: '',
            executionTime: null,
            restTime: null,
            createdAt: new Date().toISOString(),
            createdBy: 'seed',
        })
        console.log('✓', ex.name)
    }
    console.log(`\nListo — ${exercises.length} ejercicios cargados`)
    process.exit(0)
}

seed().catch(err => {
    console.error('Error:', err.message)
    process.exit(1)
})