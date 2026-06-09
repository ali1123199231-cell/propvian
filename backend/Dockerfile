FROM maven:3.9.6-eclipse-temurin-21 AS build
WORKDIR /app
COPY pom.xml .
RUN mvn dependency:go-offline -B
COPY src ./src
RUN mvn clean package -DskipTests -B

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
RUN apk add --no-cache curl
RUN addgroup -S smartlock && adduser -S smartlock -G smartlock
COPY --from=build /app/target/*.jar app.jar
RUN chown smartlock:smartlock app.jar \
    && mkdir -p /app/uploads /app/logs \
    && chown smartlock:smartlock /app/uploads /app/logs
USER smartlock
EXPOSE 8080
ENTRYPOINT ["java", \
  "-XX:+UseContainerSupport", \
  "-XX:MaxRAMPercentage=75.0", \
  "-Djava.security.egd=file:/dev/./urandom", \
  "-jar", "app.jar"]
