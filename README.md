# EduSphère & Interactive Knowledge Graph

An educational workspace interface built on top of Chatbot UI, allowing students and educators to map out concepts, visualize dependencies, extract concepts from documents and chat conversations automatically, and start interactive AI Q&A.

<img src="./public/readme/screenshot.png" alt="EduSphère Concept Canvas" width="600">

## Features

### 🎓 Interactive Concept Visualizer
* **SVG Concept Canvas**: Drag-and-drop concepts (nodes) and draw dependencies or subtopic links (edges) with smooth HSL colors and glow effects.
* **Physics Auto-Layout ("Align Graph")**: Automatically spaces out and aligns concept maps cleanly using customized Hooke's spring stiffness and Coulomb's repulsion physics simulation.
* **Concept Drawer Details**: Inspect subtopics, view mapped document files, and check prerequisite counts from a sliding side-drawer.

### 🧠 AI NLP Auto-Concept Extraction
* **Document Parser**: Select text, markdown, or PDF documents in your workspace. The API parses them, extracts core concept nodes and relationship links, and inserts them directly onto the canvas.
* **Conversational Sync**: Active chat sessions automatically scan the assistant's responses and generate new graph concept nodes in real-time, letting the conversation dynamically shape your educational map.
* **Resilient Fallback Pipeline**: Gracefully routes extraction requests through available cloud APIs (DeepSeek ➡️ OpenAI), falling back to local **Ollama (`gemma2:2b`)** if cloud balances run dry or if local model execution is selected in the UI.

---

## Technical Stack & Database Schema

The feature maps concept nodes and prerequisite links directly to your PostgreSQL database.

* **`graphs`**: Stores individual interactive maps.
* **`graph_nodes`**: Concept details, including canvas positions `(x, y)` for coordinate persistence, size, category colors, and descriptions.
* **`graph_links`**: relational dependency mapping between nodes (`source_node_id` ➡️ `target_node_id`) with custom edge labels.
* **`graph_node_files`**: Mapping junction table linking files uploaded in the workspace directly to specific concepts.

---

## Local Setup & Quickstart

To run EduSphère locally:

### 1. Prerequisite Setup
Make sure you have [Docker](https://docs.docker.com/get-docker/) installed and running on your machine.

### 2. Install Dependencies & Supabase
```bash
# Clone the repository
git clone https://github.com/Akhilesh-0529/edu-Graph.git
cd edu-Graph

# Install node dependencies
npm install

# Start Supabase services locally
supabase start
```

### 3. Apply Migrations & Generate Types
```bash
# Apply database migrations to build graphs, nodes, and links tables
npm run db-migrate
```

### 4. Setup Local Ollama Model
Follow the instructions to install [Ollama](https://github.com/ollama/ollama) locally. Then, pull the `gemma2:2b` model:
```bash
ollama pull gemma2:2b
```

### 5. Launch the Application
```bash
# Populate environment variables
cp .env.local.example .env.local

# Run the next.js development server
npm run chat
```
Open [http://localhost:3000](http://localhost:3000) and login using the local Supabase credentials (default test account: `test@test.com` / `password`).

---

## License & Credits
EduSphère is built on top of the open-source [Chatbot UI](https://github.com/mckaywrigley/chatbot-ui).
