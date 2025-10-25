/* ---------------------------
   Snoop Recipe ID - script.js (Fixed Auth)
   Uses localStorage for persistence
   --------------------------- */

// default password setup
if (!localStorage.getItem('password')) {
  localStorage.setItem('password', 'recipe123');
}

// helper: currency format (IDR)
const fmt = new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', maximumFractionDigits: 0 });

// DOM refs
const recipesContainer = document.getElementById('recipes-container');
const totalRecipesEl = document.getElementById('total-recipes');
const totalCostEl = document.getElementById('total-cost');
const avgRatingEl = document.getElementById('avg-rating');
const searchInput = document.getElementById('search-input');
const sortSelect = document.getElementById('sort-select');

// preview images
const recipeImageInput = document.getElementById('recipe-image');
const previewImages = document.getElementById('preview-images');
let imageFiles = [];

if (recipeImageInput) {
  recipeImageInput.addEventListener('change', function () {
    previewImages.innerHTML = '';
    imageFiles = [];
    Array.from(this.files).forEach(file => {
      const reader = new FileReader();
      reader.onload = function (e) {
        const img = document.createElement('img');
        img.src = e.target.result;
        previewImages.appendChild(img);
        imageFiles.push(e.target.result);
      };
      reader.readAsDataURL(file);
    });
  });
}

// ------------- AUTH (simple localStorage) -------------
function login() {
  const username = document.getElementById('username').value.trim();
  const password = document.getElementById('password').value.trim();
  const saved = localStorage.getItem('password') || 'recipe123';
  const loginError = document.getElementById('login-error');

  if (username === 'admin' && password === saved) {
    localStorage.setItem('isLoggedIn', 'true'); // ✅ simpan status login
    showMainUI();
    renderAll();
  } else {
    loginError.innerText = 'Incorrect username or password!';
    setTimeout(() => (loginError.innerText = ''), 3000);
  }
}

function logout() {
  localStorage.removeItem('isLoggedIn'); // ✅ hapus status login
  location.reload();
}

function showMainUI() {
  document.getElementById('login-box').style.display = 'none';
  document.getElementById('recipe-list').style.display = 'block';
  document.getElementById('add-recipe').style.display = 'block';
  document.querySelector('.dashboard').style.display = 'flex';
}

function showLoginUI() {
  document.getElementById('login-box').style.display = 'block';
  document.getElementById('recipe-list').style.display = 'none';
  document.getElementById('add-recipe').style.display = 'none';
  document.querySelector('.dashboard').style.display = 'none';
}

// reset password inline
function toggleResetForm() {
  const form = document.getElementById('reset-form');
  if (!form) return;
  form.classList.toggle('hidden');
  document.getElementById('reset-message').innerText = '';
}

function setNewPassword() {
  const np = document.getElementById('new-password').value;
  const cp = document.getElementById('confirm-password').value;
  const msg = document.getElementById('reset-message');
  if (!np || !cp) {
    msg.innerText = 'Please fill both fields.';
    return;
  }
  if (np !== cp) {
    msg.innerText = 'Passwords do not match.';
    return;
  }
  localStorage.setItem('password', np);
  msg.innerText = 'Password updated.';
  setTimeout(() => {
    msg.innerText = '';
    document.getElementById('reset-form').classList.add('hidden');
  }, 1500);
}

// ------------- RECIPES CRUD -------------
function getRecipes() {
  return JSON.parse(localStorage.getItem('recipes') || '[]');
}

function saveRecipes(list) {
  localStorage.setItem('recipes', JSON.stringify(list));
}

function addRecipe() {
  const name = document.getElementById('recipe-name').value.trim();
  const ingredients = document.getElementById('recipe-ingredients').value.trim();
  const steps = document.getElementById('recipe-steps').value.trim();
  const costVal = document.getElementById('recipe-cost').value;
  const cost = Number(costVal || 0);

  if (!name || !ingredients || !steps || isNaN(cost)) {
    alert('Please complete all fields (cost must be a number).');
    return;
  }

  const recipes = getRecipes();
  recipes.unshift({
    id: Date.now(),
    name,
    ingredients,
    steps,
    cost: Math.max(0, cost),
    images: imageFiles.slice(),
    rating: 0,
  });

  saveRecipes(recipes);
  document.getElementById('recipe-name').value = '';
  document.getElementById('recipe-ingredients').value = '';
  document.getElementById('recipe-steps').value = '';
  document.getElementById('recipe-cost').value = '';
  recipeImageInput.value = '';
  previewImages.innerHTML = '';
  imageFiles = [];
  renderAll();
}

