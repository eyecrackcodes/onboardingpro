import {
  GOOGLE_CALENDAR_CONFIG,
  getCalendarByLocation,
} from "./google-calendar-config";
import type { Candidate } from "./types";

console.log("[GoogleCalendarService] Module loading...");

// Add type declarations for Google APIs
declare global {
  interface Window {
    gapi: any;
    google: any;
  }
}

export interface InterviewEvent {
  candidateId: string;
  candidateName: string;
  candidateEmail: string;
  candidatePhone: string;
  interviewerEmail?: string;
  dateTime: Date;
  duration?: number; // in minutes
  location: string; // Charlotte or Austin
  notes?: string;
  conferenceType?: "hangoutsMeet" | "phone" | "inPerson";
  eventTitle?: string; // Add this field
}

export class GoogleCalendarService {
  private static instance: GoogleCalendarService;
  private tokenClient: google.accounts.oauth2.TokenClient | null = null;
  private accessToken: string | null = null;
  private gapiInited = false;
  private gisInited = false;
  private userEmail: string | null = null;

  private constructor() {
    console.log("[GoogleCalendarService] Constructor called");
  }

  static getInstance(): GoogleCalendarService {
    if (!GoogleCalendarService.instance) {
      GoogleCalendarService.instance = new GoogleCalendarService();
    }
    return GoogleCalendarService.instance;
  }

  async init(): Promise<void> {
    console.log("[GoogleCalendarService] init() called");

    // Wait for gapi to be available
    await this.waitForGapi();

    try {
      await this.initializeGapiClient();
      this.initializeGisClient();
      console.log("[GoogleCalendarService] Initialization complete");
    } catch (error) {
      console.error("[GoogleCalendarService] Initialization failed:", error);
      throw error;
    }
  }

  private async waitForGapi(maxAttempts = 50): Promise<void> {
    console.log("[GoogleCalendarService] Waiting for gapi to be available...");

    for (let i = 0; i < maxAttempts; i++) {
      if (typeof window !== "undefined" && window.gapi) {
        console.log(`[GoogleCalendarService] gapi found after ${i} attempts`);
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    throw new Error("Google API (gapi) failed to load after 5 seconds");
  }

  private async initializeGapiClient(): Promise<void> {
    console.log("[GoogleCalendarService] initializeGapiClient() called");

    if (!window.gapi) {
      throw new Error("Google API not loaded");
    }

    return new Promise((resolve, reject) => {
      window.gapi.load("client", async () => {
        try {
          console.log(
            "[GoogleCalendarService] gapi client loaded, initializing..."
          );
          await window.gapi.client.init({
            apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
            discoveryDocs: GOOGLE_CALENDAR_CONFIG.DISCOVERY_DOCS,
          });
          this.gapiInited = true;
          console.log(
            "[GoogleCalendarService] gapi client initialized successfully"
          );
          resolve();
        } catch (error) {
          console.error(
            "[GoogleCalendarService] gapi client init failed:",
            error
          );
          reject(error);
        }
      });
    });
  }

  private initializeGisClient(): void {
    console.log("[GoogleCalendarService] initializeGisClient() called");

    // Load the Google Identity Services library
    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.onload = () => {
      console.log("[GoogleCalendarService] GIS script loaded");

      if (!window.google) {
        console.error(
          "[GoogleCalendarService] Google Identity Services not available"
        );
        return;
      }

      this.tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
        scope: GOOGLE_CALENDAR_CONFIG.SCOPES,
        callback: async (response: any) => {
          console.log("[GoogleCalendarService] Token response received");
          if (response.error) {
            console.error("[GoogleCalendarService] Token error:", response);
            return;
          }
          this.accessToken = response.access_token;
          console.log("[GoogleCalendarService] Access token obtained");

          // Fetch user info after getting the token
          await this.fetchUserInfo();
        },
      });

      this.gisInited = true;
      console.log("[GoogleCalendarService] GIS client initialized");
    };
    script.onerror = (error) => {
      console.error(
        "[GoogleCalendarService] Failed to load GIS script:",
        error
      );
    };
    document.body.appendChild(script);
  }

  private async fetchUserInfo(): Promise<void> {
    if (!this.accessToken) return;

    try {
      // Use the Google People API to get user info
      const response = await fetch(
        "https://www.googleapis.com/oauth2/v1/userinfo?alt=json",
        {
          headers: {
            Authorization: `Bearer ${this.accessToken}`,
          },
        }
      );

      if (response.ok) {
        const userInfo = await response.json();
        this.userEmail = userInfo.email;
        console.log(
          "[GoogleCalendarService] User email fetched:",
          this.userEmail
        );
      }
    } catch (error) {
      console.error(
        "[GoogleCalendarService] Failed to fetch user info:",
        error
      );
    }
  }

