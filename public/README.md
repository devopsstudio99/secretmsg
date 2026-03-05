# Message Creation Form Component

This directory contains the frontend components for the Secret Message App.

## Files

- **index.html**: Main HTML page with the message creation form
- **styles.css**: Styling for the form and result display
- **app.js**: Client-side JavaScript for form validation and API interaction

## Features

### Form Validation

**Client-side validation:**
- Message content: 1-10000 characters (required)
- Password: 4-128 characters (required)
- Real-time character counter for message content
- Validation errors displayed inline

**Server-side validation:**
- All validation errors from the API are displayed in the form
- Error messages are shown in red below each field

### Form Submission

When the user submits the form:
1. Client-side validation runs first
2. If valid, POST request is sent to `/api/messages`
3. Submit button is disabled during the request
4. On success, the result section is displayed with:
   - Message URL (with copy button)
   - QR Code (with download button)
5. On error, validation errors are displayed

### Result Display

After successful message creation:
- Message URL is displayed in a read-only input field
- Copy button copies the URL to clipboard
- QR Code is displayed as an image
- Download button saves the QR code as a PNG file
- "Create Another Message" button resets the form

## Usage

1. Start the server: `npm run dev`
2. Open browser to `http://localhost:3000`
3. Fill in the message and password
4. Click "Create Secret Message"
5. Copy the URL or download the QR code to share

## Requirements Validated

This component validates the following requirements:
- **5.1**: Empty message content displays validation error
- **5.2**: Empty password displays validation error
- **5.3**: Message content up to 10000 characters accepted
- **5.4**: Password between 4-128 characters accepted
