// Always clear login when opening the page
localStorage.removeItem("loggedIn");

const loginSection = document.getElementById("loginSection");
const mainSection = document.getElementById("mainSection");
const loginBtn = document.getElementById("loginBtn");
const logoutBtn = document.getElementById("logoutBtn");
const recipeGrid = document.getElementById("recipeGrid");
const pagination = document.getElementById("pagination");

let recipes = JSON.parse(localStorage.getItem("recipes")) || [];
const RECIPES_PER_PAGE = 6;
let currentPage = 1;

// LOGIN SYSTEM
loginBtn.addEventListener("click", () => {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === "admin" && pass === "recipe123") {
    localStorage.setItem("loggedIn", "true");
    loginSection.classList.add("hidden");
    mainSection.classList.remove("hidden");
    renderRecipesPage(1);
  } else {
    alert("Invalid credentials");
  }
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem("loggedIn");
  location.reload();
});

// RECIPE SAVE
document.getElementById("saveRecipeBtn").addEventListener("click", () => {
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
    photoURLs.push(URL.createObjectURL(photos[i]));
  }

  recipes.push({
    name, ingredients, instructions, cost, photoURLs,
    rating: 0, comments: []
  });

  localStorage.setItem("recipes", JSON.stringify(recipes));
  renderRecipesPage(currentPage);
  alert("Recipe saved!");
});

// PAGINATION
function renderRecipesPage(page) {
  recipeGrid.innerHTML = "";
  pagination.innerHTML = "";

  const start = (page - 1) * RECIPES_PER_PAGE;
  const end = start + RECIPES_PER_PAGE;
  const paginatedRecipes = recipes.slice(start, end);

  paginatedRecipes.forEach((r, idx) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    let imgs = r.photoURLs.map(p => `<img src="${p}">`).join("");

    card.innerHTML = `
      ${imgs}
      <h4>${r.name}</h4>
      <p><b>Ingredients:</b><br>${r.ingredients}</p>
      <p><b>Instructions:</b><br>${r.instructions}</p>
      <div class="cost">💰 Rp ${r.cost || "-"}</div>
      <div class="rating" data-index="${start + idx}">
        ${[1,2,3,4,5].map(n => `<span class="star ${n <= r.rating ? "active" : ""}">&#9733;</span>`).join("")}
      </div>
      <div class="comment-box">
        <textarea placeholder="Add a comment..."></textarea><br>
        <button class="post-comment">Post</button>
        <div class="comments">${r.comments.map(c => `<p>💬 ${c}</p>`).join("")}</div>
      </div>
    `;
    recipeGrid.appendChild(card);
  });

  // Rating
  document.querySelectorAll(".rating").forEach(ratingDiv => {
    ratingDiv.querySelectorAll(".star").forEach((star, idx) => {
      star.onclick = () => {
        const recipeIndex = ratingDiv.getAttribute("data-index");
        recipes[recipeIndex].rating = idx + 1;
        localStorage.setItem("recipes", JSON.stringify(recipes));
        renderRecipesPage(page);
      };
    });
  });

  // Comments
  document.querySelectorAll(".post-comment").forEach((btn, i) => {
    btn.addEventListener("click", () => {
      const commentInput = btn.previousElementSibling;
      const text = commentInput.value.trim();
      if (text) {
        const recipeIndex = start + i;
        recipes[recipeIndex].comments.push(text);
        localStorage.setItem("recipes", JSON.stringify(recipes));
        renderRecipesPage(page);
      }
    });
  });

  // Pagination Buttons
  const totalPages = Math.ceil(recipes.length / RECIPES_PER_PAGE);
  for (let i = 1; i <= totalPages; i++) {
    const btn = document.createElement("button");
    btn.className = "page-btn" + (i === page ? " active" : "");
    btn.textContent = i;
    btn.addEventListener("click", () => {
      currentPage = i;
      renderRecipesPage(i);
    });
    pagination.appendChild(btn);
  }
}

// AUTO LOGOUT DISPLAY
if (localStorage.getItem("loggedIn") === "true") {
  loginSection.classList.add("hidden");
  mainSection.classList.remove("hidden");
  renderRecipesPage(1);
}
