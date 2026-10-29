$serverProcess = Start-Process -FilePath "node" -ArgumentList "scripts/server.cjs" -PassThru
Start-Sleep -Seconds 2

$brainDir = "C:\Users\MS Phung\.gemini\antigravity\brain\32054344-2dab-4079-82dc-7c3438cdf363"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$targets = @(
    @{ Name = "feed-strava-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?mock=true#/" },
    @{ Name = "feed-strava-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/?mock=true#/" },
    @{ Name = "activity-detail-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?mock=true#/activities/room-linh-smash:linh:personal" },
    @{ Name = "activity-detail-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/?mock=true#/activities/room-linh-smash:linh:personal" },
    @{ Name = "activity-editor-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?mock=true#/activities/room-user-comeback:me:personal/edit" },
    @{ Name = "activity-editor-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/?mock=true#/activities/room-user-comeback:me:personal/edit" }
)

foreach ($t in $targets) {
    $outPath = Join-Path $brainDir $t.Name
    Write-Host "Capturing $($t.Name) ($($t.Width)x$($t.Height))..."
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=$($t.Width),$($t.Height)", "--screenshot=`"$outPath`"", $t.Url -Wait
    if (Test-Path $outPath) {
        $size = (Get-Item $outPath).Length
        Write-Host "Saved: $($t.Name) ($size bytes)"
    } else {
        Write-Host "Failed: $($t.Name)"
    }
}

Stop-Process -Id $serverProcess.Id -Force
Write-Host "Done capturing Session 5.1 screenshots."

