/**
 * Generates a Dockerfile and docker-compose.yml based on the project's tech stack and environment.
 */
function generateDockerSandbox(techStack, projectType, envVars) {
  let dockerfile = '';
  let dockerCompose = '';

  const stackStr = techStack.join(' ').toLowerCase();
  
  // Basic heuristic for Node.js
  if (stackStr.includes('node') || stackStr.includes('express') || stackStr.includes('react') || stackStr.includes('next') || stackStr.includes('vite')) {
    dockerfile = `FROM node:20-alpine

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm ci || npm install

# Copy source code
COPY . .

# Expose standard ports (Vite, Next.js, Express)
EXPOSE 3000 5173 8080

CMD ["npm", "run", "dev"]`;

    dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "3000:3000"
      - "5173:5173"
      - "8080:8080"
    volumes:
      - .:/app
      - /app/node_modules
    environment:
${envVars.map(env => `      - ${env.name}=${env.defaultValue || 'placeholder'}`).join('\n')}
`;
  } else if (stackStr.includes('python') || stackStr.includes('django') || stackStr.includes('flask')) {
    dockerfile = `FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000 5000

CMD ["python", "app.py"]`;

    dockerCompose = `version: '3.8'

services:
  app:
    build: .
    ports:
      - "8000:8000"
      - "5000:5000"
    volumes:
      - .:/app
    environment:
${envVars.map(env => `      - ${env.name}=${env.defaultValue || 'placeholder'}`).join('\n')}
`;
  } else {
    // Generic fallback
    dockerfile = `FROM ubuntu:22.04

WORKDIR /app
COPY . .

# Add your setup commands here
CMD ["bash"]`;

    dockerCompose = `version: '3.8'

services:
  app:
    build: .
    volumes:
      - .:/app
`;
  }

  // If there are databases detected, add them to docker-compose
  if (stackStr.includes('postgres') || stackStr.includes('pg')) {
    dockerCompose += `
  db:
    image: postgres:15-alpine
    environment:
      POSTGRES_USER: user
      POSTGRES_PASSWORD: password
      POSTGRES_DB: mydb
    ports:
      - "5432:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data

volumes:
  pgdata:
`;
  } else if (stackStr.includes('mongodb') || stackStr.includes('mongoose')) {
    dockerCompose += `
  db:
    image: mongo:6
    ports:
      - "27017:27017"
    volumes:
      - mongodata:/data/db

volumes:
  mongodata:
`;
  } else if (stackStr.includes('redis')) {
    dockerCompose += `
  redis:
    image: redis:alpine
    ports:
      - "6379:6379"
`;
  }

  return {
    dockerfile,
    dockerCompose
  };
}

module.exports = { generateDockerSandbox };
