# EduSphære: Intelligent Educational Q&A Workspace

EduSphære is a production-grade, high-fidelity offline demonstration of an AI-powered educational Question & Answering platform. Designed with a modular architecture, it showcases Retrieval-Augmented Generation (RAG) vector retrieval, interactive Knowledge Graph visualisations, and role-based workspaces (Student, Teacher, Admin) bound by a stateless authentication gate.

---

## 🏗️ Architectural Overview & Design Decisions

### 1. Offline-First Local AI Integration (Ollama)
EduSphære is built to execute locally with **zero external API costs**. 
- **Endpoint**: The system automatically queries `http://localhost:11434/api/generate` to orchestrate prompts on your local machine.
- **Model Target**: Optimised for the lightweight `gemma:2b` model.
- **Resilient Fallback**: If Ollama is not active, the system cleanly falls back to a simulated cosine similarity NLP vector matcher, ensuring the app remains fully testable without any dependencies.

### 2. Retrieval-Augmented Generation (RAG) Flow
```
[User Query] ──► [Cosine Similarity search against Context Corpus] ──► [Match Found?]
                                                                             │
       ┌─────────────────────────────── YES ─────────────────────────────────┘
       ▼
[Inject Context into prompt] ──► [Ollama Generate API / gemma:2b] ──► [Structured UI Render]
```

### 3. Concept Mapping & spaCy Concept Graphs
Using an interactive SVG canvas, the workspace charts prerequisite educational relationships (e.g. `Calculus` as a prerequisite for `Derivatives` & `Integrals`). Clicking on map nodes automatically formats a contextual query in the Chat workspace, providing a seamless discovery journey.

---

## 📂 Core Repository Structure

```
├── login.html     # Auth gate containing session storage setups & role routers.
├── student.html   # Student workspace (interactive chat, concept panels, SVG map).
├── teacher.html   # Teacher dashboard (material parser uploads, escalated query inbox).
├── admin.html     # System monitoring & User revoking tools.
├── app.js         # Unified controller (Session check, Ollama fetcher, RAG vectors).
└── styles.css     # Premium dark-glassmorphic styling tokens.
```

---

## ⚙️ Getting Started & Offline Execution

### Prerequisites
1. Download and run [Ollama](https://ollama.com).
2. Pull the model locally:
   ```bash
   ollama pull gemma:2b
   ```
3. Run the model in your terminal to expose the local server:
   ```bash
   ollama run gemma:2b
   ```

### Running the App
Since the application uses standard web technologies, there are no package manager installs required:
1. Double-click or open [login.html](file:///Users/akhileshyerram/Q&A%20project/login.html) in your browser.
2. Sign in using one of the verified credentials below.

---

## 🔐 Demonstration Credentials

Use the following profiles to test permissions and workspace layouts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Student** | `student@edu.org` | `student123` |
| **Teacher** | `teacher@edu.org` | `teacher123` |
| **Admin** | `admin@edu.org` | `admin123` |

---

## 🛠️ Key Engineer Configurations (Extension & Modifying)

### Modifying the Document Corpus
You can extend the knowledge base inside [app.js](file:///Users/akhileshyerram/Q&A%20project/app.js) by appending objects to `documentCorpus`:
```javascript
const documentCorpus = [
  {
    title: "New Textbook Topic",
    content: "Vector embeddings represent text as dense float arrays...",
    concepts: ["Computer Science", "Embeddings"]
  }
];
```

### Updating the SVG Map Nodes
To add or remove concepts from the curriculum map, edit the `<svg>` node configurations inside [student.html](file:///Users/akhileshyerram/Q&A%20project/student.html):
```html
<g class="node" transform="translate(X, Y)" onclick="nodeClick('YourConcept')">
  <circle r="25"></circle>
  <text dx="-13" dy="4">YourConcept</text>
</g>
```