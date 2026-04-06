# Convert Markdown to HTML
# Usage: .\convert.ps1

# Read markdown file
$mdFile = "KAIROS-FRAMEWORK-DOCUMENTATION.md"
$htmlFile = "index.html"

if (-not (Test-Path $mdFile)) {
    Write-Host "Error: $mdFile not found" -ForegroundColor Red
    exit 1
}

Write-Host "Reading $mdFile..." -ForegroundColor Green

$content = Get-Content $mdFile -Raw -Encoding UTF8

# Headers (must be before other replacements)
$content = $content -replace '(?m)^### (.*?)$', '<h3>$1</h3>'
$content = $content -replace '(?m)^## (.*?)$', '<h2>$1</h2>'
$content = $content -replace '(?m)^# (.*?)$', '<h1>$1</h1>'

# Bold and italic
$content = $content -replace '\*\*(.*?)\*\*', '<strong>$1</strong>'
$content = $content -replace '__(.*?)__', '<strong>$1</strong>'
$content = $content -replace '\*(.*?)\*', '<em>$1</em>'
$content = $content -replace '_(.*?)_', '<em>$1</em>'

# Code blocks
$content = $content -replace '(?s)```(.*?)\n(.*?)\n```', '<pre><code>$2</code></pre>'

# Inline code
$content = $content -replace '`([^`]+)`', '<code>$1</code>'

# Links
$content = $content -replace '\[(.*?)\]\((.*?)\)', '<a href="$2">$1</a>'

# Replace horizontal lines
$content = $content -replace '(?m)^---+$', '<hr>'

# Split into lines for list processing
$lines = $content -split "`n"
$newLines = @()
$inList = $false
$inOL = $false

foreach ($line in $lines) {
    if ($line -match '^\d+\. ') {
        if (-not $inOL) {
            $newLines += '<ol>'
            $inOL = $true
            $inList = $true
        }
        $item = $line -replace '^\d+\. ', ''
        $newLines += "<li>$item</li>"
    }
    elseif ($line -match '^- ') {
        if (-not $inList -or $inOL) {
            if ($inOL) {
                $newLines += '</ol>'
                $inOL = $false
            }
            $newLines += '<ul>'
            $inList = $true
        }
        $item = $line -replace '^- ', ''
        $newLines += "<li>$item</li>"
    }
    else {
        if ($inList) {
            if ($inOL) {
                $newLines += '</ol>'
                $inOL = $false
            }
            else {
                $newLines += '</ul>'
            }
            $inList = $false
        }
        $newLines += $line
    }
}

if ($inList) {
    if ($inOL) {
        $newLines += '</ol>'
    }
    else {
        $newLines += '</ul>'
    }
}

$content = $newLines -join "`n"

# Paragraphs
$content = $content -replace '(?m)\n\n+', '</p>`n<p>'
$content = '<p>' + $content + '</p>'
$content = $content -replace '<p></p>', ''

# Remove duplicate tags
$content = $content -replace '<p>(<h[1-6])', '$1'
$content = $content -replace '(</h[1-6]>)</p>', '$1'
$content = $content -replace '<p>(<pre)', '$1'
$content = $content -replace '(</pre>)</p>', '$1'
$content = $content -replace '<p>(<ul|<ol)', '$1'
$content = $content -replace '(</ul|</ol>)</p>', '$1'

# HTML template
$html = @"
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>KAIROS Framework v2.0</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            background: #f5f5f5;
        }
        
        .container {
            max-width: 900px;
            margin: 0 auto;
            padding: 40px 20px;
            background: white;
            min-height: 100vh;
        }
        
        h1 {
            color: #003D7A;
            margin: 30px 0 10px 0;
            font-size: 2.5em;
        }
        
        h2 {
            color: #003D7A;
            margin: 30px 0 15px 0;
            font-size: 1.8em;
        }
        
        h3 {
            color: #00BCD4;
            margin: 20px 0 10px 0;
            font-size: 1.3em;
        }
        
        p {
            margin-bottom: 15px;
            color: #555;
        }
        
        ul, ol {
            margin-left: 20px;
            margin-bottom: 15px;
        }
        
        li {
            margin-bottom: 8px;
            color: #555;
        }
        
        code {
            background: #f4f4f4;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Courier New', monospace;
            color: #d63384;
        }
        
        pre {
            background: #f4f4f4;
            padding: 15px;
            border-radius: 5px;
            overflow-x: auto;
            margin: 15px 0;
            border-left: 4px solid #003D7A;
        }
        
        pre code {
            background: none;
            padding: 0;
            color: #333;
        }
        
        a {
            color: #00BCD4;
            text-decoration: none;
            border-bottom: 1px solid #00BCD4;
        }
        
        a:hover {
            color: #003D7A;
            border-bottom-color: #003D7A;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
        }
        
        table th, table td {
            padding: 10px;
            text-align: left;
            border-bottom: 1px solid #ddd;
        }
        
        table th {
            background: #f4f4f4;
            font-weight: bold;
            color: #003D7A;
        }
        
        table tr:hover {
            background: #f9f9f9;
        }
        
        strong {
            color: #003D7A;
            font-weight: bold;
        }
        
        em {
            font-style: italic;
            color: #666;
        }
        
        hr {
            margin: 30px 0;
            border: none;
            border-top: 1px solid #ddd;
        }
        
        .footer {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 2px solid #003D7A;
            text-align: center;
            color: #666;
            font-size: 0.9em;
        }
        
        @media (max-width: 768px) {
            h1 { font-size: 1.8em; }
            h2 { font-size: 1.4em; }
            .container { padding: 20px 15px; }
        }
    </style>
</head>
<body>
    <div class="container">
        $content
        <div class="footer">
            <p>KAIROS Framework v2.0 | © Comm.it 2026</p>
            <p>"The Right Moment for Development" 🚀</p>
        </div>
    </div>
</body>
</html>
"@

# Save HTML
Set-Content -Path $htmlFile -Value $html -Encoding UTF8

Write-Host "`n✅ Conversion complete!" -ForegroundColor Green
Write-Host "   Input:  $mdFile" -ForegroundColor Green
Write-Host "   Output: $htmlFile" -ForegroundColor Green
Write-Host "`nYou can now deploy to Vercel/Netlify/GitHub Pages" -ForegroundColor Green
