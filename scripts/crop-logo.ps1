Add-Type -AssemblyName System.Drawing

$srcPath = "T:\Stuffs\Jaitraya Technolabs\assets\images\logos\jaitraya-official-badge.jpg"
$bmp = New-Object System.Drawing.Bitmap($srcPath)

Write-Host "Source image dimensions: $($bmp.Width) x $($bmp.Height)"

# Find non-white bounding box
$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        # Check if not pure/near white (R, G, or B < 240)
        if ($c.R -lt 240 -or $c.G -lt 240 -or $c.B -lt 240) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

Write-Host "Detected tight bounds: X: $minX to $maxX, Y: $minY to $maxY"
$cropW = $maxX - $minX + 1
$cropH = $maxY - $minY + 1
Write-Host "Crop size: $cropW x $cropH"

# Add a tiny 6px padding
$pad = 6
$srcRect = New-Object System.Drawing.Rectangle([Math]::Max(0, $minX - $pad), [Math]::Max(0, $minY - $pad), [Math]::Min($bmp.Width - $minX + $pad, $cropW + ($pad * 2)), [Math]::Min($bmp.Height - $minY + $pad, $cropH + ($pad * 2)))

$cropBmp = New-Object System.Drawing.Bitmap($srcRect.Width, $srcRect.Height)
$g = [System.Drawing.Graphics]::FromImage($cropBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.Clear([System.Drawing.Color]::White)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $srcRect.Width, $srcRect.Height)
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$outPath = "T:\Stuffs\Jaitraya Technolabs\assets\images\logos\jaitraya-logo-light.png"
$cropBmp.Save($outPath, [System.Drawing.Imaging.ImageFormat]::Png)
$cropBmp.Dispose()
$bmp.Dispose()

Write-Host "Saved tightly cropped high-res logo to $outPath"
