@echo off
setlocal enabledelayedexpansion

set "MAVEN_VERSION=3.9.6"
set "MAVEN_DIR=%~dp0.mvn\apache-maven-%MAVEN_VERSION%"

if not exist "%MAVEN_DIR%" (
    echo Maven wrapper: Apache Maven %MAVEN_VERSION% is not found. Downloading...
    if not exist "%~dp0.mvn" mkdir "%~dp0.mvn"
    
    set "ZIP_URL=https://archive.apache.org/dist/maven/maven-3/%MAVEN_VERSION%/binaries/apache-maven-%MAVEN_VERSION%-bin.zip"
    set "ZIP_FILE=%~dp0.mvn\maven.zip"
    
    powershell -Command "[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12; Invoke-WebRequest -Uri '!ZIP_URL!' -OutFile '!ZIP_FILE!'"
    if !ERRORLEVEL! neq 0 (
        echo Failed to download Maven from !ZIP_URL!
        exit /b 1
    )
    
    echo Extracting Maven...
    powershell -Command "Expand-Archive -Path '!ZIP_FILE!' -DestinationPath '%~dp0.mvn'"
    if !ERRORLEVEL! neq 0 (
        echo Failed to extract Maven.
        del "!ZIP_FILE!"
        exit /b 1
    )
    
    del "!ZIP_FILE!"
    echo Maven wrapper: Download and extraction complete.
)

"%MAVEN_DIR%\bin\mvn.cmd" %*
