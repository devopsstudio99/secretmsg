# Implementation Plan: Secret Message App

## Overview

This implementation plan breaks down the Secret Message App into discrete coding tasks. The app enables users to create password-protected secret messages and share them via unique URLs and QR codes. The implementation follows a layered architecture: data models → services → API endpoints → client UI, with property-based tests integrated throughout to validate correctness properties early.

## Tasks

- [x] 1. Set up project structure and dependencies
  - Create TypeScript project with appropriate tsconfig
  - Install dependencies: bcrypt, qrcode, fast-check (dev), testing framework
  - Set up database client (e.g., PostgreSQL with pg or Prisma)
  - Configure environment variables for database connection and domain URL
  - _Requirements: All_

- [ ] 2. Implement data models and validation
  - [x] 2.1 Create MessageEntity interface and validation functions
    - Define MessageEntity TypeScript interface with all fields (id, path, content, passwordHash, createdAt, expiresAt)
    - Implement validation functions for message content (1-10000 chars) and password (4-128 chars)
    - Create ValidationError custom error class
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [ ]* 2.2 Write property test for message validation
    - **Property 1: Message Creation Accepts Valid Inputs**
    - **Validates: Requirements 1.1**

- [ ] 3. Implement Password Service
  - [x] 3.1 Create PasswordService with hashing and verification
    - Implement hashPassword() using bcrypt with cost factor 10
    - Implement verifyPassword() using bcrypt.compare() for constant-time comparison
    - _Requirements: 1.4, 7.1, 7.2, 7.4_

  - [ ]* 3.2 Write property tests for password security
    - **Property 3: Passwords Are Never Stored In Plain Text**
    - **Validates: Requirements 1.4, 7.1**

  - [ ]* 3.3 Write property test for password salting
    - **Property 15: Password Salting Produces Different Hashes**
    - **Validates: Requirements 7.2**

  - [ ]* 3.4 Write unit tests for PasswordService
    - Test password verification with correct password returns true
    - Test password verification with incorrect password returns false
    - Test same password produces different hashes

- [ ] 4. Implement Path Generator Service
  - [x] 4.1 Create PathGeneratorService with secure random generation
    - Implement generatePath() using crypto.randomBytes(16) with base64url encoding
    - Implement pathExists() to check database for existing paths
    - Implement generateUniquePath() with retry logic (max 3 attempts)
    - _Requirements: 1.2, 1.3, 6.1, 6.2, 6.3, 6.4_

  - [ ]* 4.2 Write property test for path uniqueness
    - **Property 2: Generated Paths Are Unique**
    - **Validates: Requirements 1.2, 1.3**

  - [ ]* 4.3 Write property test for path entropy
    - **Property 13: Generated Paths Have Sufficient Entropy**
    - **Validates: Requirements 6.2**

  - [ ]* 4.4 Write property test for URL-safe characters
    - **Property 14: Generated Paths Use URL-Safe Characters**
    - **Validates: Requirements 6.3**

  - [ ]* 4.5 Write unit tests for PathGeneratorService
    - Test generated paths have minimum length of 22 characters
    - Test path uniqueness check works correctly
    - Test unique path generation retries on collision

- [ ] 5. Implement Message Repository
  - [x] 5.1 Create MessageRepository with database operations
    - Implement save() to insert MessageEntity into database
    - Implement findByPath() to query message by unique path
    - Implement existsByPath() to check path existence
    - Create database schema with unique index on path field
    - _Requirements: 1.1, 1.2, 1.3_

  - [ ]* 5.2 Write unit tests for MessageRepository
    - Test save() persists message correctly
    - Test findByPath() retrieves correct message
    - Test findByPath() returns null for non-existent path
    - Test existsByPath() returns true/false correctly