function deleteRecipe(id) {
  if (!confirm('Delete this recipe?')) return;
  let recipes = getRecipes();
  recipes = recipes.filter((r) => r.id !== id);
  saveRecipes(recipes);
  renderAll();
}

function rateRecipe(id, stars) {
  const recipes = getRecipes();
  const idx = recipes.findIndex((r) => r.id === id);
  if (idx === -1) return;
  recipes[idx].rating = stars;
  saveRecipes(recipes);
  renderAll();
}

// ------------- rendering -------------
function calculateSummary(recipes) {
  const total = recipes.length;
  const sumCost = recipes.reduce((s, r) => s + (Number(r.cost) || 0), 0);
  const avg = total ? recipes.reduce((s, r) => s + (Number(r.rating) || 0), 0) / total : 0;
  return { total, sumCost, avg };
}

function renderSummary(recipes) {
  const { total, sumCost, avg } = calculateSummary(recipes);
  totalRecipesEl.innerText = total;
  totalCostEl.innerText = fmt.format(sumCost);
  avgRatingEl.innerText = avg ? (Math.round(avg * 10) / 10).toFixed(1) : '0.0';
}

function renderRecipes(recipes) {
  recipesContainer.innerHTML = '';
  if (!recipes.length) {
    recipesContainer.innerHTML = '<div class="muted">No recipes yet — add one using the form above.</div>';
    return;
  }

  recipes.forEach((r) => {
    const card = document.createElement('div');
    card.className = 'recipe-card';

    const imgHTML =
      r.images && r.images.length ? `<img src="${r.images[0]}" alt="${escapeHtml(r.name)}">` : '';
    const ingShort = escapeHtml(r.ingredients).replace(/\n/g, '<br>');
    const stepsShort = escapeHtml(r.steps).replace(/\n/g, '<br>');

    let stars = '';
    for (let i = 1; i <= 5; i++) {
      const cls = i <= (r.rating || 0) ? 'fa-star active-star' : 'fa-star';
      stars += `<i class="fa-solid ${cls}" onclick="rateRecipe(${r.id}, ${i})"></i>`;
    }

    card.innerHTML = `
      ${imgHTML}
      <h4>${escapeHtml(r.name)}</h4>
      <p><strong>Ingredients:</strong><br>${ingShort}</p>
      <p><strong>Instructions:</strong><br>${stepsShort}</p>
      <div class="recipe-meta">
        <div class="cost">💰 ${fmt.format(Number(r.cost) || 0)}</div>
        <div class="rating">${stars}</div>
      </div>
      <div class="recipe-actions">
        <button class="btn" onclick="deleteRecipe(${r.id})"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    recipesContainer.appendChild(card);
  });
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;').replaceAll('"', '&quot;');
}

function renderFiltered() {
  const q = (searchInput.value || '').trim().toLowerCase();
  const sort = sortSelect.value;
  let recipes = getRecipes();

  if (q) {
    recipes = recipes.filter((r) => (r.name || '').toLowerCase().includes(q));
  }

  if (sort === 'cost-asc') recipes.sort((a, b) => (a.cost || 0) - (b.cost || 0));
  else if (sort === 'cost-desc') recipes.sort((a, b) => (b.cost || 0) - (a.cost || 0));
  else if (sort === 'rating-desc') recipes.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  else recipes.sort((a, b) => b.id - a.id);

  renderSummary(recipes);
  renderRecipes(recipes);
}

function renderAll() {
  renderFiltered();
}

// initial render
document.addEventListener('DOMContentLoaded', function () {
  const loggedIn = localStorage.getItem('isLoggedIn') === 'true';
  if (loggedIn) {
    showMainUI();
    renderAll();
  } else {
    showLoginUI();
  }
});