  async isSignedIn(): Promise<boolean> {
    return this.accessToken !== null;
  }

  async signIn(): Promise<void> {
    console.log("[GoogleCalendarService] signIn() called");

    if (!this.gapiInited || !this.gisInited) {
      await this.init();
    }

    return new Promise((resolve, reject) => {
      if (!this.tokenClient) {
        reject(new Error("Token client not initialized"));
        return;
      }

      // Configure the callback to resolve the promise
      this.tokenClient.callback = async (response: any) => {
        console.log("[GoogleCalendarService] Sign-in response received");
        if (response.error) {
          console.error("[GoogleCalendarService] Sign-in error:", response);
          reject(new Error(response.error_description || "Sign-in failed"));
          return;
        }
        this.accessToken = response.access_token;
        console.log("[GoogleCalendarService] Successfully signed in");

        // Fetch user info after getting the token
        await this.fetchUserInfo();

        resolve();
      };

      // Request the access token
      this.tokenClient.requestAccessToken();
    });
  }

  async signOut(): Promise<void> {
    console.log("[GoogleCalendarService] signOut() called");

    if (this.accessToken) {
      window.google.accounts.oauth2.revoke(this.accessToken, () => {
        console.log("[GoogleCalendarService] Token revoked");
      });
      this.accessToken = null;
    }
  }

  // Get current user's email
  getCurrentUserEmail(): string | null {
    return this.userEmail;
  }

  // Helper method to get calendar ID based on location
  private getCalendarId(location: string): string {
    const normalizedLocation = location.toLowerCase();
    if (normalizedLocation.includes("austin")) {
      return GOOGLE_CALENDAR_CONFIG.CALENDARS.AUSTIN.id;
    }
    return GOOGLE_CALENDAR_CONFIG.CALENDARS.CHARLOTTE.id;
  }

  // Helper method to get timezone based on location
  private getTimeZone(location: string): string {
    const normalizedLocation = location.toLowerCase();
    if (normalizedLocation.includes("austin")) {
      return GOOGLE_CALENDAR_CONFIG.CALENDARS.AUSTIN.timeZone;
    }
    return GOOGLE_CALENDAR_CONFIG.CALENDARS.CHARLOTTE.timeZone;
  }

  // Create an interview calendar event
  async createInterviewEvent(interview: InterviewEvent): Promise<string> {
    if (!this.accessToken) {
      throw new Error("User must be signed in to create calendar events");
    }

    const calendarId = this.getCalendarId(interview.location);

    // Build the event object
    const event: any = {
      summary: interview.eventTitle || `Interview: ${interview.candidateName}`,
      description:
        interview.notes ||
        `Interview with ${interview.candidateName} for call center position.`,
      start: {
        dateTime: interview.dateTime.toISOString(),
        timeZone: this.getTimeZone(interview.location),
      },
      end: {
        dateTime: new Date(
          interview.dateTime.getTime() + interview.duration * 60000
        ).toISOString(),
        timeZone: this.getTimeZone(interview.location),
      },
      attendees: [
        {
          email: interview.candidateEmail,
          displayName: interview.candidateName,
          responseStatus: "needsAction",
        },
      ],
      conferenceData:
        interview.conferenceType === "hangoutsMeet"
          ? {
              createRequest: {
                requestId: `interview-${interview.candidateId}-${Date.now()}`,
                conferenceSolutionKey: { type: "hangoutsMeet" },
              },
            }
          : undefined,
      reminders: {
        useDefault: false,
        overrides: [
          { method: "email", minutes: 24 * 60 }, // 1 day before
          { method: "popup", minutes: 30 }, // 30 minutes before
        ],
      },
    };

    // Add interviewer as attendee if provided
    if (interview.interviewerEmail) {
      event.attendees.push({
        email: interview.interviewerEmail,
        displayName: "Interviewer",
        organizer: true,
        responseStatus: "accepted",
      });
    }

    try {
      const response = await window.gapi.client.calendar.events.insert({
        calendarId: calendarId,
        resource: event,
        conferenceDataVersion:
          interview.conferenceType === "hangoutsMeet" ? 1 : 0,
        sendUpdates: "all", // Send email invitations to all attendees
      });

      console.log(
        "[GoogleCalendarService] Calendar event created:",
        response.result
      );
      return response.result.id;
    } catch (error) {
      console.error(
        "[GoogleCalendarService] Failed to create calendar event:",
        error
      );
      throw error;
    }
  }

