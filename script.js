// ================== Firebase via CDN (ES Modules) ==================
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
  doc,
  updateDoc,
  deleteDoc,
  arrayUnion,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-firestore.js";
import {
  getStorage,
  ref as sRef,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.0.1/firebase-storage.js";

// ================== Firebase Config (gunakan punyamu) ==================
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUlcCyJUUQVNM_Gcv0OtdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.firebasestorage.app",
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P",
};

// ================== Init ==================
const app = initializeApp(firebaseConfig);
try { getAnalytics(app); } catch { /* analytics optional di http */ }
const auth = getAuth(app);
const db = getFirestore(app);
const storage = getStorage(app);

// ================== DOM ==================
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const loginBtn = document.getElementById("loginBtn");
const registerBtn = document.getElementById("registerBtn");
const forgotLink = document.getElementById("forgotPassword");
const logoutBtn = document.getElementById("logoutBtn");
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

function show(el){ el?.classList.remove("hidden"); }
function hide(el){ el?.classList.add("hidden"); }

// ================== Auth Actions ==================
loginBtn?.addEventListener("click", async () => {
  authError.textContent = ""; hide(authError);
  try {
    const email = emailEl.value.trim();
    const pass = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) { authError.textContent = e.message; show(authError); }
});

registerBtn?.addEventListener("click", async () => {
  authError.textContent = ""; hide(authError);
  try {
    const email = emailEl.value.trim();
    const pass = passwordEl.value;
    if (!email || !pass) throw new Error("Email & password wajib diisi.");
    await createUserWithEmailAndPassword(auth, email, pass);
  } catch (e) { authError.textContent = e.message; show(authError); }
});

forgotLink?.addEventListener("click", async (e) => {
  e.preventDefault();
  authError.textContent = ""; hide(authError);
  try {
    const email = prompt("Masukkan email untuk reset password:");
    if (!email) return;
    await sendPasswordResetEmail(auth, email.trim());
    alert("Link reset password dikirim. Cek inbox/spam.");
  } catch (e2) { authError.textContent = e2.message; show(authError); }
});

logoutBtn?.addEventListener("click", async () => { await signOut(auth); });

// ================== Auth State ==================
onAuthStateChanged(auth, async (user) => {
  if (user) {
    hide(loginSection); show(mainSection); show(logoutBtn);
    await loadRecipes(user.uid);
  } else {
    show(loginSection); hide(mainSection); hide(logoutBtn);
  }
});

// ================== Save Recipe ==================
saveRecipeBtn?.addEventListener("click", async () => {
  const user = auth.currentUser;
  if (!user) { alert("Silakan login terlebih dahulu."); return; }

  saveStatus.textContent = "Saving...";
  try {
    const name = recipeNameEl.value.trim();
    const ingredients = ingredientsEl.value.trim();
    const instructions = instructionsEl.value.trim();
    const cost = Number(costEl.value || 0);
    if (!name) throw new Error("Recipe Name wajib diisi.");

    // Upload foto (opsional)
    const photoURLs = [];
    const files = Array.from(photoEl.files || []);
    for (const file of files) {
      const path = `recipes/${user.uid}/${Date.now()}_${file.name}`;
      const r = sRef(storage, path);
      await uploadBytes(r, file);
      const url = await getDownloadURL(r);
      photoURLs.push(url);
    }

    await addDoc(collection(db, "recipes"), {
      uid: user.uid,
      name,
      ingredients,
      instructions,
      cost,
      photoURLs,
      rating: 0,               // rating awal
      comments: [],            // list komentar
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });

    saveStatus.textContent = "Saved!";
    // reset form
    recipeNameEl.value = "";
    ingredientsEl.value = "";
    instructionsEl.value = "";
    costEl.value = "";
    photoEl.value = "";
    await loadRecipes(user.uid);
    setTimeout(() => (saveStatus.textContent = ""), 1200);
  } catch (e) {
    console.error(e);
    saveStatus.textContent = "Error: " + e.message;
  }
});

