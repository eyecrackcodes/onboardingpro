# Twilio Calling Integration Setup

This document provides step-by-step instructions for setting up Twilio voice calling in your onboarding tracker application.

## Environment Setup

Add these environment variables to your `.env.local` file:

```env
# Twilio Configuration (replace with your actual values)
TWILIO_ACCOUNT_SID=your_twilio_account_sid_here
TWILIO_AUTH_TOKEN=your_twilio_auth_token_here
TWILIO_PHONE_NUMBER=your_twilio_phone_number_here

# App URL for Twilio webhooks (CRITICAL for production)
NEXT_PUBLIC_APP_URL=https://your-actual-vercel-deployment-url.vercel.app

# Optional: Force real calls in development
FORCE_REAL_CALLS=false
```

## 🚨 IMPORTANT: App URL Configuration

### For Production (Vercel):

1. Go to your Vercel project dashboard
2. Copy your deployment URL (e.g., `https://onboardingpro-git-feature-twilio-calling-eyecrackcodes-projects.vercel.app`)
3. Add it to your environment variables:
   ```env
   NEXT_PUBLIC_APP_URL=https://your-actual-vercel-deployment-url.vercel.app
   ```

### Why This Matters:

- Twilio needs to access your `/api/twilio/twiml` and `/api/twilio/status-callback` endpoints
- Without the correct URL, you'll get **HTTP 404 errors** and the message "an application error has occurred"
- The system will auto-detect the URL from request headers, but setting `NEXT_PUBLIC_APP_URL` is more reliable

## Installation

Install the required Twilio dependency:

```bash
npm install twilio
```

## How It Works

### Development Mode

- **Simulates** Twilio calls without making real API requests
- Creates mock call records in Firestore
- No actual phone calls are made
- Perfect for testing the UI and workflow

### Production Mode

- Makes **real** Twilio voice calls
- Generates actual TwiML responses
- Receives status callbacks from Twilio
- Records complete call data including duration

## API Routes

The system includes these API endpoints:

- `POST /api/twilio/initiate-call` - Start a new call
- `GET|POST /api/twilio/twiml` - Generate voice response script
- `POST /api/twilio/status-callback` - Receive call status updates
- `GET /api/twilio/call-history/[candidateId]` - Get call history

## Features

### Universal Calling

- **Quick Call Button**: One-click calling from candidate lists
- **Stage-Specific Calling**: Call buttons in interview, offers, licensing, and class assignment sections
- **Dashboard Integration**: Call candidates from funnel view

### Call Disposition System

- **Post-call logging**: Capture call status, outcome, and notes
- **Structured data**: Standardized disposition categories
- **Automatic notes**: System generates formatted notes with call details
- **Internal notes**: Recruiter-only notes separate from candidate-visible information

### Call History & Tracking

- **Complete call logs**: All calls stored in Firestore
- **Status tracking**: Real-time updates from Twilio (initiated, ringing, answered, completed)
- **Duration tracking**: Automatic recording of call length
- **Search & filter**: Find calls by candidate, date, or status

## Troubleshooting

### Common Issues

1. **HTTP 404 Errors on TwiML/Status Callback**

   - **Problem**: URLs pointing to placeholder domain
   - **Solution**: Set `NEXT_PUBLIC_APP_URL` environment variable correctly

2. **"Application Error Has Occurred" Message**

   - **Problem**: Twilio can't access your webhook URLs
   - **Solution**: Verify your app URL is publicly accessible and set correctly

3. **Call Initiation Fails**

   - **Problem**: Missing environment variables
   - **Solution**: Verify all Twilio credentials are set correctly

4. **No Call Records in Firestore**
   - **Problem**: Firebase connection issues
   - **Solution**: Check Firebase configuration and permissions

### Debugging Steps

1. **Check Environment Variables**:

   ```bash
   # In your app, verify these are set:
   echo $TWILIO_ACCOUNT_SID
   echo $TWILIO_AUTH_TOKEN
   echo $TWILIO_PHONE_NUMBER
   echo $NEXT_PUBLIC_APP_URL
   ```

2. **Test API Endpoints**:

   - Visit `/api/twilio/twiml` in browser (should return XML)
   - Check browser console for detailed error logs
   - Monitor Twilio console for webhook errors

3. **Verify Webhooks**:
   - Twilio Console > Phone Numbers > Your Number > Webhook Configuration
   - Ensure URLs point to your actual deployment, not localhost

## Production Deployment Checklist

- [ ] Environment variables configured in Vercel
- [ ] `NEXT_PUBLIC_APP_URL` set to actual deployment URL
- [ ] Twilio webhook URLs updated to production domain
- [ ] Firebase project configured for production
- [ ] Test calls working end-to-end
- [ ] Call disposition saving to Firestore
- [ ] Status callbacks being received correctly

## Support

If you encounter issues:

1. Check Twilio Console for error details
2. Review browser console logs
3. Verify all environment variables are set
4. Test with development mode first
5. Ensure webhook URLs are publicly accessible
