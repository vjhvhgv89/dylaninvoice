$port = 5500
$listener = New-Object System.Net.HttpListener
$listener.Prefixes.Add("http://localhost:$port/")
try {
    $listener.Start()
    Write-Host "Server running at http://localhost:$port/"
    Start-Process "http://localhost:$port/"
    $baseDir = "f:\One drive personal\OneDrive\Desktop\dylaninvoicesys"

    while ($listener.IsListening) {
        $context = $listener.GetContext()
        $request = $context.Request
        $response = $context.Response
        
        $localPath = $request.Url.LocalPath
        if ($localPath -eq "/" -or $localPath -eq "") { 
            $localPath = "/index.html" 
        }
        
        $relative = $localPath.TrimStart('/').Replace('/', '\')
        $filePath = Join-Path $baseDir $relative
        
        if (Test-Path $filePath -PathType Leaf) {
            $bytes = [System.IO.File]::ReadAllBytes($filePath)
            $ext = [System.IO.Path]::GetExtension($filePath).ToLower()
            $mime = "text/plain"
            if ($ext -eq ".html") { $mime = "text/html; charset=utf-8" }
            elseif ($ext -eq ".css") { $mime = "text/css; charset=utf-8" }
            elseif ($ext -eq ".js") { $mime = "application/javascript; charset=utf-8" }
            elseif ($ext -eq ".json") { $mime = "application/json" }
            elseif ($ext -eq ".png") { $mime = "image/png" }
            
            $response.ContentType = $mime
            $response.ContentLength64 = $bytes.Length
            $response.OutputStream.Write($bytes, 0, $bytes.Length)
        } else {
            $response.StatusCode = 404
            $notFoundBytes = [System.Text.Encoding]::UTF8.GetBytes("404 Not Found")
            $response.OutputStream.Write($notFoundBytes, 0, $notFoundBytes.Length)
        }
        $response.OutputStream.Close()
    }
} finally {
    $listener.Stop()
}
