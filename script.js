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

// handleSendMessage
async function handleSendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

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

// Panggil fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", addCopyFeature);
// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", loadSavedSettings);
