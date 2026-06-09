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

// English Grammar Knowledge Graph Data Structure
const knowledgeGraph = {
  nodes: [
    { id: "grammar_basics", label: "Grammar Basics", type: "topic" },
    { id: "nouns", label: "Nouns", type: "concept" },
    { id: "verbs", label: "Verbs", type: "concept" },
    { id: "tenses", label: "Tenses", type: "concept" },
    { id: "present_tense", label: "Present Tense", type: "subtopic" },
    { id: "past_tense", label: "Past Tense", type: "subtopic" },
    { id: "future_tense", label: "Future Tense", type: "subtopic" },
    { id: "adjective", label: "Adjectives", type: "concept" },
    { id: "adverb", label: "Adverbs", type: "concept" },
    { id: "clause", label: "Clauses", type: "concept" },
    { id: "phrase", label: "Phrases", type: "concept" },
    { id: "syntax", label: "Syntax", type: "topic" }
  ],
  edges: [
    { from: "grammar_basics", to: "nouns", relation: "includes" },
    { from: "grammar_basics", to: "verbs", relation: "includes" },
    { from: "grammar_basics", to: "syntax", relation: "includes" },
    { from: "verbs", to: "tenses", relation: "prerequisite" },
    { from: "tenses", to: "present_tense", relation: "includes" },
    { from: "tenses", to: "past_tense", relation: "includes" },
    { from: "tenses", to: "future_tense", relation: "includes" },
    { from: "nouns", to: "adjective", relation: "related" },
    { from: "verbs", to: "adverb", relation: "related" },
    { from: "grammar_basics", to: "phrase", relation: "includes" },
    { from: "phrase", to: "clause", relation: "prerequisite" },
    { from: "clause", to: "syntax", relation: "prerequisite" }
  ]
};

