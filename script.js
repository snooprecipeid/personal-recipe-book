// ===================== Firebase via CDN (ES Modules) =====================
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
  updateDoc,
  deleteDoc,
  doc
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// ===================== Inisialisasi Firebase =====================
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUlcCyJUUQVNM_Gcv0OtdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.firebasestorage.app",
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P"
};
/*
  Catatan: Jika upload Storage error (mis. storage/invalid-argument),
  coba ganti storageBucket menjadi "snoop-recipe.appspot.com".
*/
const app = initializeApp(firebaseConfig);
getAnalytics(app);
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ===================== DOM =====================
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

// tombol Cancel Edit (opsional; kalau tidak ada di HTML tidak apa-apa)
const cancelEditBtn = document.getElementById("cancelEditBtn");

// ===================== State Edit =====================
let editingId = null;           // docId yang sedang di-edit
let existingPhotoURLs = [];     // foto lama saat edit

// ===================== Helpers =====================
function escapeHTML(s) {
  return String(s ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function nl2br(s) { return String(s ?? "").replaceAll("\n", "<br/>"); }
function br2nl(s) { return String(s ?? "").replaceAll("<br/>", "\n").replaceAll("&lt;br/&gt;","\n"); }
function fmtIDR(n) {
  const num = Number(n || 0);
  try { return num.toLocaleString("id-ID"); } catch { return num; }
}
function show(el) { el?.classList?.remove("hidden"); }
function hide(el) { el?.classList?.add("hidden"); }

// ===================== Auth UI =====================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    hide(loginSection);
    show(mainSection);
    show(logoutBtn);
    await loadRecipes(user.uid);
  } else {
    show(loginSection);
    hide(mainSection);
    hide(logoutBtn);
  }
});

loginBtn?.addEventListener("click", async () => {
  authError.textContent = "";
  try {
    await signInWithEmailAndPassword(auth, emailEl.value.trim(), passwordEl.value);
  } catch (e) {
    authError.textContent = e.message || "Login gagal";
  }
});

registerBtn?.addEventListener("click", async () => {
  authError.textContent = "";
  try {
    await createUserWithEmailAndPassword(auth, emailEl.value.trim(), passwordEl.value);
  } catch (e) {
    authError.textContent = e.message || "Registrasi gagal";
  }
});

forgotLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  const email = emailEl.value.trim();
  if (!email) return (authError.textContent = "Isi email dulu ya.");
  try {
    await sendPasswordResetEmail(auth, email);
    authError.textContent = "Link reset password dikirim ke email 👍";
  } catch (e) {
    authError.textContent = e.message || "Gagal kirim reset password";
  }
});

logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
});

// ===================== Load & Render Recipes =====================
async function loadRecipes(uid) {
  recipeGrid.innerHTML = `<div class="loading">Loading...</div>`;
  const q = query(
    collection(db, "recipes"),
    where("uid", "==", uid),
    orderBy("createdAt", "desc")
  );
  const snap = await getDocs(q);

  const cards = [];
  snap.forEach((docSnap) => {
    const id = docSnap.id;
    const d = docSnap.data() || {};
    const imgs = (d.photoURLs || []).map(u => `<img src="${u}" alt="${escapeHTML(d.name||'')}" />`).join("");
    const dataAttr = `
      data-id="${id}"
      data-name="${escapeHTML(d.name||'')}"
      data-ingredients="${escapeHTML(d.ingredients||'')}"
      data-instructions="${escapeHTML(d.instructions||'')}"
      data-cost="${Number(d.cost||0)}"
      data-photos='${JSON.stringify(d.photoURLs||[])}'
    `;

    cards.push(`
      <div class="recipe-card" ${dataAttr}>
        <div class="images">${imgs}</div>
        <h4>${escapeHTML(d.name || "-")}</h4>
        <div class="cost">Rp ${fmtIDR(d.cost)}</div>
        <p><b>Ingredients:</b><br/>${nl2br(escapeHTML(d.ingredients || "-"))}</p>
        <p><b>Instructions:</b><br/>${nl2br(escapeHTML(d.instructions || "-"))}</p>

        <div class="recipe-actions">
          <button class="btn-icon ghost js-edit"><i class="fas fa-pen"></i> Edit</button>
          <button class="btn-icon danger js-delete"><i class="fas fa-trash"></i> Delete</button>
        </div>
      </div>
    `);
  });

  recipeGrid.innerHTML = cards.join("") || `<div class="empty">Belum ada resep. Tambahkan dulu ya ✨</div>`;
}

