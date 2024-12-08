// Konfigurasi API Gemini
const API_KEY = "AIzaSyBkll4wVmrjQukSWsNIe_WJT7cPmL4LU8k";
const MODEL_URL =
  "https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=" +
  API_KEY;

// Daftar Prompt Khusus untuk Konteks Lokal
const SPECIAL_PROMPTS = {
  introduction: [
    "perkenalan",
    "kenalan",
    "halo",
    "siapa kamu",
    "siapa?",
    "gemini",
    "tentang anda",
    "kenalkan diri",
    "asal usul",
    "mcnine ai",
    "nine",
    "mc",
    "ai",
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
    "gemini",
    "gpt",
    "claude",
    "dibuat",
    "penciptamu",
  ],
};

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

// Elemen DOM
const chatContainer = document.getElementById("chatContainer");
const messageContainer = document.getElementById("messageContainer");
const messageInput = document.getElementById("messageInput");
const sendButton = document.getElementById("sendButton");
const imageInput = document.getElementById("imageInput");
const imageUploadBtn = document.getElementById("imageUploadBtn");
const imagePreview = document.getElementById("imagePreview");
const previewImage = document.getElementById("previewImage");
// Untuk premium
const buyLicenseBtn = document.getElementById("buyLicenseBtn");
const premiumModal = document.getElementById("premiumModal");
const closePremiumModal = document.getElementById("closePremiumModal");
const basicPaketBtn = document.getElementById("basicPaketBtn");
const proPaketBtn = document.getElementById("proPaketBtn");
const konfirmasiModal = document.getElementById("konfirmasiModal");
const batalKonfirmasi = document.getElementById("batalKonfirmasi");
const konfirmasiPembayaran = document.getElementById("konfirmasiPembayaran");
const suksesModal = document.getElementById("suksesModal");
const tutupSuksesModal = document.getElementById("tutupSuksesModal");
const gagalModal = document.getElementById("gagalModal");
const tutupGagalModal = document.getElementById("tutupGagalModal");
const konfirmasiTitle = document.getElementById("konfirmasiTitle");
const konfirmasiPaket = document.getElementById("konfirmasiPaket");
const suksesMessage = document.getElementById("suksesMessage");
const gagalMessage = document.getElementById("gagalMessage");
const aktivasiInput = document.getElementById("aktivasiInput");

// Event listener untuk tombol Buy License
buyLicenseBtn.addEventListener("click", () => {
  console.log("Tombol Dapatkan Premium diklik"); // Untuk debugging
  premiumModal.classList.remove("hidden");
});

// Tutup modal premium
closePremiumModal.addEventListener("click", () => {
  console.log("Tombol Tutup Premium Modal diklik"); // Untuk debugging
  premiumModal.classList.add("hidden");
});

// Tambahkan event listener untuk menutup modal saat mengklik di luar area modal
premiumModal.addEventListener("click", (event) => {
  if (event.target === premiumModal) {
    premiumModal.classList.add("hidden");
  }
});

// Event listener untuk modal pengaturan
document.addEventListener("DOMContentLoaded", () => {
  const settingsButton = document.getElementById("settingsButton");
  const settingsModal = document.getElementById("settingsModal");
  const closeSettingsModalBtn = document.getElementById("closeSettingsModal");

  // Buka Modal Pengaturan
  settingsButton.addEventListener("click", () => {
    settingsModal.classList.remove("hidden");
  });

  // Tutup Modal Pengaturan
  closeSettingsModalBtn.addEventListener("click", () => {
    settingsModal.classList.add("hidden");
  });

  // Tutup modal jika mengklik area di luar modal
  settingsModal.addEventListener("click", (e) => {
    if (e.target === settingsModal) {
      settingsModal.classList.add("hidden");
    }
  });
});

// State Manajemen
let currentImage = null;
let previousContext = null;
let conversationHistory = [];

