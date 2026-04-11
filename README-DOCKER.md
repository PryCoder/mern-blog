# Docker Setup Instructions

## Prerequisites

- Docker Desktop installed (includes Docker Compose)
- Git

## Quick Start

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd mern-blog
   ```

2. **Create environment file**
   ```bash
   cp .env.example .env
   # Edit .env with your actual values
   ```

3. **Build and start all services**
   ```bash
   docker-compose up --build
   ```

4. **Access the application**
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000
   - MongoDB: localhost:27017

## Docker Commands

### Start services
