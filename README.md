# React - Local LLM

A powerful Proof of Concept (PoC) React application bridging modern web UIs—specifically those built in **Google AI Studio**—to your local AI infrastructure. 

While it supports raw **Ollama** connections, this application is optimized for **AnythingLLM**, providing a full Graphical Interface for your local RAG (Retrieval Augmented Generation) pipelines.

<img width="700" height="350" alt="Screenshot 2025-12-05 175930" src="https://github.com/user-attachments/assets/508bcaf4-90eb-48d5-b807-8da6bd59e234" />


## 🚀 Why Local + AnythingLLM?

While cloud APIs like Google Gemini are incredible for general knowledge, they often require uploading files to the cloud to reason about specific data.

**This app solves that by connecting to AnythingLLM running locally on your machine.**

*   **Private RAG (Retrieval Augmented Generation):** Chat with your PDFs, codebases, and internal wikis without your data ever leaving your network. The embeddings and vector database live on your machine.
*   **Custom Context:** Unlike a standard API call, AnythingLLM injects relevant snippets from your documents into the System Prompt dynamically. This gives the LLM "long-term memory" specific to your business or project.
*   **Total Control:** You manage the workspaces, vector database updates, and user permissions directly from this dashboard.

## ✨ Features

*   **API Playground (New):** A dynamic interface to test **every** AnythingLLM SDK method. Create workspaces, update embeddings, and manage users without writing curl commands.
*   **Smart Context:** Query specific workspaces (`mini`, `finance-docs`, `code-repo`) to get answers grounded in your data.
*   **Dual Provider Support**: Toggle between the advanced **AnythingLLM** API and raw **Ollama** inference.
*   **Connection Diagnostics**: Real-time feedback on CORS, Authentication, and API reachability.

---

## 🛠️ Prerequisites

1.  **Node.js** (v18+) installed (if running locally).
2.  **AnythingLLM Desktop** (Recommended) or **Ollama** installed and running.

---

## ⚙️ Server Configuration (Crucial)

For the browser to talk to your local server, you must configure **CORS (Cross-Origin Resource Sharing)** or use the correct API keys.

### 🔵 AnythingLLM Setup (Recommended)

AnythingLLM handles documents and vector storage.

1.  Open AnythingLLM Desktop.
2.  Go to **Settings** > **Developer API**.
3.  Generate a **New API Key**.
4.  **Important:** Note your **Workspace Slug**. This is the lower-case identifier for your workspace (e.g., if your workspace is named "Q1 Finance", the slug is `q1-finance`).

### 🟠 Ollama Setup (Basic Chat)

If you only need raw chat without RAG/Documents, you can use Ollama directly. By default, it blocks browser requests.

**Mac / Linux:**
```bash
OLLAMA_ORIGINS="*" ollama serve
```

**Windows (PowerShell):**
```powershell
$env:OLLAMA_ORIGINS="*"; ollama serve
```

---

## 📦 Installation & Usage

### Method A: Google AI Studio

You can use this code directly within Google AI Studio's code editor features to prototype interfaces for your local models.

1.  Create a new Application in Google AI Studio.
2.  Copy the source files (`App.tsx`, `services/*`, etc.) into the editor.
3.  The preview window will connect to `localhost` on your machine.

### Method B: Local Development

Clone the repo and run it like a standard React Vite app.

```bash
# Install dependencies
npm install

# Start the dev server
npm run dev
```

Open `http://localhost:5173` in your browser.

---

## 🖥️ API Playground Guide

The app includes a dedicated **API Playground** panel when connected to AnythingLLM:

1.  **Get Workspaces**: Fetches a list of all your document collections.
2.  **Send Chat**: Sends a prompt to a specific workspace using the `chat` (history aware) or `query` (single shot) mode.
3.  **Update Embeddings**: Forces AnythingLLM to re-read your documents and update the vector database.
4.  **Admin Functions**: If your API key has admin privileges, you can manage users and system settings.

<img width="1104" height="634" alt="Screenshot 2025-12-05 193005" src="https://github.com/user-attachments/assets/05f7a3fc-7528-468b-b20e-f9fd62651483" />


## 🔧 Troubleshooting

| Error | Cause | Solution |
|-------|-------|----------|
| **Network Error / Failed to Fetch** | CORS blocking or Server Down | Ensure AnythingLLM is running. For Ollama, set `OLLAMA_ORIGINS="*"`. |
| **401 Unauthorized** | Bad API Key | Check your API Key in AnythingLLM settings > Developer API. |
| **Workspace Not Found** | Incorrect Slug | The "Model Name" input must match the **Workspace Slug** (e.g., `my-project`), not the display name. Use the "Get Workspaces" tool to find the correct slug. |

## 📄 License

MIT
