# Buzzler - AI-Powered Video Clipper

Buzzler is a full-stack application designed to automatically extract short, engaging clips from long-form videos. It leverages AI for transcription and sentiment analysis to identify viral moments, burns subtitles directly into the video clips, and provides downloadable SRT files. This tool is perfect for content creators looking to quickly generate shareable content for social media platforms like TikTok, YouTube Shorts, and Instagram Reels.

## ✨ Features

- **Seamless Video Upload**: Upload video files directly from your computer.
- **Import from URL**: Import videos from any public URL (e.g., YouTube, Vimeo) using `yt-dlp`.
- **AI-Powered Transcription**: Automatically transcribes video audio using AssemblyAI.
- **Intelligent Clip Detection**: Uses an AI model via OpenRouter to analyze the transcript's sentiment and content to identify the most engaging and viral-worthy moments.
- **Automatic Subtitle Burning**: Generates and permanently burns subtitles into the extracted video clips using FFmpeg for maximum accessibility and engagement.
- **SRT File Downloads**: Provides downloadable SRT (SubRip Subtitle) files for the full video transcript.
- **Secure Authentication**: Robust user authentication system with email/password and Google OAuth, managed by Appwrite.
- **Project Dashboard**: A clean, modern dashboard to view and manage all your video projects, their status, and the generated clips.
- **Responsive Design**: Fully responsive interface built with Tailwind CSS and Shadcn UI, ensuring a great experience on any device.

## 🚀 Tech Stack

The project is a monorepo composed of a Next.js frontend and two Appwrite serverless functions for backend processing.

