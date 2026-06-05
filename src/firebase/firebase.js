import { initializeApp } from "firebase/app"
import { getFirestore } from "firebase/firestore"
import { getStorage } from "firebase/storage"

const firebaseConfig = {
  apiKey: "YOUR_KEY",
  authDomain: "mcfest-booking.firebaseapp.com",
  projectId: "mcfest-booking",
  storageBucket: "mcfest-booking.firebasestorage.app",
  messagingSenderId: "28335969780",
  appId: "1:28335969780:web:8e67ec779b0bfbe97155a1",
}

const app = initializeApp(firebaseConfig)


export const db = getFirestore(app)
export const storage = getStorage(app)

export default app