  // Update an existing interview event
  async updateInterviewEvent(
    eventId: string,
    location: string,
    updates: Partial<InterviewEvent>
  ): Promise<void> {
    if (!this.accessToken) {
      throw new Error("User must be signed in to update calendar events");
    }

    const calendarConfig = getCalendarByLocation(location);

    try {
      const event = await window.gapi.client.calendar.events.get({
        calendarId: calendarConfig.id,
        eventId: eventId,
      });

      // Update only the fields that are provided
      if (updates.dateTime) {
        event.result.start.dateTime = updates.dateTime.toISOString();
        const endTime = new Date(updates.dateTime);
        endTime.setMinutes(
          endTime.getMinutes() +
            (updates.duration ||
              GOOGLE_CALENDAR_CONFIG.INTERVIEW_DEFAULTS.duration)
        );
        event.result.end.dateTime = endTime.toISOString();
      }

      if (updates.candidateName) {
        event.result.summary = `Interview: ${updates.candidateName}`;
      }

      if (updates.notes !== undefined) {
        event.result.description = this.buildEventDescription({
          ...updates,
        } as InterviewEvent);
      }

      await window.gapi.client.calendar.events.update({
        calendarId: calendarConfig.id,
        eventId: eventId,
        resource: event.result,
      });
    } catch (error) {
      console.error("Error updating calendar event:", error);
      throw error;
    }
  }

  // Delete an interview event
  async deleteInterviewEvent(eventId: string, location: string): Promise<void> {
    if (!this.accessToken) {
      throw new Error("User must be signed in to delete calendar events");
    }

    const calendarConfig = getCalendarByLocation(location);

    try {
      await window.gapi.client.calendar.events.delete({
        calendarId: calendarConfig.id,
        eventId: eventId,
      });
    } catch (error) {
      console.error("Error deleting calendar event:", error);
      throw error;
    }
  }

  // Get available time slots for interviews
  async getAvailableTimeSlots(
    location: string,
    startDate: Date,
    endDate: Date,
    durationMinutes: number = 60
  ): Promise<Date[]> {
    if (!this.accessToken) {
      throw new Error("User must be signed in to check calendar availability");
    }

    const calendarConfig = getCalendarByLocation(location);

    try {
      const response = await window.gapi.client.calendar.freebusy.query({
        resource: {
          timeMin: startDate.toISOString(),
          timeMax: endDate.toISOString(),
          timeZone: calendarConfig.timeZone,
          items: [{ id: calendarConfig.id }],
        },
      });

      const busyTimes = response.result.calendars[calendarConfig.id].busy || [];
      const availableSlots: Date[] = [];

      // Generate time slots (9 AM to 5 PM on weekdays)
      const currentTime = new Date(startDate);
      while (currentTime < endDate) {
        const dayOfWeek = currentTime.getDay();

        // Skip weekends
        if (dayOfWeek === 0 || dayOfWeek === 6) {
          currentTime.setDate(currentTime.getDate() + 1);
          currentTime.setHours(9, 0, 0, 0);
          continue;
        }

        const hour = currentTime.getHours();

        // Only consider business hours (9 AM to 5 PM)
        if (hour >= 9 && hour < 17) {
          const slotEnd = new Date(currentTime);
          slotEnd.setMinutes(slotEnd.getMinutes() + durationMinutes);

          // Check if this slot conflicts with any busy time
          const isAvailable = !busyTimes.some((busy: any) => {
            const busyStart = new Date(busy.start);
            const busyEnd = new Date(busy.end);
            return (
              (currentTime >= busyStart && currentTime < busyEnd) ||
              (slotEnd > busyStart && slotEnd <= busyEnd) ||
              (currentTime <= busyStart && slotEnd >= busyEnd)
            );
          });

          if (isAvailable && slotEnd.getHours() <= 17) {
            availableSlots.push(new Date(currentTime));
          }
        }

        // Move to next hour
        currentTime.setHours(currentTime.getHours() + 1, 0, 0, 0);

        // If we've passed 5 PM, move to 9 AM next day
        if (currentTime.getHours() >= 17) {
          currentTime.setDate(currentTime.getDate() + 1);
          currentTime.setHours(9, 0, 0, 0);
        }
      }

      return availableSlots;
    } catch (error) {
      console.error("Error getting available time slots:", error);
      throw error;
    }
  }

  // Build event description with candidate details
  private buildEventDescription(interview: InterviewEvent): string {
    const lines = [
      `Candidate: ${interview.candidateName}`,
      `Email: ${interview.candidateEmail}`,
      `Phone: ${interview.candidatePhone}`,
      `Location: ${interview.location}`,
      "",
      "Interview Details:",
      `- Candidate ID: ${interview.candidateId}`,
    ];

    if (interview.notes) {
      lines.push("", "Notes:", interview.notes);
    }

    lines.push(
      "",
      "---",
      "This interview was scheduled through the Call Center Onboarding Tracker."
    );

    return lines.join("\n");
  }
}

// Export a singleton instance
export const googleCalendarService = GoogleCalendarService.getInstance();

console.log(
  "[GoogleCalendarService] Singleton instance exported:",
  googleCalendarService
);