// Fungsi untuk melanjutkan generasi
async function continueGeneration(previousText) {
  try {
    const payload = {
      contents: [
        {
          parts: [
            {
              text: `Lanjutkan kalimat berikut secara alami dan lengkap. 
                     Pastikan sambungan kalimat smooth dan sesuai konteks: 
                     "${previousText}"`,
            },
          ],
        },
      ],
      generationConfig: {
        temperature: 0.7,
        maxOutputTokens: 1000,
        topP: 0.9,
        topK: 50,
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
    console.error("Error melanjutkan generasi:", error);
    return "Maaf, tidak dapat melanjutkan generasi.";
  }
}

// Fungsi untuk melacak dan mengelola riwayat percakapan
function updateConversationHistory(message, response) {
  conversationHistory.push({
    user: message,
    ai: response,
  });

  // Batasi riwayat percakapan
  if (conversationHistory.length > 10) {
    conversationHistory.shift();
  }
}

// Avatar URLs
const AVATARS = {
  user: "/img/user-dark.png",
  ai: "/img/ai2.gif",
};

// Fungsi Kirim Pesan ke API Gemini
async function sendMessageToAPI(message, imageData = null) {
  // Cek respon khusus terlebih dahulu
  const specialResponse = getSpecialResponse(message);
  if (specialResponse) return specialResponse;

  try {
    // Tambahkan konteks riwayat percakapan
    const contextualMessage =
      conversationHistory.length > 0
        ? `Konteks percakapan sebelumnya:\n${conversationHistory
            .map((entry) => `User: ${entry.user}\nAI: ${entry.ai}`)
            .join("\n")}\n\nPertanyaan terbaru: ${message}`
        : message;

    const payload = {
      contents: [
        {
          parts: [
            { text: contextualMessage },
            ...(imageData
              ? [
                  {
                    inline_data: {
                      mime_type: imageData.mime_type,
                      data: imageData.data,
                    },
                  },
                ]
              : []),
          ],
        },
      ],
      generationConfig: {
        temperature: 0.9,
        maxOutputTokens: 1000, // Naikkan token output
        topP: 0.9,
        topK: 50,
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
    return "Maaf, terjadi kesalahan dalam komunikasi dengan AI. Silakan coba lagi.";
  }
}

// Fungsi untuk membuat code block
function createCodeBlock(code, language = "javascript") {
  const codeBlock = document.createElement("pre");
  codeBlock.className = `code-block language-${language}`;

  const codeElement = document.createElement("code");
  codeElement.textContent = code;

  codeBlock.appendChild(codeElement);
  return codeBlock;
}

// Fungsi Tambah Pesan
function addMessage(
  content,
  type = "user",
  codeContent = null,
  codeLanguage = "javascript"
) {
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
          ? "user-bubble bg-gradient-to-r from-blue-600 to-blue-500 text-white"
          : "ai-bubble bg-gradient-to-r from-purple-700 to-indigo-600 text-white"
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

  // Tambahkan code block jika ada
  if (codeContent) {
    const codeBlockElement = createCodeBlock(codeContent, codeLanguage);
    messageElement
      .querySelector(".ai-bubble, .user-bubble")
      .appendChild(codeBlockElement);
  }

  messageContainer.appendChild(messageElement);
  chatContainer.scrollTop = chatContainer.scrollHeight;

  // Reset gambar setelah ditampilkan
  if (currentImage) {
    currentImage = null;
    imagePreview.classList.add("hidden");
  }
}

// Fungsi Animasi Ketik
function createTypingIndicator() {
  const typingIndicator = document.createElement("div");
  typingIndicator.classList.add(
    "typing-indicator",
    "flex",
    "items-center",
    "space-x-1",
    "p-2",
    "text-gray-400"
  );

  typingIndicator.innerHTML = `
    <div class="dot animate-bounce delay-0"></div>
    <div class="dot animate-bounce delay-100"></div>
    <div class="dot animate-bounce delay-200"></div>
  `;

  return typingIndicator;
}

// UNTUK MEMPERCANTIK RESPON
function formatMarkdownText(text) {
  return text
    .replace(/\*\*(.*?)\*\*/g, (match, content) => {
      return `<strong>${content}</strong>`;
    })
    .replace(/\*(.*?)\*/g, (match, content) => {
      return `<em>${content}</em>`;
    })
    .replace(/~~(.*?)~~/g, (match, content) => {
      return `<del>${content}</del>`;
    });
}

// Fungsi Struktur Respon
function enhancedResponseStructure(text) {
  // Format teks terlebih dahulu
  text = formatMarkdownText(text);

  // Deteksi struktur
  const isList = text.includes("•") || text.includes("-");
  const isMultiParagraph = text.split("\n").length > 2;

  // Struktur untuk list
  if (isList) {
    const sections = text.split(/\n(?=•|\-)/).map((section) => {
      const lines = section.split("\n");
      const title = lines[0];
      const items = lines.slice(1).filter((line) => line.trim() !== "");

      return `
        <div class="mb-3">
          <h3 class="font-bold text-purple-300 mb-2">${title}</h3>
          <div class="ml-4">
            ${items
              .map(
                (item) => `
              <div class="flex items-start mb-1">
                <span class="mr-2 text-purple-400">•</span>
                <span>${item.replace(/^•|-/, "").trim()}</span>
              </div>
            `
              )
              .join("")}
          </div>
        </div>
      `;
    });

    return sections.join("");
  }

  // Struktur untuk paragraf
  if (isMultiParagraph) {
    const paragraphs = text.split("\n\n");
    return paragraphs
      .map(
        (para) => `
      <p class="mb-3">${para.trim()}</p>
    `
      )
      .join("");
  }

  // Teks biasa
  return `<p>${text}</p>`;
}

// FITUR PREMIUM
// Tambahkan di bagian konfigurasi awal
const PREMIUM_KEYS = {
  basic: "MCN-BASIC-2024",
  pro: "MCN-PRO-2024",
};

// Fungsi untuk menyimpan status premium
function savePremiumStatus(paket) {
  const premiumData = {
    paket: paket,
    aktif: true,
    tanggalAktivasi: new Date().toISOString(),
    kadaluarsa:
      paket === "basic"
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
        : new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
  };
  localStorage.setItem("mcnineAiPremium", JSON.stringify(premiumData));
}

// Fungsi untuk memeriksa status premium
function cekStatusPremium() {
  const premiumData = JSON.parse(localStorage.getItem("mcnineAiPremium"));

  console.log("Premium Data:", premiumData); // Tambahkan log ini

  if (!premiumData) return false;

  const today = new Date();
  const kadaluarsa = new Date(premiumData.kadaluarsa);

  const isPremium = premiumData.aktif && today <= kadaluarsa;
  console.log("Is Premium:", isPremium); // Tambahkan log ini

  return isPremium;
}

// Fungsi pembatasan fitur untuk non-premium
function cekBatasanPremium() {
  const isPremium = cekStatusPremium();

  if (!isPremium) {
    // Contoh pembatasan: Batasi jumlah pesan per hari
    const hariIni = new Date().toDateString();
    const pesanHariIni = JSON.parse(
      localStorage.getItem("pesanHariIni") || "{}"
    );

    if (pesanHariIni.tanggal !== hariIni) {
      pesanHariIni.tanggal = hariIni;
      pesanHariIni.jumlah = 0;
    }

    if (pesanHariIni.jumlah >= 5) {
      // Tampilkan modal upgrade premium
      premiumModal.classList.remove("hidden");
      return false;
    }

    pesanHariIni.jumlah++;
    localStorage.setItem("pesanHariIni", JSON.stringify(pesanHariIni));
  }

  return true;
}

document.addEventListener("DOMContentLoaded", () => {
  updatePremiumIndicator(); // Panggil saat halaman dimuat
});

// Modifikasi konfirmasi pembayaran
konfirmasiPembayaran.addEventListener("click", () => {
  const kodeAktivasi = aktivasiInput.value.trim();

  console.log("Kode Aktivasi Dimasukkan:", kodeAktivasi);
  console.log("Paket Dipilih:", selectedPaket);
  console.log("Kode Basic:", PREMIUM_KEYS.basic);
  console.log("Kode Pro:", PREMIUM_KEYS.pro);

  if (
    (selectedPaket === "Basic" && kodeAktivasi === PREMIUM_KEYS.basic) ||
    (selectedPaket === "Pro" && kodeAktivasi === PREMIUM_KEYS.pro)
  ) {
    console.log("Validasi Berhasil");
    savePremiumStatus(selectedPaket.toLowerCase());

    konfirmasiModal.classList.add("hidden");
    suksesMessage.textContent = `Aktivasi ${selectedPaket} berhasil!`;
    suksesModal.classList.remove("hidden");

    updatePremiumIndicator();
  } else {
    console.log("Validasi Gagal");
    konfirmasiModal.classList.add("hidden");
    gagalMessage.textContent = "Kode aktivasi tidak valid";
    gagalModal.classList.remove("hidden");
  }
});

// Tambahkan indikator status premium di UI
function updatePremiumIndicator() {
  const isPremium = cekStatusPremium();
  const premiumIndicator = document.getElementById("premiumIndicator");

  if (isPremium) {
    premiumIndicator.innerHTML = `
      <span class="text-xs text-green-500 font-semibold 
        hover:bg-green-500/10 
        px-2 py-1 
        rounded-full 
        transition-all 
        duration-300 
        cursor-pointer">
        <i class="fas fa-crown mr-1 text-yellow-500"></i>
        Premium
      </span>
    `;
  } else {
    premiumIndicator.innerHTML = `
      <span class="text-xs text-gray-400 
        hover:bg-gray-500/10 
        px-2 py-1 
        rounded-full 
        transition-all 
        duration-300 
        cursor-pointer">
        <i class="fas fa-lock mr-1"></i>
        Upgrade
      </span>
    `;
  }
}

// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", () => {
  updatePremiumIndicator();
});

// handleSendMessage
async function handleSendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;
  // Cek batasan premium sebelum mengirim pesan
  if (!cekBatasanPremium()) {
    if (!cekBatasanPremium()) {
      premiumModal.classList.remove("hidden");
      return;
    }
    addMessage(
      "Anda mencapai batas pesan harian. Silakan upgrade ke Premium.",
      "ai"
    );
    premiumModal.classList.remove("hidden");
    return;
  }

  try {
    // Cek apakah ingin melanjutkan generasi sebelumnya
    if (
      (message.toLowerCase().includes("lanjutkan") ||
        message.toLowerCase().includes("sambung")) &&
      previousContext
    ) {
      // Validasi panjang konteks sebelumnya
      if (previousContext.length < 50) {
        addMessage(
          "Maaf, konteks sebelumnya terlalu pendek untuk dilanjutkan.",
          "ai"
        );
        messageInput.value = "";
        return;
      }

      const continuedResponse = await continueGeneration(previousContext);

      const structuredResponse = enhancedResponseStructure(
        previousContext + " " + continuedResponse
      );

      addMessage(structuredResponse, "ai");

      // Update konteks
      previousContext = previousContext + " " + continuedResponse;

      // Update riwayat percakapan
      updateConversationHistory(message, continuedResponse);

      // Reset input
      messageInput.value = "";

      return;
    }

    // Tambah pesan user
    addMessage(message, "user");
    messageInput.value = "";

    // Buat dan tambahkan indikator ketik
    const typingIndicator = createTypingIndicator();
    messageContainer.appendChild(typingIndicator);
    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Siapkan data gambar jika ada
    const imageData = currentImage
      ? {
          mime_type: currentImage.split(";")[0].split(":")[1],
          data: currentImage.split(",")[1],
        }
      : null;

    // Kirim ke API dengan timeout
    const response = await Promise.race([
      sendMessageToAPI(message, imageData),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Timeout")), 15000)
      ),
    ]);

    // Hapus indikator ketik
    typingIndicator.remove();

    // Simpan konteks untuk referensi lanjutan
    previousContext = response;

    // Update riwayat percakapan
    updateConversationHistory(message, response);

    // Cek apakah respon mengandung kode
    const codeMatch = response.match(/```(\w+)?\n([\s\S]*?)```/);

    if (codeMatch) {
      const language = codeMatch[1] || "javascript";
      const code = codeMatch[2].trim();
      const textWithoutCode = response
        .replace(/```(\w+)?\n([\s\S]*?)```/g, "")
        .trim();

      // Struktur respon dengan kode
      const structuredResponse = enhancedResponseStructure(textWithoutCode);

      // Tambahkan pesan dengan kode
      addMessage(structuredResponse, "ai", code, language);
    } else {
      // Tambahkan pesan dengan struktur
      const structuredResponse = enhancedResponseStructure(response);
      addMessage(structuredResponse, "ai");
    }
  } catch (error) {
    // Hapus indikator ketik
    const typingIndicator = messageContainer.querySelector(".typing-indicator");
    if (typingIndicator) typingIndicator.remove();

    // Tampilkan pesan error yang ramah
    addMessage(
      "Maaf, terjadi kesalahan dalam komunikasi dengan AI. Silakan coba lagi.",
      "ai"
    );
  }
}

