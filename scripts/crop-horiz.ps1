Add-Type -AssemblyName System.Drawing

$src = "C:\Users\Jayraj\.gemini\antigravity\brain\d1772390-02d4-42a3-b5a1-ce5e195498f9\.user_uploaded\media_1795007849045_c61c6f55.jpg"
$bmp = New-Object System.Drawing.Bitmap($src)
Write-Host "Horizontal logo dims: $($bmp.Width) x $($bmp.Height)"

$minX = $bmp.Width
$minY = $bmp.Height
$maxX = 0
$maxY = 0

for ($y = 0; $y -lt $bmp.Height; $y++) {
    for ($x = 0; $x -lt $bmp.Width; $x++) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.R -lt 245 -or $c.G -lt 245 -or $c.B -lt 245) {
            if ($x -lt $minX) { $minX = $x }
            if ($x -gt $maxX) { $maxX = $x }
            if ($y -lt $minY) { $minY = $y }
            if ($y -gt $maxY) { $maxY = $y }
        }
    }
}

$w = $maxX - $minX + 1
$h = $maxY - $minY + 1
Write-Host "Tight bounds: X=$minX..$maxX, Y=$minY..$maxY, Size=$w x $h"

$pad = 4
$srcRect = New-Object System.Drawing.Rectangle([Math]::Max(0, $minX - $pad), [Math]::Max(0, $minY - $pad), [Math]::Min($bmp.Width - $minX + $pad, $w + ($pad * 2)), [Math]::Min($bmp.Height - $minY + $pad, $h + ($pad * 2)))

$cropBmp = New-Object System.Drawing.Bitmap($srcRect.Width, $srcRect.Height)
$g = [System.Drawing.Graphics]::FromImage($cropBmp)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.Clear([System.Drawing.Color]::White)
$destRect = New-Object System.Drawing.Rectangle(0, 0, $srcRect.Width, $srcRect.Height)
$g.DrawImage($bmp, $destRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
$g.Dispose()

$cropBmp.Save("T:\Stuffs\Jaitraya Technolabs\assets\images\logos\jaitraya-logo-horizontal.png", [System.Drawing.Imaging.ImageFormat]::Png)
$cropBmp.Dispose()
$bmp.Dispose()
Write-Host "Created cropped horizontal logo!"
