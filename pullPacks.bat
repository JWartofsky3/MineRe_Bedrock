@echo off
setlocal

REM --- Paths for Behavior Pack ---
set WORKING_BP=MineRe_BP
set SOURCE_BP=C:\Users\Jacob\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_behavior_packs\MineRe_BP

REM --- Paths for Resource Pack ---
set WORKING_RP=MineRe_RP
set SOURCE_RP=C:\Users\Jacob\AppData\Local\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\development_resource_packs\MineRe_RP

REM --- Refresh BP ---
if not exist "%SOURCE_BP%" (
    echo ❌ Error: Source BP not found at "%SOURCE_BP%"
    exit /b 1
)
if exist "%WORKING_BP%" (
    echo 🗑️ Deleting local %WORKING_BP%...
    rmdir /s /q "%WORKING_BP%"
)
echo 📋 Copying MineRe_BP from Minecraft folder...
xcopy "%SOURCE_BP%" "%WORKING_BP%" /E /I /H /Y

REM --- Refresh RP ---
if not exist "%SOURCE_RP%" (
    echo ❌ Error: Source RP not found at "%SOURCE_RP%"
    exit /b 1
)
if exist "%WORKING_RP%" (
    echo 🗑️ Deleting local %WORKING_RP%...
    rmdir /s /q "%WORKING_RP%"
)
echo 📋 Copying MineRe_RP from Minecraft folder...
xcopy "%SOURCE_RP%" "%WORKING_RP%" /E /I /H /Y

echo ✅ Done! MineRe_BP and MineRe_RP refreshed safely.
exit /b 0
