// Common Session Enforcement Layer
(function checkSession() {
  const activeRole = localStorage.getItem("active_user_role");
  const currentPath = window.location.pathname;

  // Protect internal files from direct bypass if not logged in
  if (!activeRole && !currentPath.endsWith("login.html")) {
    window.location.href = "login.html";
  }
})();

// Logout session handler
window.logout = function() {
  localStorage.removeItem("active_user_role");
  localStorage.removeItem("active_user_email");
  localStorage.removeItem("edusphere_chat_history"); // Optional: clear session logs on hard logout
  window.location.href = "login.html";
};

// Static Document Corpus for Vector RAG Simulator
const documentCorpus = [
  {
    title: "Intro to Calculus",
    content: "Calculus is the mathematical study of continuous change. It has two major branches: differential calculus (concerning rates of change and slopes of curves) and integral calculus (concerning accumulation of quantities and the areas under curves). Limits and continuity are the foundations of both branches.",
    concepts: ["Math", "Calculus"]
  },
  {
    title: "Understanding Derivatives",
    content: "The derivative of a function represents an infinitesimal rate of change. Geometrically, it is the slope of the tangent line to the graph of the function at a given point. Common rules include the power rule, product rule, and chain rule.",
    concepts: ["Calculus", "Derivatives"]
  },
  {
    title: "Integration and Accumulation",
    content: "Integration is the process of finding the area under a curve. Definite integrals compute accumulating totals over ranges, while indefinite integrals represent antiderivatives. Prerequisite knowledge includes limits and derivatives.",
    concepts: ["Calculus", "Integrals"]
  },
  {
    title: "Physics Mechanics",
    content: "Classical mechanics deals with forces, motion, and energy. Kinematics describes motion without considering its causes, while dynamics describes the effects of forces on moving objects. Calculus is heavily used to model motion over time.",
    concepts: ["Physics"]
  }
];

// Current State
let queryCount = 4;
let isOllamaOnline = false;

// Check Ollama connection on port 11434
async function checkOllamaConnection() {
  try {
    const response = await fetch("http://localhost:11434/api/tags");
    if (response.ok) {
      isOllamaOnline = true;
    }
  } catch (err) {
    isOllamaOnline = false;
  }
}
checkOllamaConnection();

// Navigation Routing Controller (Tab-switching inside pages)
document.querySelectorAll(".nav-item").forEach(item => {
  item.addEventListener("click", () => {
    document.querySelectorAll(".nav-item").forEach(i => i.classList.remove("active"));
    document.querySelectorAll(".view-panel").forEach(p => p.classList.remove("active"));
    
    item.classList.add("active");
    const target = item.getAttribute("data-target");
    const panel = document.getElementById(target);
    if (panel) panel.classList.add("active");
  });
});

// Chat UI Handlers (Only active on student.html)
const chatInput = document.getElementById("chat-input-field");
const chatHistory = document.getElementById("chat-messages-container");
const btnSend = document.getElementById("btn-send-message");
const btnClear = document.getElementById("btn-clear-history");
const conceptContainer = document.getElementById("kg-concept-relations");

// 1. Chat History: load from localStorage on init
function loadChatHistory() {
  if (!chatHistory) return;
  
  // Clear the message container except the default welcome message
  chatHistory.innerHTML = "";
  
  const saved = localStorage.getItem("edusphere_chat_history");
  if (saved) {
    const messages = JSON.parse(saved);
    messages.forEach(msg => {
      renderMessage(msg.sender, msg.text);
    });
  } else {
    // Default initial message if no history exists
    renderMessage("assistant", "Hello! I am your AI Educational Assistant. Ask me academic questions about <strong>Calculus, Derivatives, Integrals, or Physics</strong>, and I will search our ingested textbooks and concept graph to formulate a response!");
  }
}

function saveMessageToHistory(sender, text) {
  const saved = localStorage.getItem("edusphere_chat_history");
  const messages = saved ? JSON.parse(saved) : [];
  messages.push({ sender, text });
  
  // Keep last 30 messages
  if (messages.length > 30) {
    messages.shift();
  }
  localStorage.setItem("edusphere_chat_history", JSON.stringify(messages));
}

function renderMessage(sender, text) {
  if (!chatHistory) return null;
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerHTML = text;
  chatHistory.appendChild(msg);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  return msg;
}

// Clear History Handler
if (btnClear) {
  btnClear.addEventListener("click", () => {
    localStorage.removeItem("edusphere_chat_history");
    loadChatHistory();
  });
}