- **Frontend**:
  - **Framework**: [Next.js](https://nextjs.org/) (React) with the App Router
  - **Language**: [TypeScript](https://www.typescriptlang.org/)
  - **Styling**: [Tailwind CSS](https://tailwindcss.com/)
  - **UI Components**: [Shadcn UI](https://ui.shadcn.com/)
  - **State Management**: React Context API (`useAuth`)
  - **Data Fetching**: Custom hooks (`useProjects`, `useVideoUpload`) and SWR

- **Backend & Infrastructure**:
  - **Platform**: [Appwrite](https://appwrite.io/) (self-hosted or cloud)
    - **Authentication**: Appwrite Auth (Email/Password, OAuth)
    - **Database**: Appwrite Databases
    - **File Storage**: Appwrite Storage
    - **Serverless Functions**: Appwrite Functions
  - **API Routes**: Next.js API routes for client-server communication.

- **Serverless Functions**:
  - **`importVideo` (Python)**:
    - Handles video downloading from a URL using `yt-dlp`.
    - Uploads the downloaded video to Appwrite Storage.
    - Creates a new video document in the database.
  - **`VideoProcessor` (Node.js)**:
    - Triggered after transcription is complete.
    - Uses `ffmpeg-static` to extract clips based on AI-identified timestamps.
    - Burns subtitles directly into the video frames.
    - Generates thumbnails for videos and clips.
    - Updates the database with clip information and sets the project status to "completed".

- **External Services**:
  - **Transcription**: [AssemblyAI](https://www.assemblyai.com/)
  - **AI Clip Analysis**: [OpenRouter](https://openrouter.ai/) (using a model like `openrouter/sonoma-dusk-alpha`)

## 📂 Project Structure

```
/
├── app/                # Next.js App Router pages and layouts
│   ├── (main)/         # Main authenticated app routes
│   ├── api/            # API routes (transcription, project updates)
│   └── auth/           # Authentication pages (login, register)
├── components/         # Reusable React components
│   ├── auth/           # Auth-related components
│   ├── projects/       # Components for the projects dashboard
│   └── ui/             # Shadcn UI components
├── contexts/           # React Context providers (e.g., AuthContext)
├── functions/          # Appwrite serverless functions
│   ├── importVideo/    # Python function to import videos from URLs
│   └── VideoProcessor/ # Node.js function for clipping and subtitles
├── hooks/              # Custom React hooks
├── lib/                # Shared libraries, helpers, and Appwrite config
└── types/              # TypeScript type definitions
```

## ⚙️ Getting Started

Follow these steps to get the project running locally.

### Prerequisites

- [Node.js](https://nodejs.org/) (v18 or later)
- [pnpm](https://pnpm.io/) (or npm/yarn)
- [Docker](https://www.docker.com/) (for self-hosting Appwrite)
- An [Appwrite](https://appwrite.io/) project (Cloud or self-hosted)
- API keys for [AssemblyAI](https://www.assemblyai.com/) and [OpenRouter](https://openrouter.ai/).

### 1. Clone the Repository

```bash
git clone https://github.com/your-username/buzzler.git
cd buzzler
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Set Up Appwrite

1.  **Create an Appwrite Project**:
    - Go to your Appwrite console and create a new project.
    - Under **Auth**, add the "Email/Password" and "Google" providers.
    - Under **Database**, create a new database named `buzzler_db` (or similar).
2.  **Create Collections**:
    - Inside your new database, create the following collections with the specified attributes and indexes.
      - `videos`
      - `transcripts`
      - `clips`
3.  **Create Storage Buckets**:
    - Under **Storage**, create the following buckets:
      - `videos` (for original uploaded videos)
      - `clips` (for generated clips)
      - `thumbnails` (for video and clip thumbnails)
      - `transcripts` (for SRT files)
4.  **Deploy Appwrite Functions**:
    - Use the Appwrite CLI or manually create and deploy the functions located in the `/functions` directory.
    - Set the required environment variables for each function in the Appwrite console.

### 4. Configure Environment Variables

Create a `.env.local` file in the root of the project and add the following variables:

```env
# Appwrite - Frontend
NEXT_PUBLIC_APPWRITE_ENDPOINT="https://cloud.appwrite.io/v1"
NEXT_PUBLIC_APPWRITE_PROJECT_ID="<YOUR_PROJECT_ID>"
NEXT_PUBLIC_APPWRITE_DATABASE_ID="<YOUR_DATABASE_ID>"
NEXT_PUBLIC_APPWRITE_BUCKET_ID="<VIDEOS_BUCKET_ID>"
NEXT_PUBLIC_APPWRITE_CLIPS_BUCKET_ID="<CLIPS_BUCKET_ID>"
NEXT_PUBLIC_APPWRITE_THUMBNAILS_BUCKET_ID="<THUMBNAILS_BUCKET_ID>"
NEXT_PUBLIC_APPWRITE_TRANSCRIPT_BUCKET_ID="<TRANSCRIPTS_BUCKET_ID>"
NEXT_PUBLIC_APPWRITE_IMPORT_VIDEO_FUNCTION_ID="<IMPORT_VIDEO_FUNCTION_ID>"

# Appwrite - Backend (for API routes)
APPWRITE_API_KEY="<YOUR_APPWRITE_API_KEY>"

# External Services
ASSEMBLYAI_API_KEY="<YOUR_ASSEMBLYAI_API_KEY>"
OPENROUTER_API_KEY="<YOUR_OPENROUTER_API_KEY>"

# URL for the Next.js API endpoint (used by the import function)
# Example: http://localhost:3000/api/transcribe or your production URL
TRANSCRIBE_API_URL="<YOUR_TRANSCRIBE_API_ENDPOINT>"
```

### 5. Run the Development Server

```bash
pnpm dev
```

The application should now be running at [http://localhost:3000](http://localhost:3000).

## ☁️ Deployment

- **Frontend**: The Next.js application is optimized for deployment on [Vercel](https://vercel.com/).
- **Backend**: The serverless functions are deployed to your Appwrite instance and are triggered by database events or direct API calls. Ensure all environment variables are correctly set in your Vercel and Appwrite project settings.