// FITUR COPY
function addCopyFeature() {
  // Fungsi untuk membuat tombol salin
  function createCopyButton(messageElement) {
    const copyButton = document.createElement("button");
    copyButton.innerHTML = '<i class="fas fa-copy text-xs"></i>';
    copyButton.classList.add(
      "copy-btn",
      "absolute",
      "top-2",
      "right-2",
      "bg-white/10",
      "hover:bg-white/20",
      "text-white",
      "rounded-full",
      "p-2",
      "transition",
      "opacity-0",
      "group-hover:opacity-100"
    );

    copyButton.addEventListener("click", () => {
      // Ekstrak teks dari elemen pesan
      const textToCopy = messageElement.textContent.trim();

      // Salin ke clipboard
      navigator.clipboard
        .writeText(textToCopy)
        .then(() => {
          // Efek visual saat berhasil disalin
          copyButton.innerHTML = '<i class="fas fa-check text-green-400"></i>';

          // Kembalikan icon semula setelah beberapa detik
          setTimeout(() => {
            copyButton.innerHTML = '<i class="fas fa-copy text-xs"></i>';
          }, 1500);
        })
        .catch((err) => {
          console.error("Gagal menyalin teks:", err);
        });
    });

    return copyButton;
  }

  // Tambahkan tombol salin ke pesan AI
  function enhanceMessages() {
    const aiMessages = document.querySelectorAll(".ai-bubble");

    aiMessages.forEach((messageElement) => {
      // Pastikan belum ada tombol sebelumnya
      if (!messageElement.querySelector(".copy-btn")) {
        // Bungkus pesan dalam container group
        messageElement.classList.add("relative", "group");

        // Buat dan tambahkan tombol salin
        const copyButton = createCopyButton(messageElement);
        messageElement.appendChild(copyButton);
      }
    });
  }

  // Panggil saat pesan baru ditambahkan
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.addedNodes.length) {
        enhanceMessages();
      }
    });
  });

  // Amati perubahan pada container pesan
  observer.observe(messageContainer, {
    childList: true,
    subtree: true,
  });

  // Jalankan pertama kali
  enhanceMessages();
}

