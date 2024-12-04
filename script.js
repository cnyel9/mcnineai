// Konfigurasi API Gemini
const API_KEY = "AIzaSyBkll4wVmrjQukSWsNIe_WJT7cPmL4LU8k";
let CURRENT_MODEL = "gemini-pro"; // Default model

// Daftar Prompt Khusus untuk Konteks Lokal
const SPECIAL_PROMPTS = {
  introduction: [
    "perkenalan",
    "kenalan",
    "halo",
    "siapa kamu",
    "tentang anda",
    "kenalkan diri",
    "asal usul",
  ],
  capabilities: [
    "kemampuan",
    "bisa apa",
    "fitur",
    "dapat melakukan",
    "keahlian",
  ],
  creator: [
    "pembuat",
    "membuat",
    "siapa membuatmu",
    "author",
    "developer",
    "penciptamu",
  ],
};

// Fungsi untuk mengubah model
function changeModel(modelName) {
  switch (modelName) {
    case "standard":
      CURRENT_MODEL = "gemini-pro";
      break;
    case "flash":
      CURRENT_MODEL = "gemini-pro-flash";
      break;
    default:
      CURRENT_MODEL = "gemini-pro";
  }
}

// Fungsi untuk Respon Khusus
function getSpecialResponse(message) {
  const lowercaseMessage = message.toLowerCase().trim();

  if (
    SPECIAL_PROMPTS.introduction.some((keyword) =>
      lowercaseMessage.includes(keyword)
    )
  ) {
    return `Hai! Saya MCNine AI, asisten cerdas. 
      Saya dirancang untuk membantu Anda dengan berbagai tugas dan pertanyaan.`;
  }

  if (
    SPECIAL_PROMPTS.capabilities.some((keyword) =>
      lowercaseMessage.includes(keyword)
    )
  ) {
    return `Kemampuan saya meliputi:
      • Menjawab pertanyaan umum
      • Membantu menulis dan mengedit teks
      • Memberikan saran dan rekomendasi
      • Menjelaskan konsep kompleks
      • Membantu pemecahan masalah
      • Terjemahan antar bahasa`;
  }

  if (
    SPECIAL_PROMPTS.creator.some((keyword) =>
      lowercaseMessage.includes(keyword)
    )
  ) {
    return `Saya dikembangkan oleh Levi Setiadi dengan visi menciptakan 
      AI canggih yang ramah, informatif, dan mudah digunakan.`;
  }

  return null;
}

