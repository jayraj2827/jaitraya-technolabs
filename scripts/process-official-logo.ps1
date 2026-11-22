Add-Type -AssemblyName System.Drawing

$srcPath = 'C:\Users\Jayraj\.gemini\antigravity\brain\d1772390-02d4-42a3-b5a1-ce5e195498f9\.user_uploaded\media_1795007849045_c61c6f55.jpg'
$destOriginal = Join-Path (Get-Location) 'assets\images\logos\jaitraya-logo-official.jpg'
Copy-Item $srcPath $destOriginal -Force

$bmp = [System.Drawing.Bitmap]::FromFile($destOriginal)
$width = $bmp.Width
$height = $bmp.Height

# 1. Create transparent original (light theme / general transparent)
$transBmp = New-Object System.Drawing.Bitmap($width, $height)
# 2. Create dark-mode version (whiten dark charcoal text & 'J', keep cobalt blue)
$darkBmp = New-Object System.Drawing.Bitmap($width, $height)

for ($x = 0; $x -lt $width; $x++) {
    for ($y = 0; $y -lt $height; $y++) {
        $c = $bmp.GetPixel($x, $y)
        
        # Check if background (ivory / off-white: R > 235, G > 232, B > 228)
        if ($c.R -gt 235 -and $c.G -gt 232 -and $c.B -gt 225) {
            $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
            $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
        } else {
            # Foreground pixel
            # Check if this pixel is blue (cobalt blue in the 'T' and pixels)
            $isBlue = ($c.B -gt ($c.R + 40))
            
            # Anti-aliasing alpha calculation based on brightness distance to background
            $brightness = ($c.R + $c.G + $c.B) / 3.0
            $alpha = 255
            if ($brightness -gt 210) {
                $alpha = [int][Math]::Max(0, [Math]::Min(255, (245 - $brightness) * 7.2))
            }

            if ($alpha -le 5) {
                $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 0, 0, 0))
                continue
            }

            # Original transparent
            $transBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))

            # Dark theme
            if ($isBlue) {
                # Keep rich royal cobalt blue
                $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, $c.R, $c.G, $c.B))
            } else {
                # Whiten dark charcoal text, 'J', and divider line to crisp #FFFFFF / #F4F4F5
                if ($brightness -lt 120) {
                    $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 255, 255, 255))
                } else {
                    # Lighter grey text like TECHNOLABS
                    $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 200, 205, 215))
                }
            }
        }
    }
}

$destTrans = Join-Path (Get-Location) 'assets\images\logos\jaitraya-logo-transparent.png'
$destDark = Join-Path (Get-Location) 'assets\images\logos\jaitraya-logo-dark.png'

$transBmp.Save($destTrans, [System.Drawing.Imaging.ImageFormat]::Png)
$darkBmp.Save($destDark, [System.Drawing.Imaging.ImageFormat]::Png)

# Crop the new JT Monogram Icon
$iconBmp = New-Object System.Drawing.Bitmap(350, 260)
$iconG = [System.Drawing.Graphics]::FromImage($iconBmp)
$srcRect = New-Object System.Drawing.Rectangle(45, 35, 350, 260)
$destRect = New-Object System.Drawing.Rectangle(0, 0, 350, 260)
$iconG.DrawImage($darkBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$iconG.Dispose()

$destIcon = Join-Path (Get-Location) 'assets\images\logos\jaitraya-icon.png'
$iconBmp.Save($destIcon, [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()
$transBmp.Dispose()
$darkBmp.Dispose()
$iconBmp.Dispose()

Write-Output "Successfully processed official Jaitraya logo into dark and transparent assets!"
