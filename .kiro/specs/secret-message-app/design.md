# Design Document: Secret Message App

## Overview

The Secret Message App is a web application that enables users to create password-protected secret messages and share them via unique URLs and QR codes. The system consists of three main flows:

1. **Message Creation Flow**: A user creates a secret message with a password, and the system generates a unique URL and QR code
2. **Message Access Flow**: A recipient visits the URL, enters the password, and views the message if authentication succeeds
3. **QR Code Sharing Flow**: The creator downloads the QR code to share through various channels

The application prioritizes security through cryptographically secure random URL generation, password hashing with salt, and timing-attack-resistant password verification. The system is stateless from the user's perspective, with all message data stored server-side and accessed via unique URLs.

## Architecture

### System Components

The application follows a client-server architecture with clear separation of concerns:

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Layer                          │
│  ┌──────────────────┐  ┌──────────────────┐                │
│  │  Message Creator │  │ Message Receiver │                │
│  │      UI          │  │       UI         │                │
│  └──────────────────┘  └──────────────────┘                │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                        Server Layer                          │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              API Endpoints                            │  │
│  │  POST /api/messages    GET /api/messages/:path       │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Business Logic Layer                     │  │
│  │  ┌────────────┐  ┌──────────────┐  ┌─────────────┐ │  │
│  │  │  Message   │  │   Password   │  │  QR Code    │ │  │
│  │  │  Service   │  │   Service    │  │  Generator  │ │  │
│  │  └────────────┘  └──────────────┘  └─────────────┘ │  │
│  └──────────────────────────────────────────────────────┘  │
│                            │                                 │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Data Access Layer                        │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │         Message Repository                     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                     Storage Layer                            │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              Database / File Storage                  │  │
│  └──────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

**Client Layer**:
- Message Creator UI: Form for entering message and password, displays generated URL and QR code
- Message Receiver UI: Password input form and message display

**API Endpoints**:
- `POST /api/messages`: Creates a new secret message
- `GET /api/messages/:path`: Retrieves message metadata (without content)
- `POST /api/messages/:path/verify`: Verifies password and returns message content

**Business Logic Layer**:
- Message Service: Handles message creation, retrieval, and validation
- Password Service: Manages password hashing, salting, and verification with timing-attack protection
- QR Code Generator: Creates QR codes from URLs with appropriate error correction

**Data Access Layer**:
- Message Repository: Abstracts database operations for message storage and retrieval

**Storage Layer**:
- Database: Stores messages with hashed passwords and metadata

## Components and Interfaces

### Message Service

```typescript
interface MessageService {
  /**
   * Creates a new secret message with password protection
   * @param content - The secret message content (1-10000 chars)
   * @param password - The password (4-128 chars)
   * @returns Message metadata including unique path and QR code
   * @throws ValidationError if inputs are invalid
   */
  createMessage(content: string, password: string): Promise<MessageCreationResult>;
  
  /**
   * Retrieves message metadata without content
   * @param path - The unique message path
   * @returns Message metadata or null if not found
   */
  getMessageMetadata(path: string): Promise<MessageMetadata | null>;
  
  /**
   * Verifies password and retrieves message content
   * @param path - The unique message path
   * @param password - The password to verify
   * @returns Message content if password is correct
   * @throws AuthenticationError if password is incorrect
   * @throws NotFoundError if message doesn't exist
   */
  verifyAndGetMessage(path: string, password: string): Promise<string>;
}

interface MessageCreationResult {
  path: string;
  url: string;
  qrCodeDataUrl: string;
}

interface MessageMetadata {
  path: string;
  createdAt: Date;
  exists: boolean;
}
```

### Password Service

```typescript
interface PasswordService {
  /**
   * Hashes a password with a cryptographically secure salt
   * @param password - Plain text password
   * @returns Hashed password with salt
   */
  hashPassword(password: string): Promise<string>;
  
  /**
   * Verifies a password against a hash using constant-time comparison
   * @param password - Plain text password to verify
   * @param hash - Stored password hash
   * @returns True if password matches
   */
  verifyPassword(password: string, hash: string): Promise<boolean>;
}
```

Implementation notes:
- Use bcrypt or Argon2 for password hashing (both include salting)
- bcrypt.compare() provides constant-time comparison
- Minimum cost factor: 10 for bcrypt, or appropriate parameters for Argon2

### Path Generator Service

