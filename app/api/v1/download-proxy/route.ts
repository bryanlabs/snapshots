import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

const schema = z.object({
  url: z.string().url(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const url = searchParams.get('url');
    
    if (!url) {
      return NextResponse.json(
        { error: 'Missing download URL' },
        { status: 400 }
      );
    }
    
    // Validate the URL is from our snapshot servers
    const validatedUrl = new URL(url);
    const validHosts = ['snapshots.bryanlabs.net', 'snaps.bryanlabs.net'];
    if (!validHosts.some(host => validatedUrl.hostname.includes(host))) {
      return NextResponse.json(
        { error: 'Invalid download URL' },
        { status: 400 }
      );
    }
    
    // Extract filename from URL for display
    const pathParts = validatedUrl.pathname.split('/');
    const filename = pathParts[pathParts.length - 1].split('?')[0];
    
    // Return an HTML page with download instructions
    const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Download ${filename}</title>
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      margin: 0;
      background: #f5f5f5;
    }
    .container {
      text-align: center;
      padding: 2rem;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
      max-width: 800px;
      width: 90%;
    }
    h1 { color: #333; font-size: 1.5rem; margin-bottom: 1rem; }
    p { color: #666; margin: 1rem 0; line-height: 1.6; }
    .notice {
      background: #fef3c7;
      border: 1px solid #fbbf24;
      border-radius: 6px;
      padding: 1rem;
      margin: 1.5rem 0;
    }
    .notice h3 {
      color: #92400e;
      margin: 0 0 0.5rem 0;
      font-size: 1.1rem;
    }
    .notice p {
      color: #92400e;
      margin: 0;
      font-size: 0.95rem;
    }
    .command-box {
      background: #1e293b;
      color: #e2e8f0;
      border-radius: 6px;
      padding: 1rem;
      margin: 1.5rem 0;
      font-family: 'Monaco', 'Consolas', monospace;
      font-size: 0.875rem;
      user-select: all;
      position: relative;
      text-align: left;
      overflow-x: auto;
    }
    .command-label {
      color: #94a3b8;
      font-size: 0.75rem;
      margin-bottom: 0.5rem;
    }
    button {
      background: #3b82f6;
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 6px;
      font-size: 1rem;
      cursor: pointer;
      margin: 0.5rem;
    }
    button:hover { background: #2563eb; }
    button:active { transform: scale(0.98); }
    .secondary { background: #6b7280; }
    .secondary:hover { background: #4b5563; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .options {
      background: #f8fafc;
      border-radius: 6px;
      padding: 1.5rem;
      margin: 1.5rem 0;
      text-align: left;
    }
    .options h3 {
      margin: 0 0 1rem 0;
      color: #334155;
    }
    .options ul {
      margin: 0;
      padding-left: 1.5rem;
    }
    .options li {
      margin: 0.5rem 0;
      color: #475569;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>Download ${filename}</h1>
    
    <div class="notice">
      <h3>⚠️ Browser Download Blocked</h3>
      <p>Due to security restrictions, browsers cannot download from HTTP URLs when on an HTTPS page.</p>
      <p>Please use one of the terminal commands below to download your snapshot.</p>
    </div>

    <div class="command-box">
      <div class="command-label">Using curl:</div>
      <code id="curlCommand">curl -O "${url}"</code>
    </div>
    
    <button onclick="copyCommand('curlCommand', this)">Copy curl command</button>

    <div class="command-box">
      <div class="command-label">Using wget:</div>
      <code id="wgetCommand">wget "${url}"</code>
    </div>
    
    <button onclick="copyCommand('wgetCommand', this)">Copy wget command</button>

    <div class="options">
      <h3>Additional Options:</h3>
      <ul>
        <li><strong>Resume interrupted download:</strong> Add <code>-C -</code> to curl or <code>-c</code> to wget</li>
        <li><strong>Show progress:</strong> Add <code>-#</code> to curl</li>
        <li><strong>Parallel download:</strong> Use <code>aria2c "${url}"</code></li>
      </ul>
    </div>

    <button class="secondary" onclick="window.location.href='/'">Return to Snapshots</button>
  </div>

  <script>
    function copyCommand(elementId, button) {
      const element = document.getElementById(elementId);
      const text = element.textContent;
      
      navigator.clipboard.writeText(text).then(() => {
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 2000);
      }).catch(() => {
        // Fallback for older browsers
        const range = document.createRange();
        range.selectNode(element);
        window.getSelection().removeAllRanges();
        window.getSelection().addRange(range);
        document.execCommand('copy');
        window.getSelection().removeAllRanges();
        
        const originalText = button.textContent;
        button.textContent = 'Copied!';
        button.style.background = '#10b981';
        
        setTimeout(() => {
          button.textContent = originalText;
          button.style.background = '';
        }, 2000);
      });
    }
  </script>
</body>
</html>`;
    
    return new NextResponse(html, {
      headers: {
        'Content-Type': 'text/html',
        'Cache-Control': 'no-store',
      }
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid request' },
      { status: 400 }
    );
  }
}