# AI Chat Application

A fullstack AI chat application built with React, Node.js, MongoDB, OpenAI/Google Gemini API model and Ollama Cloud for AI model inference.

# In-short how to run project:

## Installation

Please use node version >=22.12.0 || ^24.0.0

### 1. Install Backend Dependencies

```bash
cd backend
yarn install
cp .env.example .env
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
yarn install
cp .env.example .env
```

## Configuration

.env.example fully configured

**DISCLAIMER**

This project supports multiple AI providers, including Ollama Cloud, OpenAI, and Google Gemini.

API keys for these services are not included in this repository to prevent security risks and unauthorized usage. Exposing API credentials in a public repository may lead to abuse and may violate provider policies (e.g., OpenAI API key safety guidelines).

To run this project locally, please follow these steps:

Obtain your own API key(s) from the provider(s) you wish to use:
Ollama Cloud
OpenAI
Google Gemini
Create a .env file in the backend directory based on .env.example.
Add your API key(s):

# Ollama Cloud (recommended)

OLLAMA_API_KEY=your_ollama_api_key_here
OLLAMA_API_URL=https://ollama.com
OLLAMA_MODEL=llama3

# OpenAI (optional)

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

# Google Gemini (optional)

GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-1.5-pro
Start the backend and frontend as described below.

Notes:

API keys are handled server-side only and are never exposed to the client.
You only need to configure one provider to run the application.
It is recommended to use a scoped API key with usage limits for testing.
In production, additional safeguards such as rate limiting, logging, and monitoring should be applied.

This approach follows standard security practices for handling sensitive credentials in fullstack applications.

## Tech Stack

### Frontend

- React 18
- Axios for API calls
- CSS3 with gradients and animations
- Responsive design

### Backend

- Node.js with Express
- MongoDB with Mongoose
- Multer for file uploads
- Ollama API integration
- OpenAI/Google Gemini API integration

## Prerequisites

Before running this application, ensure you have:

1. **Node.js** (v20.13.0 or higher) - [Download here](https://nodejs.org/)
2. **Ollama** - [Download here](https://ollama.ai/)

### Install Ollama Model

After installing Ollama, pull a model:

```bash
# Pull the default llama2 model
ollama pull llama2

# Or pull another model like mistral
ollama pull mistral
```

Verify Ollama is running:

```bash
curl http://localhost:11434/api/tags
```

#### Set API Key to Env file (see .env.example)

OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini

GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-1.5-pro

## Installation

### 1. Clone the repository

```bash
cd ai-chat-monofs
```

### 2. Install Backend Dependencies

```bash
cd backend
npm install
```

### 3. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

## Configuration

### Backend Configuration

The backend configuration is in `backend/.env`:

```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/ai-chat
OLLAMA_API_URL=http://localhost:11434
OLLAMA_MODEL=llama2
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4o-mini
GOOGLE_API_KEY=your_google_api_key_here
GEMINI_MODEL=gemini-1.5-pro
```

Update these values if needed:

- Change `OLLAMA_MODEL` to use a different model (e.g., `mistral`, `codellama`)
- Update `MONGODB_URI` if using a different MongoDB connection

### Frontend Configuration

The frontend configuration is in `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5000/api
```

## Running the Application

### 1. MongoDB

I'm using MongoDB's cloud service cluster, store data in database test, collections: chats and files for this App

### 2. Start Ollama

Ollama should be running in the background. If not:

```bash
# Start Ollma
ollama serve
# New Terminal to pull model
ollama pull llama2
ollama pull llama3
# Ollama runs as a service on macOS/Linux
# On macOS, it starts automatically after installation
# You can verify by running:
ollama list
```

### 3. Start Backend Server

```bash
cd backend
npm start

# Or for development with auto-reload:
npm run dev
```

The backend will start on `http://localhost:5000`

### 4. Start Frontend Development Server

In a new terminal:

```bash
cd frontend
npm start
```

The frontend will start on `http://localhost:3000` and automatically open in your browser.

## API Endpoints

### Chat Endpoints

- **POST** `/api/chat/message` - Send a message and get AI response

  ```json
  {
    "sessionId": "session-123",
    "message": "Hello, AI!"
  }
  ```

- **GET** `/api/chat/session/:sessionId` - Get chat history for a session

- **GET** `/api/chat/sessions` - Get all chat sessions

- **DELETE** `/api/chat/session/:sessionId` - Delete a session

- **GET** `/api/chat/status` - Check Ollama connection status

### Upload Endpoints

- **POST** `/api/upload` - Upload a file
  - Form data: `file` and `sessionId`

- **GET** `/api/upload/session/:sessionId` - Get uploaded files for a session

## Usage

1. Open the application in your browser (`http://localhost:3000`)
2. You'll see a status indicator showing if Ollama is connected
3. Type a message in the input field at the bottom
4. Press Enter or click the send button (➤) to send
5. Click the plus (+) button to upload files
6. View your conversation history in the chat area

### Keyboard Shortcuts

- **Enter** - Send message
- **Shift + Enter** - New line in message

## Project Structure

```
ai-chat/
├── backend/
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── models/
│   │   ├── Chat.js              # Chat schema
│   │   └── File.js              # File schema
│   ├── routes/
│   │   ├── chat.js              # Chat endpoints
│   │   └── upload.js            # Upload endpoints
│   ├── services/
│   │   └── ollamaService.js     # Ollama API integration
│   ├── uploads/                 # Uploaded files storage
│   ├── .env                     # Environment variables
│   ├── package.json
│   └── server.js                # Express server
│
├── frontend/
│   ├── public/
│   │   └── index.html
│   ├── src/
│   │   ├── services/
│   │   │   └── api.js           # API service layer
│   │   ├── App.js               # Main component
│   │   ├── App.css              # Styles
│   │   ├── index.js
│   │   └── index.css
│   ├── .env                     # Environment variables
│   └── package.json
│
└── README.md
```

## Troubleshooting

### Ollama Connection Issues

1. Make sure Ollama is installed and running
2. Verify the model is pulled: `ollama list`
3. Check Ollama is accessible: `curl http://localhost:11434/api/tags`
4. Update `OLLAMA_MODEL` in `.env` to match your installed model

### MongoDB Connection Issues

If the backend can't connect to MongoDB:

1. Ensure MongoDB is running: `mongod` or check service status
2. Verify the connection string in `backend/.env`
3. Check MongoDB logs for errors

### Port Already in Use

If port 5000 or 3000 is already in use:

1. Change `PORT` in `backend/.env`
2. Update `REACT_APP_API_URL` in `frontend/.env` accordingly
3. Or kill the process using the port

## Development

### Adding New Ollama Models

1. Pull the model: `ollama pull <model-name>`
2. Update `OLLAMA_MODEL` in `backend/.env`
3. Restart the backend server

### Customizing the UI

- Edit `frontend/src/App.css` for styling changes
- Modify `frontend/src/App.js` for functionality changes
- Adjust colors in the gradient backgrounds and button styles

### Database Schema

The chat messages are stored with this schema:

```javascript
{
  sessionId: String,
  messages: [{
    role: 'user' | 'assistant',
    content: String,
    timestamp: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

## License

MIT

## Support

For issues or questions, please open an issue on the GitHub repository.
