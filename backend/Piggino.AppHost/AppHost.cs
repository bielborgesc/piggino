var builder = DistributedApplication.CreateBuilder(args);

var apiService = builder.AddProject<Projects.Piggino_API>("piggino-api");

builder.AddNpmApp("piggino-frontend", "../../frontend", "dev")
    .WithReference(apiService) 
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();