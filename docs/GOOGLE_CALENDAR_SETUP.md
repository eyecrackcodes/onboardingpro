# Google Calendar Integration Setup Guide

This guide will help you set up Google Calendar API integration for the Call Center Onboarding Tracker.

## Prerequisites

- A Google Cloud Platform account
- Access to create projects and enable APIs
- Admin access to your organization's Google Workspace (if using organizational calendars)

## Step 1: Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" → "New Project"
3. Name your project (e.g., "Call Center Onboarding Tracker")
4. Click "Create"

## Step 2: Enable Google Calendar API

1. In your project, go to "APIs & Services" → "Library"
2. Search for "Google Calendar API"
3. Click on it and press "Enable"

## Step 3: Create OAuth 2.0 Credentials

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "OAuth client ID"
3. If prompted, configure the OAuth consent screen:
   - Choose "Internal" for organization use or "External" for public use
   - Fill in the required fields
   - Add scopes: `https://www.googleapis.com/auth/calendar.events`
4. For Application type, select "Web application"
5. Add authorized JavaScript origins:
   - `http://localhost:3000` (for development)
   - Your production domain (e.g., `https://yourapp.com`)
6. Add authorized redirect URIs:
   - `http://localhost:3000` (for development)
   - Your production domain
7. Click "Create"
8. Save the Client ID

## Step 4: Create an API Key

1. Go to "APIs & Services" → "Credentials"
2. Click "Create Credentials" → "API key"
3. Restrict the API key:
   - Click "Restrict key"
   - Under "API restrictions", select "Restrict key"
   - Add "Google Calendar API"
   - Under "Website restrictions", add your domains
4. Save the API key

## Step 5: Set Up Calendar IDs (Optional)

If you want to use specific calendars for Charlotte and Austin:

1. Go to [Google Calendar](https://calendar.google.com)
2. Create or select the calendar for Charlotte interviews
3. Go to calendar settings → "Integrate calendar"
4. Copy the Calendar ID
5. Repeat for Austin calendar

## Step 6: Configure Environment Variables

Create a `.env.local` file in your project root:

```env
# Google Calendar API Configuration
NEXT_PUBLIC_GOOGLE_CLIENT_ID=your-client-id-here
NEXT_PUBLIC_GOOGLE_API_KEY=your-api-key-here

# Calendar IDs (use 'primary' for default calendar)
NEXT_PUBLIC_CHARLOTTE_CALENDAR_ID=charlotte-calendar-id@group.calendar.google.com
NEXT_PUBLIC_AUSTIN_CALENDAR_ID=austin-calendar-id@group.calendar.google.com
```

## Step 7: Test the Integration

1. Start your development server: `npm run dev`
2. Navigate to a candidate's page
3. Click "Schedule Interview"
4. Sign in with your Google account
5. Schedule a test interview

## Troubleshooting

### "Failed to initialize Google Calendar"

- Check that your API key and Client ID are correct
- Ensure the Google Calendar API is enabled
- Verify your domain is in the authorized origins

### "User must be signed in to create calendar events"

- The user needs to authenticate with Google
- Check that the OAuth consent screen is properly configured

### Calendar not found

- Verify the calendar IDs are correct
- Ensure the authenticated user has access to the calendars
- Check that calendar sharing settings allow event creation

## Security Best Practices

1. Never commit `.env.local` to version control
2. Use separate API keys for development and production
3. Restrict API keys to specific domains
4. Regularly rotate credentials
5. Monitor API usage in Google Cloud Console

## Managing Multiple Locations

The system automatically determines which calendar to use based on:

1. Candidate's location field
2. Candidate's assigned call center

Location mapping:

- Contains "Charlotte" or "NC" → Charlotte Calendar
- Contains "Austin" or "TX" → Austin Calendar
- Default → Charlotte Calendar

You can modify this logic in `lib/google-calendar-config.ts`
