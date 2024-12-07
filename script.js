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
    const payload = {
      contents: [
        {
          parts: [
            { text: message },
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
        temperature: 0.5,
        maxOutputTokens: 200,
        topP: 0.8,
        topK: 40,
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

// handleSendMessage
async function handleSendMessage() {
  const message = messageInput.value.trim();
  if (!message) return;

  try {
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

    // Cek apakah respon mengandung kode
    const codeMatch = response.match(/```(\w+)?\n([\s\S]*?)```/);

    if (codeMatch) {
      const language = codeMatch[1] || "javascript";
      const code = codeMatch[2].trim();

      // Tambahkan pesan dengan kode
      addMessage(
        response.replace(/```(\w+)?\n([\s\S]*?)```/g, "").trim(),
        "ai",
        code,
        language
      );
    } else {
      // Tambahkan pesan biasa
      addMessage(response, "ai");
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

// Panggil fungsi saat halaman dimuat
document.addEventListener("DOMContentLoaded", addCopyFeature);
// Panggil saat halaman dimuat
document.addEventListener("DOMContentLoaded", loadSavedSettings);
