// script.js — Snoop Recipe (Firebase v11, CDN, ESM)

// -------- Firebase imports (CDN) --------
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
  uploadBytes,
  getDownloadURL,
  deleteObject,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// -------- Firebase config (punyamu) --------
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUlcCyJUUQVNM_Gcv0OtdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.firebasestorage.app", // <- SESUAI bucket milikmu
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P",
};

// -------- Init Firebase --------
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch {}
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

console.log("APP LOADED");

// -------- DOM refs (pastikan id sama dengan HTML kamu) --------
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

// -------- Helpers UI --------
function show(el){ el?.classList?.remove("hidden"); }
function hide(el){ el?.classList?.add("hidden"); }
function uiLog(msg){
  if (saveStatus) saveStatus.textContent = msg || "";
  console.log("[UI]", msg);
}
window.addEventListener("error",(e)=>{
  console.error("[GlobalError]", e.error || e.message || e);
});

// -------- Auth: listeners --------
if (loginBtn) loginBtn.type = "button";
if (registerBtn) registerBtn.type = "button";
if (saveRecipeBtn) saveRecipeBtn.type = "button";

loginBtn?.addEventListener("click", async () => {
  try {
    console.log("LOGIN CLICK");
    authError.textContent = ""; hide(authError);
    const email = emailEl.value.trim();
    const pass  = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    authError.textContent = e.message; show(authError);
  }
});

registerBtn?.addEventListener("click", async () => {
  try {
    console.log("REGISTER CLICK");
    authError.textContent = ""; hide(authError);
    const email = emailEl.value.trim();
    const pass  = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    authError.textContent = e.message; show(authError);
  }
});

forgotLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  try {
    const email = prompt("Masukkan email untuk reset password:");
    if (!email) return;
    await sendPasswordResetEmail(auth, email.trim());
    alert("Link reset password sudah dikirim (cek inbox/spam).");
  } catch (e2) {
    alert(e2.message);
  }
});

logoutBtn?.addEventListener("click", async () => { await signOut(auth); });

onAuthStateChanged(auth, async (user) => {
  console.log("AUTH STATE:", !!user, user?.email);
  if (user) {
    hide(loginSection); show(mainSection); show(logoutBtn);
    await loadRecipes(user.uid);
  } else {
    show(loginSection); hide(mainSection); hide(logoutBtn);
  }
});

// -------- Save Recipe (upload foto + simpan dokumen) --------
saveRecipeBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) { alert("Silakan login terlebih dahulu."); return; }

  try {
    const name         = recipeNameEl.value.trim();
    const ingredients  = ingredientsEl.value.trim();
    const instructions = instructionsEl.value.trim();
    const cost         = Number(costEl.value || 0);
    if (!name) throw new Error("Recipe Name wajib diisi.");

    // Upload foto (opsional)
    const files = Array.from(photoEl.files || []);
    const photoURLs = [];
    if (files.length > 0) {
      uiLog("Uploading photo(s)...");
      for (const f of files) {
        try {
          const path = `recipes/${user.uid}/${Date.now()}_${f.name}`;
          const rf = sRef(storage, path);
          const withTimeout = Promise.race([
            uploadBytes(rf, f),
            new Promise((_,rej)=>setTimeout(()=>rej(new Error("Upload timeout")), 60000))
          ]);
          await withTimeout;
          const url = await getDownloadURL(rf);
          photoURLs.push(url);
          uiLog(`Uploaded: ${f.name}`);
        } catch (err) {
          console.warn("Upload gagal:", f.name, err?.message);
        }
      }
    }

    uiLog("Saving document...");
    await addDoc(collection(db, "recipes"), {
      uid: user.uid,
      name,
      ingredients,
      instructions,
      cost,
      photoURLs,
      createdAt: serverTimestamp(),
    });

    // Reset form
    recipeNameEl.value = "";
    ingredientsEl.value = "";
    instructionsEl.value = "";
    costEl.value = "";
    photoEl.value = "";
    uiLog("Saved!");

    await loadRecipes(user.uid);
    setTimeout(()=>uiLog(""), 1500);
  } catch (e) {
    console.error("[SaveError]", e);
    uiLog("Error: " + (e?.message || e));
  }
});