// Event Listener Utama
sendButton.addEventListener("click", handleSendMessage);
messageInput.addEventListener("keypress", (e) => {
  if (e.key === "Enter") handleSendMessage();
});

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

// AUTO COMPLETE SUGEST
class SmartAutocomplete {
  constructor() {
    this.suggestions = {
      Biasa: [
        "Jelaskan konsep...",
        "Bantu saya merancang...",
        "Apa pendapatmu tentang...",
      ],
      Tech: [
        "Jelaskan arsitektur AI",
        "Perbedaan machine learning dan deep learning",
        "Trend teknologi 2024",
      ],
      Coding: [
        "Contoh struktur data kompleks",
        "Optimasi algoritma",
        "Design pattern dalam pemrograman",
      ],
      User: [
        "Strategi pengembangan diri",
        "Manajemen waktu efektif",
        "Tips membangun karier",
      ],
    };

    this.currentCategory = "default";
    this.container = null;
    this.suggestionArea = null;
    this.initUI();
  }

  initUI() {
    // Buat container utama
    this.container = document.createElement("div");
    this.container.classList.add(
      "smart-autocomplete",
      "fixed",
      "bottom-20",
      "right-4",
      "z-50",
      "bg-white/10",
      "backdrop-blur-md",
      "rounded-lg",
      "p-2",
      "w-64"
    );

    // Kontainer kategori
    const categoryContainer = document.createElement("div");
    categoryContainer.classList.add("flex", "space-x-1", "mb-2");

    // Buat tab kategori
    const categories = Object.keys(this.suggestions);
    categories.forEach((category) => {
      const tab = document.createElement("button");
      tab.textContent = category;
      tab.classList.add(
        "px-2",
        "py-1",
        "text-xs",
        "rounded",
        "text-white",
        "bg-blue-500/30",
        "hover:bg-blue-500/50"
      );

      tab.addEventListener("click", (e) => {
        // Hapus active dari semua
        categoryContainer
          .querySelectorAll("button")
          .forEach((btn) => btn.classList.remove("bg-blue-500/50"));

        // Tambah active ke yang dipilih
        e.target.classList.add("bg-blue-500/50");
        this.setCategory(category);

        // Cegah hilangnya container
        e.stopPropagation();
      });

      categoryContainer.appendChild(tab);
    });

    // Set default active
    categoryContainer.firstChild.classList.add("bg-blue-500/50");
    this.container.appendChild(categoryContainer);

    // Area suggestions
    this.suggestionArea = document.createElement("div");
    this.suggestionArea.classList.add(
      "grid",
      "grid-cols-2",
      "gap-1",
      "text-xs"
    );
    this.container.appendChild(this.suggestionArea);

    // Cegah hilang saat diklik di dalam area
    this.container.addEventListener("click", (e) => {
      e.stopPropagation();
    });
  }

