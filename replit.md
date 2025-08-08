# TeleBot AI Studio

## Overview

TeleBot AI Studio is a full-stack web application for creating and editing Telegram bots with AI assistance. The platform provides an IDE-like interface with a file explorer, code editor with syntax highlighting, and an AI-powered chat assistant. Users can create, edit, and manage Python-based Telegram bot projects with integrated AI code generation and assistance capabilities.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
The frontend is built as a Single Page Application (SPA) using React with TypeScript:

- **Framework**: React 18 with TypeScript for type safety and modern React features
- **Routing**: Wouter for lightweight client-side routing
- **State Management**: TanStack Query (React Query) for server state management and caching
- **UI Components**: Radix UI primitives with shadcn/ui component library for consistent design
- **Styling**: Tailwind CSS with custom dark theme optimized for code editing
- **Code Editor**: Monaco Editor integration for syntax highlighting and code editing features
- **Build Tool**: Vite for fast development and optimized production builds

The application follows a component-based architecture with clear separation between UI components, business logic, and data fetching.

### Backend Architecture
The backend follows a RESTful API design using Node.js and Express:

- **Runtime**: Node.js with TypeScript and ESM modules
- **Framework**: Express.js for HTTP server and API routing
- **Storage**: In-memory storage with file-based persistence for projects and chat messages
- **Development**: Full-stack development server with Vite integration for seamless client-server development

The backend provides APIs for project management, file operations, and chat message persistence with a simple but extensible storage interface.

### Data Storage Solutions
The application uses a hybrid storage approach:

- **Database Schema**: Drizzle ORM with PostgreSQL schema definitions for projects and chat messages
- **Current Implementation**: In-memory storage with default project initialization
- **Schema Design**: Projects contain metadata and file contents as JSON, with separate chat message tracking

The storage layer is designed to be easily replaceable, with a clean interface that can switch from in-memory to database persistence.

### Authentication and Authorization
Currently operates without authentication - designed as a single-user development environment. The architecture supports adding authentication layers in the future without major refactoring.

### Code Editor Integration
- **Monaco Editor**: Full VS Code-like editing experience with syntax highlighting
- **Language Support**: Python syntax highlighting with custom theme matching the application's dark UI
- **File Management**: Multi-file editing with tab-based interface and file tree navigation
- **Real-time Updates**: Immediate file content synchronization between editor and storage

## External Dependencies

### Third-party Services
- **Neon Database**: PostgreSQL database service (configured but not actively used)
- **OpenAI API**: AI code generation and chat assistance through FastAPI proxy service
- **Replit Integration**: Development environment integration with cartographer plugin and error overlay

### Key Libraries and Frameworks
- **Frontend**: React, TypeScript, Vite, Tailwind CSS, Radix UI, TanStack Query
- **Backend**: Express.js, Drizzle ORM, Monaco Editor
- **Development Tools**: ESBuild for production builds, PostCSS for CSS processing
- **UI Components**: Comprehensive shadcn/ui component library with consistent theming

### API Integrations
- **FastAPI Proxy**: Python-based proxy service for OpenAI API integration
- **File Export**: JSZip for project export functionality
- **Real-time Features**: Built-in support for WebSocket connections (configured but not actively used)

The application is designed to be easily deployable across different environments while maintaining development-friendly features like hot reload and error overlays.