// -------- Load Recipes & render cards (dengan tombol Delete) --------
async function loadRecipes(uid){
  if (!recipeGrid) return;
  recipeGrid.innerHTML = "<p>Loading recipes...</p>";
  try {
    const q = query(
      collection(db, "recipes"),
      where("uid","==", uid),
      orderBy("createdAt","desc")
    );
    const snap = await getDocs(q);
    if (snap.empty){
      recipeGrid.innerHTML = "<p>Belum ada resep. Tambahkan di atas ya.</p>";
      return;
    }

    const cards = [];
    snap.forEach((dSnap)=>{
      const d  = dSnap.data();
      const id = dSnap.id;

      const imgs = (d.photoURLs && d.photoURLs.length)
        ? d.photoURLs.map(u => `<img src="${u}" alt="${d.name}"
             onerror="this.src='https://via.placeholder.com/600x400?text=No+Image'">`).join("")
        : `<img src="https://via.placeholder.com/600x400?text=No+Image" alt="No Image">`;

      const costFmt = d.cost ? d.cost.toLocaleString("id-ID") : 0;

      cards.push(`
        <div class="recipe-card" data-id="${id}">
          ${imgs}
          <h4>${escapeHTML(d.name || "-")}</h4>
          <div class="cost">Rp ${costFmt}</div>
          <p><b>Ingredients:</b><br>${nl2br(escapeHTML(d.ingredients || "-"))}</p>
          <p><b>Instructions:</b><br>${nl2br(escapeHTML(d.instructions || "-"))}</p>
          <button class="del-btn" data-id="${id}">🗑 Delete</button>
        </div>
      `);
    });
    recipeGrid.innerHTML = cards.join("");
  } catch (e){
    console.error(e);
    recipeGrid.innerHTML = `<p>Gagal load recipes: ${e.message}</p>`;
  }
}

// -------- Delete recipe (doc + file Storage) --------

// Ubah download URL → path di Storage (recipes/uid/file.jpg)
function storagePathFromDownloadURL(url){
  // contoh: https://firebasestorage.googleapis.com/v0/b/<bucket>/o/recipes%2Fuid%2Ffile.jpg?alt=media&token=...
  const m = url.match(/\/o\/([^?]+)/);
  if (!m) throw new Error("URL storage tidak valid");
  return decodeURIComponent(m[1]); // recipes/uid/file.jpg
}

recipeGrid?.addEventListener("click", async (e)=>{
  const btn = e.target.closest(".del-btn");
  if (!btn) return;

  const user = auth.currentUser;
  if (!user) { alert("Silakan login."); return; }

  const id = btn.dataset.id;
  if (!confirm("Hapus resep ini?")) return;

  try {
    const docRef = doc(db, "recipes", id);
    const snap   = await getDoc(docRef);
    const photos = snap.exists() ? (snap.data().photoURLs || []) : [];

    // Hapus file-file foto (jika ada)
    for (const url of photos){
      try{
        const path = storagePathFromDownloadURL(url);
        const r = sRef(storage, path);
        await deleteObject(r);
      }catch(err){
        console.warn("Gagal hapus file:", url, err?.message);
      }
    }

    // Hapus dokumen
    await deleteDoc(docRef);

    await loadRecipes(user.uid);
  } catch (err){
    console.error("Delete error:", err);
    alert("Gagal delete: " + (err?.message || err));
  }
});

// -------- Utils --------
function escapeHTML(s){
  return String(s)
    .replaceAll("&","&amp;")
    .replaceAll("<","&lt;")
    .replaceAll(">","&gt;")
    .replaceAll('"',"&quot;")
    .replaceAll("'","&#039;");
}
function nl2br(s){ return String(s).replaceAll("\n","<br/>"); }
