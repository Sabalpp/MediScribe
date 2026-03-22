# Stage 1: Build React frontend
FROM node:20-slim AS frontend
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY index.html overlay.html vite.config.js eslint.config.js ./
COPY public/ public/
COPY src/ src/
RUN npm run build

# Stage 2: Python backend + built frontend
FROM python:3.11-slim
WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends gcc libpq-dev && \
    rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .
COPY --from=frontend /app/dist ./dist

ENV DJANGO_SECRET_KEY=build-placeholder
ENV DJANGO_DEBUG=False
RUN python manage.py collectstatic --noinput
ENV DJANGO_SECRET_KEY=

EXPOSE 8000

COPY start.sh .
RUN chmod +x start.sh
CMD ["./start.sh"]
