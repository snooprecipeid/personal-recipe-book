// === Firebase Configuration ===
const firebaseConfig = {
  apiKey: "AIzaSyBOM-K25yqUIcCyJUUQVNM_Gcv00tdK65g",
  authDomain: "snoop-recipe.firebaseapp.com",
  projectId: "snoop-recipe",
  storageBucket: "snoop-recipe.appspot.com",
  messagingSenderId: "1069983280773",
  appId: "1:1069983280773:web:10822e328d2f3e3c9003ec"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
const storage = firebase.storage();

// === Website Logic ===
document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const mainSection = document.getElementById('mainSection');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const forgotLink = document.getElementById('forgotPassword');
  const saveBtn = document.getElementById('saveRecipeBtn');
  const recipeGrid = document.getElementById('recipeGrid');

  // Set default credentials
  if (!localStorage.getItem('username')) {
    localStorage.setItem('username', 'admin');
    localStorage.setItem('password', 'recipe123');
  }

  // Always start with login
  loginSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');

  // LOGIN
  loginBtn.addEventListener('click', () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    if (user === localStorage.getItem('username') && pass === localStorage.getItem('password')) {
      loginSection.classList.add('hidden');
      mainSection.classList.remove('hidden');
      logoutBtn.classList.remove('hidden');
      loadRecipes();
    } else {
      alert('Incorrect username or password');
    }
  });

  // LOGOUT
  logoutBtn.addEventListener('click', () => {
    mainSection.classList.add('hidden');
    loginSection.classList.remove('hidden');
    logoutBtn.classList.add('hidden');
  });

  // FORGOT PASSWORD
  forgotLink.addEventListener('click', () => {
    const newPass = prompt('Enter your new password:');
    if (newPass) {
      localStorage.setItem('password', newPass);
      alert('Password changed successfully!');
    }
  });

  // SAVE RECIPE TO FIREBASE
  saveBtn.addEventListener('click', async () => {
    const name = document.getElementById('recipeName').value.trim();
    const ingredients = document.getElementById('ingredients').value.trim();
    const instructions = document.getElementById('instructions').value.trim();
    const cost = document.getElementById('cost').value.trim();
    const file = document.getElementById('photo').files[0];

    if (!name || !ingredients || !instructions || !cost) {
      alert('Please fill all fields!');
      return;
    }

    try {
      let imageURL = '';
      if (file) {
        const storageRef = storage.ref(`recipe-images/${Date.now()}-${file.name}`);
        await storageRef.put(file);
        imageURL = await storageRef.getDownloadURL();
      }

      await db.collection('recipes').add({
        name,
        ingredients,
        instructions,
        cost,
        imageURL,
        createdAt: firebase.firestore.FieldValue.serverTimestamp()
      });

      alert('Recipe saved successfully!');
      loadRecipes();
      clearForm();
    } catch (error) {
      console.error('Error saving recipe:', error);
      alert('Failed to save recipe. Check console.');
    }
  });

  // LOAD RECIPES FROM FIREBASE
  async function loadRecipes() {
    recipeGrid.innerHTML = '<p>Loading recipes...</p>';
    const snapshot = await db.collection('recipes').orderBy('createdAt', 'desc').get();

    recipeGrid.innerHTML = '';
    snapshot.forEach(doc => {
      const r = doc.data();
      const card = document.createElement('div');
      card.className = 'recipe-card';
      card.innerHTML = `
        ${r.imageURL ? `<img src="${r.imageURL}" alt="${r.name}">` : ''}
        <h4>${r.name}</h4>
        <p><strong>Ingredients:</strong> ${r.ingredients}</p>
        <p><strong>Instructions:</strong> ${r.instructions}</p>
        <p class="cost"><i class="fas fa-coins"></i> Rp ${r.cost}</p>
      `;
      recipeGrid.appendChild(card);
    });
  }

  function clearForm() {
    document.getElementById('recipeName').value = '';
    document.getElementById('ingredients').value = '';
    document.getElementById('instructions').value = '';
    document.getElementById('cost').value = '';
    document.getElementById('photo').value = '';
  }
});
