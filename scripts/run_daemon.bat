@echo off
title The Chronicles — Real-Time Newsroom Daemon (1-Min Sweeps)
echo =======================================================================
echo          THE CHRONICLES AUTOMATED REAL-TIME NEWSROOM DAEMON
echo =======================================================================
echo  - Polling interval: Every 60 seconds (1 minute)
echo  - Sources: 16 Verified Nigerian ^& Global Wires
echo  - Deduplication: Smart Multi-Layered Anti-Duplicate Engine Active
echo  - Content Target: Substantive 300 to 1,000 Words Luxury Broadsheet
echo  - Watermarking: Official Luxury Brand Badge Active
echo =======================================================================
echo.
cd /d "%~dp0.."
python scripts/news_pipeline.py --daemon --interval 1 --batch-size 60 --beat all
pause
