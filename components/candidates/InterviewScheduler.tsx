"use client";

import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  User,
  LogIn,
  Check,
  AlertCircle,
} from "lucide-react";
import { googleCalendarService } from "@/lib/google-calendar-service";
import { getCalendarByLocation } from "@/lib/google-calendar-config";
import { useAuth } from "@/components/auth/AuthProvider";
import type { Candidate } from "@/lib/types";
import { GOOGLE_CALENDAR_CONFIG } from "@/lib/google-calendar-config";

interface InterviewSchedulerProps {
  candidate: Candidate;
  onScheduled: (interviewData: {
    scheduledDate: Date;
    calendarEventId: string;
    location: string;
    interviewerEmail?: string;
  }) => void;
  onCancel: () => void;
}

export default function InterviewScheduler({
  candidate,
  onScheduled,
  onCancel,
}: InterviewSchedulerProps) {
  console.log(
    "[InterviewScheduler] Component rendered with candidate:",
    candidate?.personalInfo?.name
  );

  const { user } = useAuth(); // Get authenticated user
  const [isSignedIn, setIsSignedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);
  const [interviewerEmail, setInterviewerEmail] = useState(user?.email || "");
  const [candidateEmail, setCandidateEmail] = useState(
    candidate?.personalInfo?.email || ""
  );
  const [interviewTitle, setInterviewTitle] = useState(
    `Interview: ${candidate?.personalInfo?.name || "Candidate"}`
  );
  const [notes, setNotes] = useState("");
  const [duration, setDuration] = useState(60); // minutes
  const [availableSlots, setAvailableSlots] = useState<Date[]>([]);
  const [checkingAvailability, setCheckingAvailability] = useState(false);
  const [meetingType, setMeetingType] = useState<
    "hangoutsMeet" | "phone" | "inPerson"
  >("hangoutsMeet");

  const calendarService = googleCalendarService;

  // Helper function to create date in local timezone (fixes timezone bug)
  const createLocalDate = (dateString: string): Date => {
    // Parse date string as local date instead of UTC
    const [year, month, day] = dateString.split("-").map(Number);
    return new Date(year, month - 1, day); // month is 0-indexed
  };

  // Helper function to format date for input (ensures local timezone)
  const formatDateForInput = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  };

  // Get timezone info based on candidate location
  const getTimezoneInfo = () => {
    const location =
      candidate.personalInfo?.location || candidate.callCenter || "CLT";
    if (
      location.toLowerCase().includes("austin") ||
      location.toLowerCase().includes("atx") ||
      location.toLowerCase().includes("tx")
    ) {
      return {
        timezone: "America/Chicago",
        display: "CST/CDT",
        offset: "UTC-6/-5",
      };
    } else {
      return {
        timezone: "America/New_York",
        display: "EST/EDT",
        offset: "UTC-5/-4",
      };
    }
  };

  const timezoneInfo = getTimezoneInfo();

  // Format time with timezone
  const formatTimeWithTimezone = (date: Date) => {
    const options: Intl.DateTimeFormatOptions = {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
      timeZone: timezoneInfo.timezone,
      timeZoneName: "short",
    };
    return date.toLocaleString("en-US", options);
  };

  useEffect(() => {
    console.log("[InterviewScheduler] Component mounted, checking gapi...");

    // Load the Google API client library
    const loadGoogleAPI = () => {
      const script = document.createElement("script");
      script.src = "https://apis.google.com/js/api.js";
      script.onload = () => {
        console.log("[InterviewScheduler] Google API script loaded");
        initializeGoogleCalendar();
      };
      script.onerror = (error) => {
        console.error(
          "[InterviewScheduler] Failed to load Google API script:",
          error
        );
        setError("Failed to load Google Calendar API");
      };
      document.body.appendChild(script);
    };

    const initializeGoogleCalendar = async () => {
      console.log("[InterviewScheduler] Initializing Google Calendar...");
      setLoading(true);
      setError(null);

      try {
        // Check if gapi is available
        if (typeof window === "undefined" || !window.gapi) {
          console.error("[InterviewScheduler] gapi not available");
          setError("Google API not loaded");
          setLoading(false);
          return;
        }

        // Initialize the Google Calendar service
        await calendarService.init();
        console.log(
          "[InterviewScheduler] Google Calendar initialized successfully"
        );

        // Check if already authorized
        const isAuthorized = await calendarService.isSignedIn();
        console.log("[InterviewScheduler] User signed in:", isAuthorized);
        setIsSignedIn(isAuthorized);

        if (isAuthorized) {
          await fetchAvailableSlots();
        }
      } catch (err) {
        console.error(
          "[InterviewScheduler] Failed to initialize Google Calendar:",
          err
        );
        setError(
          err instanceof Error ? err.message : "Failed to initialize calendar"
        );
      } finally {
        setLoading(false);
      }
    };

    // Check if gapi is already loaded
    if (window.gapi) {
      console.log("[InterviewScheduler] gapi already loaded");
      initializeGoogleCalendar();
    } else {
      console.log("[InterviewScheduler] Loading Google API script...");
      loadGoogleAPI();
    }

    // Cleanup function
    return () => {
      const script = document.querySelector(
        'script[src="https://apis.google.com/js/api.js"]'
      );
      if (script) {
        script.remove();
      }
    };
  }, []);

  // Auto-populate interviewer email when user is available
  useEffect(() => {
    if (user?.email && !interviewerEmail) {
      setInterviewerEmail(user.email);
    }
  }, [user?.email, interviewerEmail]);

  const fetchAvailableSlots = async () => {
    if (!selectedDate) return;

    setCheckingAvailability(true);
    try {
      const slots = await calendarService.getAvailableTimeSlots(
        candidate.personalInfo?.location || candidate.callCenter || "charlotte",
        selectedDate,
        selectedDate,
        duration
      );
      console.log("[InterviewScheduler] Available slots:", slots);
      setAvailableSlots(slots);
    } catch (err) {
      console.error(
        "[InterviewScheduler] Failed to fetch available slots:",
        err
      );
      setError("Failed to check calendar availability");
    } finally {
      setCheckingAvailability(false);
    }
  };

  const handleSignIn = async () => {
    console.log("[InterviewScheduler] handleSignIn called");
    setLoading(true);
    setError(null);

    try {
      await calendarService.signIn();
      console.log("[InterviewScheduler] Sign in successful");
      setIsSignedIn(true);

      // Get the user's email after a small delay to ensure it's fetched
      setTimeout(() => {
        const email = calendarService.getCurrentUserEmail();
        console.log("[InterviewScheduler] User email retrieved:", email);
        if (email) {
          setInterviewerEmail(email);
        }
      }, 1000);
    } catch (err) {
      console.error("[InterviewScheduler] Sign in failed:", err);
      setError(err instanceof Error ? err.message : "Failed to sign in");
    } finally {
      setLoading(false);
    }
  };

  const handleSchedule = async () => {
    if (!selectedTime || !interviewerEmail || !candidateEmail) {
      setError("Please fill in all required fields");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      console.log("[InterviewScheduler] Scheduling interview:", {
        title: interviewTitle,
        candidate: candidate.personalInfo.name,
        candidateEmail,
        time: selectedTime,
        duration,
        interviewerEmail,
        meetingType,
      });

      // Create the calendar event with candidate as attendee
      const eventId = await calendarService.createInterviewEvent({
        candidateId: candidate.id,
        candidateName: candidate.personalInfo.name,
        candidateEmail: candidateEmail,
        candidatePhone: candidate.personalInfo.phone,
        interviewerEmail: interviewerEmail,
        dateTime: selectedTime,
        duration: duration,
        location:
          candidate.personalInfo?.location ||
          candidate.callCenter ||
          "charlotte",
        notes:
          notes ||
          `${interviewTitle}\n\nCandidate: ${candidate.personalInfo.name}\nPosition: Call Center Representative`,
        conferenceType: meetingType,
        eventTitle: interviewTitle, // Add this to the interface
      });

      console.log(
        "[InterviewScheduler] Interview scheduled successfully:",
        eventId
      );

      onScheduled({
        scheduledDate: selectedTime,
        calendarEventId: eventId,
        location:
          candidate.personalInfo?.location ||
          candidate.callCenter ||
          "charlotte",
        interviewerEmail: interviewerEmail,
      });
    } catch (err) {
      console.error("[InterviewScheduler] Failed to schedule interview:", err);
      setError(
        err instanceof Error ? err.message : "Failed to schedule interview"
      );
    } finally {
      setLoading(false);
    }
  };

  if (!isSignedIn) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Schedule Interview</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center py-8">
            <LogIn className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600 mb-4">
              Sign in with Google to access calendar and schedule interviews
            </p>
            <Button onClick={handleSignIn} disabled={loading}>
              {loading ? "Signing in..." : "Sign in with Google"}
            </Button>
          </div>
          {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
              <AlertCircle className="h-4 w-4" />
              {error}
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          Schedule Interview
          <div className="flex gap-2">
            <Badge variant="outline" className="font-normal">
              <MapPin className="h-3 w-3 mr-1" />
              {candidate.callCenter === "ATX" ? "Austin" : "Charlotte"}
            </Badge>
            <Badge variant="secondary" className="font-normal">
              {timezoneInfo.display}
            </Badge>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-sm text-gray-600 mb-4">
          <p>Signed in as: {interviewerEmail}</p>
          <p className="text-xs mt-1">
            All times shown in {timezoneInfo.display} ({timezoneInfo.offset})
          </p>
        </div>

        {/* Interview Title */}
        <div className="space-y-2">
          <Label htmlFor="interview-title">Interview Title *</Label>
          <Input
            id="interview-title"
            type="text"
            value={interviewTitle}
            onChange={(e) => setInterviewTitle(e.target.value)}
            placeholder="e.g., Phone Interview - John Doe"
            required
          />
        </div>

        {/* Candidate Email */}
        <div className="space-y-2">
          <Label htmlFor="candidate-email">Candidate Email *</Label>
          <Input
            id="candidate-email"
            type="email"
            value={candidateEmail}
            onChange={(e) => setCandidateEmail(e.target.value)}
            placeholder="candidate@email.com"
            required
          />
          <p className="text-xs text-gray-500">
            The candidate will receive a calendar invitation at this email
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Interview Date *</Label>
            <Input
              type="date"
              value={selectedDate ? formatDateForInput(selectedDate) : ""}
              onChange={(e) => {
                if (e.target.value) {
                  const localDate = createLocalDate(e.target.value);
                  console.log("[InterviewScheduler] Date selected:", {
                    inputValue: e.target.value,
                    localDate: localDate,
                    formattedForDisplay: localDate.toLocaleDateString(),
                  });
                  setSelectedDate(localDate);
                  setAvailableSlots([]);
                  setSelectedTime(null);
                }
              }}
              min={formatDateForInput(new Date())}
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Duration</Label>
            <Select
              value={duration.toString()}
              onValueChange={(value) => setDuration(parseInt(value))}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="30">30 minutes</SelectItem>
                <SelectItem value="45">45 minutes</SelectItem>
                <SelectItem value="60">1 hour</SelectItem>
                <SelectItem value="90">1.5 hours</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {selectedDate && (
          <div className="space-y-2">
            <Button
              onClick={fetchAvailableSlots}
              disabled={checkingAvailability}
              variant="outline"
              className="w-full"
            >
              <Clock className="mr-2 h-4 w-4" />
              {checkingAvailability ? "Checking..." : "Check Available Times"}
            </Button>

            {availableSlots.length > 0 && (
              <div className="space-y-2">
                <Label>Available Time Slots ({timezoneInfo.display})</Label>
                <div className="grid grid-cols-4 gap-2">
                  {availableSlots.map((slot) => {
                    const timeString = formatTimeWithTimezone(slot);
                    return (
                      <Button
                        key={slot.toISOString()}
                        variant={
                          selectedTime?.toISOString() === slot.toISOString()
                            ? "default"
                            : "outline"
                        }
                        size="sm"
                        onClick={() => setSelectedTime(slot)}
                      >
                        {timeString}
                      </Button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Allow manual time input */}
            <div className="space-y-2">
              <Label>Or Select Custom Time *</Label>
              <Input
                type="time"
                value={
                  selectedTime
                    ? `${String(selectedTime.getHours()).padStart(
                        2,
                        "0"
                      )}:${String(selectedTime.getMinutes()).padStart(2, "0")}`
                    : ""
                }
                onChange={(e) => {
                  if (e.target.value && selectedDate) {
                    const [hours, minutes] = e.target.value.split(":");
                    // Create new time using the SAME date object to preserve local timezone
                    const newTime = new Date(selectedDate.getTime());
                    newTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

                    console.log("[InterviewScheduler] Time selected:", {
                      timeInput: e.target.value,
                      selectedDate: selectedDate,
                      combinedDateTime: newTime,
                      formattedForDisplay: newTime.toLocaleString(),
                    });

                    setSelectedTime(newTime);
                  }
                }}
                required
              />
            </div>
          </div>
        )}

        <div className="space-y-2">
          <Label>Meeting Type</Label>
          <Select
            value={meetingType}
            onValueChange={(value: any) => setMeetingType(value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="hangoutsMeet">
                Google Meet (Video Call)
              </SelectItem>
              <SelectItem value="phone">Phone Call</SelectItem>
              <SelectItem value="inPerson">In Person</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="interviewer-email">Interviewer Email *</Label>
          <Input
            id="interviewer-email"
            type="email"
            value={interviewerEmail}
            onChange={(e) => setInterviewerEmail(e.target.value)}
            placeholder="interviewer@company.com"
            required
          />
        </div>

        <div className="space-y-2">
          <Label>Additional Notes (optional)</Label>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any special instructions, agenda items, or notes for the interview..."
            rows={3}
          />
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            {error}
          </div>
        )}

        {/* Debug Information */}
        {selectedTime && (
          <div className="bg-gray-50 p-4 rounded-lg text-sm">
            <h4 className="font-medium mb-2">
              This will create a calendar event with:
            </h4>
            <ul className="space-y-1 text-gray-700">
              <li>
                <strong>Title:</strong> {interviewTitle}
              </li>
              <li>
                <strong>Date:</strong>{" "}
                {selectedTime.toLocaleDateString("en-US", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </li>
              <li>
                <strong>Time:</strong>{" "}
                {selectedTime.toLocaleTimeString("en-US", {
                  hour: "numeric",
                  minute: "2-digit",
                  timeZoneName: "short",
                })}
              </li>
              <li>
                <strong>Duration:</strong> {duration} minutes
              </li>
              <li>
                <strong>Attendees:</strong> {candidateEmail} and{" "}
                {interviewerEmail}
              </li>
              {meetingType === "hangoutsMeet" && (
                <li>
                  <strong>Google Meet link will be automatically added</strong>
                </li>
              )}
            </ul>

            <details className="mt-3">
              <summary className="cursor-pointer text-xs text-gray-500">
                Debug - Field values:
              </summary>
              <div className="mt-2 space-y-1 text-xs font-mono text-gray-600">
                <div>
                  <strong>selectedDate:</strong> {selectedDate?.toString()}
                </div>
                <div>
                  <strong>selectedTime:</strong> {selectedTime?.toString()}
                </div>
                <div>
                  <strong>candidateEmail:</strong> "{candidateEmail}" (length:{" "}
                  {candidateEmail.length})
                </div>
                <div>
                  <strong>interviewerEmail:</strong> "{interviewerEmail}"
                  (length: {interviewerEmail.length})
                </div>
                <div>
                  <strong>interviewTitle:</strong> "{interviewTitle}" (length:{" "}
                  {interviewTitle.length})
                </div>
                <div>
                  <strong>timezone:</strong> {timezoneInfo.timezone} (
                  {timezoneInfo.display})
                </div>
                <div>
                  <strong>loading:</strong> {loading.toString()}
                </div>
              </div>
            </details>

            {(!candidateEmail || !interviewerEmail) && (
              <div className="mt-2 text-red-600 text-xs">
                <strong>Missing fields:</strong>
                {!candidateEmail && " candidateEmail"}
                {!interviewerEmail && " interviewerEmail"}
              </div>
            )}

            <div className="mt-2 text-xs text-gray-500">
              <strong>Button disabled:</strong>{" "}
              {!selectedTime || !interviewerEmail || !candidateEmail
                ? "YES"
                : "NO"}
            </div>
          </div>
        )}

        {/* Schedule Button */}
        <div className="flex gap-4">
          <Button
            onClick={onCancel}
            variant="outline"
            className="flex-1"
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={
              !selectedTime || !interviewerEmail || !candidateEmail || loading
            }
            className="flex-1"
          >
            {loading ? (
              <>
                <Clock className="mr-2 h-4 w-4 animate-spin" />
                Scheduling...
              </>
            ) : (
              <>
                <Calendar className="mr-2 h-4 w-4" />
                Schedule Interview
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