// 2. Typing Indicator / Streaming Response from local Ollama
async function streamOllamaResponse(query, contextText, messageElement) {
  const prompt = `You are an AI assistant. Answer the student's question based strictly on this context:
Context: ${contextText}
Question: ${query}
Answer concisely:`;

  const response = await fetch("http://localhost:11434/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "gemma:2b",
      prompt: prompt,
      stream: true
    })
  });

  if (!response.ok) throw new Error("Ollama connection failed");

  const reader = response.body.getReader();
  const decoder = new TextDecoder();
  let accumulatedResponse = "";

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    
    const chunk = decoder.decode(value, { stream: true });
    // Ollama streams JSON lines
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.trim() !== "") {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            accumulatedResponse += parsed.response;
            // Update UI dynamically with cursor
            messageElement.innerHTML = `[Offline Ollama (gemma:2b) RAG Response]<br><br>${accumulatedResponse}<span class="chat-pulse">▍</span>`;
          }
        } catch (e) {
          // Incomplete line chunk, ignore and continue
        }
      }
    }
  }
  
  // Strip cursor at the end
  messageElement.innerHTML = `[Offline Ollama (gemma:2b) RAG Response]<br><br>${accumulatedResponse}`;
  return accumulatedResponse;
}

// Cosine similarity word intersections calculator
function mockCosineSimilarity(text1, text2) {
  const words1 = text1.toLowerCase().split(/\W+/);
  const words2 = text2.toLowerCase().split(/\W+/);
  const intersect = words1.filter(w => words2.includes(w));
  return intersect.length / Math.max(words1.length, words2.length, 1);
}

function runVectorQuery(query) {
  let bestMatch = null;
  let highestScore = -1;
  
  documentCorpus.forEach(doc => {
    // Basic weight: Title match holds more relevance
    const score = mockCosineSimilarity(query, doc.content) + mockCosineSimilarity(query, doc.title) * 2;
    if (score > highestScore) {
      highestScore = score;
      bestMatch = doc;
    }
  });

  return { document: bestMatch, score: highestScore };
}

async function processQuestion(question) {
  if (!question.trim()) return;
  
  renderMessage("user", question);
  saveMessageToHistory("user", question);
  chatInput.value = "";
  
  queryCount++;
  const statCount = document.getElementById("stat-queries-count");
  if (statCount) statCount.textContent = queryCount;
  
  // Create an assistant element to load tokens into
  const assistantMsgEl = renderMessage("assistant", "<span class='chat-pulse'>Searching vector database...</span>");
  
  try {
    const searchResult = runVectorQuery(question);
    
    // Normalize mock score to percentage (capped at 99%)
    const confidencePercent = Math.min(Math.round(searchResult.score * 100), 99);
    
    if (searchResult.score > 0.05) {
      const doc = searchResult.document;
      let finalText = "";
      
      // Update with confidence badge status
      const confidenceBadge = `<span class="role-badge" style="font-size: 0.65rem; background: var(--accent-glow); color: var(--accent); border-color: var(--accent); margin-left: 0.5rem; text-transform: none;">${confidencePercent}% Match Confidence</span>`;
      
      if (isOllamaOnline) {
        assistantMsgEl.innerHTML = `<span class='chat-pulse'>Connecting to local Ollama server...</span>`;
        const generatedText = await streamOllamaResponse(question, doc.content, assistantMsgEl);
        finalText = `[Offline Ollama (gemma:2b) RAG Response] ${confidenceBadge}<br><br>${generatedText}<br><br><em>Source Context: "${doc.title}"</em>`;
        assistantMsgEl.innerHTML = finalText;
      } else {
        // Run local simulated NLP RAG fallback with confidence score
        finalText = `[Local NLP Simulation RAG Response] ${confidenceBadge}<br><br>Based on context from *"${doc.title}"*:<br>${doc.content}<br><br><em>Extracted Concept Tags: ${doc.concepts.join(", ")}</em>`;
        assistantMsgEl.innerHTML = finalText;
      }
      
      // Save assistant response to history
      saveMessageToHistory("assistant", finalText);
      
      // Update sidebar concepts
      if (conceptContainer) {
        conceptContainer.innerHTML = doc.concepts.map(c => `
          <div class="glass rec-card" style="border-left: 3px solid var(--accent); margin-bottom: 0.5rem;">
            <strong>${c}</strong> (Active concept context loaded)
          </div>
        `).join("");
      }
    } else {
      const fallbackText = "I could not find matching vectorized resources inside the index. The query has been escalated to your teacher.";
      assistantMsgEl.innerHTML = fallbackText;
      saveMessageToHistory("assistant", fallbackText);
    }
  } catch (err) {
    const errorText = "An error occurred connecting to the local Ollama model generation server. Please make sure Ollama is running (`ollama run gemma:2b`).";
    assistantMsgEl.innerHTML = errorText;
    saveMessageToHistory("assistant", errorText);
  }
}

if (btnSend) {
  btnSend.addEventListener("click", () => processQuestion(chatInput.value));
}
if (chatInput) {
  chatInput.addEventListener("keypress", (e) => {
    if (e.key === "Enter") processQuestion(chatInput.value);
  });
}

// Auto-fill questions helper
window.autoFillQuestion = function(text) {
  if (chatInput) {
    chatInput.value = text;
    chatInput.focus();
  }
};

// SVG Node click handler
window.nodeClick = function(conceptName) {
  if (chatInput) {
    chatInput.value = `Explain ${conceptName} and its prerequisites`;
    document.querySelectorAll(".nav-item").forEach(item => {
      if(item.getAttribute("data-target") === "panel-chat") {
        item.click();
      }
    });
  }
};

// Load chat history on script initialization
loadChatHistory();
