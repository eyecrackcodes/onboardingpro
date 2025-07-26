"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import {
  Phone,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Clock,
  User,
  FileText,
  CheckCircle,
} from "lucide-react";

interface CallRecord {
  id: string;
  callSid: string;
  candidateName: string;
  candidatePhone: string;
  status: string;
  duration?: number;
  createdAt: Date;
}

interface CallControlsProps {
  candidateId: string;
  candidateName: string;
  candidatePhone: string;
  activeCall?: CallRecord;
  onCallEnd?: () => void;
}

export function CallControls({
  candidateId,
  candidateName,
  candidatePhone,
  activeCall,
  onCallEnd,
}: CallControlsProps) {
  const [callDuration, setCallDuration] = useState(0);
  const [callNotes, setCallNotes] = useState("");
  const [callOutcome, setCallOutcome] = useState("");
  const [nextAction, setNextAction] = useState("");
  const [isMuted, setIsMuted] = useState(false);
  const [isSpeakerOn, setIsSpeakerOn] = useState(false);
  const [isCallActive, setIsCallActive] = useState(false);

  // Timer for call duration
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (activeCall && activeCall.status === "in-progress") {
      setIsCallActive(true);
      interval = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    } else {
      setIsCallActive(false);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [activeCall]);

  // Format duration as MM:SS
  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;
  };

  const handleEndCall = async () => {
    // Save call notes and disposition
    if (callNotes || callOutcome) {
      try {
        const response = await fetch("/api/candidates/notes", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            candidateId,
            type: "call_disposition",
            content: callNotes,
            callDisposition: {
              status: "completed",
              outcome: callOutcome,
              nextAction,
              duration: callDuration,
              callSid: activeCall?.callSid,
            },
          }),
        });

        if (!response.ok) {
          console.error("Failed to save call notes");
        }
      } catch (error) {
        console.error("Error saving call notes:", error);
      }
    }

    // Reset state
    setCallDuration(0);
    setCallNotes("");
    setCallOutcome("");
    setNextAction("");
    setIsCallActive(false);

    if (onCallEnd) {
      onCallEnd();
    }
  };

  const handleMuteToggle = () => {
    setIsMuted(!isMuted);
    // In a real implementation, this would mute the microphone
  };

  const handleSpeakerToggle = () => {
    setIsSpeakerOn(!isSpeakerOn);
    // In a real implementation, this would toggle speaker/earpiece
  };

  if (!activeCall || !isCallActive) {
    return null;
  }

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Phone className="h-5 w-5 text-green-600" />
          Active Call
        </CardTitle>
        <div className="space-y-1">
          <div className="flex items-center justify-center gap-2">
            <User className="h-4 w-4" />
            <span className="font-medium">{candidateName}</span>
          </div>
          <div className="text-sm text-gray-600">{candidatePhone}</div>
          <Badge variant="outline" className="text-green-600 border-green-600">
            {activeCall.status}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Call Duration */}
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 text-2xl font-mono">
            <Clock className="h-5 w-5" />
            {formatDuration(callDuration)}
          </div>
        </div>

        {/* Call Controls */}
        <div className="flex justify-center gap-3">
          <Button
            variant={isMuted ? "destructive" : "outline"}
            size="sm"
            onClick={handleMuteToggle}
            className="flex items-center gap-2"
          >
            {isMuted ? (
              <MicOff className="h-4 w-4" />
            ) : (
              <Mic className="h-4 w-4" />
            )}
            {isMuted ? "Unmute" : "Mute"}
          </Button>

          <Button
            variant={isSpeakerOn ? "default" : "outline"}
            size="sm"
            onClick={handleSpeakerToggle}
            className="flex items-center gap-2"
          >
            {isSpeakerOn ? (
              <Volume2 className="h-4 w-4" />
            ) : (
              <VolumeX className="h-4 w-4" />
            )}
            Speaker
          </Button>

          <Button
            variant="destructive"
            size="sm"
            onClick={handleEndCall}
            className="flex items-center gap-2"
          >
            <PhoneOff className="h-4 w-4" />
            End Call
          </Button>
        </div>

        {/* Call Notes */}
        <div className="space-y-2">
          <Label htmlFor="call-notes" className="flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Call Notes
          </Label>
          <Textarea
            id="call-notes"
            placeholder="Notes about the call..."
            value={callNotes}
            onChange={(e) => setCallNotes(e.target.value)}
            rows={3}
          />
        </div>

        {/* Call Outcome */}
        <div className="space-y-2">
          <Label>Call Outcome</Label>
          <Select value={callOutcome} onValueChange={setCallOutcome}>
            <SelectTrigger>
              <SelectValue placeholder="Select outcome..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="answered">
                Answered - Spoke with candidate
              </SelectItem>
              <SelectItem value="voicemail">Voicemail left</SelectItem>
              <SelectItem value="no_answer">No answer</SelectItem>
              <SelectItem value="busy">Busy signal</SelectItem>
              <SelectItem value="callback_requested">
                Callback requested
              </SelectItem>
              <SelectItem value="wrong_number">Wrong number</SelectItem>
              <SelectItem value="not_interested">Not interested</SelectItem>
              <SelectItem value="interested">
                Interested - Moving forward
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Next Action */}
        <div className="space-y-2">
          <Label>Next Action</Label>
          <Select value={nextAction} onValueChange={setNextAction}>
            <SelectTrigger>
              <SelectValue placeholder="Select next action..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="schedule_interview">
                Schedule interview
              </SelectItem>
              <SelectItem value="call_back_tomorrow">
                Call back tomorrow
              </SelectItem>
              <SelectItem value="call_back_next_week">
                Call back next week
              </SelectItem>
              <SelectItem value="send_information">
                Send additional information
              </SelectItem>
              <SelectItem value="no_further_action">
                No further action needed
              </SelectItem>
              <SelectItem value="remove_from_list">
                Remove from candidate list
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Quick Save Button */}
        <Button
          onClick={handleEndCall}
          className="w-full flex items-center gap-2"
          variant="outline"
        >
          <CheckCircle className="h-4 w-4" />
          Save & End Call
        </Button>
      </CardContent>
    </Card>
  );
}
