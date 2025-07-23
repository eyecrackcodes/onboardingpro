# IBR (Interstate Background Research) Integration

This document describes the integration with Interstate Background Research, Inc. (IBR) for automated background checks in the onboarding system.

## Overview

The system integrates with IBR's XML API to:

- Submit background check requests
- Upload signed release forms
- Check status of background checks
- Download completed reports

## Architecture

The integration uses Next.js API routes as a proxy to handle CORS restrictions:

- Browser → Next.js API routes → IBR API
- This allows secure server-to-server communication
- Credentials are kept server-side for security

## Setup

### 1. Environment Variables

Create a `.env.local` file with your IBR credentials:

```env
NEXT_PUBLIC_IBR_USERNAME=your-username
NEXT_PUBLIC_IBR_PASSWORD=your-password
```

### 2. API Environment

The system defaults to the development API. To use production:

- Update the configuration in the API route files (`app/api/ibr/*`)
- Change from `development` to `production` endpoints

## Usage Flow

### 1. Prerequisites

- Candidate must pass interview with score ≥ 4.0
- This ensures only qualified candidates proceed to background check

### 2. Release Form

Two options for obtaining the required release form:

#### Option A: In-System Signing

1. Click "Sign Release Form" in the Background Check section
2. Candidate reviews the authorization text
3. Candidate provides electronic signature
4. System generates an HTML release form

#### Option B: Upload External Form

1. Use Dropbox Sign or other service to obtain signed form
2. Upload the PDF/DOC file in the Background Check section

### 3. Initiate Background Check

1. Enter required candidate information:
   - Social Security Number
   - Date of Birth (will be converted to MMDDYYYY format)
   - Current Address (street, city, state, ZIP)
2. Ensure release form is attached
3. Click "Initiate Background Check with IBR"

### 4. Monitor Status

- System receives an IBR ID for tracking
- Click "Check Status" to get updates
- Status flows: Pending → Processing → Review → Pass/Fail

### 5. Retrieve Results

- When status is "Completed", download the PDF report
- Review results and proceed with onboarding if passed

## API Integration Details

### Key Files

- `lib/ibr-api.ts` - IBR API client implementation
- `components/candidates/BackgroundCheckWithIBR.tsx` - UI component
- `components/candidates/BackgroundCheckReleaseForm.tsx` - Release form
- `app/api/ibr/submit/route.ts` - Proxy for submit requests
- `app/api/ibr/status/route.ts` - Proxy for status checks
- `app/api/ibr/attach/route.ts` - Proxy for file attachments

### API Flow

1. Client makes request to `/api/ibr/*`
2. Next.js API route forwards to IBR with credentials
3. IBR response is returned to client
4. This avoids CORS issues and keeps credentials secure

### Data Flow

1. **Submit Request**: XML request with candidate data → IBR ID response
2. **Attach Release**: Multipart form upload with IBR ID
3. **Check Status**: XML status request → Status response
4. **Get Report**: XML report request → PDF blob response

## Security Considerations

1. **Credentials**: Store IBR credentials in environment variables
2. **SSN Handling**: Use password input fields, never store in plain text
3. **Release Forms**: Ensure proper authorization before submitting
4. **Data Privacy**: Follow FCRA compliance requirements
5. **API Proxy**: Credentials never exposed to client-side code

## Testing

### Development Environment

- Uses IBR's development API endpoints
- Test SSNs: Use 555-XX-XXXX format
- Results are simulated, not real background checks

### Test Data Generation

1. Go to `/admin/generate-test-data`
2. Generate candidates with passing interview scores
3. Test the full background check flow

## Troubleshooting

### Common Issues

1. **"Failed to fetch" Error**
   - This was resolved by implementing API proxy routes
   - If still occurring, check server logs
2. **"Interview Required" Message**
   - Ensure candidate has passed interview with score ≥ 4.0
3. **API Connection Errors**
   - Check credentials in environment variables
   - Verify network connectivity to ibrinc.com
   - Check Next.js server logs for detailed errors
4. **Invalid State Code**
   - Ensure state codes are 2-letter abbreviations (e.g., "FL", "NY")
5. **Missing Release Form**
   - Either sign in-system or upload external form
   - File must be attached before submission

### Error Handling

- API errors display user-friendly messages
- Check browser console for detailed error information
- Check Next.js server logs for API proxy errors
- IBR IDs are preserved for support inquiries

## Future Enhancements

1. **Webhook Integration**: Receive real-time status updates
2. **Bulk Submissions**: Submit multiple candidates at once
3. **Advanced Packages**: Support different background check levels
4. **Automated Retries**: Handle temporary API failures
5. **Dropbox Sign Integration**: Direct API integration for release forms
6. **SSN Encryption**: Implement field-level encryption for sensitive data
