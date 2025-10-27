document.addEventListener('DOMContentLoaded', () => {
  const loginSection = document.getElementById('loginSection');
  const mainSection = document.getElementById('mainSection');
  const loginBtn = document.getElementById('loginBtn');
  const logoutBtn = document.getElementById('logoutBtn');
  const forgotLink = document.getElementById('forgotPassword');

  // Simpan username & password default
  if (!localStorage.getItem('username')) {
    localStorage.setItem('username', 'admin');
    localStorage.setItem('password', 'admin');
  }

  // Tampilkan login di awal
  loginSection.classList.remove('hidden');
  mainSection.classList.add('hidden');
  logoutBtn.classList.add('hidden');

  // LOGIN
  loginBtn.addEventListener('click', () => {
    const user = document.getElementById('username').value.trim();
    const pass = document.getElementById('password').value.trim();

    const savedUser = localStorage.getItem('username');
    const savedPass = localStorage.getItem('password');

    if (user === savedUser && pass === savedPass) {
      loginSection.classList.add('hidden');
      mainSection.classList.remove('hidden');
      logoutBtn.classList.remove('hidden');
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
    if (newPass && newPass.trim() !== '') {
      localStorage.setItem('password', newPass.trim());
      alert('Password has been updated successfully!');
    }
  });
});
