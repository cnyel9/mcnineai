import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";

// Konfigurasi Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDgIYJwhRIodOoiv68pP1SJ_XnLW6jg9ag",
  authDomain: "mcnineai.firebaseapp.com",
  projectId: "mcnineai",
  storageBucket: "mcnineai.firebasestorage.app",
  messagingSenderId: "515764668190",
  appId: "1:515764668190:web:4bf5d086935273777f6b0f",
  measurementId: "G-V21T23VWY8",
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Fungsi Login Google
function loginWithGoogle() {
  console.log("Login function called");
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Login successful", result.user);
      // Login berhasil
      updateUserUI(result.user);
      saveUserData(result.user);
      closeSettingsModal();
      showNotification("Login berhasil!");
    })
    .catch((error) => {
      console.error("Detailed Login Error:", error);
      showNotification("Login gagal. Silakan coba lagi.", "error");
    });
}

// Fungsi Logout
function logout() {
  signOut(auth)
    .then(() => {
      // Reset UI
      document.getElementById("notLoggedInView").classList.remove("hidden");
      document.getElementById("loggedInView").classList.add("hidden");

      // Hapus data tersimpan
      localStorage.removeItem("mcnineUser");

      showNotification("Anda berhasil logout");
    })
    .catch((error) => {
      console.error("Logout Error:", error);
      showNotification("Logout gagal", "error");
    });
}

// Update UI Pengguna
function updateUserUI(user) {
  const loggedInView = document.getElementById("loggedInView");
  const notLoggedInView = document.getElementById("notLoggedInView");

  document.getElementById("userProfilePicture").src =
    user.photoURL || "/img/default-avatar.png";
  document.getElementById("userDisplayName").textContent =
    user.displayName || "Pengguna";
  document.getElementById("userEmail").textContent = user.email;

  loggedInView.classList.remove("hidden");
  notLoggedInView.classList.add("hidden");
}

// Simpan Data Pengguna
function saveUserData(user) {
  localStorage.setItem(
    "mcnineUser",
    JSON.stringify({
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
    })
  );
}

// Cek Status Login Saat Halaman Dimuat
function checkLoginStatus() {
  const savedUser = localStorage.getItem("mcnineUser");

  if (savedUser) {
    const user = JSON.parse(savedUser);
    updateUserUI(user);
  }
}

// Fungsi Notifikasi
function showNotification(message, type = "info") {
  const notification = document.createElement("div");
  notification.className = `
      fixed top-4 right-4 z-[1000] 
      ${type === "error" ? "bg-red-500" : "bg-green-500"} 
      text-white px-4 py-2 rounded-lg shadow-lg
    `;
  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.remove();
  }, 3000);
}

// Fungsi Menutup Modal Pengaturan
function closeSettingsModal() {
  const settingsModal = document.getElementById("settingsModal");
  settingsModal.classList.add("hidden");
}

// Event Listeners
document
  .getElementById("loginWithGoogleBtn")
  .addEventListener("click", loginWithGoogle);
document.getElementById("logoutBtn").addEventListener("click", logout);

// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", checkLoginStatus);

// Ekspor auth untuk digunakan di file lain
export { auth, loginWithGoogle, logout };
