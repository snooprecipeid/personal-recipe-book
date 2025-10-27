// script.js — Firebase v11 (CDN, ESM) + Delete feature

// --- Firebase imports (CDN) ---
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-app.js";
import { getAnalytics } from "https://www.gstatic.com/firebasejs/11.0.1/firebase-analytics.js";

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
  deleteDoc,
  doc,
  getDoc,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";

import {
  getStorage,
  ref as sRef,
  refFromURL,
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";


// --- Firebase config (punyamu) ---
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUlcCyJUUQVNM_Gcv0OtdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.appspot.com", // pastikan identik dengan Project Settings
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P",
};

// --- Init Firebase ---
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch { /* analytics optional di http/local */ }
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);


// --- DOM refs ---
const loginSection   = document.getElementById("loginSection");
const mainSection    = document.getElementById("mainSection");
const loginBtn       = document.getElementById("loginBtn");
const registerBtn    = document.getElementById("registerBtn");
const logoutBtn      = document.getElementById("logoutBtn");
const forgotLink     = document.getElementById("forgotPassword");
const authError      = document.getElementById("authError");

const emailEl        = document.getElementById("email");
const passwordEl     = document.getElementById("password");

const recipeNameEl   = document.getElementById("recipeName");
const ingredientsEl  = document.getElementById("ingredients");
const instructionsEl = document.getElementById("instructions");
const costEl         = document.getElementById("cost");
const photoEl        = document.getElementById("photo");
const saveRecipeBtn  = document.getElementById("saveRecipeBtn");
const saveStatus     = document.getElementById("saveStatus");
const recipeGrid     = document.getElementById("recipeGrid");

function show(el){ el.classList.remove("hidden"); }
function hide(el){ el.classList.add("hidden"); }

function uiLog(msg) {
  console.log("[RecipeSave]", msg);
  if (saveStatus) saveStatus.textContent = String(msg);
}
window.addEventListener("error", (e) => {
  console.error("[GlobalError]", e.error || e.message || e);
  uiLog("Error: " + (e.error?.message || e.message || e));
});


// --- Auth actions ---
loginBtn.addEventListener("click", async () => {
  authError.textContent = ""; hide(authError);
  try {
    const email = emailEl.value.trim();
    const pass  = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    authError.textContent = e.message; show(authError);
  }
});

registerBtn.addEventListener("click", async () => {
  authError.textContent = ""; hide(authError);
  try {
    const email = emailEl.value.trim();
    const pass  = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    authError.textContent = e.message; show(authError);
  }
});

forgotLink.addEventListener("click", async (e) => {
  e.preventDefault();
  authError.textContent = ""; hide(authError);
  try {
    const email = prompt("Masukkan email untuk reset password:");
    if (!email) return;
    await sendPasswordResetEmail(auth, email.trim());
    alert("Link reset password sudah dikirim (cek inbox/spam).");
  } catch (e2) {
    authError.textContent = e2.message; show(authError);
  }
});

logoutBtn.addEventListener("click", async () => { await signOut(auth); });


// --- Auth state listener ---
onAuthStateChanged(auth, async (user) => {
  if (user) {
    hide(loginSection); show(mainSection); show(logoutBtn);
    await loadRecipes(user.uid);
  } else {
    show(loginSection); hide(mainSection); hide(logoutBtn);
  }
});


