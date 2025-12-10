@echo off
echo Starting development environment...

echo.
echo Step 1: Starting PostgreSQL database...
docker-compose up -d impulse_db
timeout /t 5 /nobreak >nul

echo.
echo Step 2: Starting backend server...
echo Please open a new terminal and run:
echo   cd back
echo   uvicorn main:app --reload --host 0.0.0.0 --port 8000
echo.
echo Or if using uv:
echo   cd back
echo   uv run uvicorn main:app --reload --host 0.0.0.0 --port 8000

echo.
echo Step 3: Starting frontend...
echo Please open a new terminal and run:
echo   cd web
echo   npm start

echo.
echo Database is running on localhost:5434
echo Backend should run on http://localhost:8000
echo Frontend will run on http://localhost:3000
echo.
pause





