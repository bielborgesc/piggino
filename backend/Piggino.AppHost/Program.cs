var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.Piggino_Api>("piggino-api");

builder.AddNpmApp("piggino-frontend", "../../frontend", "dev")
    .PublishAsDockerFile();

builder.Build().Run();
