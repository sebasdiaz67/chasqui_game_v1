<#
.SYNOPSIS
  Prepara Windows para compilar "Chasqui: El Mensajero Inca" con Capacitor 8 (Android).

.DESCRIPTION
  1. Diagnostica Node.js (>= 22), JDK (>= 21), Android Studio y Android SDK (ANDROID_HOME).
  2. Instala con winget lo que falte (Node LTS, Microsoft OpenJDK 21; Android Studio solo con -InstallAndroidStudio).
  3. Ejecuta "npx cap doctor" en el proyecto (instala Capacitor en el proyecto solo con -InitCapacitor).

  Requisitos verificados para Capacitor 8 (capacitorjs.com, 2026): Node 22+, Android Studio 2025.2.1+,
  JDK 21 (Android Studio trae uno propio en su carpeta "jbr").

.PARAMETER ProjectPath
  Carpeta del proyecto. Por defecto, la carpeta donde está este script.
.PARAMETER InstallAndroidStudio
  Instala Android Studio con winget si no se encuentra (descarga ~1 GB).
.PARAMETER InitCapacitor
  Si el proyecto aún no tiene Capacitor, crea package.json e instala @capacitor/core, @capacitor/android y @capacitor/cli.
.PARAMETER AppId
  Identificador de la app para "npx cap init". Es PERMANENTE en Google Play: confírmalo antes de usar -InitCapacitor.

.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\preparar_entorno.ps1
.EXAMPLE
  powershell -NoProfile -ExecutionPolicy Bypass -File .\preparar_entorno.ps1 -InstallAndroidStudio -InitCapacitor

.NOTES
  Chasqui: El Mensajero Inca v1.0.0
  Autor: Byron Sebastián Rosero Díaz — Ingeniero de software
  © 2026 Byron Sebastián Rosero Díaz. Todos los derechos reservados.
#>
[CmdletBinding()]
param(
    [string]$ProjectPath = $PSScriptRoot,
    [switch]$InstallAndroidStudio,
    [switch]$InitCapacitor,
    [string]$AppId = 'com.sebastian.chasqui'
)

$ErrorActionPreference = 'Stop'
$MinNode = 22
$MinJava = 21
$Results = [ordered]@{}

# ---------------------------------------------------------------- utilidades
function Write-Step([string]$m) { Write-Host "`n== $m" -ForegroundColor Cyan }
function Write-Ok([string]$m)   { Write-Host "   [OK] $m" -ForegroundColor Green }
function Write-Warn([string]$m) { Write-Host "   [!]  $m" -ForegroundColor Yellow }
function Write-Bad([string]$m)  { Write-Host "   [X]  $m" -ForegroundColor Red }

# Recarga PATH y variables en la sesión actual (winget no actualiza la consola abierta).
function Update-SessionEnv {
    $env:Path = [Environment]::GetEnvironmentVariable('Path', 'Machine') + ';' +
                [Environment]::GetEnvironmentVariable('Path', 'User')
    foreach ($name in 'JAVA_HOME', 'ANDROID_HOME') {
        $val = [Environment]::GetEnvironmentVariable($name, 'User')
        if (-not $val) { $val = [Environment]::GetEnvironmentVariable($name, 'Machine') }
        if ($val) { Set-Item -Path "env:$name" -Value $val }
    }
}

function Invoke-Winget([string]$Id) {
    if (-not (Get-Command winget -ErrorAction SilentlyContinue)) {
        throw 'winget no está disponible. Instala "Instalador de aplicación" (App Installer) desde Microsoft Store.'
    }
    Write-Host "   -> winget install --id $Id" -ForegroundColor DarkGray
    winget install --id $Id --exact --silent --accept-package-agreements --accept-source-agreements --disable-interactivity
    # -1978335189 = ya instalado / sin actualización disponible: no es error.
    if ($LASTEXITCODE -ne 0 -and $LASTEXITCODE -ne -1978335189) {
        throw "winget falló instalando $Id (código $LASTEXITCODE)."
    }
    Update-SessionEnv
}

# Ejecuta un comando nativo capturando stdout+stderr sin que PowerShell 5.1 lo trate como error.
function Invoke-Quiet([string]$Exe, [string[]]$Arguments) {
    $prev = $ErrorActionPreference
    $ErrorActionPreference = 'Continue'
    try { return (& $Exe @Arguments 2>&1 | Out-String) } catch { return '' } finally { $ErrorActionPreference = $prev }
}