```typescript
interface PathGeneratorService {
  /**
   * Generates a cryptographically secure random URL path
   * @returns URL-safe random string with at least 16 characters of entropy
   */
  generatePath(): string;
  
  /**
   * Checks if a path already exists in storage
   * @param path - The path to check
   * @returns True if path exists
   */
  pathExists(path: string): Promise<boolean>;
  
  /**
   * Generates a unique path that doesn't exist in storage
   * @returns Unique URL-safe random string
   */
  generateUniquePath(): Promise<string>;
}
```

Implementation notes:
- Use crypto.randomBytes() or equivalent cryptographically secure random generator
- Encode using base64url (URL-safe base64 without padding)
- Minimum 16 bytes of random data = 128 bits of entropy
- Collision probability: < 1 in 1 billion for 1 million messages

### QR Code Generator

```typescript
interface QRCodeGenerator {
  /**
   * Generates a QR code image from a URL
   * @param url - The URL to encode
   * @param options - QR code generation options
   * @returns QR code as data URL (PNG format)
   */
  generateQRCode(url: string, options?: QRCodeOptions): Promise<string>;
  
  /**
   * Generates a downloadable QR code file
   * @param url - The URL to encode
   * @param filename - Optional filename (defaults to timestamp-based name)
   * @returns QR code as buffer with filename
   */
  generateDownloadableQRCode(url: string, filename?: string): Promise<QRCodeFile>;
}

interface QRCodeOptions {
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'; // Default: 'M'
  width?: number; // Default: 300px
  margin?: number; // Default: 4
}

interface QRCodeFile {
  buffer: Buffer;
  filename: string;
  mimeType: string;
}
```

Implementation notes:
- Use established QR code library (e.g., qrcode, node-qrcode)
- Error correction level 'M' (15% recovery) is sufficient for URLs
- Minimum 300x300px for print/screen scanning
- Filename format: `secret-message-{timestamp}.png`

### Message Repository

```typescript
interface MessageRepository {
  /**
   * Stores a new message with hashed password
   * @param message - Message data to store
   * @returns The stored message with generated ID
   */
  save(message: MessageEntity): Promise<MessageEntity>;
  
  /**
   * Retrieves a message by its unique path
   * @param path - The unique message path
   * @returns Message entity or null if not found
   */
  findByPath(path: string): Promise<MessageEntity | null>;
  
  /**
   * Checks if a path exists
   * @param path - The path to check
   * @returns True if path exists
   */
  existsByPath(path: string): Promise<boolean>;
}
```

## Data Models

### Message Entity

```typescript
interface MessageEntity {
  id: string;                    // Primary key (UUID)
  path: string;                  // Unique random path (indexed)
  content: string;               // Encrypted or plain message content
  passwordHash: string;          // Hashed password with salt
  createdAt: Date;              // Creation timestamp
  expiresAt?: Date;             // Optional expiration (future enhancement)
}
```

Database schema considerations:
- `path` must have a unique index for fast lookups
- `content` should support up to 10000 characters
- `passwordHash` typically 60 characters for bcrypt
- Consider adding TTL/expiration for automatic cleanup

### Validation Rules

```typescript
interface MessageValidation {
  content: {
    minLength: 1;
    maxLength: 10000;
    required: true;
  };
  password: {
    minLength: 4;
    maxLength: 128;
    required: true;
  };
}
```

### URL Structure

```
https://{domain}/message/{path}

Example: https://secretmsg.app/message/Kx9mP2nQ7vR4sT8w
```

Where:
- `{path}` is a cryptographically secure random string
- Minimum 16 bytes (128 bits) of entropy
- URL-safe base64 encoding (characters: A-Z, a-z, 0-9, -, _)
- Typical length: 22 characters for 16 bytes base64url encoded


## Correctness Properties

A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees.

### Property Reflection

After analyzing all acceptance criteria, I identified the following redundancies:
- Criteria 1.3 is redundant with 1.2 (both test path uniqueness)
- Criteria 2.4 is redundant with 2.2 (both test QR code encoding correctness via round-trip)
- Criteria 7.1 is redundant with 1.4 (both test that passwords are not stored in plain text)

These redundant criteria will be consolidated into single comprehensive properties.

### Property 1: Message Creation Accepts Valid Inputs

For any valid secret message (1-10000 characters) and valid password (4-128 characters), the system should successfully create a message and return a message URL without error.

**Validates: Requirements 1.1**

### Property 2: Generated Paths Are Unique

For any collection of created messages, all generated URL paths should be distinct from each other.

**Validates: Requirements 1.2, 1.3**

### Property 3: Passwords Are Never Stored In Plain Text

For any message created with a password, the stored password hash should not equal the original plain text password.

**Validates: Requirements 1.4, 7.1**