- [x] 6. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 7. Implement QR Code Generator
  - [x] 7.1 Create QRCodeGenerator with image generation
    - Implement generateQRCode() using qrcode library with error correction level 'M'
    - Set default width to 300px and margin to 4
    - Return QR code as data URL in PNG format
    - Implement generateDownloadableQRCode() with timestamp-based filename
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 8.2, 8.3, 8.4_

  - [ ]* 7.2 Write property test for QR code round-trip
    - **Property 6: QR Code Round-Trip Preserves URL**
    - **Validates: Requirements 2.2, 2.4**

  - [ ]* 7.3 Write property test for QR code image format
    - **Property 7: QR Code Is Valid Image Format**
    - **Validates: Requirements 2.3, 8.2**

  - [ ]* 7.4 Write property test for QR code resolution
    - **Property 16: QR Code Has Sufficient Resolution**
    - **Validates: Requirements 8.3**

  - [ ]* 7.5 Write property test for QR code filename
    - **Property 17: QR Code Filename Contains Identifier**
    - **Validates: Requirements 8.4**

  - [ ]* 7.6 Write unit tests for QRCodeGenerator
    - Test QR code generation from URL succeeds
    - Test generated QR code is valid PNG format
    - Test QR code has minimum 300x300 resolution
    - Test filename includes timestamp

- [ ] 8. Implement Message Service
  - [x] 8.1 Create MessageService with business logic
    - Implement createMessage() that validates inputs, generates unique path, hashes password, saves to repository, generates QR code
    - Implement getMessageMetadata() that retrieves message without content
    - Implement verifyAndGetMessage() that verifies password and returns content
    - Create custom error classes: AuthenticationError, NotFoundError
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5, 2.1, 3.3, 3.4, 3.5, 4.1, 5.1, 5.2_

  - [ ]* 8.2 Write property test for message creation URL format
    - **Property 4: Message Creation Returns Valid URL**
    - **Validates: Requirements 1.5**

  - [ ]* 8.3 Write property test for QR code generation
    - **Property 5: QR Code Generated For Every Message**
    - **Validates: Requirements 2.1**

  - [ ]* 8.4 Write property test for correct password authentication
    - **Property 9: Correct Password Returns Message**
    - **Validates: Requirements 3.4**

  - [ ]* 8.5 Write property test for incorrect password rejection
    - **Property 10: Incorrect Password Returns Error**
    - **Validates: Requirements 3.5**

  - [ ]* 8.6 Write property test for non-existent path handling
    - **Property 11: Non-Existent Paths Return Not Found**
    - **Validates: Requirements 4.1**

  - [ ]* 8.7 Write unit tests for MessageService
    - Test empty message rejection
    - Test empty password rejection
    - Test message at 10000 character boundary
    - Test password at 4 and 128 character boundaries
    - Test successful message creation flow
    - Test message retrieval with correct password
    - Test message retrieval with incorrect password
    - Test non-existent message handling

- [x] 9. Checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

- [ ] 10. Implement API endpoints
  - [x] 10.1 Create POST /api/messages endpoint
    - Accept JSON body with content and password fields
    - Validate inputs and return 400 for validation errors
    - Call MessageService.createMessage()
    - Return 201 with MessageCreationResult (path, url, qrCodeDataUrl)
    - Implement error handling with consistent ErrorResponse format
    - _Requirements: 1.1, 1.5, 5.1, 5.2_

  - [x] 10.2 Create GET /api/messages/:path endpoint
    - Extract path parameter from URL
    - Call MessageService.getMessageMetadata()
    - Return 404 if message not found
    - Return 200 with MessageMetadata (without content)
    - _Requirements: 3.1, 4.1_

  - [x] 10.3 Create POST /api/messages/:path/verify endpoint
    - Extract path parameter and password from request body
    - Call MessageService.verifyAndGetMessage()
    - Return 401 for incorrect password
    - Return 404 for non-existent message
    - Return 200 with message content if authentication succeeds
    - _Requirements: 3.3, 3.4, 3.5, 4.1_

  - [ ]* 10.4 Write property test for content leakage prevention
    - **Property 8: Message Content Not Leaked Before Authentication**
    - **Validates: Requirements 3.2**

  - [ ]* 10.5 Write property test for path existence timing
    - **Property 12: Path Existence Not Revealed Before Authentication**
    - **Validates: Requirements 4.2**

  - [ ]* 10.6 Write integration tests for API endpoints
    - Test POST /api/messages with valid input returns 201
    - Test POST /api/messages with invalid input returns 400
    - Test GET /api/messages/:path for existing message returns metadata
    - Test GET /api/messages/:path for non-existing message returns 404
    - Test POST /api/messages/:path/verify with correct password returns message
    - Test POST /api/messages/:path/verify with incorrect password returns 401

