# Stage 1: build with the full SDK.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY DelayOracle.Api/ DelayOracle.Api/
RUN dotnet publish DelayOracle.Api -c Release -o /app

# Stage 2: run on the smaller runtime-only image.
FROM mcr.microsoft.com/dotnet/aspnet:10.0
WORKDIR /app
COPY --from=build /app .
# ASP.NET Core listens on port 8080 inside the container by default.
EXPOSE 8080
ENTRYPOINT ["dotnet", "DelayOracle.Api.dll"]
