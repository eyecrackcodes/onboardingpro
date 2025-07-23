# OnboardingPro Workflow Summary

## Current Workflow Order

The application follows this chronological order:

### 1. Interview → 2. I-9 Form → 3. Background Check → 4. Offer Letter

## Detailed Workflow

### 1. Interview Stage
- **Purpose**: Evaluate candidate suitability
- **Components**: 
  - Interview scheduling via Google Calendar integration
  - Interview evaluation form with scoring
  - Pass/fail determination based on composite score ≥ 4.0
- **Email**: Interview invites sent via Google Calendar

### 2. I-9 Form Collection
- **Purpose**: Collect employment eligibility information
- **Two Methods Available**:
  
  #### Electronic Submission:
  - Email sent to candidate with secure link
  - Candidate completes multi-step form online
  - Data automatically saved to Firestore
  - Email API: `/api/email/send-i9`
  
  #### Manual Upload:
  - For onsite completion
  - Recruiter uploads physical signed PDF
  - Bypasses electronic process
  - Files stored in Firebase Storage (with CORS fallback to base64)

### 3. Background Check (IBR)
- **Purpose**: Verify candidate information
- **Prerequisites**: Interview passed AND I-9 completed
- **Auto-Population**: When I-9 is completed, background check form auto-fills with:
  - Legal name
  - Social Security Number
  - Date of birth
  - Current address
- **Process**:
  - Additional information can be added/verified
  - Release form must be signed (electronic or upload)
  - Submits to IBR API for processing
  - Automatic monitoring for status updates

### 4. Offer Letter
- **Purpose**: Extend employment offer
- **Prerequisites**: I-9 must be completed (background check can be pending)
- **Features**:
  - Dynamic template selection based on location/license status
  - Automatic start date calculation from cohort system
  - Variables dynamically inserted:
    - Candidate name
    - Projected start date
  - Electronic signature capture
  - Signed PDFs stored in Firebase Storage
  - Email API: `/api/email/send-offer`

## Email Functionality

All emails work with graceful fallback:
- **With SendGrid**: Emails sent to candidates
- **Without SendGrid**: Emails logged to console for testing

### Email APIs:
- `/api/email/send-i9` - Sends I-9 form links
- `/api/email/send-offer` - Sends offer letter links

## Data Storage

### Firestore Collections:
- `candidates` - Main candidate data
- `i9Forms` - I-9 form submissions
- `offers` - Offer letter data and status

### Firebase Storage:
- `/i9-forms/[candidateId]/` - Manual I-9 uploads
- `/signed-offers/[offerId].pdf` - Signed offer letters

### CORS Handling:
- Direct upload attempted first
- Falls back to API route `/api/upload/i9` if CORS error
- Final fallback stores base64 in Firestore

## Status Tracking

Each stage tracks completion:
- **Interview**: `interview.status` = "Completed" and `interview.result` = "Passed"
- **I-9**: `i9Status` = "completed"
- **Background Check**: `backgroundCheck.status` = "Completed"
- **Offer**: `offers.preLicenseOffer.signed` = true

## Security Features

- Encrypted form links
- Secure file uploads
- Electronic signature validation
- IP tracking for signatures
- CORS protection with fallback options

## Document Download Features

### Individual Documents
- **Signed Offers**: Download button appears after offer is signed in the candidate's Offers tab
- **I-9 Forms**: Manual uploads can be viewed/downloaded from the I-9 tab
- **Background Check Reports**: Download button available when background check is completed

### Centralized Document Repository
- **Admin Panel**: `/admin/documents` page shows all signed documents
- **Features**:
  - Search by candidate name, email, or document type
  - Filter by document type (Offer, I-9, Background)
  - One-click download for any document
  - Summary statistics
  - Handles both Firebase Storage and base64 fallback downloads

## Testing Mode Features

- Console logging for emails when SendGrid not configured
- Test data pre-population in development mode
- Mock IBR mode for testing without real API calls 