  setCategory(category) {
    this.currentCategory = category;
    this.renderSuggestions();
  }

  renderSuggestions() {
    const suggestions = this.suggestions[this.currentCategory];
    this.suggestionArea.innerHTML = "";

    suggestions.forEach((suggestion) => {
      const suggestionBtn = document.createElement("button");
      suggestionBtn.textContent = suggestion;
      suggestionBtn.classList.add(
        "bg-blue-500/20",
        "hover:bg-blue-500/40",
        "text-white",
        "rounded",
        "p-1",
        "text-left",
        "text-xs"
      );

      suggestionBtn.addEventListener("click", (e) => {
        // Kirim suggestion ke input
        document.getElementById("messageInput").value = suggestion;

        // Fokus ke input
        document.getElementById("messageInput").focus();

        // Cegah hilangnya container
        e.stopPropagation();
      });

      this.suggestionArea.appendChild(suggestionBtn);
    });
  }

  show() {
    // Hapus dulu jika sudah ada
    if (this.container.parentElement) {
      this.container.remove();
    }

    // Tambahkan ke body
    document.body.appendChild(this.container);
    this.renderSuggestions();
  }

  hide() {
    // Hapus dari body
    if (this.container.parentElement) {
      this.container.remove();
    }
  }
}

// Inisiasi
const smartAutocomplete = new SmartAutocomplete();