// English Grammar Question Bank
const questionBank = [
  { id: 1, content: "What is a noun", answer: "A noun is a word that names a person, place, thing, or idea.", concept: "nouns" },
  { id: 2, content: "What is a verb", answer: "A verb expresses action or a state of being.", concept: "verbs" },
  { id: 3, content: "Explain present tense", answer: "Present tense describes actions happening now or habitually.", concept: "present_tense" },
  { id: 4, content: "What is past tense", answer: "Past tense describes actions that have already occurred.", concept: "past_tense" },
  { id: 5, content: "What is future tense", answer: "Future tense describes actions that are expected to happen later.", concept: "future_tense" },
  { id: 6, content: "What is an adjective", answer: "An adjective modifies or describes a noun or pronoun.", concept: "adjective" },
  { id: 7, content: "Define a clause", answer: "A clause is a group of words containing a subject and a predicate.", concept: "clause" },
  { id: 8, content: "What is an adverb", answer: "An adverb modifies a verb, adjective, or another adverb, indicating time, place, manner, or degree.", concept: "adverb" },
  { id: 9, content: "Define a phrase", answer: "A phrase is a group of words that functions as a single unit but lacks a subject-predicate pair.", concept: "phrase" },
  { id: 10, content: "What is grammar basics", answer: "Grammar basics include the fundamental rules governing parts of speech and sentence structure.", concept: "grammar_basics" },
  { id: 11, content: "What is syntax", answer: "Syntax is the arrangement of words and phrases to create well-formed sentences in a language.", concept: "syntax" },
  { id: 12, content: "Explain subject and predicate", answer: "The subject is who or what the sentence is about; the predicate tells something about the subject.", concept: "syntax" },
  { id: 13, content: "What is a pronoun", answer: "A pronoun is a word used in place of a noun, such as he, she, it, or they.", concept: "nouns" },
  { id: 14, content: "What is a preposition", answer: "A preposition shows the relationship of a noun/pronoun to another word, like in, on, at, or under.", concept: "grammar_basics" },
  { id: 15, content: "What is a conjunction", answer: "A conjunction connects words, phrases, or clauses, such as and, but, or, and because.", concept: "grammar_basics" },
  { id: 16, content: "What is an interjection", answer: "An interjection is a word expressing sudden or strong emotion, like Wow! or Ouch!", concept: "grammar_basics" },
  { id: 17, content: "Explain gerunds", answer: "A gerund is a verb form ending in -ing that functions as a noun, such as running in 'Running is fun'.", concept: "verbs" },
  { id: 18, content: "What is an infinitive", answer: "An infinitive is the base form of a verb preceded by 'to', such as 'to read' or 'to play'.", concept: "verbs" },
  { id: 19, content: "What is a participle", answer: "A participle is a verb form used as an adjective (e.g., 'the crying baby') or to form verb tenses.", concept: "verbs" },
  { id: 20, content: "Explain active voice", answer: "In active voice, the subject performs the action (e.g., 'The cat chased the mouse').", concept: "syntax" },
  { id: 21, content: "Explain passive voice", answer: "In passive voice, the subject receives the action (e.g., 'The mouse was chased by the cat').", concept: "syntax" },
  { id: 22, content: "What is a relative clause", answer: "A relative clause starts with a relative pronoun (who, which, that) and describes a noun.", concept: "clause" },
  { id: 23, content: "What is a coordinate clause", answer: "A coordinate clause is one of two or more clauses of equal rank connected by a coordinating conjunction.", concept: "clause" },
  { id: 24, content: "What are subordinating conjunctions", answer: "Subordinating conjunctions introduce dependent clauses and show relationships of time, cause, or condition.", concept: "grammar_basics" },
  { id: 25, content: "What is a direct object", answer: "A direct object is a noun or pronoun that receives the direct action of a transitive verb.", concept: "nouns" },
  { id: 26, content: "What is an indirect object", answer: "An indirect object is the recipient of the direct object, answering 'to whom' or 'for whom'.", concept: "nouns" },
  { id: 27, content: "Explain modal verbs", answer: "Modal verbs (can, could, may, might, must, shall, should, will, would) express necessity or possibility.", concept: "verbs" },
  { id: 28, content: "What is a transitive verb", answer: "A transitive verb is an action verb that requires a direct object to complete its meaning.", concept: "verbs" },
  { id: 29, content: "What is an intransitive verb", answer: "An intransitive verb is an action verb that does not take a direct object.", concept: "verbs" },
  { id: 30, content: "What is morphology", answer: "Morphology is the study of word formation and structure, including roots, prefixes, and suffixes.", concept: "grammar_basics" }
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

    // Resize Cytoscape if switching to the Knowledge Map panel
    if (target === "panel-kg" && cy) {
      cy.resize();
      cy.layout({ name: 'breadthfirst' }).run();
    }
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
    renderMessage("assistant", "Hello! I am your AI Educational Assistant. Ask me academic questions about <strong>English Grammar, Nouns, Verbs, Clauses, or Tenses</strong>, and I will search our concept graph to formulate a response!");
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
      model: "gemma:4b",
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
    const lines = chunk.split("\n");
    for (const line of lines) {
      if (line.trim() !== "") {
        try {
          const parsed = JSON.parse(line);
          if (parsed.response) {
            accumulatedResponse += parsed.response;
            messageElement.innerHTML = `[Offline Ollama (gemma:4b) RAG Response]<br><br>${accumulatedResponse}<span class="chat-pulse">▍</span>`;
          }
        } catch (e) {
          // Incomplete line chunk, ignore
        }
      }
    }
  }
  
  messageElement.innerHTML = `[Offline Ollama (gemma:4b) RAG Response]<br><br>${accumulatedResponse}`;
  return accumulatedResponse;
}

// --- Step 1: Tokenizer ---
function tokenize(text) {
  const stopwords = new Set(['a','an','the','is','are','was','were','what','how','why','does','do','in','of','to','and','or','for']);
  return text.toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 1 && !stopwords.has(w));
}

// --- Step 2: Mark specialized English grammar terms ---
const specializedTerms = new Set([
  'noun','verb','tense','adjective','adverb','pronoun','conjunction',
  'preposition','clause','phrase','grammar','syntax','morphology',
  'predicate','subject','object','gerund','infinitive','participle'
]);

function getLexicalWeight(term) {
  return specializedTerms.has(term) ? 0.6 : 0.4;
}

// --- Step 3: Improved TF-IDF (paper Eq. 8 + Eq. 9) ---
function computeTFIDF(corpus) {
  const N = corpus.length;
  const tfIdfVectors = [];

  corpus.forEach(doc => {
    const tokens = tokenize(doc.content || doc.answer || '');
    const tf = {};
    tokens.forEach(t => tf[t] = (tf[t] || 0) + 1);

    const vector = {};
    Object.keys(tf).forEach(term => {
      const termFreq = tf[term] / tokens.length;
      const docsWithTerm = corpus.filter(d => tokenize(d.content || d.answer || '').includes(term)).length;
      const idf = Math.log(N / (docsWithTerm + 1));

      const omega_i = termFreq * idf;              // traditional TF-IDF
      const omega_p = getLexicalWeight(term);       // lexical weight

      vector[term] = 0.6 * omega_i + 0.4 * omega_p;
    });
    tfIdfVectors.push(vector);
  });
  return tfIdfVectors;
}

