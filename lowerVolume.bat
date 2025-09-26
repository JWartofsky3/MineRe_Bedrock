@echo off
setlocal enabledelayedexpansion

rem --- Prompt for directory ---
set /p SOUNDS_DIR=Enter the path to the sounds directory: 
if not exist "%SOUNDS_DIR%" (
    echo ❌ Error: %SOUNDS_DIR% does not exist!
    pause
    exit /b 1
)

rem --- Prompt for target peak volume ---
:ask_volume
set /p TARGET_DB=Enter the target peak volume in dBFS (e.g., -15): 
rem Validate input is a number
powershell -NoProfile -Command "if(-not [double]('%TARGET_DB%')) {exit 1}" >nul 2>&1
if errorlevel 1 (
    echo ❌ Invalid input. Please enter a numeric value like -15.
    goto ask_volume
)

echo 🔊 Checking and normalizing .wav files in %SOUNDS_DIR% ...
echo Target peak volume: %TARGET_DB% dBFS
echo.

set /a changed=0
set /a skipped=0
set /a failed=0

for /r "%SOUNDS_DIR%" %%F in (*.wav) do (
    echo Analyzing: %%F

    rem --- Extract peak volume ---
    for /f "tokens=2 delims=:" %%A in ('
        ffmpeg -i "%%F" -af volumedetect -f null NUL 2^>^&1 ^| findstr "max_volume"
    ') do set "peak=%%A"

    rem --- Clean value ---
    set "peak=!peak: dB=!"
    set "peak=!peak: =!"

    echo    Peak detected: !peak! dBFS

    rem --- Calculate gain to reach target ---
    for /f %%G in ('powershell -NoProfile -Command "([double]('%TARGET_DB%') - [double](!peak!)).ToString('F2')"') do set gain=%%G

    rem --- Check if any change is needed ---
    if !gain! neq 0 (
        echo    ⚠ Adjusting volume by !gain! dB to reach %TARGET_DB% dBFS

        set "tmp=%%F.tmp.wav"
        set "bak=%%F.bak.wav"

        rem --- Make backup ---
        copy "%%F" "!bak!" >nul

        rem --- Apply volume adjustment ---
        ffmpeg -i "%%F" -af "volume=!gain!dB" -c:a pcm_s16le -y "!tmp!"

        rem --- Replace original only if tmp created ---
        if exist "!tmp!" (
            move /y "!tmp!" "%%F" >nul
            if errorlevel 1 (
                echo ⚠ Failed to replace %%F — backup kept at !bak!
                set /a failed+=1
            ) else (
                echo    ✔ Normalized: %%F
                del /q "!bak!" >nul
                set /a changed+=1
            )
        ) else (
            echo ⚠ FFmpeg failed for %%F — original preserved, backup at !bak!
            set /a failed+=1
        )
    ) else (
        echo    OK: Already at target volume (%TARGET_DB% dBFS)
        set /a skipped+=1
    )

    echo.
)

echo 🎉 Done processing all sounds!
echo    ✔ Changed: %changed% file(s)
echo    ⏩ Skipped: %skipped% file(s)
echo    ⚠ Failed:  %failed% file(s)
pause