// ================== Load Recipes ==================
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
    snap.forEach((docSnap) => {
      const id = docSnap.id;
      const d = docSnap.data();

      const imgs = (d.photoURLs || []).map(
        (u) => `<img src="${u}" alt="${escapeHTML(d.name || "-")}">`
      ).join("");

      const costFmt = d.cost ? Number(d.cost).toLocaleString("id-ID") : 0;

      // Stars 1..5
      const rating = Number(d.rating || 0);
      const starsHTML = Array.from({length:5}, (_,i)=> {
        const idx = i+1;
        const active = idx <= rating ? "active" : "";
        return `<span class="star ${active}" data-star="${idx}">★</span>`;
      }).join("");

      // View fields
      const viewHTML = `
        <div class="view-fields">
          <h4>${escapeHTML(d.name || "-")}</h4>
          <div class="stars" data-id="${id}" aria-label="rating">${starsHTML}</div>
          <div class="cost">Rp ${costFmt}</div>
          <p><b>Ingredients:</b><br>${nl2br(escapeHTML(d.ingredients || "-"))}</p>
          <p><b>Instructions:</b><br>${nl2br(escapeHTML(d.instructions || "-"))}</p>
        </div>
      `;

      // Edit fields
      const editHTML = `
        <div class="edit-fields">
          <input class="editable" type="text" data-edit="name" value="${escapeAttr(d.name || "")}" />
          <textarea class="editable" data-edit="ingredients">${escapeHTML(d.ingredients || "")}</textarea>
          <textarea class="editable" data-edit="instructions">${escapeHTML(d.instructions || "")}</textarea>
          <input class="editable" type="number" data-edit="cost" value="${Number(d.cost || 0)}" />
          <div class="recipe-actions">
            <button class="btn-chip" data-action="save-edit" data-id="${id}">Save</button>
            <button class="btn-chip" data-action="cancel-edit" data-id="${id}">Cancel</button>
          </div>
        </div>
      `;

      // Comments
      const comments = Array.isArray(d.comments) ? d.comments : [];
      const commentList = comments.map((c) => {
        const t = normalizeDate(c?.createdAt);
        return `
          <div class="comment-item">
            <div class="comment-meta">${t ? t.toLocaleString("id-ID") : ""}</div>
            <div>${nl2br(escapeHTML(c?.text || ""))}</div>
          </div>
        `;
      }).join("");

      const commentHTML = `
        <div class="comment-box">
          <div class="comment-list" id="clist-${id}">${commentList || ""}</div>
          <textarea placeholder="Tulis komentar..." id="cinput-${id}"></textarea>
          <div class="comment-actions">
            <button class="btn-chip" data-action="add-comment" data-id="${id}">Kirim</button>
          </div>
        </div>
      `;

      // Action buttons
      const actionsHTML = `
        <div class="recipe-actions">
          <button class="btn-chip" data-action="edit" data-id="${id}">Edit</button>
          <button class="btn-chip" data-action="delete" data-id="${id}">Delete</button>
        </div>
      `;

      cards.push(`
        <div class="recipe-card" data-id="${id}">
          ${imgs}
          ${viewHTML}
          ${editHTML}
          ${actionsHTML}
          ${commentHTML}
        </div>
      `);
    });

    recipeGrid.innerHTML = cards.join("");
  } catch (e) {
    console.error(e);
    recipeGrid.innerHTML = "<p>Gagal load recipes: " + e.message + "</p>";
  }
}

