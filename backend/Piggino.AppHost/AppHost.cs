var builder = DistributedApplication.CreateBuilder(args);

var postgres = builder.AddPostgres("piggino-postgres")
    .AddDatabase("piggino-db");

var apiService = builder.AddProject<Projects.Piggino_Api>("piggino-api")
    .WithReference(postgres)
    .WaitFor(postgres)
    .WithEnvironment("OTEL_EXPORTER_OTLP_ENDPOINT", "http://localhost:4317");

builder.AddNpmApp("piggino-frontend", "../../frontend", "dev")
    .WithReference(apiService)
    .WithHttpEndpoint(env: "PORT")
    .WithExternalHttpEndpoints()
    .PublishAsDockerFile();

builder.Build().Run();
