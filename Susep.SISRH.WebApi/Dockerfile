# Sobre o Dockerfile Multi-stage
###########################################################
# 1. Evita a cria??o manual de imagens intermedi?rias.
# 2. Reduz a complexidade.
# 3. Copia seletivamente artefatos de um est?gio para outro.
# 4. Minimiza o tamanho final da imagem.

# Cr?ditos e Desenvolvimento
###########################################################
# O Sistema PGD (vers?o SUSEP) ? um sistema utilizado para pactua??o e monitoramento dos resultados do Programa de Gest?o (teletrabalho).
# Sistema de Programa de Gest?o (SISPG) - Instru??o Normativa N? 65, de 30 de julho de 2020.
# Secretaria de Avalia??o e Gest?o da Informa??o (SESEP)
# Sistema de Recursos Humanos (SISRH)
# Programa de Gest?o e Desempenho (PGD)
# https://www.gov.br/servidor/pt-br/assuntos/programa-de-gestao

# Sugest?o para Conteineriza??o
###########################################################
# Erivando Sena
# Divis?o de Infraestrutura, Seguran?a da Informa??o e Redes (DISIR)
# Diretoria de Tecnologia da Informa??o (DTI)
# Universidade da Integra??o Internacional da Lusofonia Afro-Brasileira (UNILAB)
# https://unilab.edu.br

#Consulte https://aka.ms/containerfastmode para entender como o Visual Studio usa esse Dockerfile para criar suas imagens para uma depura??o mais r?pida.

# ==== Stage 1 ====
FROM mcr.microsoft.com/dotnet/aspnet:3.1 AS base

LABEL vendor="SUSEP" maintainer="Erivando Sena<erivandoramos@unilab.edu.br>" description="Programa de Gest?o e Desempenho (PGD), API Vers?o Docker" version="1.x.x"

RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get autoremove -y \
 && apt-get install -y iputils-ping nano -y

WORKDIR /app

EXPOSE 80
EXPOSE 443

# ==== Stage 2 ====
FROM mcr.microsoft.com/dotnet/sdk:3.1 AS build

RUN apt-get update \
 && apt-get upgrade -y \
 && apt-get autoremove -y

WORKDIR /src

COPY ["Susep.SISRH.WebApi/Susep.SISRH.WebApi.csproj", "Susep.SISRH.WebApi/"]
COPY ["Susep.SISRH.Application/Susep.SISRH.Application.csproj", "Susep.SISRH.Application/"]
COPY ["Susep.SISRH.Infrastructure/Susep.SISRH.Infrastructure.csproj", "Susep.SISRH.Infrastructure/"]
COPY ["Susep.SISRH.Domain/Susep.SISRH.Domain.csproj", "Susep.SISRH.Domain/"]

RUN dotnet restore "Susep.SISRH.WebApi/Susep.SISRH.WebApi.csproj"

COPY . .

WORKDIR "/src/Susep.SISRH.WebApi"

RUN dotnet build "Susep.SISRH.WebApi.csproj" -c Release -o /app/build

# ==== Stage 3 ====
FROM build AS publish

RUN dotnet publish "Susep.SISRH.WebApi.csproj" -c Release -o /app/publish

# ==== Stage 4 ====
FROM base AS final

WORKDIR /app

COPY --from=publish /app/publish .