# The Chronicles — Real-Time Newsroom Daemon Runner (PowerShell)
Write-Host "=======================================================================" -ForegroundColor Red
Write-Host "         THE CHRONICLES AUTOMATED REAL-TIME NEWSROOM DAEMON            " -ForegroundColor White
Write-Host "=======================================================================" -ForegroundColor Red
Write-Host " - Polling Interval: Every 60 seconds (1 minute)" -ForegroundColor Yellow
Write-Host " - Sources: 16 Verified Nigerian & Global News Wires" -ForegroundColor Yellow
Write-Host " - Anti-Duplicate Engine: Active" -ForegroundColor Green
Write-Host " - Format: 300 to 1,000 Words Broadsheet HTML" -ForegroundColor Green
Write-Host "=======================================================================" -ForegroundColor Red
Write-Host ""

$ScriptDir = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location (Join-Path $ScriptDir "..")

python scripts/news_pipeline.py --daemon --interval 1 --batch-size 60 --beat all
