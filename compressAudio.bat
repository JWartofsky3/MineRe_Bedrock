@echo off
setlocal enabledelayedexpansion

set "SOUNDS_DIR=MineRe_RP\sounds"

if not exist "%SOUNDS_DIR%" (
    echo ❌ Error: %SOUNDS_DIR% does not exist!
    exit /b 1
)

echo 🔊 Compressing .wav files in %SOUNDS_DIR% ...

set beforeTotal=0
set afterTotal=0

for /r "%SOUNDS_DIR%" %%F in (*.wav) do (
    set "file=%%F"
    for %%A in ("%%F") do set size=%%~zA

    rem Only process files larger than 50 KB (51200 bytes)
    if !size! gtr 51200 (
        set "tmp=%%F.tmp.wav"
        set /a beforeTotal+=!size!

        ffmpeg -i "%%F" -ac 1 -ar 32000 -y "!tmp!" >nul 2>&1

        if exist "!tmp!" (
            for %%B in ("!tmp!") do set after=%%~zB
            set /a afterTotal+=!after!
            move /y "!tmp!" "%%F" >nul
            set /a saved=!size! - !after!
            echo ✔ Compressed: %%F ^| Before: !size! bytes ^| After: !after! bytes ^| Saved: !saved! bytes
        )
    )
)

set /a totalSaved=beforeTotal - afterTotal
echo.
echo 🎉 Total Storage Saved: %totalSaved% bytes (%totalSaved%/1024 KB)
