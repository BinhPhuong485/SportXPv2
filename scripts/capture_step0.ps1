$serverProcess = Start-Process -FilePath "node" -ArgumentList "scripts/server.cjs" -PassThru
Start-Sleep -Seconds 2

$brainDir = "C:\Users\MS Phung\.gemini\antigravity\brain\32054344-2dab-4079-82dc-7c3438cdf363"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"

$targets = @(
    @{ Name = "splash-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/splash" },
    @{ Name = "onboarding-step-1-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?step=0#/onboarding" },
    @{ Name = "onboarding-step-2-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?step=1#/onboarding" },
    @{ Name = "onboarding-step-3-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?step=2#/onboarding" },
    @{ Name = "onboarding-step-4-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?step=3#/onboarding" },
    @{ Name = "onboarding-step-5-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?step=4#/onboarding" },
    @{ Name = "onboarding-result-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/?step=5#/onboarding" }
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
Write-Host "Done capturing Step 0 screenshots."

