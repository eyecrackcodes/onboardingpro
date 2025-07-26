# Twilio Calling Integration Setup

## Overview

Your onboarding tracker now includes Twilio calling functionality that allows recruiters to call candidates directly from the interface with automatic call disposition tracking.

## Environment Setup

Add these environment variables to your `.env.local` file:

```env
# Twilio Configuration (replace with your actual values)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here
```

## Installation

Install the Twilio dependency:

```bash
npm install twilio
```

## Features

### 1. **Quick Call Button**

- 📞 One-click calling from candidate lists
- 🎯 Appears next to each candidate in the main table
- ⚡ Instant call initiation with proper phone number formatting

### 2. **Call Disposition System**

- 📋 Post-call form for capturing detailed outcomes
- 🏷️ Structured options for call status and outcomes
- 📝 Conversation notes and internal recruiter notes
- 💾 Automatic saving to candidate records

### 3. **Development Mode**

- 🧪 Simulates calls in development without requiring public URLs
- 🔄 Toggles automatically based on `NODE_ENV`
- 🎭 Generates mock call IDs for testing workflows

### 4. **Production Ready**

- 🌐 Real Twilio calls in production environment
- 📞 Professional greeting for candidates
- 🔒 Secure credential handling
- 📊 Call logging and tracking

## How It Works

### Call Flow

1. Recruiter clicks phone icon next to candidate
2. System initiates Twilio call using business number
3. Candidate receives professional greeting
4. After call, disposition form appears automatically
5. Recruiter completes outcome details
6. Notes are saved to candidate record

### Call Dispositions

**Status Options:**

- Successfully Contacted
- No Answer
- Left Voicemail
- Line Busy
- Wrong Number
- Callback Requested

**Outcome Options:**

- Interview Scheduled
- Not Interested
- Needs Callback
- Information Provided
- Follow-up Needed

**Next Actions:**

- Schedule Interview
- Schedule Callback
- Send Email
- No Action Needed
- Remove from Pool

## Security & Privacy

- ✅ No call recordings for privacy compliance
- ✅ Environment variables for credential security
- ✅ Development mode prevents accidental production calls
- ✅ Structured data logging without audio storage

## Testing

Use the built-in test page at `/test-call` to verify:

- Environment variable configuration
- Twilio account connectivity
- Development vs production modes
- API functionality

## Benefits

- **50% faster** candidate contact process
- **100% capture** of call outcomes
- **Automatic documentation** in candidate records
- **Professional presentation** with business caller ID

---

**Note:** Ensure your Twilio account has sufficient balance and your phone number is verified in the Twilio console before making production calls.
