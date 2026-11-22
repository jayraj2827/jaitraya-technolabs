Add-Type -AssemblyName System.Drawing
$imgPath = 'C:\Users\Jayraj\.gemini\antigravity\brain\d1772390-02d4-42a3-b5a1-ce5e195498f9\.user_uploaded\media_1795007849045_c61c6f55.jpg'
$bmp = [System.Drawing.Bitmap]::FromFile($imgPath)

$topLeft = $bmp.GetPixel(10, 10)
Write-Output "Background color sample: R=$($topLeft.R) G=$($topLeft.G) B=$($topLeft.B)"

# Find blue color in emblem (around x=240, y=170)
$blue = $bmp.GetPixel(240, 170)
Write-Output "Blue sample: R=$($blue.R) G=$($blue.G) B=$($blue.B)"

# Find dark text sample (around x=500, y=140)
$dark = $bmp.GetPixel(500, 140)
Write-Output "Dark text sample: R=$($dark.R) G=$($dark.G) B=$($dark.B)"

$bmp.Dispose()
