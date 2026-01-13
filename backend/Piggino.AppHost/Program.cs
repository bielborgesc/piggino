var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject("piggino-api", "../Piggino.Api/Piggino.Api.csproj");

builder.AddNpmApp("piggino-frontend", "../../frontend", "dev")
    .PublishAsDockerFile();

builder.Build().Run();