// --- Step 4: Cosine similarity (paper Eq. 12) ---
function cosineSimilarity(vecA, vecB) {
  const allTerms = new Set([...Object.keys(vecA), ...Object.keys(vecB)]);
  let dot = 0, magA = 0, magB = 0;
  allTerms.forEach(term => {
    const a = vecA[term] || 0;
    const b = vecB[term] || 0;
    dot += a * b;
    magA += a * a;
    magB += b * b;
  });
  return magA && magB ? dot / (Math.sqrt(magA) * Math.sqrt(magB)) : 0;
}

// --- Step 5: Answer extraction with threshold=10 (paper §3.4) ---
function findSimilarQuestions(userQuery, corpus) {
  const queryTokens = tokenize(userQuery);
  const queryVec = {};
  queryTokens.forEach(t => {
    const omega_p = getLexicalWeight(t);
    queryVec[t] = 0.6 * (1 / queryTokens.length) + 0.4 * omega_p;
  });

  const vectors = computeTFIDF(corpus);
  const scored = corpus.map((qa, i) => ({
    ...qa,
    score: cosineSimilarity(queryVec, vectors[i])
  }))
  .filter(qa => qa.score > 0.1)
  .sort((a, b) => b.score - a.score);

  return scored.length > 10 ? scored.slice(0, 10) : scored;
}

// --- Step 6: Graph traversal ---
function getRelatedConcepts(nodeId, depth = 2) {
  const visited = new Set();
  const result = [];
  function traverse(id, currentDepth) {
    if (currentDepth === 0 || visited.has(id)) return;
    visited.add(id);
    const neighbors = knowledgeGraph.edges
      .filter(e => e.from === id || e.to === id)
      .map(e => e.from === id ? e.to : e.from);
    neighbors.forEach(n => {
      if (!result.includes(n)) result.push(n);
      traverse(n, currentDepth - 1);
    });
  }
  traverse(nodeId, depth);
  return result;
}

// --- Step 7: HMM Question Prediction ---
const HMM = {
  states: ['A','B','C','D'],
  transferMatrix: {
    A: { A:0.16, B:0.19, C:0.06, D:0.59 },
    B: { A:0.17, B:0.17, C:0.04, D:0.62 },
    C: { A:0.06, B:0.08, C:0.21, D:0.65 },
    D: { A:0.08, B:0.21, C:0.12, D:0.59 }
  },
  initialProbs: { A:0.52, B:0.30, C:0.14, D:0.04 }
};

const conceptToStateMap = {
  nouns: 'A', verbs: 'A',
  tenses: 'B', present_tense: 'B', past_tense: 'B', future_tense: 'B',
  adjective: 'C', adverb: 'C', clause: 'C', phrase: 'C',
  grammar_basics: 'D', syntax: 'D'
};

const categoryToConceptMap = {
  A: ['nouns', 'verbs'],
  B: ['tenses', 'present_tense', 'past_tense', 'future_tense'],
  C: ['adjective', 'adverb', 'clause', 'phrase'],
  D: ['grammar_basics', 'syntax']
};

function predictNextCategory(currentCategory) {
  const probs = HMM.transferMatrix[currentCategory];
  if (!probs) return 'A';
  return Object.entries(probs).sort((a,b) => b[1]-a[1])[0][0];
}

function getRecommendedQuestions(currentCategory) {
  const nextCat = predictNextCategory(currentCategory);
  const concepts = categoryToConceptMap[nextCat] || [];
  return questionBank
    .filter(q => concepts.includes(q.concept))
    .slice(0, 5); // top 5 recommendations
}

function updateQuestionRecommendations(lastQuery) {
  const queryTokens = tokenize(lastQuery);
  let detectedConcept = 'nouns';
  
  for (const t of queryTokens) {
    if (conceptToStateMap[t]) {
      detectedConcept = t;
      break;
    }
  }

  const state = conceptToStateMap[detectedConcept] || 'A';
  const recQuestions = getRecommendedQuestions(state);

  const container = document.getElementById("recommended-questions-container");
  if (!container) return;

  if (recQuestions.length === 0) {
    container.innerHTML = `<div style="font-size: 0.85rem; color: var(--text-secondary); font-style: italic;">No recommendations available</div>`;
    return;
  }

  container.innerHTML = recQuestions.map(rec => `
    <div class="glass glass-interactive rec-card" onclick="autoFillQuestion('${rec.content}')">
      ${rec.content} <span class="role-badge" style="font-size: 0.55rem; border-color: rgba(99,102,241,0.2); text-transform:none; margin-left:0.25rem;">HMM Predict</span>
    </div>
  `).join("");
}

