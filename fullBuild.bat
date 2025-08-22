@echo off
setlocal

echo 🔹 Running pullPacks.bat...
if exist pullPacks.bat (
    call pullPacks.bat
) else (
    echo ❌ Error: pullPacks.bat not found!
    exit /b 1
)

echo 🔹 Running compressAudio.bat...
if exist compressAudio.bat (
    call compressAudio.bat
) else (
    echo ❌ Error: compressAudio.bat not found!
    exit /b 1
)

echo 🔹 Running packmcaddon.bat...
if exist packmcaddon.bat (
    call packmcaddon.bat
) else (
    echo ❌ Error: packmcaddon.bat not found!
    exit /b 1
)

echo 🎉 All steps completed successfully!
exit /b 0