if (!localStorage.getItem('password')) {
  localStorage.setItem('password', 'recipe123');
}

function login() {
  const username = document.getElementById('username').value;
  const password = document.getElementById('password').value;
  const savedPassword = localStorage.getItem('password');

  if (username === 'admin' && password === savedPassword) {
    document.getElementById('login-page').classList.remove('active');
    document.getElementById('main-page').classList.add('active');
    displayRecipes();
  } else {
    document.getElementById('login-error').innerText = 'Incorrect username or password!';
  }
}

function logout() {
  document.getElementById('login-page').classList.add('active');
  document.getElementById('main-page').classList.remove('active');
}

function toggleResetForm() {
  const form = document.getElementById('reset-form');
  form.classList.toggle('hidden');
  document.getElementById('reset-message').innerText = '';
}

function setNewPassword() {
  const newPass = document.getElementById('new-password').value;
  const confirmPass = document.getElementById('confirm-password').value;
  const message = document.getElementById('reset-message');

  if (!newPass || !confirmPass) {
    message.innerText = 'Please fill out both fields.';
    return;
  }
  if (newPass !== confirmPass) {
    message.innerText = 'Passwords do not match!';
    return;
  }

  localStorage.setItem('password', newPass);
  message.innerText = '✅ Password updated successfully!';
  document.getElementById('new-password').value = '';
  document.getElementById('confirm-password').value = '';
}

const recipeImageInput = document.getElementById('recipe-image');
const previewImages = document.getElementById('preview-images');
let imageFiles = [];

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

function addRecipe() {
  const name = document.getElementById('recipe-name').value;
  const ingredients = document.getElementById('recipe-ingredients').value;
  const steps = document.getElementById('recipe-steps').value;

  if (!name || !ingredients || !steps) {
    alert('Please fill out all fields!');
    return;
  }

  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
  recipes.push({ name, ingredients, steps, images: imageFiles });
  localStorage.setItem('recipes', JSON.stringify(recipes));
  displayRecipes();

  document.getElementById('recipe-name').value = '';
  document.getElementById('recipe-ingredients').value = '';
  document.getElementById('recipe-steps').value = '';
  recipeImageInput.value = '';
  previewImages.innerHTML = '';
  imageFiles = [];
}

function displayRecipes() {
  const container = document.getElementById('recipes-container');
  container.innerHTML = '';
  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');

  recipes.forEach((recipe, index) => {
    const card = document.createElement('div');
    card.classList.add('recipe-card');
    card.innerHTML = `
      <h3>${recipe.name}</h3>
      ${recipe.images.map(img => `<img src="${img}" />`).join('')}
      <p><strong>Ingredients:</strong> ${recipe.ingredients}</p>
      <p><strong>Instructions:</strong> ${recipe.steps}</p>
      <button onclick="deleteRecipe(${index})"><i class="fa-solid fa-trash"></i> Delete</button>
    `;
    container.appendChild(card);
  });
}

function deleteRecipe(index) {
  const recipes = JSON.parse(localStorage.getItem('recipes') || '[]');
  recipes.splice(index, 1);
  localStorage.setItem('recipes', JSON.stringify(recipes));
  displayRecipes();
}
