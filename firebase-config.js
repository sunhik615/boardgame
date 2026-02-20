import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import {
    getFirestore,
    collection,
    getDocs,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    getDoc,
    writeBatch,
    query,
    where,
    orderBy,
    enableMultiTabIndexedDbPersistence,
    onSnapshot
} from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

const firebaseConfig = {
    apiKey: "AIzaSyA707bmTsuR9_gE8VB6-71UgE69yMBP2ik",
    authDomain: "boardame-ee082.firebaseapp.com",
    projectId: "boardame-ee082",
    storageBucket: "boardame-ee082.firebasestorage.app",
    messagingSenderId: "744895422133",
    appId: "1:744895422133:web:3337f9996f739da8d8a8fc",
    measurementId: "G-9V5X9W47ZB"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Enable Offline Persistence
enableMultiTabIndexedDbPersistence(db).catch((err) => {
    if (err.code == 'failed-precondition') {
        // Multiple tabs open, persistence can only be enabled in one tab at a time.
        console.warn("Firestore persistence failed-precondition: Multiple tabs open.");
    } else if (err.code == 'unimplemented') {
        // The current browser does not support all of the features required to enable persistence
        console.warn("Firestore persistence unimplemented: Browser not supported.");
    }
});

const storage = getStorage(app);

// 다른 파일에서 사용할 수 있도록 export
export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, writeBatch, storage, ref, uploadBytes, getDownloadURL, query, where, orderBy, onSnapshot };