// Fungsi Kirim Pesan ke API Gemini
async function sendMessageToAPI(message) {
  // Cek respon khusus terlebih dahulu
  const specialResponse = getSpecialResponse(message);
  if (specialResponse) return specialResponse;

  try {
    const MODEL_URL = `https://generativelanguage.googleapis.com/v1beta/models/${CURRENT_MODEL}:generateContent?key=${API_KEY}`;

    const payload = {
      contents: [{ parts: [{ text: message }] }],
      generationConfig: {
        // Perbedaan konfigurasi antar model
        temperature: CURRENT_MODEL === "gemini-pro-flash" ? 0.5 : 0.7,
        maxOutputTokens: CURRENT_MODEL === "gemini-pro-flash" ? 200 : 300,
        topP: CURRENT_MODEL === "gemini-pro-flash" ? 0.8 : 0.9,
        topK: CURRENT_MODEL === "gemini-pro-flash" ? 40 : 50,
      },
    };

    const response = await fetch(MODEL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const data = await response.json();
    return data.candidates[0].content.parts[0].text;
  } catch (error) {
    console.error("Error:", error);
    return `Maaf, terjadi kesalahan dalam komunikasi dengan model ${CURRENT_MODEL}. Silakan coba lagi.`;
  }
}

// Elemen DOM
const chatContainer = document.getElementById("chatContainer");
const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const imageInput = document.getElementById("imageInput");
const imageUploadBtn = document.getElementById("imageUploadBtn");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");

// State Manajemen
let currentImage = null;

// Avatar URLs
const AVATARS = {
  user: "/img/user.png",
  ai: "/img/ai2.gif",
};

// Fungsi Tambah Pesan
function addMessage(content, type = "user") {
  const messageElement = document.createElement("div");

  messageElement.classList.add(
    "flex",
    "items-end",
    "space-x-3",
    type === "user" ? "justify-end" : "justify-start",
    "mb-4"
  );

  messageElement.innerHTML = `
    ${
      type === "ai"
        ? `
          <img 
            src="${AVATARS.ai}" 
            class="w-10 h-10 rounded-full object-cover shadow-md"
          >
        `
        : ""
    }
    
    <div class="
      ${
        type === "user"
          ? "bg-blue-600 text-white order-first"
          : "bg-gradient-to-r from-purple-700 to-indigo-600 text-white"
      }
      p-4 
      rounded-2xl 
      max-w-[80%] 
      shadow-lg 
      transform 
      transition 
      hover:scale-[1.02]
    ">
      ${content}
      ${
        currentImage
          ? `<img src="${currentImage}" class="mt-2 max-h-48 rounded-lg object-cover">`
          : ""
      }
    </div>
    
    ${
      type === "user"
        ? `
          <img 
            src="${AVATARS.user}" 
            class="w-10 h-10 rounded-full object-cover shadow-md"
          >
        `
        : ""
    }
  `;

  messageContainer.appendChild(messageElement);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Reset gambar setelah ditampilkan
  if (currentImage) {
    currentImage = null;
    imagePreview.classList.add("hidden");
  }
}

// Tambahkan event listener untuk pilihan model di modal pengaturan
document.getElementById("modelSelect").addEventListener("change", (e) => {
  const selectedModel = e.target.value;

  // Konfirmasi pergantian model
  const konfirmasi = confirm(
    `Apakah Anda ingin beralih ke model ${selectedModel}?`
  );

  if (konfirmasi) {
    // Ganti model
    changeModel(selectedModel);

    // Reset percakapan
    messageContainer.innerHTML = "";

    // Tampilkan pesan sambutan dengan model baru
    addMessage(
      `Hai! Saya MCNine AI, sekarang menggunakan model ${
        selectedModel === "standard" ? "Standard" : "Flash"
      }. Ada yang bisa saya bantu?`,
      "ai"
    );

    // Simpan pilihan model ke localStorage
    localStorage.setItem("selectedModel", selectedModel);
  } else {
    // Kembalikan pilihan model ke semula jika dibatalkan
    document.getElementById("modelSelect").value =
      CURRENT_MODEL === "gemini-pro" ? "standard" : "flash";
  }
});

// Event Listener Utama
sendButton.addEventListener("click", handleSendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSendMessage();
});

// Handler Kirim Pesan
async function handleSendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  try {
    // Tambah pesan user
    addMessage(message, "user");
    messageInput.value = "";

    // Tampilkan loading
    addMessage("Sedang menulis...", "ai");

    // Kirim ke API dengan timeout
    const response = await Promise.race([
      sendMessageToAPI(message),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000)
      ),
    ]);

    // Hapus pesan loading dan tambah respon
    const loadingMessage = messageContainer.lastElementChild;
    loadingMessage.remove();
    addMessage(response, "ai");
  } catch (error) {
    // Hapus pesan loading
    const loadingMessage = messageContainer.lastElementChild;
    loadingMessage.remove();

    // Tampilkan pesan error yang ramah
    addMessage(
      "Maaf, terjadi kesalahan dalam komunikasi dengan AI. Silakan coba lagi.",
      "ai"
    );
  }
}

// Upload Gambar
imageUploadBtn.addEventListener("click", () => {
  imageInput.click();
});

imageInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (event) => {
      currentImage = event.target.result;
      previewImage.src = currentImage;
      imagePreview.classList.remove("hidden");
    };
    reader.readAsDataURL(file);
  }
});

// Fitur untuk pengaturan
const settingsModal = document.getElementById("settingsModal");
const closeSettingsModalBtn = document.getElementById("closeSettingsModal");

// Buka Modal Pengaturan
document.getElementById("settingsButton").addEventListener("click", () => {
  settingsModal.classList.remove("hidden");
});

// Tutup Modal Pengaturan
closeSettingsModalBtn.addEventListener("click", () => {
  settingsModal.classList.add("hidden");
});

// Load Pengaturan Tersimpan
function loadSavedSettings() {
  // Bahasa
  const savedLanguage = localStorage.getItem("appLanguage") || "indonesia";
  document.getElementById("languageSelect").value = savedLanguage;

  // Model
  const savedModel = localStorage.getItem("selectedModel") || "standard";
  document.getElementById("modelSelect").value = savedModel;
  changeModel(savedModel);
}

// Tambahkan event listener untuk pilihan model di modal pengaturan
document.getElementById("modelSelect").addEventListener("change", (e) => {
  const selectedModel = e.target.value;
  changeModel(selectedModel);

  // Simpan pilihan model ke localStorage
  localStorage.setItem("selectedModel", selectedModel);
});

// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", loadSavedSettings);