// ================== Delegated Events ==================
recipeGrid.addEventListener("click", async (e) => {
  const btn = e.target.closest("button, .star");
  if (!btn) return;

  const user = auth.currentUser;
  if (!user) { alert("Silakan login terlebih dahulu."); return; }

  // Rating star
  if (btn.classList.contains("star")) {
    const starEl = btn;
    const wrapper = starEl.closest(".stars");
    const docId = wrapper?.dataset?.id;
    const starVal = Number(starEl.dataset.star || 0);
    if (!docId || !starVal) return;

    try {
      await updateDoc(doc(db, "recipes", docId), {
        rating: starVal,
        updatedAt: serverTimestamp(),
      });
      // Update UI
      [...wrapper.querySelectorAll(".star")].forEach(s => {
        const v = Number(s.dataset.star || 0);
        s.classList.toggle("active", v <= starVal);
      });
    } catch (err) {
      alert("Gagal update rating: " + err.message);
    }
    return;
  }

  // Buttons (edit/delete/save/cancel/comment)
  const action = btn.dataset.action;
  const id = btn.dataset.id;
  if (!action || !id) return;

  const card = recipeGrid.querySelector(`.recipe-card[data-id="${id}"]`);
  if (!card) return;

  if (action === "delete") {
    if (!confirm("Yakin hapus resep ini?")) return;
    try {
      await deleteDoc(doc(db, "recipes", id));
      card.remove();
    } catch (err) {
      alert("Gagal menghapus: " + err.message);
    }
  }

  if (action === "edit") {
    card.classList.add("editing");
  }

  if (action === "cancel-edit") {
    card.classList.remove("editing");
  }

  if (action === "save-edit") {
    const name = card.querySelector('[data-edit="name"]').value.trim();
    const ingredients = card.querySelector('[data-edit="ingredients"]').value.trim();
    const instructions = card.querySelector('[data-edit="instructions"]').value.trim();
    const cost = Number(card.querySelector('[data-edit="cost"]').value || 0);
    if (!name) { alert("Nama resep wajib."); return; }

    try {
      await updateDoc(doc(db, "recipes", id), {
        name, ingredients, instructions, cost,
        updatedAt: serverTimestamp(),
      });
      // Sync tampilan ringan
      card.querySelector(".view-fields h4").textContent = name || "-";
      card.querySelector(".view-fields .cost").textContent = "Rp " + (cost ? cost.toLocaleString("id-ID") : 0);
      card.querySelectorAll(".view-fields p")[0].innerHTML = "<b>Ingredients:</b><br>" + nl2br(escapeHTML(ingredients || "-"));
      card.querySelectorAll(".view-fields p")[1].innerHTML = "<b>Instructions:</b><br>" + nl2br(escapeHTML(instructions || "-"));
      card.classList.remove("editing");
    } catch (err) {
      alert("Gagal menyimpan perubahan: " + err.message);
    }
  }

  if (action === "add-comment") {
    const input = card.querySelector(`#cinput-${id}`);
    const text = (input?.value || "").trim();
    if (!text) return;

    const dref = doc(db, "recipes", id);
    const newComment = {
      text,
      createdAt: serverTimestamp(), // server time
    };

    try {
      await updateDoc(dref, { comments: arrayUnion(newComment), updatedAt: serverTimestamp() });

      // Update UI segera (pakai waktu lokal untuk tampilan cepat)
      const list = card.querySelector(`#clist-${id}`);
      const item = document.createElement("div");
      item.className = "comment-item";
      item.innerHTML = `
        <div class="comment-meta">${new Date().toLocaleString("id-ID")}</div>
        <div>${nl2br(escapeHTML(text))}</div>
      `;
      list?.prepend(item);
      input.value = "";
    } catch (err) {
      alert("Gagal menambah komentar: " + err.message);
    }
  }
});

// ================== Utils ==================
function escapeHTML(s) {
  return String(s)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}
function escapeAttr(s) {
  return escapeHTML(s).replaceAll("\n", " ");
}
function nl2br(s) { return String(s).replaceAll("\n", "<br/>"); }
function normalizeDate(v) {
  // dukung Timestamp Firestore, number ms, string ISO
  try {
    if (!v) return null;
    if (typeof v === "number") return new Date(v);
    if (typeof v?.toMillis === "function") return new Date(v.toMillis());
    if (typeof v === "string") return new Date(v);
    return null;
  } catch { return null; }
}

// ================== Boot ==================
document.addEventListener("DOMContentLoaded", () => {
  // auth state akan memicu loadRecipes saat login
});