// Processing incoming student question
async function processQuestion(question) {
  if (!question.trim()) return;
  
  renderMessage("user", question);
  saveMessageToHistory("user", question);
  chatInput.value = "";
  
  queryCount++;
  const statCount = document.getElementById("stat-queries-count");
  if (statCount) statCount.textContent = queryCount;
  
  const assistantMsgEl = renderMessage("assistant", "<span class='chat-pulse'>Searching question bank...</span>");
  
  try {
    const searchResults = findSimilarQuestions(question, questionBank);
    
    if (searchResults.length > 0) {
      const bestMatch = searchResults[0];
      const confidencePercent = Math.min(Math.round(bestMatch.score * 100), 99);
      let finalText = "";
      
      const confidenceBadge = `<span class="role-badge" style="font-size: 0.65rem; background: var(--accent-glow); color: var(--accent); border-color: var(--accent); margin-left: 0.5rem; text-transform: none;">${confidencePercent}% Match Confidence</span>`;
      
      if (isOllamaOnline) {
        assistantMsgEl.innerHTML = `<span class='chat-pulse'>Connecting to local Ollama server...</span>`;
        const generatedText = await streamOllamaResponse(question, bestMatch.answer, assistantMsgEl);
        finalText = `[Offline Ollama (gemma:4b) RAG Response] ${confidenceBadge}<br><br>${generatedText}<br><br><em>Source Concept: "${bestMatch.concept}"</em>`;
        assistantMsgEl.innerHTML = finalText;
      } else {
        finalText = `[Local NLP Simulation RAG Response] ${confidenceBadge}<br><br>Based on context for *"${bestMatch.concept}"*:<br>${bestMatch.answer}<br><br><em>Matched Topic: ${bestMatch.content}?</em>`;
        assistantMsgEl.innerHTML = finalText;
      }
      
      saveMessageToHistory("assistant", finalText);
      
      // Update sidebar concepts
      if (conceptContainer) {
        conceptContainer.innerHTML = `
          <div class="glass rec-card" style="border-left: 3px solid var(--accent); margin-bottom: 0.5rem;">
            <strong>${bestMatch.concept.toUpperCase()}</strong> (Active concept context loaded)
          </div>
        `;
      }

      updateQuestionRecommendations(question);
    } else {
      const fallbackText = "I could not find matching vectorized resources inside the index. The query has been escalated to your teacher.";
      assistantMsgEl.innerHTML = fallbackText;
      saveMessageToHistory("assistant", fallbackText);
      
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

// Cytoscape initialization logic
let cy = null;
const cyContainer = document.getElementById('kg-canvas');
if (cyContainer) {
  cy = cytoscape({
    container: cyContainer,
    elements: [
      ...knowledgeGraph.nodes.map(n => ({ data: n })),
      ...knowledgeGraph.edges.map(e => ({ data: { source: e.from, target: e.to, label: e.relation } }))
    ],
    style: [
      {
        selector: 'node',
        style: {
          'label': 'data(label)',
          'background-color': '#6366f1',
          'color': '#f9fafb',
          'font-family': 'Outfit, sans-serif',
          'font-size': '12px',
          'text-valign': 'center',
          'text-halign': 'center',
          'width': '110px',
          'height': '42px',
          'shape': 'round-rectangle',
          'border-width': '2px',
          'border-color': '#a5b4fc',
          'padding': '10px'
        }
      },
      {
        selector: 'edge',
        style: {
          'width': 2,
          'line-color': 'rgba(99, 102, 241, 0.3)',
          'target-arrow-color': 'rgba(99, 102, 241, 0.5)',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          'label': 'data(label)',
          'font-size': '10px',
          'color': '#9ca3af',
          'text-background-opacity': 0.8,
          'text-background-color': '#07090e',
          'text-background-padding': '4px',
          'text-background-shape': 'roundrectangle'
        }
      },
      {
        selector: 'node:selected',
        style: {
          'background-color': '#10b981',
          'border-color': '#34d399'
        }
      }
    ],
    layout: { name: 'breadthfirst' }
  });

  // Load related Q&A on tap
  cy.on('tap', 'node', function(evt) {
    const nodeId = evt.target.id();
    const related = getRelatedConcepts(nodeId);
    
    // Auto fill question in chat and load active concept info
    if (chatInput) {
      const nodeLabel = evt.target.data('label');
      chatInput.value = `Explain ${nodeLabel} and its prerequisites`;
      document.querySelectorAll(".nav-item").forEach(item => {
        if(item.getAttribute("data-target") === "panel-chat") {
          item.click();
        }
      });
      chatInput.focus();
    }
  });
}

// Load chat history on script initialization
loadChatHistory();