// --- Save recipe (upload foto + simpan ke Firestore) ---
saveRecipeBtn.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) { alert("Silakan login terlebih dahulu."); return; }

  uiLog("Saving... (init)");

  try {
    const name         = recipeNameEl.value.trim();
    const ingredients  = ingredientsEl.value.trim();
    const instructions = instructionsEl.value.trim();
    const cost         = Number(costEl.value || 0);
    if (!name) throw new Error("Recipe Name wajib diisi.");

    // Upload foto (optional), jangan biarkan app ngegantung
    const files = Array.from(photoEl.files || []);
    const photoURLs = [];

    if (files.length > 0) {
      uiLog("Uploading photo(s)...");
      for (const file of files) {
        try {
          const key = `recipes/${user.uid}/${Date.now()}_${file.name}`;
          const r = sRef(storage, key);

          // Timeout manual 60s
          const uploadPromise = uploadBytes(r, file);
          const withTimeout = Promise.race([
            uploadPromise,
            new Promise((_, rej) => setTimeout(() => rej(new Error("Upload timeout: 60s")), 60000))
          ]);

          await withTimeout;
          const url = await getDownloadURL(r);
          photoURLs.push(url);
          uiLog("Uploaded: " + file.name);
        } catch (err) {
          console.error("[StorageUploadError]", err);
          uiLog("Peringatan: gagal upload " + file.name + " → lanjut tanpa foto ini.");
        }
      }
    } else {
      uiLog("No photo selected. Skipping upload.");
    }

    // Simpan dokumen ke Firestore
    uiLog("Saving document to Firestore...");
    const docRef = await addDoc(collection(db, "recipes"), {
      uid: user.uid,
      name,
      ingredients,
      instructions,
      cost,
      photoURLs,
      createdAt: serverTimestamp(),
    });

    // Clear form & reload
    recipeNameEl.value = "";
    ingredientsEl.value = "";
    instructionsEl.value = "";
    costEl.value = "";
    photoEl.value = "";

    uiLog("Saved! (" + docRef.id + ")");
    await loadRecipes(user.uid);
    setTimeout(() => uiLog(""), 1500);
  } catch (e) {
    console.error("[RecipeSaveError]", e);
    uiLog("Error: " + (e?.message || e));
  }
});


// --- Load recipes (render + tombol Delete) ---
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
    snap.forEach((dSnap) => {
      const d  = dSnap.data();
      const id = dSnap.id;

      const imgs = (d.photoURLs && d.photoURLs.length)
        ? d.photoURLs.map(u => `<img src="${u}" alt="${d.name}"/>`).join("")
        : `<img src="https://via.placeholder.com/600x400?text=No+Image" alt="No Image" />`;

      const costFmt = d.cost ? d.cost.toLocaleString("id-ID") : 0;

      cards.push(`
        <div class="recipe-card" data-id="${id}">
          ${imgs}
          <h4>${escapeHTML(d.name || "-")}</h4>
          <div class="cost">Rp ${costFmt}</div>
          <p><b>Ingredients:</b><br>${nl2br(escapeHTML(d.ingredients || "-"))}</p>
          <p><b>Instructions:</b><br>${nl2br(escapeHTML(d.instructions || "-"))}</p>
          <button class="del-btn" data-id="${id}">Delete</button>
        </div>
      `);
    });

    recipeGrid.innerHTML = cards.join("");
  } catch (e) {
    console.error(e);
    recipeGrid.innerHTML = "<p>Gagal load recipes: " + e.message + "</p>";
  }
}


// --- Delegated handler: Delete recipe (doc + files) ---
recipeGrid.addEventListener("click", async (e) => {
  const btn = e.target.closest(".del-btn");
  if (!btn) return;

  const user = auth.currentUser;
  if (!user) { alert("Silakan login."); return; }

  const id = btn.dataset.id;
  if (!confirm("Hapus resep ini?")) return;

  try {
    // Ambil dokumen untuk tahu daftar foto
    const docRef = doc(db, "recipes", id);
    const snap = await getDoc(docRef);
    const photos = snap.exists() ? (snap.data().photoURLs || []) : [];

    // Hapus file-file foto (jika ada)
    for (const url of photos) {
      try {
        const r = refFromURL(url); // gunakan refFromURL untuk URL https
        await deleteObject(r);
      } catch (err) {
        console.warn("Gagal delete file:", url, err?.message);
      }
    }

    // Hapus dokumen Firestore
    await deleteDoc(docRef);

    await loadRecipes(user.uid);
  } catch (err) {
    console.error("Delete error:", err);
    alert("Gagal delete: " + (err?.message || err));
  }
});


// --- Utils ---
function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function nl2br(s) { return String(s).replaceAll("\n", "<br/>"); }


// --- Boot ---
document.addEventListener("DOMContentLoaded", () => {
  // UI mulai di login; tidak perlu init tambahan.
});
