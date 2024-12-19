import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.1/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  updateDoc,
  getDoc,
  increment,
  collection,
  addDoc,
  serverTimestamp,
} from "https://www.gstatic.com/firebasejs/9.22.1/firebase-firestore.js";

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
const db = getFirestore(app);

// Kelas Pelacakan Pengunjung dengan Fitur Lengkap
class WebsiteVisitorTracker {
  constructor() {
    this.statsRef = doc(db, "analytics/websiteTraffic");
  }

  // Inisialisasi dokumen statistik
  async initializeStatsDocument() {
    try {
      const docSnap = await getDoc(this.statsRef);

      if (!docSnap.exists()) {
        console.log("Membuat dokumen statistik baru");
        await setDoc(this.statsRef, {
          totalVisitors: 0,
          uniqueVisitors: 0,
          lastVisitorTimestamp: serverTimestamp(),
          createdAt: serverTimestamp(),
        });
      }
    } catch (error) {
      console.error("Error inisialisasi dokumen:", error);
    }
  }

  // Tambah pengunjung dengan metode robust
  async incrementVisitorCount() {
    try {
      // Pastikan dokumen sudah ada
      await this.initializeStatsDocument();

      console.log("Mencoba menambah pengunjung");
      await updateDoc(this.statsRef, {
        totalVisitors: increment(1),
        lastVisitorTimestamp: serverTimestamp(),
      });

      console.log("Pengunjung berhasil ditambahkan");
    } catch (error) {
      console.error("Error updating visitor count:", error);

      // Coba metode alternatif
      try {
        await setDoc(
          this.statsRef,
          {
            totalVisitors: increment(1),
            lastVisitorTimestamp: serverTimestamp(),
          },
          { merge: true }
        );

        console.log("Pengunjung ditambahkan dengan metode alternatif");
      } catch (altError) {
        console.error("Metode alternatif gagal:", altError);
      }
    }
  }

  // Lacak pengunjung unik
  trackUniqueVisitor() {
    const visitorKey = "mcnine_visitor_id";
    let visitorId = localStorage.getItem(visitorKey);

    if (!visitorId) {
      // Generate unique visitor ID
      visitorId = this.generateUniqueId();
      localStorage.setItem(visitorKey, visitorId);
    }

    return visitorId;
  }

  // Generate unique ID
  generateUniqueId() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(
      /[xy]/g,
      function (c) {
        var r = (Math.random() * 16) | 0,
          v = c == "x" ? r : (r & 0x3) | 0x8;
        return v.toString(16);
      }
    );
  }

  // Dapatkan statistik lengkap
  async getVisitorStats() {
    try {
      const docSnap = await getDoc(this.statsRef);
      if (docSnap.exists()) {
        return docSnap.data();
      }
      return null;
    } catch (error) {
      console.error("Error getting visitor stats:", error);
      return null;
    }
  }

  // Tampilkan statistik di UI
  displayVisitorStats() {
    this.getVisitorStats().then((stats) => {
      const totalVisitorsElement = document.getElementById("totalVisitors");
      if (totalVisitorsElement && stats) {
        totalVisitorsElement.textContent = (
          stats.totalVisitors || 0
        ).toLocaleString();
      }
    });
  }

  // Simpan detail pengunjung
  async saveVisitorDetails() {
    const uniqueVisitorId = this.trackUniqueVisitor();

    const visitorInfo = {
      timestamp: serverTimestamp(),
      visitorId: uniqueVisitorId,
      userAgent: navigator.userAgent,
      platform: navigator.platform,
      language: navigator.language,
      screenResolution: `${window.screen.width}x${window.screen.height}`,
      referrer: document.referrer,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      path: window.location.pathname,
    };

    try {
      const visitorsCollectionRef = collection(db, "websiteVisitors");
      await addDoc(visitorsCollectionRef, visitorInfo);
      console.log("Detail pengunjung berhasil disimpan");
    } catch (error) {
      console.error("Gagal menyimpan detail pengunjung:", error);
    }
  }
}

// Inisialisasi tracker pengunjung
const visitorTracker = new WebsiteVisitorTracker();