// Event listener
document.getElementById("messageInput").addEventListener("focus", () => {
  smartAutocomplete.show();
});

// Tambahkan event listener global untuk kontrol
document.addEventListener("click", (event) => {
  const autocomplete = document.querySelector(".smart-autocomplete");
  const messageInput = document.getElementById("messageInput");

  // Cek apakah klik di luar autocomplete dan input
  if (
    autocomplete &&
    !autocomplete.contains(event.target) &&
    event.target !== messageInput
  ) {
    smartAutocomplete.hide();
  }
});

// Konfigurasi Paket
const PAKET_CONFIG = {
  basic: {
    harga: 50000,
    durasi: "30 Hari",
    maxQuestions: 100,
    fitur: ["Akses Dasar AI", "Terbatas 100 Pertanyaan", "Dukungan Email"],
  },
  pro: {
    harga: 150000,
    durasi: "Selamanya",
    maxQuestions: Infinity,
    fitur: [
      "Akses Penuh AI",
      "Pertanyaan Unlimited",
      "Prioritas Dukungan",
      "Update Fitur Terbaru",
    ],
  },
};

// Fungsi Validasi Kode Lisensi (contoh sederhana)
function validateLicenseKey(key, paket) {
  const validKeys = {
    basic: "MCN-BASIC-2024",
    pro: "MCN-PRO-2024",
  };

  return key === validKeys[paket];
}

// Hitung Tanggal Kadaluarsa
function calculateExpirationDate(paket) {
  const today = new Date();
  if (paket === "basic") {
    today.setDate(today.getDate() + 30);
  } else {
    // Pro selamanya, set jauh di masa depan
    today.setFullYear(today.getFullYear() + 100);
  }
  return today.toISOString();
}

// Fungsi Update Status Lisensi
function updateLicenseStatus() {
  const licenseStatus = document.getElementById("licenseStatus");
  const licenseData = JSON.parse(localStorage.getItem("mcnineAiLicense"));

  if (licenseData) {
    const expirationDate = new Date(licenseData.kadaluarsa);
    const today = new Date();

    if (today <= expirationDate) {
      licenseStatus.innerHTML = `
        <div class="text-green-400">
          <p>Status: Aktif</p>
          <p>Paket: ${licenseData.paket.toUpperCase()}</p>
          <p>Berlaku sampai: ${new Date(
            licenseData.kadaluarsa
          ).toLocaleDateString()}</p>
        </div>
      `;
    } else {
      licenseStatus.innerHTML = `
        <div class="text-red-400">
          <p>Status: Kadaluarsa</p>
          <p>Silakan perpanjang lisensi</p>
        </div>
      `;
    }
  } else {
    licenseStatus.innerHTML = `
      <div class="text-gray-400">
        <p>Belum Ada Lisensi Aktif</p>
      </div>
    `;
  }
}

