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

// // 1. Reverse Maximum Matching (RMM) Tokenizer (§3.2.1)
// Dictionary-based Chinese/English academic term segmenter
const DICTIONARY = ["calculus", "derivatives", "integrals", "math", "physics", "mechanics", "kinematics", "limits", "continuity", "prerequisite", "accumulation"];
function reverseMaximumMatching(text) {
  let temp = text.toLowerCase().replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"").trim();
  const tokens = [];
  const maxLen = 12; // Maximum word length constraint

  while (temp.length > 0) {
    let matched = false;
    let len = Math.min(temp.length, maxLen);
    
    // Look backward from end of phrase
    for (let i = len; i > 0; i--) {
      const slice = temp.substring(temp.length - i);
      if (DICTIONARY.includes(slice) || i === 1) {
        tokens.unshift(slice);
        temp = temp.substring(0, temp.length - i).trim();
        matched = true;
        break;
      }
    }
    if (!matched) {
      tokens.unshift(temp.charAt(temp.length - 1));
      temp = temp.substring(0, temp.length - 1).trim();
    }
  }
  return tokens.filter(t => t.trim().length > 0);
}

// 2. TF-IDF & Specialized Weight Formula (§3.2)
// Weight calculation: alpha_1 * w + alpha_2 * w_s (alpha_1 = 0.6, alpha_2 = 0.4)
function calculateSpecializedWeight(query, document) {
  const queryTokens = reverseMaximumMatching(query);
  const docTokens = reverseMaximumMatching(document.content + " " + document.title);
  
  if (queryTokens.length === 0) return 0;
  
  let w = 0; // Standard term frequency matching weight
  let w_s = 0; // Specialized topic vocabulary weight
  
  queryTokens.forEach(token => {
    // Term Frequency in document
    const tf = docTokens.filter(t => t === token).length;
    if (tf > 0) {
      w += 1; // Basic count mapping
      if (document.concepts.map(c => c.toLowerCase()).includes(token)) {
        w_s += 2; // Extra relevance weight for matching core concepts
      }
    }
  });

  const alpha_1 = 0.6;
  const alpha_2 = 0.4;
  return (alpha_1 * w) + (alpha_2 * w_s);
}

// 3. Hidden Markov Model (HMM) & Viterbi Predictive Analytics (§4)
// Transition probability state table for core topic pathways: Math -> Calculus -> Derivatives -> Integrals
const HMM = {
  states: ["Math", "Calculus", "Derivatives", "Integrals", "Physics"],
  // Prior initial probabilities (pi)
  pi: { "Math": 0.4, "Calculus": 0.3, "Derivatives": 0.1, "Integrals": 0.1, "Physics": 0.1 },
  // State transitions (A)
  transitions: {
    "Math": { "Math": 0.2, "Calculus": 0.5, "Derivatives": 0.1, "Integrals": 0.1, "Physics": 0.1 },
    "Calculus": { "Math": 0.1, "Calculus": 0.2, "Derivatives": 0.4, "Integrals": 0.2, "Physics": 0.1 },
    "Derivatives": { "Math": 0.1, "Calculus": 0.2, "Derivatives": 0.2, "Integrals": 0.4, "Physics": 0.1 },
    "Integrals": { "Math": 0.1, "Calculus": 0.1, "Derivatives": 0.3, "Integrals": 0.4, "Physics": 0.1 },
    "Physics": { "Math": 0.3, "Calculus": 0.1, "Derivatives": 0.1, "Integrals": 0.1, "Physics": 0.4 }
  },
  // Observation matrix (B) maps current query keywords to states
  observations: {
    "Math": { "query_math": 0.7, "query_calc": 0.1, "query_deriv": 0.1, "query_integ": 0.1 },
    "Calculus": { "query_math": 0.1, "query_calc": 0.6, "query_deriv": 0.2, "query_integ": 0.1 },
    "Derivatives": { "query_math": 0.05, "query_calc": 0.15, "query_deriv": 0.65, "query_integ": 0.15 },
    "Integrals": { "query_math": 0.05, "query_calc": 0.1, "query_deriv": 0.25, "query_integ": 0.6 },
    "Physics": { "query_math": 0.2, "query_calc": 0.1, "query_deriv": 0.1, "query_integ": 0.1 }
  }
};

// Viterbi path predictor to estimate likely next conceptual state
function predictNextConceptViterbi(currentConcept) {
  const state = currentConcept.charAt(0).toUpperCase() + currentConcept.slice(1).toLowerCase();
  if (!HMM.states.includes(state)) return "Calculus"; // Default fallback state

  // Apply maximum probability path transition
  const trans = HMM.transitions[state];
  let nextConcept = "Calculus";
  let maxProb = -1;
  
  Object.keys(trans).forEach(next => {
    if (trans[next] > maxProb) {
      maxProb = trans[next];
      nextConcept = next;
    }
  });
  return nextConcept;
}

// Generate dynamic question recommendations powered by HMM next states
function updateQuestionRecommendations(lastQuery) {
  const tokens = reverseMaximumMatching(lastQuery);
  let detected = "Math";
  
  // Basic concept extractor lookup
  for (const t of tokens) {
    const capitalized = t.charAt(0).toUpperCase() + t.slice(1).toLowerCase();
    if (HMM.states.includes(capitalized)) {
      detected = capitalized;
      break;
    }
  }

  const nextConcept = predictNextConceptViterbi(detected);
  const container = document.getElementById("recommended-questions-container");
  if (!container) return;

  const conceptPrompts = {
    "Math": ["What represents basic math foundations?", "Why is math required for calculus?"],
    "Calculus": ["What is limits and continuity in Calculus?", "Explain Calculus rate of change"],
    "Derivatives": ["How do you compute Derivatives power rule?", "Explain derivatives chain rule"],
    "Integrals": ["What is the definite Integrals limit formula?", "Explain integration area sums"],
    "Physics": ["Explain kinematic laws in Physics", "How does calculus apply to Physics?"]
  };

  const recommendations = conceptPrompts[nextConcept] || conceptPrompts["Calculus"];
  container.innerHTML = recommendations.map(rec => `
    <div class="glass glass-interactive rec-card" onclick="autoFillQuestion('${rec}')">
      ${rec} <span class="role-badge" style="font-size: 0.55rem; border-color: rgba(99,102,241,0.2); text-transform:none; margin-left:0.25rem;">HMM Predict</span>
    </div>
  `).join("");
}

function runVectorQuery(query) {
  let bestMatch = null;
  let highestScore = -1;
  
  documentCorpus.forEach(doc => {
    // Run specialized weighted math matching instead of plain intersection counts
    const score = calculateSpecializedWeight(query, doc);
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
    
    // Scale matching value to display percentage
    const confidencePercent = Math.min(Math.round(searchResult.score * 20), 99);
    
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

      // Update question recommendations using HMM predictions
      updateQuestionRecommendations(question);
    } else {
      const fallbackText = "I could not find matching vectorized resources inside the index. The query has been escalated to your teacher.";
      assistantMsgEl.innerHTML = fallbackText;
      saveMessageToHistory("assistant", fallbackText);
      
      // Persist shared escalated student questions to localStorage
      const savedEscalations = localStorage.getItem("edusphere_escalated_questions");
      const escalationsList = savedEscalations ? JSON.parse(savedEscalations) : [];
      escalationsList.push({ question: question, timestamp: new Date() });
      localStorage.setItem("edusphere_escalated_questions", JSON.stringify(escalationsList));
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
