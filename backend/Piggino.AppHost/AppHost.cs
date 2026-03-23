var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("piggino-postgres")
    .WithPgAdmin()
    .AddDatabase("piggino-db");

var apiService = builder.AddProject<Projects.Piggino_Api>("piggino-api")
    .WithReference(postgres)
    .WaitFor(postgres);

builder.AddNpmApp("piggino-frontend", "../../frontend", "dev")
    .WithReference(apiService)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();
