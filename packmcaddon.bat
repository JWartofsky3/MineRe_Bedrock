@echo off
setlocal enabledelayedexpansion

REM --- CONFIG ---
set BP_DIR=MineRe_BP
set RP_DIR=MineRe_RP
set OUT_NAME=MineRe

REM --- Paths to Archivers ---
set WINRAR_PATH=C:\Program Files\WinRAR\WinRAR.exe
set SEVENZIP_PATH=C:\Program Files\7-Zip\7z.exe

REM --- Check manifests exist ---
if not exist "%BP_DIR%\manifest.json" (
    echo ❌ Error: %BP_DIR%\manifest.json not found!
    goto :fail
)
if not exist "%RP_DIR%\manifest.json" (
    echo ❌ Error: %RP_DIR%\manifest.json not found!
    goto :fail
)

REM --- Extract version using PowerShell ---
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "((Get-Content \"%BP_DIR%\manifest.json\" | ConvertFrom-Json).header.version -join '.')"` ) do set BP_VER=%%V
for /f "usebackq delims=" %%V in (`powershell -NoProfile -Command "((Get-Content \"%RP_DIR%\manifest.json\" | ConvertFrom-Json).header.version -join '.')"` ) do set RP_VER=%%V

echo BP_VER=!BP_VER!
echo RP_VER=!RP_VER!

REM --- Check versions ---
if "!BP_VER!"=="" (
    echo ❌ Could not read BP version!
    goto :fail
)
if "!RP_VER!"=="" (
    echo ❌ Could not read RP version!
    goto :fail
)
if not "!BP_VER!"=="!RP_VER!" (
    echo ❌ Version mismatch! BP=!BP_VER!, RP=!RP_VER!
    goto :fail
)

echo ✅ Version match: !BP_VER!

REM --- Build output file name ---
set PACK_NAME=%OUT_NAME%_!BP_VER!.mcaddon

REM --- Delete old files ---
if exist "%PACK_NAME%" del "%PACK_NAME%"
if exist tmp_pack.zip del tmp_pack.zip

REM --- Try WinRAR first ---
if exist "%WINRAR_PATH%" (
    echo 🚀 Using WinRAR for compression...
    "%WINRAR_PATH%" a -afzip tmp_pack.zip "%RP_DIR%\*" "%BP_DIR%\*" -x"%BP_DIR%\src*" -x"%BP_DIR%\node_modules*" -x"%BP_DIR%\package.json" -x"%BP_DIR%\package-lock.json" -x"%BP_DIR%\tsconfig.json"
    if errorlevel 1 (
        echo ❌ WinRAR failed!
        goto :fail
    )
) else if exist "%SEVENZIP_PATH%" (
    echo ⚡ WinRAR not found, using 7-Zip...
    "%SEVENZIP_PATH%" a -tzip "tmp_pack.zip" "%RP_DIR%\*"
    "%SEVENZIP_PATH%" a -tzip "tmp_pack.zip" "%BP_DIR%\*" -xr!"src" -xr!"node_modules" -xr!"package.json" -xr!"package-lock.json" -xr!"tsconfig.json"
    if errorlevel 1 (
        echo ❌ 7-Zip failed!
        goto :fail
    )
) else (
    echo 🐢 Neither WinRAR nor 7-Zip found, using PowerShell Compress-Archive...
    powershell -NoProfile -Command "Compress-Archive -Path '%RP_DIR%\*' -DestinationPath 'tmp_pack.zip' -Force"
    powershell -NoProfile -Command "Get-ChildItem -Path '%BP_DIR%' -Recurse -File | Where-Object { $_.FullName -notmatch 'src|node_modules|package.json|package-lock.json|tsconfig' } | Compress-Archive -Update -DestinationPath 'tmp_pack.zip'"
)

REM --- Rename to .mcaddon ---
rename tmp_pack.zip "%PACK_NAME%"

echo 🎉 Done! Created %PACK_NAME%
exit /b 0

:fail
echo ❌ Build failed! See errors above.
echo Press any key to exit...
pause >nul
exit /b 1
