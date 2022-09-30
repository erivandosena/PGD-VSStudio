#See https://aka.ms/containerfastmode to understand how Visual Studio uses this Dockerfile to build your images for faster debugging.

FROM mcr.microsoft.com/dotnet/aspnet:3.1 AS base
WORKDIR /app
EXPOSE 80
EXPOSE 443

FROM mcr.microsoft.com/dotnet/sdk:3.1 AS build
WORKDIR /src
COPY ["Susep.SISRH/Susep.SISRH.csproj", "Susep.SISRH/"]
RUN dotnet restore "Susep.SISRH/Susep.SISRH.csproj"
COPY . .
WORKDIR "/src/Susep.SISRH"
RUN dotnet build "Susep.SISRH.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Susep.SISRH.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Susep.SISRH.dll"]