// Event Listener Saat Halaman Dimuat
document.addEventListener("DOMContentLoaded", () => {
  const aktivasiButton = document.getElementById("aktivasiButton");
  const paketButtons = document.querySelectorAll(".paket-btn");
  let selectedPaket = null;

  // Event Listener Pilih Paket
  paketButtons.forEach((button) => {
    button.addEventListener("click", () => {
      // Hapus seleksi sebelumnya
      paketButtons.forEach((btn) => btn.classList.remove("active"));
      button.classList.add("active");

      // Ambil paket yang dipilih
      selectedPaket = button.dataset.paket;

      // Tampilkan informasi paket
      const paket = PAKET_CONFIG[selectedPaket];
      const paketInfo = document.getElementById("paketInfo");
      paketInfo.innerHTML = `
        <div>
          <h4 class="font-bold text-white mb-2">${selectedPaket.toUpperCase()} Paket</h4>
          <p>Harga: Rp ${paket.harga.toLocaleString()}</p>
          <p>Durasi: ${paket.durasi}</p>
          <ul class="list-disc list-inside mt-2">
            ${paket.fitur.map((fitur) => `<li>${fitur}</li>`).join("")}
          </ul>
        </div>
      `;
    });
  });

  // Event Listener Aktivasi
  aktivasiButton.addEventListener("click", () => {
    const licenseKey = document.getElementById("licenseKey").value;

    if (!selectedPaket) {
      alert("Pilih paket terlebih dahulu");
      return;
    }

    if (!licenseKey) {
      alert("Masukkan kode lisensi");
      return;
    }

    // Validasi kode lisensi
    const isValid = validateLicenseKey(licenseKey, selectedPaket);

    if (isValid) {
      // Simpan informasi lisensi
      localStorage.setItem(
        "mcnineAiLicense",
        JSON.stringify({
          paket: selectedPaket,
          tanggalAktivasi: new Date().toISOString(),
          kadaluarsa: calculateExpirationDate(selectedPaket),
        })
      );

      // Update status lisensi
      updateLicenseStatus();

      alert("Lisensi berhasil diaktifkan!");
    } else {
      alert("Kode lisensi tidak valid");
    }
  });
});

// Untuk premium
let selectedPaket = "";

