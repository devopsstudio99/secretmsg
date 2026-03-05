# Security Configuration

This document describes the security measures implemented in the Secret Message App.

## HTTPS Configuration

### Production Environment

In production, the application enforces HTTPS connections:

- All HTTP requests are automatically redirected to HTTPS (301 redirect)
- The application checks both `req.secure` and `X-Forwarded-Proto` header
- This ensures secure communication even behind reverse proxies

### Development Environment

In development mode, HTTPS enforcement is disabled to allow local testing.

### Environment Variables

Set `NODE_ENV=production` to enable HTTPS enforcement:

```bash
NODE_ENV=production npm start
```

## Security Headers

The application uses [Helmet](https://helmetjs.github.io/) to set various security headers:

### HTTP Strict Transport Security (HSTS)

Forces browsers to use HTTPS for all future requests:

```
Strict-Transport-Security: max-age=31536000; includeSubDomains; preload
```

- `max-age`: 1 year (31536000 seconds)
- `includeSubDomains`: Applies to all subdomains
- `preload`: Eligible for browser HSTS preload lists

### Content Security Policy (CSP)

Restricts resource loading to prevent XSS attacks:

```
Content-Security-Policy: 
  default-src 'self';
  script-src 'self' 'unsafe-inline';
  style-src 'self' 'unsafe-inline';
  img-src 'self' data: blob:;
  connect-src 'self';
  font-src 'self';
  object-src 'none';
  media-src 'self';
  frame-src 'none'
```

**Note:** `unsafe-inline` is allowed for scripts and styles to support QR code generation. Consider using nonces or hashes for stricter CSP in future versions.

### X-Frame-Options

Prevents clickjacking attacks:

```
X-Frame-Options: DENY
```

The application cannot be embedded in iframes.

### X-Content-Type-Options

Prevents MIME type sniffing:

```
X-Content-Type-Options: nosniff
```

Browsers will not try to guess content types.

### X-XSS-Protection

Enables browser XSS protection:

```
X-XSS-Protection: 1; mode=block
```

### Referrer-Policy

Controls referrer information:

```
Referrer-Policy: strict-origin-when-cross-origin
```

### Other Headers

- `X-DNS-Prefetch-Control: off` - Disables DNS prefetching
- `X-Download-Options: noopen` - Prevents IE from executing downloads
- `X-Permitted-Cross-Domain-Policies: none` - Restricts Flash/PDF policies

## CORS Configuration

Cross-Origin Resource Sharing (CORS) is configured differently for development and production:

### Development

All origins are allowed for easier local development:

```javascript
cors({
  origin: true,
  methods: ['GET', 'POST'],
  credentials: true
})
```

### Production

Origins must be explicitly whitelisted via environment variable:

```bash
ALLOWED_ORIGINS=https://example.com,https://app.example.com
```

If `ALLOWED_ORIGINS` is not set, all origins are blocked (origin: false).

### CORS Settings

- **Methods**: Only GET and POST are allowed
- **Headers**: Content-Type and Authorization
- **Credentials**: Enabled (allows cookies)
- **Max Age**: 24 hours (86400 seconds)

## Password Security

The application implements multiple password security measures:

### Password Hashing

- Uses bcrypt with salt for password hashing
- Passwords are never stored in plain text
- Each password gets a unique salt

### Constant-Time Comparison

- Password verification uses bcrypt's constant-time comparison
- Prevents timing attacks

### HTTPS Requirement

- Passwords are only transmitted over HTTPS in production
- Requirement 7.3: "THE system SHALL not transmit passwords over unencrypted connections"

## Testing

Security configuration is tested in `src/middleware/security.test.ts`:

- HTTPS enforcement in production
- Security header presence and values
- CORS configuration for different environments

Run security tests:

```bash
npm test -- src/middleware/security.test.ts
```

## Deployment Checklist

Before deploying to production:

1. ✅ Set `NODE_ENV=production`
2. ✅ Configure `ALLOWED_ORIGINS` with your domain(s)
3. ✅ Ensure your reverse proxy/load balancer sets `X-Forwarded-Proto: https`
4. ✅ Configure SSL/TLS certificates
5. ✅ Test HTTPS redirect functionality
6. ✅ Verify security headers are present
7. ✅ Test CORS with your frontend domain

## Security Considerations

### Future Improvements

1. **Stricter CSP**: Remove `unsafe-inline` by using nonces or hashes
2. **Rate Limiting**: Already implemented in `src/middleware/rate-limiter.ts`
3. **Certificate Pinning**: Consider implementing for mobile apps
4. **Security Monitoring**: Add logging for security events
5. **Regular Updates**: Keep dependencies updated for security patches

### Known Limitations

- `unsafe-inline` in CSP for scripts and styles (required for QR code generation)
- CORS credentials enabled (required for session management)

## References

- [OWASP Secure Headers Project](https://owasp.org/www-project-secure-headers/)
- [Helmet.js Documentation](https://helmetjs.github.io/)
- [MDN Web Security](https://developer.mozilla.org/en-US/docs/Web/Security)
