# Estágio 1: Build da aplicação
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copia os arquivos de projeto necessários para a restauração.
COPY ["Piggino.sln", "."]
COPY ["Piggino.Api/Piggino.Api.csproj", "Piggino.Api/"]
COPY ["Piggino.ServiceDefaults/Piggino.ServiceDefaults.csproj", "Piggino.ServiceDefaults/"]

# Restaura as dependências APENAS para o projeto da API.
# Isso ignora os projetos de teste ou AppHost definidos na solução.
RUN dotnet restore "Piggino.Api/Piggino.Api.csproj"

# Copia o resto do código-fonte.
COPY . .

# Publica a API. O --no-restore agora funciona porque já restauramos o que era preciso.
WORKDIR "/src/Piggino.Api"
RUN dotnet publish "Piggino.Api.csproj" -c Release -o /app/publish --no-restore

# Estágio 2: Imagem final de runtime
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
RUN mkdir /app/data
ENTRYPOINT ["dotnet", "Piggino.Api.dll"]