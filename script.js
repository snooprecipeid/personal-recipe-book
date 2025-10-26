// Selalu reset login saat buka situs
localStorage.removeItem("loggedIn");

// Firebase Config (pakai punyamu sendiri)
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUIcCyJUUQVNM_Gcv00tdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.appspot.com",
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec",
  measurementId: "G-YPXRJVEM1P"
};

// Inisialisasi Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// Elemen utama
const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const recipeGrid = document.getElementById("recipeGrid");
const pagination = document.getElementById("pagination");

const RECIPES_PER_PAGE = 6;
let currentPage = 1;
let recipes = [];

// LOGIN
loginBtn.addEventListener("click", () => {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === "admin" && pass === "recipe123") {
    localStorage.setItem("loggedIn", "true");
    loginSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    logoutBtn.classList.remove("hidden");
    loadRecipes();
  } else {
    alert("Invalid credentials");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("loggedIn");
  location.reload();
});

// SIMPAN RESEP KE FIREBASE
document.getElementById("saveRecipeBtn").addEventListener("click", async () => {
  const name = document.getElementById("recipeName").value.trim();
  const ingredients = document.getElementById("ingredients").value.trim();
  const instructions = document.getElementById("instructions").value.trim();
  const cost = document.getElementById("cost").value.trim();
  const photos = document.getElementById("photo").files;

  if (!name) {
    alert("Please enter a recipe name!");
    return;
  }

  let photoURLs = [];
  for (let i = 0; i < photos.length; i++) {
    const file = photos[i];
    const storageRef = storage.ref("recipes/" + file.name);
    await storageRef.put(file);
    const url = await storageRef.getDownloadURL();
    photoURLs.push(url);
  }

  await db.collection("recipes").add({
    name,
    ingredients,
    instructions,
    cost,
    photoURLs,
    rating: 0,
    comments: []
  });

  alert("Recipe saved to Firebase!");
  loadRecipes();
});

// AMBIL DATA DARI FIRESTORE
async function loadRecipes() {
  const snapshot = await db.collection("recipes").get();
  recipes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  renderRecipesPage(currentPage);
}

// RENDER RESEP
function renderRecipesPage(page) {
  recipeGrid.innerHTML = "";
  pagination.innerHTML = "";

  const start = (page - 1) * RECIPES_PER_PAGE;
  const end = start + RECIPES_PER_PAGE;
  const paginated = recipes.slice(start, end);

  paginated.forEach((r) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    const imgs = (r.photoURLs || [])
      .map(url => `<img src="${url}" alt="Recipe photo">`)
      .join("");

    card.innerHTML = `
      ${imgs}
      <h4>${r.name}</h4>
      <p><b>Ingredients:</b><br>${r.ingredients}</p>
      <p><b>Instructions:</b><br>${r.instructions}</p>
      <div class="cost">💰 Rp ${r.cost || "-"}</div>
      <div class="rating" data-id="${r.id}">
        ${[1,2,3,4,5].map(n => `<span class="star ${n <= r.rating ? "active" : ""}">&#9733;</span>`).join("")}
      </div>
      <div class="comment-box">
        <textarea placeholder="Add a comment..."></textarea><br>
        <button class="post-comment">Post</button>
        <div class="comments">${(r.comments || []).map(c => `<p>💬 ${c}</p>`).join("")}</div>
      </div>
    `;
    recipeGrid.appendChild(card);
  });

  // Rating
  document.querySelectorAll(".rating").forEach(div => {
    div.querySelectorAll(".star").forEach((star, idx) => {
      star.onclick = async () => {
        const id = div.dataset.id;
        await db.collection("recipes").doc(id).update({ rating: idx + 1 });
        loadRecipes();
      };
    });
  });

  // Comments
  document.querySelectorAll(".post-comment").forEach((btn, i) => {
    btn.onclick = async () => {
      const commentInput = btn.previousElementSibling;
      const text = commentInput.value.trim();
      if (!text) return;
      const recipe = paginated[i];
      const newComments = [...(recipe.comments || []), text];
      await db.collection("recipes").doc(recipe.id).update({ comments: newComments });
      loadRecipes();
    };
  });

  // Pagination
  const totalPages = Math.ceil(recipes.length / RECIPES_PER_PAGE);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (i === page ? " active" : "");
    btn.textContent = i;
    btn.onclick = () => {
      currentPage = i;
      renderRecipesPage(i);
    };
    pagination.appendChild(btn);
  }
}