### Property 4: Message Creation Returns Valid URL

For any created message, the returned URL should have a valid structure matching the pattern `https://{domain}/message/{path}` where path is a non-empty string.

**Validates: Requirements 1.5**

### Property 5: QR Code Generated For Every Message

For any message creation, a QR code should be generated and included in the response.

**Validates: Requirements 2.1**

### Property 6: QR Code Round-Trip Preserves URL

For any message URL, encoding it to a QR code and then decoding the QR code should return the original URL.

**Validates: Requirements 2.2, 2.4**

### Property 7: QR Code Is Valid Image Format

For any generated QR code, the data should be in a valid PNG image format.

**Validates: Requirements 2.3, 8.2**

### Property 8: Message Content Not Leaked Before Authentication

For any message URL, accessing it without providing a password should not return the secret message content in the response.

**Validates: Requirements 3.2**

### Property 9: Correct Password Returns Message

For any message created with a password, verifying with the same password should return the original message content.

**Validates: Requirements 3.4**

### Property 10: Incorrect Password Returns Error

For any message created with a password, verifying with a different password should return an authentication error and not return the message content.

**Validates: Requirements 3.5**

### Property 11: Non-Existent Paths Return Not Found

For any randomly generated path that was never created, accessing it should return a "not found" error.

**Validates: Requirements 4.1**

### Property 12: Path Existence Not Revealed Before Authentication

For any two paths (one existing, one non-existing), the response structure and timing when accessing them without authentication should be indistinguishable.

**Validates: Requirements 4.2**

### Property 13: Generated Paths Have Sufficient Entropy

For any generated path, it should have a minimum length that provides at least 16 characters of entropy (typically 22+ characters for base64url encoding of 16 bytes).

**Validates: Requirements 6.2**

### Property 14: Generated Paths Use URL-Safe Characters

For any generated path, all characters should be from the URL-safe character set (A-Z, a-z, 0-9, -, _).

**Validates: Requirements 6.3**

### Property 15: Password Salting Produces Different Hashes

For any password, hashing it multiple times should produce different hash values due to unique salts.

**Validates: Requirements 7.2**

### Property 16: QR Code Has Sufficient Resolution

For any generated QR code image, it should have minimum dimensions of 300x300 pixels to ensure scannability.

**Validates: Requirements 8.3**

### Property 17: QR Code Filename Contains Identifier

For any generated QR code filename, it should contain either a timestamp or unique identifier.

**Validates: Requirements 8.4**

## Error Handling

### Error Types

The system should handle the following error conditions:

**Validation Errors** (HTTP 400):
- Empty message content
- Empty password
- Message content exceeds 10000 characters
- Password length outside 4-128 character range
- Invalid input format

**Authentication Errors** (HTTP 401):
- Incorrect password provided
- Password verification failed

**Not Found Errors** (HTTP 404):
- Message path does not exist
- Invalid URL structure

**Server Errors** (HTTP 500):
- Database connection failure
- QR code generation failure
- Path generation collision (after retries)
- Unexpected system errors

### Error Response Format

All errors should return a consistent JSON structure:

```typescript
interface ErrorResponse {
  error: {
    code: string;           // Machine-readable error code
    message: string;        // Human-readable error message
    details?: any;          // Optional additional context
  };
}
```

Examples:

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Message content cannot be empty"
  }
}

{
  "error": {
    "code": "AUTHENTICATION_FAILED",
    "message": "Incorrect password"
  }
}

