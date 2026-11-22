Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\Jayraj\.gemini\antigravity\brain\d1772390-02d4-42a3-b5a1-ce5e195498f9\.user_uploaded\media_1795007849045_c61c6f55.jpg'
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)

$found = $false
for ($x = 180; $x -lt 280; $x += 5) {
    for ($y = 100; $y -lt 250; $y += 5) {
        $c = $bmp.GetPixel($x, $y)
        if ($c.B -gt ($c.R + 60)) {
            Write-Output ("Found Blue at x=" + $x + " y=" + $y + " R=" + $c.R + " G=" + $c.G + " B=" + $c.B)
            $found = $true
            break
        }
    }
    if ($found) { break }
}
$bmp.Dispose()
