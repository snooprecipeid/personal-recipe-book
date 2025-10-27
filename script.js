// ------------------ Firebase Config -------------------
import {
  initializeApp
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAuth,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// Ganti ini dengan konfigurasi Firebase project kamu
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUIcCyJUUQVNM_Gcv00tdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.firebasestorage.app",
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ------------------ Element -------------------
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const recipeGrid = document.getElementById("recipeGrid");
const logoutBtn = document.getElementById("logoutBtn");

// Login & Register
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
document.getElementById("loginBtn").addEventListener("click", async () => {
  try {
    await signInWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
  } catch (err) {
    alert("Login gagal: " + err.message);
  }
});
document.getElementById("registerBtn").addEventListener("click", async () => {
  try {
    await createUserWithEmailAndPassword(auth, emailInput.value, passwordInput.value);
    alert("Akun berhasil dibuat!");
  } catch (err) {
    alert("Register gagal: " + err.message);
  }
});

// ------------------ Upload & Save Recipe -------------------
const recipeNameInput = document.getElementById("recipeName");
const recipeCostInput = document.getElementById("recipeCost");
const recipeIngredientsInput = document.getElementById("recipeIngredients");
const recipeInstructionsInput = document.getElementById("recipeInstructions");
const recipeImageInput = document.getElementById("recipeImage");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");

saveRecipeBtn.addEventListener("click", async () => {
  const name = recipeNameInput.value.trim();
  const cost = recipeCostInput.value.trim();
  const ingredients = recipeIngredientsInput.value.trim();
  const instructions = recipeInstructionsInput.value.trim();
  const file = recipeImageInput.files[0];

  if (!name || !ingredients || !instructions) {
    alert("Lengkapi semua kolom.");
    return;
  }

  let imageUrl = "";
  if (file) {
    const imgRef = storageRef(storage, `recipes/${Date.now()}_${file.name}`);
    await uploadBytes(imgRef, file);
    imageUrl = await getDownloadURL(imgRef);
  }

  await addDoc(collection(db, "recipes"), {
    name,
    cost,
    ingredients,
    instructions,
    image: imageUrl,
    stars: 0,
    comments: []
  });

  recipeNameInput.value = "";
  recipeCostInput.value = "";
  recipeIngredientsInput.value = "";
  recipeInstructionsInput.value = "";
  recipeImageInput.value = "";

  await loadRecipes();
});

// ------------------ Load Recipes -------------------
function escapeHtml(unsafe) {
  return unsafe.replace(/[&<"'>]/g, (m) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#039;"
  }[m]));
}

// Helper: ambil path dari URL download untuk delete file
function storagePathFromDownloadURL(url) {
  const path = decodeURIComponent(url.split("/o/")[1].split("?")[0]);
  return path;
}

async function loadRecipes() {
  rec
