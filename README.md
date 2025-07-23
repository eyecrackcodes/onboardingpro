# Call Center Onboarding Management System

A comprehensive web application to manage call center agent onboarding from initial hiring through full certification. The system handles two distinct phases: individual pre-onboarding pipeline and group cohort training management across two call centers.

## Features

- **Candidate Pipeline Management**: Track candidates through background checks, licensing, offers, and class assignment
- **Cohort Training Tracking**: Manage group training sessions with weekly progression
- **Real-time Updates**: Live data synchronization across all views
- **Multi-Center Support**: Separate tracking for Center 1 and Center 2
- **Dashboard Overview**: High-level metrics and alerts for pending actions

## Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **UI Components**: shadcn/ui with Tailwind CSS
- **Database**: Firebase Firestore
- **Real-time**: Firestore listeners for live updates

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Firebase account with Firestore enabled
- Basic knowledge of React and TypeScript

### Installation

1. Clone the repository:

```bash
git clone <your-repo-url>
cd onboarding-tracker
```

2. Install dependencies:

```bash
npm install
```

3. Configure Firebase:

   - Create a new Firebase project at https://console.firebase.google.com
   - Enable Firestore Database
   - Get your Firebase configuration from Project Settings
   - Create a `.env.local` file in the root directory with:

   ```
   NEXT_PUBLIC_FIREBASE_API_KEY=your-api-key
   NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your-auth-domain
   NEXT_PUBLIC_FIREBASE_PROJECT_ID=your-project-id
   NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your-storage-bucket
   NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your-messaging-sender-id
   NEXT_PUBLIC_FIREBASE_APP_ID=your-app-id
   ```

4. Run the development server:

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## Firebase Setup

### Firestore Security Rules

Add these basic rules to your Firestore to get started:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow read/write access to all documents (for development)
    // TODO: Implement proper authentication and authorization
    match /{document=**} {
      allow read, write: if true;
    }
  }
}
```

### Firestore Indexes

The application will automatically prompt you to create required indexes when needed. You can also manually create these composite indexes:

1. **Candidates Collection**:

   - `callCenter` (Ascending) + `createdAt` (Descending)
   - `status` (Ascending) + `createdAt` (Descending)
   - `licenseStatus` (Ascending) + `createdAt` (Descending)

2. **Cohorts Collection**:

   - `callCenter` (Ascending) + `startDate` (Descending)
   - `status` (Ascending) + `startDate` (Descending)

3. **Trainers Collection**:
   - `callCenter` (Ascending) + `name` (Ascending)
   - `isActive` (Ascending) + `name` (Ascending)

## Environment Variables

Add these to your `.env.local` file:

```bash
# SendGrid Email Service (for offer letter delivery)
SENDGRID_API_KEY=your_sendgrid_api_key

# IBR Background Check API
IBR_API_USERNAME=your_ibr_username
IBR_API_PASSWORD=your_ibr_password
IBR_API_VENDOR=your_ibr_vendor
IBR_API_URL=https://soap.services.ibrtest.com/ws/services/StandardReportingService

# Firebase & Google Calendar (existing)
# ... your existing firebase config ...
```

## Free E-Signature System

The application includes a **completely free** digital signature system for offer letters that replaces services like DocuSign or Dropbox Sign.

### How It Works

1. **HR sends offer**: Select template → system creates signing link → email sent to candidate
2. **Candidate signs**: Opens link → views PDF → signs with mouse/touch → submits
3. **Automatic storage**: Signed PDF stored in Firebase Storage with timestamp and IP address
4. **Real-time updates**: Candidate status automatically updated across the system

### Setup Requirements

#### 1. Email Service (Choose One)

**Option A: Free Console Mode (Development)**

- No setup required
- Emails are logged to console instead of actually sent
- Perfect for testing and development

**Option B: SendGrid (Production)**

- Add `SENDGRID_API_KEY` to `.env.local`
- Get free SendGrid account (100 emails/day)
- Emails will be sent automatically

#### 2. PDF Templates

Place your offer letter templates in `public/offer-templates/` with these exact names:

```
MASTER Austin Agent - Offer of Employment Letter.pdf
MASTER Austin UNLICENSED Agent - Offer of Employment Letter.docx.pdf
MASTER Charlotte Agent - Offer of Employment Letter.docx.pdf
MASTER Charlotte UNLICENSED Agent - Offer of Employment Letter.docx.pdf
```

#### 3. Firebase Storage

- Enable Firebase Storage in your Firebase console
- Signed PDFs are automatically stored in `signed-offers/{candidateId}.pdf`
- Storage rules should allow authenticated writes

### Usage Workflow

1. **Open candidate page** → Navigate to "Offers" section
2. **Select template** → Choose appropriate location/license type
3. **Send offer** → Click "Send Offer" button
4. **Monitor status** → Real-time updates show when candidate signs
5. **Access signed PDF** → Download from Firebase Storage console

### Features

- ✅ **100% Free** - No third-party signature service fees
- ✅ **Legally binding** - Captures signature, timestamp, and IP address
- ✅ **Template selection** - 4 different offer types supported
- ✅ **Real-time updates** - Instant status changes across all views
- ✅ **Secure storage** - PDFs stored in Firebase with access controls
- ✅ **Audit trail** - Full signature metadata for compliance
- ✅ **Mobile friendly** - Touch signatures work on phones/tablets

### Cost Comparison

| Service      | Monthly Cost | Our Solution |
| ------------ | ------------ | ------------ |
| DocuSign     | $25+/month   | **FREE**     |
| Dropbox Sign | $20+/month   | **FREE**     |
| Adobe Sign   | $30+/month   | **FREE**     |
| Our System   | $0           | **FREE**     |

_Note: SendGrid free tier provides 100 emails/day. For higher volume, consider upgrading SendGrid or using alternative email services._

## Support

For technical questions about the e-signature system or other features, check the console logs for detailed debugging information.

## License

This project is private and proprietary.
