# ── 1단계: 빌드 ──────────────────────────────
FROM eclipse-temurin:21-jdk-alpine AS builder
WORKDIR /app

# 의존성만 먼저 캐싱 (소스 변경 시 재다운로드 방지)
COPY gradlew .
COPY gradle gradle
COPY build.gradle .
COPY settings.gradle .
RUN chmod +x gradlew && ./gradlew dependencies --no-daemon -q

COPY src src
RUN ./gradlew bootJar -x test --no-daemon

# ── 2단계: 실행 ──────────────────────────────
FROM eclipse-temurin:21-jre-alpine AS runner
WORKDIR /app

RUN mkdir -p uploads/videos

COPY --from=builder /app/build/libs/*.jar app.jar

VOLUME /app/uploads

EXPOSE 8081
ENTRYPOINT ["java", "-jar", "app.jar"]