{
  "error": {
    "code": "MESSAGE_NOT_FOUND",
    "message": "The requested message does not exist"
  }
}
```

### Error Handling Strategies

**Input Validation**:
- Validate all inputs on both client and server side
- Return specific validation errors to help users correct input
- Sanitize inputs to prevent injection attacks

**Authentication Failures**:
- Use generic error messages to avoid leaking information
- Implement rate limiting to prevent brute force attacks
- Log failed authentication attempts for security monitoring

**Path Collision Handling**:
- Retry path generation up to 3 times if collision detected
- Log collision events for monitoring
- Return server error if all retries fail (extremely unlikely)

**Database Errors**:
- Catch and log database errors
- Return generic server error to client
- Implement connection pooling and retry logic

**QR Code Generation Errors**:
- Validate URL before QR code generation
- Catch library errors and return appropriate error response
- Provide fallback: return URL even if QR code generation fails

## Testing Strategy

### Dual Testing Approach

The testing strategy employs both unit tests and property-based tests to ensure comprehensive coverage:

**Unit Tests**: Focus on specific examples, edge cases, and integration points
- Specific example scenarios (empty inputs, boundary values)
- Integration between components
- Error handling paths
- UI behavior verification

**Property-Based Tests**: Verify universal properties across randomized inputs
- Universal correctness properties that hold for all valid inputs
- Comprehensive input coverage through randomization
- Minimum 100 iterations per property test
- Each test references its corresponding design property

### Property-Based Testing Configuration

**Library Selection**:
- JavaScript/TypeScript: Use `fast-check` library
- Python: Use `hypothesis` library
- Other languages: Select established PBT library for the target language

**Test Configuration**:
- Minimum 100 iterations per property test (configurable via `numRuns` or equivalent)
- Each property test must include a comment tag: `Feature: secret-message-app, Property {number}: {property_text}`
- Use appropriate generators for test data (strings, numbers, dates, etc.)
- Configure shrinking to find minimal failing examples

**Test Organization**:
```
tests/
├── unit/
│   ├── message-service.test.ts
│   ├── password-service.test.ts
│   ├── qr-generator.test.ts
│   └── path-generator.test.ts
├── property/
│   ├── message-creation.property.test.ts
│   ├── password-security.property.test.ts
│   ├── qr-code.property.test.ts
│   └── authentication.property.test.ts
└── integration/
    ├── api-endpoints.test.ts
    └── end-to-end.test.ts
```

### Unit Test Coverage

**Message Service**:
- Empty message rejection (Requirement 5.1)
- Empty password rejection (Requirement 5.2)
- Message at 10000 character boundary (Requirement 5.3)
- Password at 4 and 128 character boundaries (Requirement 5.4)
- Successful message creation flow
- Message retrieval with correct password
- Message retrieval with incorrect password
- Non-existent message handling

**Password Service**:
- Password hashing produces non-plain-text output
- Same password with different salts produces different hashes
- Password verification with correct password returns true
- Password verification with incorrect password returns false
- Constant-time comparison (timing analysis)

**Path Generator Service**:
- Generated paths have minimum length
- Generated paths use only URL-safe characters
- Path uniqueness check works correctly
- Unique path generation retries on collision

**QR Code Generator**:
- QR code generation from URL succeeds
- Generated QR code is valid PNG format
- QR code has minimum 300x300 resolution
- QR code filename includes timestamp
- Download button present in UI (Requirement 8.1)

**API Endpoints**:
- POST /api/messages with valid input returns 201
- POST /api/messages with invalid input returns 400
- GET /api/messages/:path for existing message returns metadata
- GET /api/messages/:path for non-existing message returns 404
- POST /api/messages/:path/verify with correct password returns message
- POST /api/messages/:path/verify with incorrect password returns 401
- Password input form displayed when visiting message URL (Requirement 3.1)

### Property-Based Test Coverage

Each property test should:
1. Generate random valid inputs using appropriate generators
2. Execute the system operation
3. Assert the property holds
4. Include the feature and property tag in a comment

**Example Property Test Structure** (using fast-check):

```typescript
// Feature: secret-message-app, Property 2: Generated Paths Are Unique
test('generated paths are unique', async () => {
  await fc.assert(
    fc.asyncProperty(
      fc.array(fc.tuple(fc.string({ minLength: 1, maxLength: 10000 }), 
                        fc.string({ minLength: 4, maxLength: 128 })), 
               { minLength: 2, maxLength: 100 }),
      async (messagePairs) => {
        const paths = [];
        for (const [content, password] of messagePairs) {
          const result = await messageService.createMessage(content, password);
          paths.push(result.path);
        }
        const uniquePaths = new Set(paths);
        return uniquePaths.size === paths.length;
      }
    ),
    { numRuns: 100 }
  );
});
```

### Integration Testing

**End-to-End Flows**:
- Complete message creation and retrieval flow
- QR code generation and scanning simulation
- Error handling across component boundaries
- Database persistence and retrieval

**Security Testing**:
- Timing attack resistance verification
- Password hash security validation
- Path unpredictability analysis
- Information leakage prevention

### Test Data Generators

For property-based tests, define generators for:
- Valid messages: strings 1-10000 characters
- Valid passwords: strings 4-128 characters
- Invalid messages: empty strings, strings > 10000 characters
- Invalid passwords: empty strings, strings < 4 or > 128 characters
- URL paths: random URL-safe strings
- Timestamps: valid date ranges

### Continuous Integration

- Run all unit tests on every commit
- Run property-based tests on every pull request
- Run integration tests before deployment
- Monitor test execution time and optimize slow tests
- Maintain minimum 80% code coverage threshold
