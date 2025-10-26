// Initialize localStorage
if (!localStorage.getItem("recipes")) localStorage.setItem("recipes", "[]");

const recipesContainer = document.getElementById("recipes-container");
const recipeImageInput = document.getElementById("recipe-image");
const previewImages = document.getElementById("preview-images");
let imageFiles = [];

recipeImageInput.addEventListener("change", function () {
  previewImages.innerHTML = "";
  imageFiles = [];
  Array.from(this.files).forEach((file) => {
    const reader = new FileReader();
    reader.onload = function (e) {
      const img = document.createElement("img");
      img.src = e.target.result;
      previewImages.appendChild(img);
      imageFiles.push(e.target.result);
    };
    reader.readAsDataURL(file);
  });
});

function getRecipes() {
  return JSON.parse(localStorage.getItem("recipes") || "[]");
}
function saveRecipes(list) {
  localStorage.setItem("recipes", JSON.stringify(list));
}

function addRecipe() {
  const name = document.getElementById("recipe-name").value.trim();
  const ingredients = document.getElementById("recipe-ingredients").value.trim();
  const steps = document.getElementById("recipe-steps").value.trim();
  const cost = Number(document.getElementById("recipe-cost").value || 0);

  if (!name || !ingredients || !steps) {
    alert("Please fill all fields!");
    return;
  }

  const recipes = getRecipes();
  recipes.unshift({
    id: Date.now(),
    name,
    ingredients,
    steps,
    cost,
    images: imageFiles,
    rating: 0,
    comments: []
  });
  saveRecipes(recipes);

  // reset form
  document.querySelectorAll("#recipe-name, #recipe-ingredients, #recipe-steps, #recipe-cost").forEach(el => el.value = "");
  previewImages.innerHTML = "";
  imageFiles = [];
  renderAll();
}

function deleteRecipe(id) {
  if (!confirm("Delete this recipe?")) return;
  const recipes = getRecipes().filter(r => r.id !== id);
  saveRecipes(recipes);
  renderAll();
}

function rateRecipe(id, stars) {
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if (recipe) recipe.rating = stars;
  saveRecipes(recipes);
  renderAll();
}

function addComment(id) {
  const commentInput = document.getElementById(`comment-input-${id}`);
  const commentText = commentInput.value.trim();
  if (!commentText) return;
  const recipes = getRecipes();
  const recipe = recipes.find(r => r.id === id);
  if (recipe) {
    recipe.comments.push(commentText);
    saveRecipes(recipes);
    renderAll();
  }
}

function renderAll() {
  const recipes = getRecipes();
  recipesContainer.innerHTML = "";
  if (!recipes.length) {
    recipesContainer.innerHTML = "<p class='muted'>No recipes yet.</p>";
    return;
  }

  recipes.forEach((r) => {
    const card = document.createElement("div");
    card.className = "recipe-card";

    let starsHTML = "";
    for (let i = 1; i <= 5; i++) {
      const cls = i <= r.rating ? "fa-star active-star" : "fa-star";
      starsHTML += `<i class="fa-solid ${cls}" onclick="rateRecipe(${r.id}, ${i})"></i>`;
    }

    const commentsHTML = r.comments.map(c => `<div class="comment-list">💬 ${c}</div>`).join("");

    card.innerHTML = `
      ${r.images[0] ? `<img src="${r.images[0]}" alt="${r.name}">` : ""}
      <h4>${r.name}</h4>
      <p><strong>Ingredients:</strong><br>${r.ingredients.replace(/\n/g, "<br>")}</p>
      <p><strong>Instructions:</strong><br>${r.steps.replace(/\n/g, "<br>")}</p>
      <p><span style="background:#ffe8ef;padding:6px 10px;border-radius:10px;color:#b94f6f;font-weight:700;">💰 Rp ${r.cost.toLocaleString()}</span></p>
      <div class="rating">${starsHTML}</div>
      <div class="comment-box">
        <textarea id="comment-input-${r.id}" placeholder="Add a comment..."></textarea>
        <button onclick="addComment(${r.id})">Post</button>
      </div>
      ${commentsHTML}
      <div style="text-align:right;margin-top:8px;">
        <button class="btn" onclick="deleteRecipe(${r.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    recipesContainer.appendChild(card);
  });
}

function logout() {
  alert("Logged out!");
}

document.addEventListener("DOMContentLoaded", renderAll);
