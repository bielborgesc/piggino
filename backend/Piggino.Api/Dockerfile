# Stage 1: Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files first to leverage Docker layer caching for restore.
COPY ["Piggino.sln", "."]
COPY ["Piggino.Api/Piggino.Api.csproj", "Piggino.Api/"]
COPY ["Piggino.ServiceDefaults/Piggino.ServiceDefaults.csproj", "Piggino.ServiceDefaults/"]

# Restore only the API project to skip test/AppHost dependencies.
RUN dotnet restore "Piggino.Api/Piggino.Api.csproj"

# Copy all remaining source files.
COPY . .

# Publish in Release mode, reusing the already-restored packages.
WORKDIR "/src/Piggino.Api"
RUN dotnet publish "Piggino.Api.csproj" -c Release -o /app/publish --no-restore

# Stage 2: Runtime image
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final
RUN apt-get update && apt-get install -y curl && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "Piggino.Api.dll"]