basicPaketBtn.addEventListener("click", () => {
  selectedPaket = "Basic";
  konfirmasiTitle.textContent = "Konfirmasi Pembayaran Paket Basic";
  konfirmasiPaket.innerHTML = `
    <div class="grid grid-cols-2 gap-6 bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl shadow-lg">
      <div class="col-span-1">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-1xl font-bold text-blue-600">Paket Basic</h3>
          <div class="bg-blue-200 text-blue-800 px-3 py-1 rounded-full text-sm">
            30 Hari Akses
          </div>
        </div>
        
        <div class="space-y-3">
          ${[
            "Durasi Akses: 30 Hari",
            "Maksimal 100 Pertanyaan per Bulan",
            "Akses Dasar ke Semua Fitur AI",
            "Dukungan Pelanggan via Email",
          ]
            .map(
              (fitur) => `
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-3 text-lg"></i>
              <span class="text-blue-800">${fitur}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      
      <div class="col-span-1 flex flex-col justify-between">
        <div class="space-y-3">
          ${["Prioritas Dukungan", "Akses Fitur Eksklusif"]
            .map(
              (fitur) => `
            <div class="flex items-center">
              <i class="fas fa-times-circle text-red-400 mr-3 text-lg"></i>
              <span class="text-gray-500 line-through">${fitur}</span>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div class="bg-blue-500/10 p-3 rounded-lg mt-4">
          <div class="flex justify-between items-center">
            <span class="text-blue-800 font-semibold">Total Harga</span>
            <span class="text-1xl font-bold text-blue-600">Rp 50.000</span>
          </div>
        </div>
      </div>
    </div>
  `;
  premiumModal.classList.add("hidden");
  konfirmasiModal.classList.remove("hidden");
});

// Untuk Paket Pro, gunakan pendekatan serupa
proPaketBtn.addEventListener("click", () => {
  selectedPaket = "Pro";
  konfirmasiTitle.textContent = "Konfirmasi Pembayaran Paket Pro";
  konfirmasiPaket.innerHTML = `
    <div class="grid grid-cols-2 gap-6 bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl shadow-lg relative">
      <div class="absolute top-0 right-0 bg-yellow-400 text-white px-3 py-1 rounded-bl-xl text-xs font-bold">
        BEST VALUE
      </div>
      
      <div class="col-span-1">
        <div class="flex justify-between items-center mb-4">
          <h3 class="text-1xl font-bold text-purple-600">Paket Pro</h3>
          <div class="bg-purple-200 text-purple-800 px-3 py-1 rounded-full text-sm">
            Akses Selamanya
          </div>
        </div>
        
        <div class="space-y-3">
          ${[
            "Akses Selamanya",
            "Pertanyaan Unlimited",
            "Akses Penuh Semua Fitur AI",
            "Prioritas Dukungan Pelanggan",
          ]
            .map(
              (fitur) => `
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-3 text-lg"></i>
              <span class="text-purple-800">${fitur}</span>
            </div>
          `
            )
            .join("")}
        </div>
      </div>
      
      <div class="col-span-1 flex flex-col justify-between">
        <div class="space-y-3">
          ${[
            "Akses Fitur Eksklusif Terbaru",
            "Update Fitur Tanpa Biaya Tambahan",
            "Konsultasi Personal",
          ]
            .map(
              (fitur) => `
            <div class="flex items-center">
              <i class="fas fa-check-circle text-green-500 mr-3 text-lg"></i>
              <span class="text-purple-800">${fitur}</span>
            </div>
          `
            )
            .join("")}
        </div>
        
        <div>
          <div class="bg-purple-500/10 p-3 rounded-lg mt-4">
            <div class="flex justify-between items-center">
              <span class="text-purple-800 font-semibold">Total Harga</span>
              <span class="text-1xl font-bold text-purple-600">Rp 50.000</span>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  `;
  premiumModal.classList.add("hidden");
  konfirmasiModal.classList.remove("hidden");
});

// Batal konfirmasi
batalKonfirmasi.addEventListener("click", () => {
  konfirmasiModal.classList.add("hidden");
});

// Konfirmasi pembayaran
konfirmasiPembayaran.addEventListener("click", () => {
  const kodeAktivasi = aktivasiInput.value.trim();

  // Gunakan kode aktivasi yang valid dari PREMIUM_KEYS
  if (
    (selectedPaket === "Basic" && kodeAktivasi === PREMIUM_KEYS.basic) ||
    (selectedPaket === "Pro" && kodeAktivasi === PREMIUM_KEYS.pro)
  ) {
    // Simpan status premium
    savePremiumStatus(selectedPaket.toLowerCase());

    konfirmasiModal.classList.add("hidden");
    suksesMessage.textContent = `Aktivasi ${selectedPaket} berhasil!`;
    suksesModal.classList.remove("hidden");

    // Perbarui indikator premium
    updatePremiumIndicator();
  } else {
    konfirmasiModal.classList.add("hidden");
    gagalMessage.textContent = "Kode aktivasi tidak valid";
    gagalModal.classList.remove("hidden");
  }
});

// Tutup modal sukses
tutupSuksesModal.addEventListener("click", () => {
  suksesModal.classList.add("hidden");
});

// Tutup modal gagal
tutupGagalModal.addEventListener("click", () => {
  gagalModal.classList.add("hidden");
});

// Tutup modal jika mengklik di luar area modal
[premiumModal, konfirmasiModal, suksesModal, gagalModal].forEach((modal) => {
  modal.addEventListener("click", (event) => {
    if (event.target === modal) {
      modal.classList.add("hidden");
    }
  });
});

document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") {
    // Tutup semua modal
    document.querySelectorAll('[id$="Modal"]').forEach((modal) => {
      modal.classList.add("hidden");
      document.body.classList.remove("modal-open");
    });
  }
});

document
  .getElementById("closeKonfirmasiModal")
  .addEventListener("click", () => {
    konfirmasiModal.classList.add("hidden");
  });

// Panggil fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", addCopyFeature);
// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", loadSavedSettings);