// ===================== Edit/Delete via Delegation =====================
recipeGrid.addEventListener("click", async (e) => {
  const card = e.target.closest(".recipe-card");
  if (!card) return;

  // EDIT
  if (e.target.closest(".js-edit")) {
    editingId = card.dataset.id || null;
    recipeNameEl.value = card.dataset.name || "";
    ingredientsEl.value = br2nl(card.dataset.ingredients || "");
    instructionsEl.value = br2nl(card.dataset.instructions || "");
    costEl.value = card.dataset.cost || 0;

    try { existingPhotoURLs = JSON.parse(card.dataset.photos || "[]"); }
    catch { existingPhotoURLs = []; }

    saveRecipeBtn.innerHTML = '<i class="fas fa-save"></i> Update Recipe';
    saveStatus.textContent = "Editing mode: perubahan akan menimpa resep ini.";
    saveStatus.classList.add("editing-hint");
    show(cancelEditBtn); // kalau tombolnya memang ada
    window.scrollTo({ top: 0, behavior: "smooth" });
    return;
  }

  // DELETE
  if (e.target.closest(".js-delete")) {
    const id = card.dataset.id;
    const name = card.dataset.name || "resep";
    if (!confirm(`Hapus "${name}"? Tindakan ini tidak bisa dibatalkan.`)) return;

    try {
      // hapus dokumen
      await deleteDoc(doc(db, "recipes", id));

      // coba hapus file storage (best-effort)
      try {
        const photos = JSON.parse(card.dataset.photos || "[]");
        for (const url of photos) {
          try { await deleteObject(sRef(storage, url)); } catch {}
        }
      } catch {}

      await loadRecipes(auth.currentUser.uid);
      alert("Resep terhapus.");
    } catch (err) {
      console.error(err);
      alert("Gagal menghapus: " + (err?.message || err));
    }
  }
});

// ===================== Save (Add / Update) =====================
saveRecipeBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) { alert("Silakan login terlebih dahulu."); return; }

  saveStatus.textContent = editingId ? "Updating..." : "Saving...";
  try {
    const name = recipeNameEl.value.trim();
    const ingredients = ingredientsEl.value.trim();
    const instructions = instructionsEl.value.trim();
    const cost = Number(costEl.value || 0);
    if (!name) throw new Error("Recipe Name wajib diisi.");

    // upload foto baru (jika ada)
    const files = Array.from(photoEl.files || []);
    const newUrls = [];
    for (const file of files) {
      const key = `recipes/${user.uid}/${Date.now()}_${file.name}`;
      const r = sRef(storage, key);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      newUrls.push(url);
    }

    if (editingId) {
      // MODE EDIT → update dokumen
      const mergedPhotos = [...(existingPhotoURLs || []), ...newUrls];
      await updateDoc(doc(db, "recipes", editingId), {
        name, ingredients, instructions, cost,
        photoURLs: mergedPhotos,
        updatedAt: serverTimestamp()
      });
      saveStatus.textContent = "Updated!";
    } else {
      // MODE ADD → tambah dokumen baru
      await addDoc(collection(db, "recipes"), {
        uid: user.uid, name, ingredients, instructions, cost,
        photoURLs: newUrls,
        createdAt: serverTimestamp()
      });
      saveStatus.textContent = "Saved!";
    }

    // reset form + state
    recipeNameEl.value = "";
    ingredientsEl.value = "";
    instructionsEl.value = "";
    costEl.value = "";
    photoEl.value = "";
    editingId = null;
    existingPhotoURLs = [];
    saveRecipeBtn.innerHTML = '<i class="fas fa-save"></i> Save Recipe';
    hide(cancelEditBtn);
    saveStatus.classList.remove("editing-hint");

    await loadRecipes(user.uid);
    setTimeout(() => (saveStatus.textContent = ""), 1500);
  } catch (e) {
    console.error(e);
    saveStatus.textContent = "Error: " + (e?.message || e);
  }
});

// ===================== Cancel Edit (opsional) =====================
cancelEditBtn?.addEventListener("click", () => {
  editingId = null;
  existingPhotoURLs = [];
  recipeNameEl.value = "";
  ingredientsEl.value = "";
  instructionsEl.value = "";
  costEl.value = "";
  photoEl.value = "";
  saveRecipeBtn.innerHTML = '<i class="fas fa-save"></i> Save Recipe';
  hide(cancelEditBtn);
  saveStatus.textContent = "";
  saveStatus.classList.remove("editing-hint");
});

// ===================== Boot =====================
document.addEventListener("DOMContentLoaded", () => {
  // UI mulai di state login (ditangani onAuthStateChanged)
});
