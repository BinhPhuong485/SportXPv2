$server = Start-Process -FilePath "node" -ArgumentList "E:\SQUARE\STUDY\EXE\v3\scripts\server.cjs" -PassThru
Start-Sleep -Seconds 2

$brainDir = "C:\Users\MS Phung\.gemini\antigravity\brain\32054344-2dab-4079-82dc-7c3438cdf363"
$chrome = "C:\Program Files\Google\Chrome\Application\chrome.exe"
$profileDir = Join-Path $brainDir "chrome_profile"
if (Test-Path $profileDir) { Remove-Item -Recurse -Force $profileDir }
New-Item -ItemType Directory -Path $profileDir | Out-Null

# Obtain session for live Supabase
$envContent = Get-Content "E:\SQUARE\STUDY\EXE\v3\.env" | Out-String
$url = ($envContent -split "`n" | Where-Object { $_ -match "^VITE_SUPABASE_URL=" } | ForEach-Object { ($_ -split "=")[1].Trim() })
$key = ($envContent -split "`n" | Where-Object { $_ -match "^VITE_SUPABASE_ANON_KEY=" } | ForEach-Object { ($_ -split "=")[1].Trim() })

$headers = @{ "apikey" = $key; "Content-Type" = "application/json" }
$body = @{ "email" = "bp@gmail.com"; "password" = "$env:TEST_PWD" } | ConvertTo-Json
$res = Invoke-RestMethod -Uri "$url/auth/v1/token?grant_type=password" -Method Post -Headers $headers -Body $body
$sessionJson = $res | ConvertTo-Json -Compress
$encodedSession = [System.Uri]::EscapeDataString($sessionJson)

# Seed into Chrome profile
$seedUrl = "http://127.0.0.1:4173/inject-session.html?next=/#/?noSplash=true#$encodedSession"
$seedOut = Join-Path $profileDir "seed.png"
Write-Host "Seeding Chrome localStorage session..."
Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--user-data-dir=`"$profileDir`"", "--screenshot=`"$seedOut`"", "`"$seedUrl`"" -Wait
Write-Host "Seeded."

$targets = @(
    # Screen 1: Splash Screen (Always courtNight #09281E in Dart)
    @{ Name = "splash-courtNight-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/splash?theme=light&noExit=true" },
    @{ Name = "splash-courtNight-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/#/splash?theme=dark&noExit=true" },

    # Screen 2: Auth Page with "Quên mật khẩu?" link
    @{ Name = "auth-light-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/auth?theme=light" },
    @{ Name = "auth-light-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/#/auth?theme=light" },
    @{ Name = "auth-dark-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/auth?theme=dark" },
    @{ Name = "auth-dark-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/#/auth?theme=dark" },

    # Screen 3: Forgot Password Sheet
    @{ Name = "forgot-password-light-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/auth?theme=light&forgot=true" },
    @{ Name = "forgot-password-dark-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/auth?theme=dark&forgot=true" },

    # Screen 4: Feed Page with TopAppBar (Bell + Theme switch) & Live Matches
    @{ Name = "feed-light-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/?theme=light&noSplash=true&skipOnboarding=true&session=$encodedSession" },
    @{ Name = "feed-light-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/#/?theme=light&noSplash=true&skipOnboarding=true&session=$encodedSession" },
    @{ Name = "feed-dark-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/?theme=dark&noSplash=true&skipOnboarding=true&session=$encodedSession" },
    @{ Name = "feed-dark-1440px.png"; Width = 1440; Height = 900; Url = "http://127.0.0.1:4173/#/?theme=dark&noSplash=true&skipOnboarding=true&session=$encodedSession" },

    # Screen 5: Notification Modal Sheet
    @{ Name = "notification-modal-light-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/?theme=light&noSplash=true&skipOnboarding=true&notice=true&session=$encodedSession" },
    @{ Name = "notification-modal-dark-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/?theme=dark&noSplash=true&skipOnboarding=true&notice=true&session=$encodedSession" },

    # Screen 6: Record Match Sheet
    @{ Name = "record-match-light-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/?theme=light&noSplash=true&skipOnboarding=true&record=true&session=$encodedSession" },
    @{ Name = "record-match-dark-375px.png"; Width = 375; Height = 812; Url = "http://127.0.0.1:4173/#/?theme=dark&noSplash=true&skipOnboarding=true&record=true&session=$encodedSession" }
)

foreach ($t in $targets) {
    $outPath = Join-Path $brainDir $t.Name
    Write-Host "Capturing $($t.Name) ($($t.Width)x$($t.Height))..."
    Start-Process -FilePath $chrome -ArgumentList "--headless=new", "--disable-gpu", "--hide-scrollbars", "--window-size=$($t.Width),$($t.Height)", "--user-data-dir=`"$profileDir`"", "--screenshot=`"$outPath`"", "`"$($t.Url)`"" -Wait
    if (Test-Path $outPath) {
        $size = (Get-Item $outPath).Length
        Write-Host "Saved: $($t.Name) ($size bytes)"
    } else {
        Write-Host "Failed: $($t.Name)"
    }
}

Stop-Process -Id $server.Id -Force
Write-Host "All theme sync screenshots captured successfully."
