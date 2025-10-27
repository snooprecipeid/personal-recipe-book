// Firebase via CDN (ES Modules)
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import {
  getAnalytics
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";
import {
  getAuth,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-auth.js";
import {
  getFirestore,
  collection,
  addDoc,
  serverTimestamp,
  query,
  where,
  orderBy,
  getDocs,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

/** ---------- Firebase Config (milikmu) ---------- */
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUlcCyJUUQVNM_Gcv0OtdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.firebasestorage.app",
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P"
};

// Init
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch { /* analytics optional on http */ }
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

/** ---------- DOM ---------- */
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const logoutBtn = document.getElementById("logoutBtn");
const forgotLink = document.getElementById("forgotPassword");
const authError = document.getElementById("authError");

const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");

const recipeNameEl = document.getElementById("recipeName");
const ingredientsEl = document.getElementById("ingredients");
const instructionsEl = document.getElementById("instructions");
const costEl = document.getElementById("cost");
const photoEl = document.getElementById("photo");
const saveRecipeBtn = document.getElementById("saveRecipeBtn");
const saveStatus = document.getElementById("saveStatus");
const recipeGrid = document.getElementById("recipeGrid");

function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }

/** ---------- Auth Actions ---------- */
loginBtn.addEventListener("click", async () => {
  authError.textContent = ""; hide(authError);
  try {
    const email = emailEl.value.trim();
    const pass = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) { authError.textContent = e.message; show(authError); }
});

registerBtn.addEventListener("click", async () => {
  authError.textContent = ""; hide(authError);
  try {
    const email = emailEl.value.trim();
    const pass = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) { authError.textContent = e.message; show(authError); }
});

forgotLink.addEventListener("click", async (e) => {
  e.preventDefault();
  authError.textContent = ""; hide(authError);
  try {
    const email = prompt("Masukkan email untuk reset password:");
    if (!email) return;
    await sendPasswordResetEmail(auth, email.trim());
    alert("Link reset password sudah dikirim (cek inbox/spam).");
  } catch (e2) { authError.textContent = e2.message; show(authError); }
});

logoutBtn.addEventListener("click", async () => { await signOut(auth); });

/** ---------- Auth State ---------- */
onAuthStateChanged(auth, async (user) => {
  if (user) {
    hide(loginSection); show(mainSection); show(logoutBtn);
    await loadRecipes(user.uid);
  } else {
    show(loginSection); hide(mainSection); hide(logoutBtn);
  }
});

/** ---------- Save & Load Recipes ---------- */
saveRecipeBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) { alert("Silakan login terlebih dahulu."); return; }
  saveStatus.textContent = "Saving...";

  try {
    const name = recipeNameEl.value.trim();
    const ingredients = ingredientsEl.value.trim();
    const instructions = instructionsEl.value.trim();
    const cost = Number(costEl.value || 0);

    if (!name) throw new Error("Recipe Name wajib diisi.");

    // Upload photos (optional)
    const files = Array.from(photoEl.files || []);
    const photoURLs = [];
    for (const file of files) {
      const key = `recipes/${user.uid}/${Date.now()}_${file.name}`;
      const r = sRef(storage, key);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      photoURLs.push(url);
    }

    const docRef = await addDoc(collection(db, "recipes"), {
      uid: user.uid,
      name,
      ingredients,
      instructions,
      cost,
      photoURLs,
      createdAt: serverTimestamp(),
    });

    saveStatus.textContent = "Saved! (" + docRef.id + ")";
    // clear form
    recipeNameEl.value = "";
    ingredientsEl.value = "";
    instructionsEl.value = "";
    costEl.value = "";
    photoEl.value = "";
    await loadRecipes(user.uid);
    setTimeout(() => (saveStatus.textContent = ""), 1500);
  } catch (e) {
    console.error(e);
    saveStatus.textContent = "Error: " + e.message;
  }
});

async function loadRecipes(uid) {
  recipeGrid.innerHTML = "<p>Loading recipes...</p>";
  try {
    const q = query(
      collection(db, "recipes"),
      where("uid", "==", uid),
      orderBy("createdAt", "desc")
    );
    const snap = await getDocs(q);

    if (snap.empty) {
      recipeGrid.innerHTML = "<p>Belum ada resep. Tambahkan di atas ya.</p>";
      return;
    }

    const cards = [];
    snap.forEach((doc) => {
      const d = doc.data();
      const imgs = (d.photoURLs || []).map(
        (u) => `<img src="${u}" alt="${d.name}"/>`
      ).join("");

      const costFmt = d.cost ? d.cost.toLocaleString("id-ID") : 0;

      cards.push(`
        <div class="recipe-card">
          ${imgs}
          <h4>${escapeHTML(d.name || "-")}</h4>
          <div class="cost">Rp ${costFmt}</div>
          <p><b>Ingredients:</b><br>${nl2br(escapeHTML(d.ingredients || "-"))}</p>
          <p><b>Instructions:</b><br>${nl2br(escapeHTML(d.instructions || "-"))}</p>
        </div>
      `);
    });
    recipeGrid.innerHTML = cards.join("");
  } catch (e) {
    console.error(e);
    recipeGrid.innerHTML = "<p>Gagal load recipes: " + e.message + "</p>";
  }
}

/** ---------- Utils ---------- */
function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function nl2br(s) { return String(s).replaceAll("\n", "<br/>"); }

/** ---------- Boot ---------- */
document.addEventListener("DOMContentLoaded", () => {
  // nothing else needed – UI starts in login state
});
