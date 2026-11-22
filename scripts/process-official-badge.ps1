Add-Type -AssemblyName System.Drawing

$srcPath = Join-Path (Get-Location) 'assets\images\logos\jaitraya-official-badge.jpg'
$bmp = [System.Drawing.Bitmap]::FromFile($srcPath)
$width = $bmp.Width
$height = $bmp.Height

# 1. Create transparent PNG
$transBmp = New-Object System.Drawing.Bitmap($width, $height)

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Check if white / near-white background (R > 242, G > 242, B > 242)
        if ($c.R -gt 242 -and $c.G -gt 242 -and $c.B -gt 242) {
            $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Compute alpha for anti-aliasing near edges
            $brightness = ($c.R + $c.G + $c.B) / 3.0
            $alpha = 255
            if ($brightness -gt 215) {
                $alpha = [int][Math]::Max(0, [Math]::Min(255, (248 - $brightness) * 7.7))
            }
            if ($alpha -le 5) {
                $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            } else {
                $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
            }
        }
    }
}

$destBadge = Join-Path (Get-Location) 'assets\images\logos\jaitraya-official-badge.png'
$transBmp.Save($destBadge, [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Crop the Emblem (y: 35 to 370, x: 300 to 750)
$iconWidth = 460
$iconHeight = 350
$iconBmp = New-Object System.Drawing.Bitmap($iconWidth, $iconHeight)
$g = [System.Drawing.Graphics]::FromImage($iconBmp)
$srcRect = New-Object System.Drawing.Rectangle(290, 35, $iconWidth, $iconHeight)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $iconWidth, $iconHeight)
$g.DrawImage($transBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$destIcon = Join-Path (Get-Location) 'assets\images\logos\jaitraya-icon.png'
$iconBmp.Save($destIcon, [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Create Horizontal Lockup for Navbar (Height 120px, Width 480px)
# Left: Emblem (scaled to ~110px)
# Right: Typography (y: 390 to 650, x: 100 to 924)
$typeWidth = 840
$typeHeight = 250
$typeBmp = New-Object System.Drawing.Bitmap($typeWidth, $typeHeight)
$gType = [System.Drawing.Graphics]::FromImage($typeBmp)
$srcTypeRect = New-Object System.Drawing.Rectangle(92, 395, $typeWidth, $typeHeight)
$destTypeRect = New-Object System.Drawing.Rectangle(0, 0, $typeWidth, $typeHeight)
$gType.DrawImage($transBmp, $destTypeRect, $srcTypeRect, [System.Drawing.GraphicsUnit]::Pixel)
$gType.Dispose()

# Combine into horizontal banner (Width 600, Height 140)
$bannerWidth = 620
$bannerHeight = 140
$bannerBmp = New-Object System.Drawing.Bitmap($bannerWidth, $bannerHeight)
$gBanner = [System.Drawing.Graphics]::FromImage($bannerBmp)
$gBanner.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gBanner.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality

# Draw icon on left: 140x110
$gBanner.DrawImage($iconBmp, 0, 10, 145, 115)
# Draw typography on right: 460x125
$gBanner.DrawImage($typeBmp, 150, 10, 460, 125)
$gBanner.Dispose()

$destBanner = Join-Path (Get-Location) 'assets\images\logos\jaitraya-logo-light.png'
$bannerBmp.Save($destBanner, [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()
$transBmp.Dispose()
$iconBmp.Dispose()
$typeBmp.Dispose()
$bannerBmp.Dispose()

Write-Output "Official logo badge, icon, and horizontal lockup successfully created!"
