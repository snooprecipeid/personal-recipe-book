import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// KONFIGURASI FIREBASE KAMU
const firebaseConfig = {
  apiKey: "API_KEY_KAMU",
  authDomain: "PROJECT_ID.firebaseapp.com",
  projectId: "PROJECT_ID",
  storageBucket: "PROJECT_ID.appspot.com",
  messagingSenderId: "SENDER_ID",
  appId: "APP_ID"
};

// Inisialisasi
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// Element
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const logoutBtn = document.getElementById("logoutBtn");

const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const forgotPasswordBtn = document.getElementById("forgotPasswordBtn");

const username = document.getElementById("username");
const password = document.getElementById("password");
const loginError = document.getElementById("loginError");

const saveRecipeBtn = document.getElementById("saveRecipeBtn");
const recipeGrid = document.getElementById("recipeGrid");
const recipeName = document.getElementById("recipeName");
const ingredients = document.getElementById("ingredients");
const instructions = document.getElementById("instructions");
const cost = document.getElementById("cost");
const photo = document.getElementById("photo");
const saveStatus = document.getElementById("saveStatus");

// AUTH
loginBtn.addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, username.value, password.value);
  } catch (err) {
    loginError.textContent = err.message;
  }
});

registerBtn.addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, username.value, password.value);
    alert("Registration successful!");
  } catch (err) {
    loginError.textContent = err.message;
  }
});

forgotPasswordBtn.addEventListener("click", async () => {
  try {
    await sendPasswordResetEmail(auth, username.value);
    alert("Password reset email sent!");
  } catch (err) {
    loginError.textContent = err.message;
  }
});

logoutBtn.addEventListener("click", async () => {
  await signOut(auth);
});

// Ubah tampilan sesuai login
onAuthStateChanged(auth, (user) => {
  if (user) {
    loginSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loadRecipes();
  } else {
    loginSection.classList.remove("hidden");
    mainSection.classList.add("hidden");
    logoutBtn.classList.add("hidden");
  }
});

// SIMPAN RESEP
saveRecipeBtn.addEventListener("click", async () => {
  saveStatus.textContent = "Uploading...";
  let imageUrl = "";
  const file = photo.files[0];

  if (file) {
    const storageRef = ref(storage, `recipes/${Date.now()}_${file.name}`);
    await uploadBytes(storageRef, file);
    imageUrl = await getDownloadURL(storageRef);
  }

  await addDoc(collection(db, "recipes"), {
    name: recipeName.value,
    ingredients: ingredients.value,
    instructions: instructions.value,
    cost: cost.value,
    image: imageUrl
  });

  recipeName.value = "";
  ingredients.value = "";
  instructions.value = "";
  cost.value = "";
  photo.value = "";
  saveStatus.textContent = "Recipe saved!";
  loadRecipes();
});

// LOAD RESEP
async function loadRecipes() {
  recipeGrid.innerHTML = "";
  const querySnapshot = await getDocs(collection(db, "recipes"));
  querySnapshot.forEach((docSnap) => {
    const data = docSnap.data();
    const card = document.createElement("div");
    card.className = "recipe-card";
    card.innerHTML = `
      ${data.image ? `<img src="${data.image}" alt="${data.name}"/>` : ""}
      <h4>${data.name}</h4>
      <p><strong>Ingredients:</strong> ${data.ingredients}</p>
      <p><strong>Instructions:</strong> ${data.instructions}</p>
      <p><strong>Rp ${data.cost}</strong></p>
      <button onclick="deleteRecipe('${docSnap.id}', '${data.image}')">Delete</button>
    `;
    recipeGrid.appendChild(card);
  });
}

// HAPUS RESEP
window.deleteRecipe = async function (id, imageUrl) {
  await deleteDoc(doc(db, "recipes", id));
  if (imageUrl) {
    const imageRef = ref(storage, imageUrl);
    await deleteObject(imageRef);
  }
  loadRecipes();
};
