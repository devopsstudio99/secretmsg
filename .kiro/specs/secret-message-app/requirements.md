# Requirements Document

## Introduction

Secret Message App เป็นแอปพลิเคชันที่ช่วยให้ผู้ใช้สามารถส่งข้อความลับที่มีการป้องกันด้วยรหัสผ่านได้ โดยผู้ส่งจะสร้างข้อความและรหัสผ่าน จากนั้นระบบจะสร้าง URL แบบสุ่มและ QR Code สำหรับแชร์ให้ผู้รับ ผู้รับจะต้องใช้รหัสผ่านที่ถูกต้องเพื่อเข้าถึงข้อความ

## Glossary

- **Message_Creator**: ผู้ใช้ที่สร้างและส่งข้อความลับ
- **Message_Receiver**: ผู้ใช้ที่รับและอ่านข้อความลับ
- **Secret_Message**: ข้อความที่ต้องการเก็บเป็นความลับ
- **Password**: รหัสผ่านที่ใช้ป้องกันการเข้าถึงข้อความ
- **Message_URL**: URL ที่มี path แบบสุ่มสำหรับเข้าถึงข้อความ
- **QR_Code**: รูปภาพ QR Code ที่เก็บ Message_URL
- **Message_Storage**: ระบบจัดเก็บข้อความและรหัสผ่าน
- **QR_Generator**: ระบบสร้าง QR Code จาก URL
- **Password_Validator**: ระบบตรวจสอบความถูกต้องของรหัสผ่าน

## Requirements

### Requirement 1: Create Secret Message

**User Story:** As a Message_Creator, I want to create a secret message with a password, so that only people with the password can read it

#### Acceptance Criteria

1. THE Message_Storage SHALL accept a Secret_Message and Password from the Message_Creator
2. WHEN a Secret_Message is submitted, THE Message_Storage SHALL generate a unique random path for the Message_URL
3. THE Message_Storage SHALL ensure the generated path is unique across all stored messages
4. WHEN a Secret_Message is stored, THE Message_Storage SHALL hash the Password before storage
5. THE Message_Storage SHALL return the Message_URL to the Message_Creator

### Requirement 2: Generate QR Code

**User Story:** As a Message_Creator, I want to get a QR code for my secret message, so that I can easily share it with the receiver

#### Acceptance Criteria

1. WHEN a Message_URL is created, THE QR_Generator SHALL generate a QR_Code containing the Message_URL
2. THE QR_Generator SHALL encode the complete Message_URL in the QR_Code
3. THE QR_Generator SHALL provide the QR_Code as a downloadable image file
4. WHEN the QR_Code is scanned, THE decoded value SHALL match the original Message_URL

### Requirement 3: Access Secret Message

**User Story:** As a Message_Receiver, I want to access a secret message using a URL, so that I can view the protected content

#### Acceptance Criteria

1. WHEN a Message_Receiver visits a Message_URL, THE system SHALL display a password input form
2. THE system SHALL not display the Secret_Message before password verification
3. WHEN a Message_Receiver submits a Password, THE Password_Validator SHALL verify it against the stored hashed password
4. IF the Password is correct, THEN THE system SHALL display the Secret_Message
5. IF the Password is incorrect, THEN THE system SHALL display an error message and allow retry

### Requirement 4: Handle Invalid URLs

**User Story:** As a Message_Receiver, I want to know if a message URL is invalid, so that I don't waste time trying to access it

#### Acceptance Criteria

1. WHEN a Message_Receiver visits a non-existent Message_URL, THE system SHALL display a "message not found" error
2. THE system SHALL not reveal whether a URL path exists before password verification

### Requirement 5: Message Input Validation

**User Story:** As a Message_Creator, I want the system to validate my input, so that I create valid secret messages

#### Acceptance Criteria

1. WHEN a Message_Creator submits an empty Secret_Message, THE system SHALL display a validation error
2. WHEN a Message_Creator submits an empty Password, THE system SHALL display a validation error
3. THE system SHALL accept Secret_Messages up to 10000 characters in length
4. THE system SHALL accept Passwords between 4 and 128 characters in length

### Requirement 6: URL Path Generation

**User Story:** As a system administrator, I want message URLs to be unpredictable, so that messages remain secure

#### Acceptance Criteria

1. THE Message_Storage SHALL generate URL paths using cryptographically secure random values
2. THE Message_Storage SHALL generate URL paths with at least 16 characters of entropy
3. THE Message_Storage SHALL use URL-safe characters in generated paths
4. FOR ALL generated paths, THE probability of collision SHALL be less than 1 in 1 billion for 1 million messages

### Requirement 7: Password Security

**User Story:** As a Message_Creator, I want my password to be stored securely, so that my message remains protected

#### Acceptance Criteria

1. THE Message_Storage SHALL never store passwords in plain text
2. WHEN storing a Password, THE Message_Storage SHALL use a cryptographic hash function with salt
3. THE system SHALL not transmit passwords over unencrypted connections
4. THE Password_Validator SHALL use constant-time comparison to prevent timing attacks

### Requirement 8: QR Code Download

**User Story:** As a Message_Creator, I want to download the QR code, so that I can share it through various channels

#### Acceptance Criteria

1. WHEN a QR_Code is generated, THE system SHALL provide a download button
2. WHEN the Message_Creator clicks download, THE system SHALL save the QR_Code as a PNG image file
3. THE downloaded QR_Code SHALL have sufficient resolution to be scannable when printed or displayed on screen
4. THE QR_Code filename SHALL include a timestamp or unique identifier

