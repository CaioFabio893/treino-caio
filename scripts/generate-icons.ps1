Add-Type -AssemblyName System.Drawing
$workspace = Split-Path -Parent $PSScriptRoot
foreach ($size in @(192, 512)) {
  $bitmap = New-Object System.Drawing.Bitmap($size, $size)
  $canvas = [System.Drawing.Graphics]::FromImage($bitmap)
  $canvas.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::AntiAlias
  $canvas.Clear([System.Drawing.ColorTranslator]::FromHtml('#101112'))
  $pen = New-Object System.Drawing.Pen([System.Drawing.ColorTranslator]::FromHtml('#b9f14d'), ($size * 0.0625))
  $pen.StartCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.EndCap = [System.Drawing.Drawing2D.LineCap]::Round
  $pen.LineJoin = [System.Drawing.Drawing2D.LineJoin]::Round
  $points = [System.Drawing.PointF[]]@(
    [System.Drawing.PointF]::new($size*.18, $size*.51),
    [System.Drawing.PointF]::new($size*.32, $size*.51),
    [System.Drawing.PointF]::new($size*.41, $size*.30),
    [System.Drawing.PointF]::new($size*.56, $size*.71),
    [System.Drawing.PointF]::new($size*.65, $size*.51),
    [System.Drawing.PointF]::new($size*.82, $size*.51)
  )
  $canvas.DrawLines($pen, $points)
  $bitmap.Save((Join-Path $workspace "public\icon-$size.png"), [System.Drawing.Imaging.ImageFormat]::Png)
  $pen.Dispose(); $canvas.Dispose(); $bitmap.Dispose()
}
