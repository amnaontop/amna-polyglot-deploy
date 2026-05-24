FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build-stage
WORKDIR /app
COPY src/TaskFlowApi/*.csproj ./src/TaskFlowApi/
RUN dotnet restore ./src/TaskFlowApi/
COPY src/ ./src/
RUN dotnet publish ./src/TaskFlowApi/ -c Release -o /app/published

FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS final-stage
WORKDIR /app
COPY --from=build-stage /app/published .
ENV ASPNETCORE_URLS=http://+:5000
EXPOSE 5000
ENTRYPOINT ["dotnet", "TaskFlowApi.dll"]