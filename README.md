# Weavy Workflow Builder Clone

A full-featured workflow automation platform built with Next.js, React Flow, Trigger.dev, and Neon PostgreSQL. Create, execute, and monitor visual workflows for image and video processing with AI capabilities.

## 🎥 Video Walkthrough
[Watch the demo video](https://drive.google.com/file/d/1yhAFFO28iRfYKf4tQ8ymH0be_7xEvM9W/view?usp=drive_link)

## Features

### Core Workflow System
- **Visual Workflow Builder**: Drag-and-drop canvas with React Flow for creating complex workflows
- **6 Node Types**:
  - **Text Node**: Input text content with text output
  - **Image Upload Node**: Upload images with drag-and-drop support
  - **Video Upload Node**: Upload videos with preview player
  - **LLM Node**: Google Gemini AI integration with system prompts and image inputs
  - **Crop Image Node**: Crop images with x%, y%, width%, height% parameters
  - **Extract Frame Node**: Extract specific frames from videos by timestamp
- **Undo/Redo History**: Full support for workflow editing history with undo/redo buttons
- **Save & Load Workflows**: Persist workflows to database and load them later
- **Import/Export**: JSON-based workflow export and import functionality

### Execution & Monitoring
- **Workflow Runs History**: Track all workflow executions with timestamps and status
- **Real-time Execution**: Execute workflows with parallel node processing
- **Trigger.dev Integration**: Background job processing for long-running tasks
- **DAG Validation**: Automatic validation of workflow structure and topological sorting
- **Node Execution Tracking**: Monitor individual node execution with logs and outputs

### Design System
- **Dark Theme**: Modern dark interface inspired by Weavy.ai
- **Pulsating Glow Effect**: Visual feedback for running nodes
- **Responsive Layout**: Three-panel layout with collapsible sidebars
- **Type-Safe**: Full TypeScript support throughout

### Authentication & Storage
- **Clerk Auth**: Optional authentication with Clerk (works in anonymous mode without config)
- **PostgreSQL Database**: Neon PostgreSQL for persistent data storage
- **Prisma ORM**: Type-safe database access with migrations

## Tech Stack

- **Frontend**: React 19, Next.js 16, TypeScript
- **UI & Canvas**: React Flow, Tailwind CSS, shadcn/ui
- **State Management**: Zustand
- **Database**: PostgreSQL (Neon), Prisma ORM
- **Authentication**: Clerk
- **AI/ML**: Google Gemini API, Trigger.dev
- **File Processing**: Transloadit (image cropping, video frame extraction)
- **File Storage**: Vercel Blob or Transloadit

## Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn
- PostgreSQL database (Neon)

### Installation

1. Clone the repository and install dependencies:
```bash
npm install
```

2. Set up environment variables (see [Environment Variables](#environment-variables) section)

3. Run database migrations:
```bash
npx prisma migrate dev
```

4. Start the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Environment Variables

Create a `.env.local` file with the following variables:

### Database (Neon)
```env
DATABASE_URL=postgresql://user:password@host/database
POSTGRES_URL=postgresql://user:password@host/database
```

### Clerk Authentication (Optional - app works without)
```env
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
CLERK_SECRET_KEY=your_clerk_secret_key
CLERK_WEBHOOK_SECRET=your_clerk_webhook_secret
```

### AI & Processing Services
```env
GOOGLE_AI_API_KEY=your_google_ai_api_key
TRIGGER_SECRET_KEY=your_trigger_dev_secret_key
TRANSLOADIT_AUTH_KEY=your_transloadit_auth_key
TRANSLOADIT_AUTH_SECRET=your_transloadit_auth_secret
```

## Project Structure

```
├── app/
│   ├── layout.tsx              # Root layout with Clerk provider
│   ├── page.tsx                # Main workflow editor page
│   ├── globals.css             # Tailwind configuration
│   ├── api/
│   │   ├── workflows/          # Workflow CRUD endpoints
│   │   ├── runs/               # Workflow run status endpoints
│   │   ├── upload/             # File upload handler
│   │   └── webhooks/           # Clerk webhook handler
│   ├── sign-in/                # Clerk sign-in page
│   └── sign-up/                # Clerk sign-up page
├── components/
│   ├── nodes/                  # React Flow node components
│   │   ├── base-node.tsx
│   │   ├── text-node.tsx
│   │   ├── image-upload-node.tsx
│   │   ├── video-upload-node.tsx
│   │   ├── llm-node.tsx
│   │   ├── crop-image-node.tsx
│   │   └── extract-frame-node.tsx
│   ├── layout/                 # Layout components
│   │   ├── top-bar.tsx
│   │   ├── left-sidebar.tsx
│   │   ├── right-sidebar.tsx
│   │   └── workflow-layout.tsx
│   └── workflow/
│       └── workflow-canvas.tsx
├── lib/
│   ├── auth.ts                 # Auth helper functions
│   ├── prisma.ts               # Prisma client singleton
│   ├── db.ts                   # Database utilities
│   ├── workflow-executor.ts    # Workflow execution logic
│   └── validations/            # Zod validation schemas
├── prisma/
│   └── schema.prisma           # Database schema
├── stores/
│   └── workflow-store.ts       # Zustand workflow state
├── trigger/                    # Trigger.dev tasks
│   ├── llm-task.ts
│   ├── crop-image-task.ts
│   ├── extract-frame-task.ts
│   └── workflow-task.ts
├── types/
│   └── workflow.ts             # TypeScript type definitions
├── scripts/
│   └── 001-create-schema.sql   # Database schema SQL
└── middleware.ts               # Next.js middleware for auth
```

## API Endpoints

### Workflows
- `GET /api/workflows` - List all workflows
- `POST /api/workflows` - Create new workflow
- `GET /api/workflows/[id]` - Get workflow details
- `PUT /api/workflows/[id]` - Update workflow
- `DELETE /api/workflows/[id]` - Delete workflow
- `POST /api/workflows/[id]/run` - Execute workflow

### Workflow Runs
- `GET /api/runs/[runId]` - Get run status and results
- `GET /api/runs/[runId]/logs` - Get execution logs

### File Upload
- `POST /api/upload` - Upload images/videos
- Returns: `{ url: string, id: string }`

## Node Types Reference

### Text Node
- **Input**: None
- **Output**: `text` (string)
- **Config**: Textarea for text content

### Image Upload Node
- **Input**: None
- **Output**: `image_url` (string)
- **Config**: Drag-and-drop file upload

### Video Upload Node
- **Input**: None
- **Output**: `video_url` (string)
- **Config**: Drag-and-drop file upload with preview

### LLM Node
- **Input**: 
  - `user_message` (string)
  - `images` (string[], optional)
- **Output**: `result` (string)
- **Config**: 
  - Model selector (Gemini variants)
  - System prompt
  - User message input
  - Image attachment support

### Crop Image Node
- **Input**: 
  - `image_url` (string)
  - `x_percent` (0-100)
  - `y_percent` (0-100)
  - `width_percent` (0-100)
  - `height_percent` (0-100)
- **Output**: `cropped_image_url` (string)

### Extract Frame Node
- **Input**: 
  - `video_url` (string)
  - `timestamp_seconds` (number)
- **Output**: `frame_image_url` (string)

## Workflow Execution

Workflows are executed using a DAG (Directed Acyclic Graph) model:

1. **Validation**: Check workflow structure for cycles and valid connections
2. **Topological Sort**: Order nodes for execution
3. **Parallel Execution**: Execute independent nodes simultaneously via Trigger.dev
4. **Data Flow**: Pass outputs from one node as inputs to connected nodes
5. **Logging**: Track each node execution with timestamps and results

## Database Schema

### Users
- `id` (uuid, primary)
- `clerkId` (string)
- `email` (string)
- `name` (string)
- `createdAt` (timestamp)

### Workflows
- `id` (uuid, primary)
- `userId` (uuid, foreign key)
- `name` (string)
- `description` (text, optional)
- `nodes` (json)
- `edges` (json)
- `createdAt` (timestamp)
- `updatedAt` (timestamp)

### WorkflowRuns
- `id` (uuid, primary)
- `workflowId` (uuid, foreign key)
- `userId` (uuid, foreign key)
- `status` ('running' | 'completed' | 'failed')
- `results` (json)
- `error` (text, optional)
- `startedAt` (timestamp)
- `completedAt` (timestamp, optional)

### NodeExecutions
- `id` (uuid, primary)
- `runId` (uuid, foreign key)
- `nodeId` (string)
- `status` ('pending' | 'running' | 'completed' | 'failed')
- `inputs` (json)
- `outputs` (json)
- `error` (text, optional)
- `startedAt` (timestamp)
- `completedAt` (timestamp, optional)

### FileUploads
- `id` (uuid, primary)
- `userId` (uuid, foreign key)
- `originalName` (string)
- `url` (string)
- `type` ('image' | 'video')
- `size` (integer)
- `uploadedAt` (timestamp)

## Deployment

### Vercel Deployment

1. Push code to GitHub
2. Connect repository to Vercel
3. Set environment variables in Vercel dashboard
4. Deploy

### Manual Deployment

```bash
npm run build
npm start
```

## Development

### Running Tests
```bash
npm run test
```

### Code Generation
```bash
# Regenerate Prisma client after schema changes
npx prisma generate

# Create migration
npx prisma migrate dev --name migration_name
```

### Database Management
```bash
# Access database
npx prisma studio

# Reset database (development only)
npx prisma migrate reset
```

## Troubleshooting

### Missing Clerk Keys
The app works without Clerk authentication in anonymous mode. To enable full auth:
1. Create Clerk account at https://clerk.com
2. Copy publishable and secret keys
3. Add to environment variables
4. Restart dev server

### Database Connection Issues
- Verify `DATABASE_URL` is correct
- Check network access rules in Neon dashboard
- Ensure database exists and migrations ran

### File Upload Failures
- Check Transloadit credentials
- Verify file size limits (images: 10MB, videos: 100MB)
- Check browser console for detailed errors

## License

MIT

## Support

For issues and feature requests, visit the project repository.