// Fungsi Login Google
function loginWithGoogle() {
  console.log("Login function called");
  const provider = new GoogleAuthProvider();

  signInWithPopup(auth, provider)
    .then((result) => {
      console.log("Login successful", result.user);
      updateUserUI(result.user);
      saveUserData(result.user);
      closeSettingsModal();
      showNotification("Login berhasil!");
    })
    .catch((error) => {
      console.error("Detailed Login Error:", {
        code: error.code,
        message: error.message,
        email: error.email,
        credential: error.credential,
      });

      let errorMessage = "Login gagal. Silakan coba lagi.";

      switch (error.code) {
        case "auth/popup-closed-by-user":
          errorMessage = "Login dibatalkan.";
          break;
        case "auth/network-request-failed":
          errorMessage = "Masalah jaringan. Periksa koneksi internet Anda.";
          break;
        case "auth/invalid-credential":
          errorMessage = "Kredensial tidak valid. Coba lagi.";
          break;
      }

      showNotification(errorMessage, "error");
    });
}

// Fungsi Logout
function logout() {
  signOut(auth)
    .then(() => {
      // Reset UI di modal pengaturan
      const notLoggedInView = document.getElementById("notLoggedInView");
      const loggedInView = document.getElementById("loggedInView");

      if (notLoggedInView && loggedInView) {
        notLoggedInView.classList.remove("hidden");
        loggedInView.classList.add("hidden");
      }

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
  try {
    const loggedInView = document.getElementById("loggedInView");
    const notLoggedInView = document.getElementById("notLoggedInView");

    if (!loggedInView || !notLoggedInView) {
      console.warn("Login view elements not found");
      return;
    }

    const profilePicture = document.getElementById("userProfilePicture");
    const displayName = document.getElementById("userDisplayName");
    const userEmail = document.getElementById("userEmail");

    if (profilePicture) {
      profilePicture.src = user.photoURL || "/img/default-avatar.png";
    }

    if (displayName) {
      displayName.textContent = user.displayName || "Pengguna";
    }

    if (userEmail) {
      userEmail.textContent = user.email;
    }

    loggedInView.classList.remove("hidden");
    notLoggedInView.classList.add("hidden");
  } catch (error) {
    console.error("Error updating user UI:", error);
  }
}

// Simpan Data Pengguna
function saveUserData(user) {
  try {
    const userData = {
      uid: user.uid,
      email: user.email,
      displayName: user.displayName,
      photoURL: user.photoURL,
      lastLogin: new Date().toISOString(),
    };

    localStorage.setItem("mcnineUser", JSON.stringify(userData));
    console.log("User data saved:", userData);
  } catch (error) {
    console.error("Error saving user data:", error);
  }
}

// Cek Status Login Saat Halaman Dimuat
function checkLoginStatus() {
  try {
    const savedUser = localStorage.getItem("mcnineUser");

    if (savedUser) {
      const user = JSON.parse(savedUser);
      updateUserUI(user);
    } else {
      // Reset tampilan jika tidak ada user tersimpan
      const loggedInView = document.getElementById("loggedInView");
      const notLoggedInView = document.getElementById("notLoggedInView");

      if (loggedInView && notLoggedInView) {
        loggedInView.classList.add("hidden");
        notLoggedInView.classList.remove("hidden");
      }
    }
  } catch (error) {
    console.error("Error checking login status:", error);
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

// Fungsi Setup Login Buttons
function setupLoginButtons() {
  const loginButtons = document.querySelectorAll("#loginWithGoogleBtn");
  loginButtons.forEach((button) => {
    button.addEventListener("click", loginWithGoogle);
  });
}

// Event Listeners Utama
document.addEventListener("DOMContentLoaded", async () => {
  try {
    // Inisialisasi Tracker Pengunjung
    await visitorTracker.initializeStatsDocument();

    // Tambah Pengunjung
    await visitorTracker.incrementVisitorCount();

    // Simpan Detail Pengunjung
    await visitorTracker.saveVisitorDetails();

    // Tampilkan Statistik Pengunjung
    visitorTracker.displayVisitorStats();

    // Setup Autentikasi
    setupLoginButtons();
    checkLoginStatus();

    // Setup Logout Buttons
    const logoutButtons = document.querySelectorAll("#logoutBtn");
    logoutButtons.forEach((button) => {
      button.addEventListener("click", logout);
    });
  } catch (error) {
    console.error("Error during initialization:", error);
  }
});

// Fungsi Tambahan untuk Akses Statistik
function getWebsiteVisitorStats() {
  return visitorTracker.getVisitorStats();
}

// Ekspor Fungsi yang Diperlukan
export {
  auth,
  loginWithGoogle,
  logout,
  getWebsiteVisitorStats,
  db, // Jika membutuhkan akses database langsung
  visitorTracker, // Jika ingin mengakses metode tracker
};
