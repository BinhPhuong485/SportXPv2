param (
    [string]$TargetGroup = "all"
)

$brainDir = "C:\Users\MS Phung\.gemini\antigravity\brain\32054344-2dab-4079-82dc-7c3438cdf363"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$profileDir = Join-Path $brainDir "chrome_profile"

if (-not (Test-Path $profileDir)) {
    New-Item -ItemType Directory -Path $profileDir | Out-Null
}

# 1. Fetch live Supabase session
$envContent = Get-Content "E:\SQUARE\STUDY\EXE\v3\.env" | Out-String
$url = ($envContent -split "`n" | Where-Object { $_ -match "^VITE_SUPABASE_URL=" } | ForEach-Object { ($_ -split "=")[1].Trim() })
$key = ($envContent -split "`n" | Where-Object { $_ -match "^VITE_SUPABASE_ANON_KEY=" } | ForEach-Object { ($_ -split "=")[1].Trim() })

$headers = @{ "apikey" = $key; "Content-Type" = "application/json" }
$body = @{ "email" = "bp@gmail.com"; "password" = "12345678@" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "$url/auth/v1/token?grant_type=password" -Method Post -Headers $headers -Body $body
$sessionJson = $res | ConvertTo-Json -Compress
$encodedSession = [System.Uri]::EscapeDataString($sessionJson)

# Seed session into Chrome user-data-dir
$seedUrl = "http://localhost:5173/inject-session.html?next=/#/?noSplash=true#$encodedSession"
$seedOut = Join-Path $profileDir "seed.png"
Write-Host "Seeding Chrome localStorage profile..."
Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--virtual-time-budget=3000", "--user-data-dir=`"$profileDir`"", "--screenshot=`"$seedOut`"", "`"$seedUrl`"" -Wait
Write-Host "Session seeded."

$targets = @(
    # Splash Screen (Light & Dark, 375 & 1440)
    @{ Name = "splash-courtNight-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/splash?theme=light" },
    @{ Name = "splash-courtNight-1440px.png"; Width = 1440; Height = 900; Url = "http://localhost:5173/#/splash?theme=dark" },

    # Auth Page (Light & Dark, 375 & 1440)
    @{ Name = "auth-light-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/auth?theme=light" },
    @{ Name = "auth-light-1440px.png"; Width = 1440; Height = 900; Url = "http://localhost:5173/#/auth?theme=light" },
    @{ Name = "auth-dark-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/auth?theme=dark" },
    @{ Name = "auth-dark-1440px.png"; Width = 1440; Height = 900; Url = "http://localhost:5173/#/auth?theme=dark" },

    # Forgot Password Sheet (Light & Dark, 375)
    @{ Name = "forgot-password-light-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/auth?theme=light&forgot=true" },
    @{ Name = "forgot-password-dark-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/auth?theme=dark&forgot=true" },

    # Feed Page with TopAppBar & Bell + Theme Switch (Light & Dark, 375 & 1440)
    @{ Name = "feed-light-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/?theme=light&noSplash=true" },
    @{ Name = "feed-light-1440px.png"; Width = 1440; Height = 900; Url = "http://localhost:5173/#/?theme=light&noSplash=true" },
    @{ Name = "feed-dark-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/?theme=dark&noSplash=true" },
    @{ Name = "feed-dark-1440px.png"; Width = 1440; Height = 900; Url = "http://localhost:5173/#/?theme=dark&noSplash=true" },

    # Notification Modal Sheet (Light & Dark, 375)
    @{ Name = "notification-modal-light-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/?theme=light&noSplash=true&notice=true" },
    @{ Name = "notification-modal-dark-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/?theme=dark&noSplash=true&notice=true" },

    # Record Match Sheet (Light & Dark, 375)
    @{ Name = "record-match-light-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/?theme=light&noSplash=true&record=true" },
    @{ Name = "record-match-dark-375px.png"; Width = 375; Height = 812; Url = "http://localhost:5173/#/?theme=dark&noSplash=true&record=true" }
)

foreach ($t in $targets) {
    $outPath = Join-Path $brainDir $t.Name
    Write-Host "Capturing $($t.Name) ($($t.Width)x$($t.Height))..."
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--virtual-time-budget=3500", "--window-size=$($t.Width),$($t.Height)", "--user-data-dir=`"$profileDir`"", "--screenshot=`"$outPath`"", "`"$($t.Url)`"" -Wait
    if (Test-Path $outPath) {
        $size = (Get-Item $outPath).Length
        Write-Host "Saved: $($t.Name) ($size bytes)"
    } else {
        Write-Host "Failed: $($t.Name)"
    }
}

Write-Host "Screenshot capture complete!"

