# Self-hosted build: one container serves the React client AND the game server
# from the same address, so phones just open http://<host-ip>/.
# Used by compose.gamenight.yml / game-night.sh. (backend/Dockerfile is the
# upstream Fly.io image and expects a prebuilt jar.)

FROM node:20-bookworm-slim AS frontend
WORKDIR /src/frontend
COPY frontend/package.json frontend/package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY frontend/ ./
# CRA also loads .env.local for production builds; drop the dev env files so the
# client falls back to talking to whichever server served the page.
RUN rm -f .env .env.local .env.dev .env.production .env.production.local \
    && npx react-scripts build

FROM eclipse-temurin:17-jdk AS backend
WORKDIR /src/backend
COPY backend/gradlew backend/build.gradle backend/settings.gradle ./
COPY backend/gradle ./gradle
# Warm the Gradle + dependency cache in its own layer.
RUN ./gradlew --no-daemon dependencies > /dev/null
COPY backend/src ./src
RUN ./gradlew --no-daemon jar -x test

FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=backend /src/backend/build/libs/secret-hitler-online.jar ./secret-hitler-online.jar
COPY --from=frontend /src/frontend/build ./public
ENV PORT=8080 \
    STATIC_DIR=/app/public
EXPOSE 8080
CMD ["java", "-jar", "/app/secret-hitler-online.jar"]
