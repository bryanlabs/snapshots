// Mock for next/server
class NextRequest {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Map();
    
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
    
    this.body = init.body || null;
    
    // Parse URL
    const urlObj = new URL(url);
    this.nextUrl = {
      pathname: urlObj.pathname,
      searchParams: urlObj.searchParams,
      href: urlObj.href,
      origin: urlObj.origin,
    };
  }
  
  text() {
    return Promise.resolve(this.body || '');
  }
  
  json() {
    return Promise.resolve(this.body ? JSON.parse(this.body) : null);
  }
  
  formData() {
    return Promise.resolve(new FormData());
  }
  
  clone() {
    return new NextRequest(this.url, {
      method: this.method,
      headers: Object.fromEntries(this.headers),
      body: this.body,
    });
  }
}

class NextResponse {
  constructor(body, init = {}) {
    this.body = body;
    this.status = init.status || 200;
    this.statusText = init.statusText || 'OK';
    this.headers = new Map();
    
    if (init.headers) {
      Object.entries(init.headers).forEach(([key, value]) => {
        this.headers.set(key, value);
      });
    }
  }
  
  static json(data, init = {}) {
    const response = new NextResponse(JSON.stringify(data), init);
    response.headers.set('content-type', 'application/json');
    return response;
  }
  
  static redirect(url, status = 302) {
    const response = new NextResponse(null, { status });
    response.headers.set('location', url);
    return response;
  }
  
  static rewrite(url) {
    return new NextResponse(null, { headers: { 'x-middleware-rewrite': url } });
  }
  
  static next() {
    return new NextResponse(null);
  }
  
  json() {
    return Promise.resolve(JSON.parse(this.body));
  }
  
  text() {
    return Promise.resolve(this.body);
  }
}

// Polyfill Request if not available
if (typeof global.Request === 'undefined') {
  global.Request = NextRequest;
}

module.exports = {
  NextRequest,
  NextResponse,
};