Add-Type -AssemblyName System.Drawing

$inputPath = Join-Path (Get-Location) 'assets\images\logos\jaitraya-logo-original.jpg'
if (-not (Test-Path $inputPath)) {
    Write-Error "File not found: $inputPath"
    exit 1
}

$bmp = [System.Drawing.Bitmap]::FromFile($inputPath)

# 1. Transparent version
$transparentBmp = New-Object System.Drawing.Bitmap($bmp.Width, $bmp.Height)
$g1 = [System.Drawing.Graphics]::FromImage($transparentBmp)
$g1.DrawImage($bmp, 0, 0, $bmp.Width, $bmp.Height)
$g1.Dispose()

for ($x = 0; $x -lt $transparentBmp.Width; $x++) {
    for ($y = 0; $y -lt $transparentBmp.Height; $y++) {
        $c = $transparentBmp.GetPixel($x, $y)
        if ($c.R -gt 238 -and $c.G -gt 238 -and $c.B -gt 238) {
            $transparentBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb(0, 255, 255, 255))
        }
    }
}
$transparentBmp.Save((Join-Path (Get-Location) 'assets\images\logos\jaitraya-logo-transparent.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# 2. Dark-mode version (whiten dark text for dark backgrounds)
$darkBmp = New-Object System.Drawing.Bitmap($transparentBmp)
for ($x = 0; $x -lt $darkBmp.Width; $x++) {
    for ($y = 0; $y -lt $darkBmp.Height; $y++) {
        $c = $darkBmp.GetPixel($x, $y)
        if ($c.A -gt 20 -and $x -gt 370) {
            # Check if this is the dark navy text
            $isBlue = ($c.B -gt ($c.R + 35))
            if (-not $isBlue) {
                if ($c.R -lt 110 -and $c.G -lt 110 -and $c.B -lt 130) {
                    $alpha = $c.A
                    $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 248, 250, 252))
                } elseif ($c.R -lt 165 -and $c.G -lt 170 -and $c.B -lt 180) {
                    $alpha = $c.A
                    $darkBmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($alpha, 185, 198, 215))
                }
            }
        }
    }
}
$darkBmp.Save((Join-Path (Get-Location) 'assets\images\logos\jaitraya-logo-dark.png'), [System.Drawing.Imaging.ImageFormat]::Png)

# 3. Icon crop (JT monogram)
$iconBmp = New-Object System.Drawing.Bitmap(350, 260)
$iconG = [System.Drawing.Graphics]::FromImage($iconBmp)
$srcRect = New-Object System.Drawing.Rectangle(45, 35, 350, 260)
$destRect = New-Object System.Drawing.Rectangle(0, 0, 350, 260)
$iconG.DrawImage($darkBmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$iconG.Dispose()
$iconBmp.Save((Join-Path (Get-Location) 'assets\images\logos\jaitraya-icon.png'), [System.Drawing.Imaging.ImageFormat]::Png)

$bmp.Dispose()
$transparentBmp.Dispose()
$darkBmp.Dispose()
$iconBmp.Dispose()
Write-Output "Official logo assets successfully generated!"
