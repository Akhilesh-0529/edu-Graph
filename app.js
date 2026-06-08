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
const conceptContainer = document.getElementById("kg-concept-relations");

function appendMessage(sender, text) {
  if (!chatHistory) return;
  const msg = document.createElement("div");
  msg.className = `message ${sender}`;
  msg.innerHTML = text;
  chatHistory.appendChild(msg);
  chatHistory.scrollTop = chatHistory.scrollHeight;
}

// Local Ollama generation API fetcher
async function generateOllamaResponse(query, contextText) {
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
      stream: false
    })
  });

  if (!response.ok) throw new Error("Ollama generation failed");
  const data = await response.json();
  return data.response;
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
  appendMessage("user", question);
  chatInput.value = "";
  
  queryCount++;
  const statCount = document.getElementById("stat-queries-count");
  if (statCount) statCount.textContent = queryCount;
  
  // Show loading indicator
  const loading = document.createElement("div");
  loading.className = "message assistant";
  loading.innerHTML = `<span class='chat-pulse'>Thinking... ${isOllamaOnline ? 'Generating response locally via Ollama (gemma)...' : 'Searching FAISS vector database...'}</span>`;
  chatHistory.appendChild(loading);
  chatHistory.scrollTop = chatHistory.scrollHeight;
  
  try {
    const searchResult = runVectorQuery(question);
    
    if (searchResult.score > 0.05) {
      const doc = searchResult.document;
      let answer = "";
      
      if (isOllamaOnline) {
        const generatedText = await generateOllamaResponse(question, doc.content);
        answer = `[Offline Ollama (gemma:2b) RAG Response]<br><br>${generatedText}<br><br><em>Source Context: "${doc.title}"</em>`;
      } else {
        answer = `[Local NLP Simulation RAG Response]<br><br>Based on context from *"${doc.title}"*:<br>${doc.content}<br><br><em>Extracted Concept Tags: ${doc.concepts.join(", ")}</em>`;
      }
      
      chatHistory.removeChild(loading);
      appendMessage("assistant", answer);
      
      // Update sidebar concepts
      if (conceptContainer) {
        conceptContainer.innerHTML = doc.concepts.map(c => `
          <div class="glass rec-card" style="border-left: 3px solid var(--accent); margin-bottom: 0.5rem;">
            <strong>${c}</strong> (Active concept context loaded)
          </div>
        `).join("");
      }
    } else {
      chatHistory.removeChild(loading);
      appendMessage("assistant", "I could not find matching vectorized resources inside the index. The query has been escalated to your teacher.");
    }
  } catch (err) {
    if (chatHistory.contains(loading)) chatHistory.removeChild(loading);
    appendMessage("assistant", "An error occurred connecting to the local Ollama model generation server. Please make sure Ollama is running (`ollama run gemma:2b`).");
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