function Get-NodeMajor {
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) { return 0 }
    $v = Invoke-Quiet 'node' @('--version')
    if ($v -match 'v(\d+)\.') { return [int]$Matches[1] }
    return 0
}

function Get-JavaMajor([string]$JavaExe) {
    if (-not $JavaExe -or -not (Test-Path $JavaExe)) { return 0 }
    $out = Invoke-Quiet $JavaExe @('-version')          # java escribe la versión en stderr
    if ($out -match 'version "(\d+)') { return [int]$Matches[1] }
    return 0
}

function Set-UserEnv([string]$Name, [string]$Value) {
    [Environment]::SetEnvironmentVariable($Name, $Value, 'User')
    Set-Item -Path "env:$Name" -Value $Value
    Write-Ok "$Name = $Value (variable de usuario)"
}

# ---------------------------------------------------------------- inicio
Write-Host 'Chasqui: El Mensajero Inca — preparación del entorno Android (Capacitor 8)' -ForegroundColor White
$isAdmin = ([Security.Principal.WindowsPrincipal][Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole(
    [Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) { Write-Warn 'No se ejecuta como Administrador: winget puede pedir confirmación (UAC) en algunas instalaciones.' }
if (-not (Test-Path (Join-Path $ProjectPath 'www\index.html'))) {
    Write-Bad "No encuentro www\index.html en '$ProjectPath'. Usa -ProjectPath D:\claude-projects\chasqui"
    exit 1
}

try {
    # ------------------------------------------------------------ 1. Node.js
    Write-Step "Node.js (mínimo v$MinNode)"
    $node = Get-NodeMajor
    if ($node -ge $MinNode) {
        Write-Ok "Node v$node"
    } else {
        if ($node -gt 0) { Write-Warn "Node v$node es antiguo para Capacitor 8; se instala la versión LTS." }
        else { Write-Warn 'Node.js no está instalado.' }
        Invoke-Winget 'OpenJS.NodeJS.LTS'
        $node = Get-NodeMajor
        if ($node -ge $MinNode) { Write-Ok "Node v$node instalado" } else { throw 'Node.js no quedó disponible. Cierra y abre la terminal y vuelve a ejecutar.' }
    }
    $Results['Node.js'] = "v$node"

    # ------------------------------------------------------------ 2. Android Studio
    Write-Step 'Android Studio (mínimo 2025.2.1)'
    $studioDir = Join-Path $env:ProgramFiles 'Android\Android Studio'
    $studio = Test-Path (Join-Path $studioDir 'bin\studio64.exe')
    if (-not $studio -and $InstallAndroidStudio) {
        Invoke-Winget 'Google.AndroidStudio'
        $studio = Test-Path (Join-Path $studioDir 'bin\studio64.exe')
    }
    if ($studio) { Write-Ok "Android Studio en $studioDir" }
    else {
        Write-Warn 'Android Studio no está instalado. Es necesario para compilar y firmar la app.'
        Write-Host '        Instálalo con:  winget install --id Google.AndroidStudio --exact' -ForegroundColor Yellow
        Write-Host '        o vuelve a ejecutar este script con -InstallAndroidStudio' -ForegroundColor Yellow
    }
    $Results['Android Studio'] = $(if ($studio) { 'instalado' } else { 'FALTA' })

    # ------------------------------------------------------------ 3. JDK
    Write-Step "JDK (mínimo $MinJava)"
    $candidates = @()
    if ($env:JAVA_HOME) { $candidates += Join-Path $env:JAVA_HOME 'bin\java.exe' }
    $candidates += Join-Path $studioDir 'jbr\bin\java.exe'                     # JDK incluido en Android Studio
    $onPath = Get-Command java -ErrorAction SilentlyContinue
    if ($onPath) { $candidates += $onPath.Source }
    $candidates += Get-ChildItem "$env:ProgramFiles\Microsoft\jdk-21*\bin\java.exe" -ErrorAction SilentlyContinue | ForEach-Object FullName

    $javaExe = $null; $javaVer = 0
    foreach ($c in $candidates) {
        $v = Get-JavaMajor $c
        if ($v -ge $MinJava) { $javaExe = $c; $javaVer = $v; break }
    }
    if (-not $javaExe) {
        Write-Warn "No se encontró un JDK $MinJava+; se instala Microsoft OpenJDK 21."
        Invoke-Winget 'Microsoft.OpenJDK.21'
        $javaExe = Get-ChildItem "$env:ProgramFiles\Microsoft\jdk-21*\bin\java.exe" -ErrorAction SilentlyContinue |
                   Select-Object -First 1 -ExpandProperty FullName
        $javaVer = Get-JavaMajor $javaExe
        if ($javaVer -lt $MinJava) { throw 'No se pudo verificar el JDK 21 instalado.' }
    }
    $javaHome = Split-Path (Split-Path $javaExe -Parent) -Parent
    Write-Ok "JDK $javaVer en $javaHome"
    if ($env:JAVA_HOME -ne $javaHome) { Set-UserEnv 'JAVA_HOME' $javaHome }
    $Results['JDK'] = "$javaVer ($javaHome)"

    # ------------------------------------------------------------ 4. Android SDK
    Write-Step 'Android SDK (ANDROID_HOME)'
    $sdk = $env:ANDROID_HOME
    if (-not $sdk -or -not (Test-Path $sdk)) {
        $default = Join-Path $env:LOCALAPPDATA 'Android\Sdk'
        if (Test-Path (Join-Path $default 'platform-tools')) { Set-UserEnv 'ANDROID_HOME' $default; $sdk = $default }
        else { $sdk = $null }
    }
    if ($sdk) { Write-Ok "Android SDK en $sdk" }
    else {
        Write-Warn 'No hay Android SDK. Abre Android Studio una vez y completa el asistente (descarga el SDK);'
        Write-Host '        luego vuelve a ejecutar este script para registrar ANDROID_HOME.' -ForegroundColor Yellow
    }
    $Results['Android SDK'] = $(if ($sdk) { $sdk } else { 'FALTA' })

    # ------------------------------------------------------------ 5. Capacitor
    Write-Step 'Capacitor en el proyecto'
    Push-Location $ProjectPath
    try {
        $cli = Test-Path 'node_modules\@capacitor\cli'
        if (-not $cli -and $InitCapacitor) {
            Write-Warn "Se instalará Capacitor en el proyecto. AppId: $AppId (permanente en Google Play)."
            if (-not (Test-Path 'package.json')) { npm init -y | Out-Null }
            npm install @capacitor/core @capacitor/android
            if ($LASTEXITCODE -ne 0) { throw 'npm install @capacitor/core @capacitor/android falló.' }
            npm install -D @capacitor/cli
            if ($LASTEXITCODE -ne 0) { throw 'npm install -D @capacitor/cli falló.' }
            if (-not (Get-ChildItem 'capacitor.config.*' -ErrorAction SilentlyContinue)) {
                npx cap init 'Chasqui: El Mensajero Inca' $AppId --web-dir www
                if ($LASTEXITCODE -ne 0) { throw 'npx cap init falló.' }
            }
            $cli = Test-Path 'node_modules\@capacitor\cli'
        }
        if ($cli) {
            Write-Step 'npx cap doctor'
            npx cap doctor
            $Results['Capacitor'] = $(if ($LASTEXITCODE -eq 0) { 'doctor OK' } else { "doctor con advertencias (código $LASTEXITCODE)" })
        } else {
            # Sin @capacitor/cli local, "npx cap" descargaría un paquete ajeno llamado "cap": no se ejecuta.
            Write-Warn 'Capacitor aún no está instalado en el proyecto; no se ejecuta "npx cap doctor".'
            Write-Host '        Vuelve a ejecutar con -InitCapacitor (confirma antes el AppId).' -ForegroundColor Yellow
            $Results['Capacitor'] = 'no instalado en el proyecto'
        }
    } finally { Pop-Location }
}
catch {
    Write-Bad $_.Exception.Message
    $Results['Error'] = $_.Exception.Message
}

# ---------------------------------------------------------------- resumen
Write-Step 'Resumen'
$Results.GetEnumerator() | ForEach-Object { '{0,-16} {1}' -f $_.Key, $_.Value } | Write-Host
if ($Results.Contains('Error') -or ($Results.Values -contains 'FALTA')) {
    Write-Host "`nEntorno incompleto: revisa los puntos marcados arriba." -ForegroundColor Yellow
    exit 1
}
Write-Host "`nEntorno listo. Si instalaste algo nuevo, abre una terminal nueva para heredar las variables." -ForegroundColor Green
exit 0
