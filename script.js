// ===== Import Firebase SDK (v11 CDN) =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";

// ===== Konfigurasi Firebase (punyamu) =====
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUlcCyJUUQVNM_Gcv0OtdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.firebasestorage.app",
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P"
};

// ===== Inisialisasi Firebase =====
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
console.log("Firebase initialized");

// ===== Ambil elemen dari HTML =====
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");

const emailInput = document.getElementById("username");
const passwordInput = document.getElementById("password");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const forgotBtn = document.getElementById("forgotPasswordBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loginError = document.getElementById("loginError");

// ===== Event: Login =====
loginBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    loginError.innerText = "Email dan Password wajib diisi!";
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, password);
    console.log("Login success");
  } catch (error) {
    loginError.innerText = error.message;
  }
});

// ===== Event: Register (optional) =====
registerBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  const password = passwordInput.value.trim();
  if (!email || !password) {
    loginError.innerText = "Email dan Password wajib diisi!";
    return;
  }
  try {
    await createUserWithEmailAndPassword(auth, email, password);
    console.log("Register success");
  } catch (error) {
    loginError.innerText = error.message;
  }
});

// ===== Event: Forgot Password =====
forgotBtn.addEventListener("click", async () => {
  const email = emailInput.value.trim();
  if (!email) {
    alert("Masukkan email Anda dulu.");
    return;
  }
  try {
    await sendPasswordResetEmail(auth, email);
    alert("Link reset password telah dikirim ke email.");
  } catch (error) {
    alert(error.message);
  }
});

// ===== Event: Logout =====
logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// ===== Cek Status Login =====
onAuthStateChanged(auth, (user) => {
  if (user) {
    console.log("Logged in:", user.email);
    loginSection.style.display = "none";
    mainSection.style.display = "block";
  } else {
    console.log("Not logged in");
    loginSection.style.display = "block";
    mainSection.style.display = "none";
  }
});
