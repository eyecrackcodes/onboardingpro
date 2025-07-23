# IBR Integration Testing Guide

## Quick Start Testing

### 1. Access the Test Page

Navigate to: http://localhost:3000/admin/ibr-test

This page will help you verify:

- API connectivity
- Credential validation
- Response handling

### 2. Test with a Candidate

1. **Generate Test Data**:

   - Go to http://localhost:3000/admin/generate-test-data
   - Click "Generate Test Candidates"
   - This creates candidates with passing interview scores

2. **Navigate to a Candidate**:

   - Go to http://localhost:3000/candidates
   - Select a candidate with "Interview: Passed" status
   - Click on their name to view details

3. **Go to Background Check Tab**:

   - Click on the "Background Check" tab
   - You'll see pre-filled test data (in development mode)

4. **Sign the Release Form**:

   - Click "Sign Release Form"
   - Review the authorization text
   - Type a name in the signature field
   - Click "Sign and Generate Authorization Form"

5. **Submit Background Check**:
   - Verify the pre-filled data:
     - SSN: 555123456 (test SSN)
     - DOB: 1990-01-01
     - Address: 123 Test Street
     - City: Tampa
     - State: FL
     - ZIP: 33601
   - Click "Initiate Background Check with IBR"

### 3. Monitor Console Logs

Open browser DevTools (F12) and check the Console tab for:

- Request data being sent
- XML generation
- API responses
- Any error messages

### 4. Expected Results

**Success Case**:

- Alert showing "Background check initiated successfully. IBR ID: [number]"
- Background check status changes to "In Progress"
- IBR ID displayed in the UI

**Common Issues**:

1. **"Unknown error occurred"** - Check console for XML parsing issues
2. **401 Unauthorized** - Verify credentials in .env.local
3. **Network errors** - Check internet connection

### 5. Debugging Steps

1. **Check API Route Logs**:

   - Look in your terminal running `npm run dev`
   - You'll see server-side console logs

2. **Verify XML Format**:

   - Console logs show the generated XML
   - Ensure all tags are properly formed
   - Check for `<NAME>` tags (not `<n>`)

3. **Test Credentials**:
   - Username: ApAttonLL
   - Password: G4#tPkM7@qTT
   - These are hardcoded for testing

### 6. Test Data Reference

**Valid Test SSNs** (IBR Development):

- 555-00-1234 through 555-99-9999

**Valid State Codes**:

- Use standard 2-letter codes (FL, NY, CA, etc.)

**Date Format**:

- Input: YYYY-MM-DD (HTML date input)
- Converted to: MMDDYYYY for IBR

### 7. Next Steps After Testing

Once you confirm the integration works:

1. **Check Status**:

   - Click "Check Status" button
   - This polls IBR for updates

2. **Download Report**:

   - When status shows "Completed"
   - Click "Download Report"

3. **Production Setup**:
   - Update API routes to use production endpoints
   - Set proper environment variables
   - Implement proper SSN handling/encryption

## Troubleshooting Checklist

- [ ] Dev server running (`npm run dev`)
- [ ] Browser console open for logs
- [ ] Test candidate has passed interview
- [ ] Release form signed/uploaded
- [ ] All required fields filled
- [ ] No XML syntax errors in console
- [ ] API returns 200 status

## Support

If issues persist:

1. Check server logs in terminal
2. Review XML format in console
3. Verify IBR API is accessible
4. Check credentials are correct
