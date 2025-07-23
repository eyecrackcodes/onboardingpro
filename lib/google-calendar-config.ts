// Google Calendar API Configuration
console.log("[GoogleCalendarConfig] Loading configuration...");

export const GOOGLE_CALENDAR_CONFIG = {
  // You'll need to replace these with your actual Google Cloud Project credentials
  CLIENT_ID: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID || "",
  API_KEY: process.env.NEXT_PUBLIC_GOOGLE_API_KEY || "",

  // Discovery docs for Google Calendar API
  DISCOVERY_DOCS: [
    "https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest",
  ],

  // Authorization scopes required for calendar operations
  SCOPES:
    "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly https://www.googleapis.com/auth/userinfo.email",

  // Calendar configurations for different locations
  CALENDARS: {
    CHARLOTTE: {
      id: process.env.NEXT_PUBLIC_CHARLOTTE_CALENDAR_ID || "primary",
      timeZone: "America/New_York",
      name: "Charlotte Interview Calendar",
      color: "#4285F4",
    },
    AUSTIN: {
      id: process.env.NEXT_PUBLIC_AUSTIN_CALENDAR_ID || "primary",
      timeZone: "America/Chicago",
      name: "Austin Interview Calendar",
      color: "#0F9D58",
    },
  },

  // Default interview settings
  INTERVIEW_DEFAULTS: {
    duration: 60, // minutes
    reminderMinutes: [1440, 60], // 1 day and 1 hour before
    conferenceType: "hangoutsMeet", // Google Meet
  },
};

console.log("[GoogleCalendarConfig] Config loaded:", {
  hasClientId: !!GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
  clientIdLength: GOOGLE_CALENDAR_CONFIG.CLIENT_ID.length,
  hasApiKey: !!GOOGLE_CALENDAR_CONFIG.API_KEY,
  apiKeyLength: GOOGLE_CALENDAR_CONFIG.API_KEY.length,
});

// Helper to get calendar config by location
export function getCalendarByLocation(location: string) {
  const normalizedLocation = location.toLowerCase();

  if (
    normalizedLocation.includes("charlotte") ||
    normalizedLocation.includes("nc")
  ) {
    return GOOGLE_CALENDAR_CONFIG.CALENDARS.CHARLOTTE;
  } else if (
    normalizedLocation.includes("austin") ||
    normalizedLocation.includes("tx")
  ) {
    return GOOGLE_CALENDAR_CONFIG.CALENDARS.AUSTIN;
  }

  // Default to Charlotte if location is unclear
  return GOOGLE_CALENDAR_CONFIG.CALENDARS.CHARLOTTE;
}
