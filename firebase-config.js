// Firebase 설정 파일
// CDN 방식을 사용하므로 import 문 대신 전역 객체를 사용하지는 않지만,
// 모듈 방식(type="module")을 사용할 것이므로 import 문을 그대로 두되,
// CDN URL로 변경합니다.

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, writeBatch } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
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
const storage = getStorage(app);

// 다른 파일에서 사용할 수 있도록 export
export { db, collection, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, writeBatch, storage, ref, uploadBytes, getDownloadURL };