- [ ] 11. Implement Message Creator UI
  - [x] 11.1 Create message creation form component
    - Build form with textarea for message content (max 10000 chars)
    - Build form with input for password (4-128 chars)
    - Add client-side validation with error messages
    - Add submit button that calls POST /api/messages
    - Display validation errors from server
    - _Requirements: 5.1, 5.2, 5.3, 5.4_

  - [x] 11.2 Create message result display component
    - Display generated URL in copyable text field
    - Display QR code image from data URL
    - Add download button for QR code that triggers file download
    - Show success message after message creation
    - _Requirements: 1.5, 2.1, 2.3, 8.1_

  - [ ]* 11.3 Write unit tests for Message Creator UI
    - Test form validation displays errors for empty inputs
    - Test form validation displays errors for out-of-range inputs
    - Test successful submission displays URL and QR code
    - Test download button triggers file download

- [ ] 12. Implement Message Receiver UI
  - [x] 12.1 Create message access page component
    - Extract path from URL route parameter
    - Call GET /api/messages/:path on page load
    - Display password input form (not message content initially)
    - Handle 404 error with "message not found" display
    - _Requirements: 3.1, 3.2, 4.1_

  - [x] 12.2 Create password verification and message display
    - Handle password form submission calling POST /api/messages/:path/verify
    - Display message content on successful authentication
    - Display error message for incorrect password with retry option
    - Handle 401 error with "incorrect password" message
    - _Requirements: 3.3, 3.4, 3.5_

  - [ ]* 12.3 Write unit tests for Message Receiver UI
    - Test password input form displayed on page load
    - Test message content not displayed before authentication
    - Test correct password displays message content
    - Test incorrect password displays error and allows retry
    - Test non-existent path displays "message not found"

- [ ] 13. Implement error handling and security features
  - [x] 13.1 Add rate limiting to password verification endpoint
    - Implement rate limiting middleware (e.g., 5 attempts per minute per IP)
    - Return 429 Too Many Requests when limit exceeded
    - Log failed authentication attempts
    - _Requirements: 7.4_

  - [x] 13.2 Configure HTTPS and security headers
    - Ensure all endpoints use HTTPS in production
    - Add security headers (HSTS, CSP, X-Frame-Options)
    - Configure CORS appropriately
    - _Requirements: 7.3_

  - [ ]* 13.3 Write security tests
    - Test rate limiting blocks excessive requests
    - Test timing attack resistance (constant-time comparison)
    - Test password not transmitted over HTTP

- [ ] 14. Final integration and wiring
  - [x] 14.1 Wire all components together
    - Connect client UI to API endpoints
    - Configure routing for message creation and access pages
    - Set up database connection and migrations
    - Configure environment variables for production
    - _Requirements: All_

  - [ ]* 14.2 Write end-to-end integration tests
    - Test complete message creation and retrieval flow
    - Test QR code generation and scanning simulation
    - Test error handling across component boundaries

- [x] 15. Final checkpoint - Ensure all tests pass
  - Ensure all tests pass, ask the user if questions arise.

## Notes

- Tasks marked with `*` are optional and can be skipped for faster MVP
- Each task references specific requirements for traceability
- Property-based tests use fast-check library with minimum 100 iterations
- All property tests include feature tag: `Feature: secret-message-app, Property {number}`
- Checkpoints ensure incremental validation throughout implementation
- Implementation language: TypeScript (as specified in design document)
