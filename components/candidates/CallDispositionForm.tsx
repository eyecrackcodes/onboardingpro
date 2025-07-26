"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CandidateNotesService } from "@/lib/candidate-notes-service";

interface CallDispositionFormProps {
  callRecord: any;
  candidateId: string;
  onComplete: () => void;
  onCancel: () => void;
}

export function CallDispositionForm({
  callRecord,
  candidateId,
  onComplete,
  onCancel,
}: CallDispositionFormProps) {
  const [disposition, setDisposition] = useState({
    status: "",
    outcome: "",
    nextAction: "",
    conversationNotes: "",
    internalNotes: "",
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    if (!disposition.status || !disposition.outcome) {
      alert("Please select both call status and outcome.");
      return;
    }

    setIsSaving(true);

    try {
      await CandidateNotesService.saveCallDisposition(
        candidateId,
        callRecord,
        disposition
      );

      console.log("✅ Call disposition saved successfully");
      onComplete();
    } catch (error) {
      console.error("❌ Error saving call disposition:", error);
      alert("Failed to save call disposition. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="w-full max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle>📞 Call Disposition</CardTitle>
        <p className="text-sm text-gray-600">
          Complete the details for your call with {callRecord.candidateName}
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="status">Call Status *</Label>
            <Select
              value={disposition.status}
              onValueChange={(value) =>
                setDisposition((prev) => ({ ...prev, status: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="contacted">
                  Successfully Contacted
                </SelectItem>
                <SelectItem value="no_answer">No Answer</SelectItem>
                <SelectItem value="voicemail">Left Voicemail</SelectItem>
                <SelectItem value="busy">Line Busy</SelectItem>
                <SelectItem value="wrong_number">Wrong Number</SelectItem>
                <SelectItem value="callback_requested">
                  Callback Requested
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="outcome">Call Outcome *</Label>
            <Select
              value={disposition.outcome}
              onValueChange={(value) =>
                setDisposition((prev) => ({ ...prev, outcome: value }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select outcome" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="interview_scheduled">
                  Interview Scheduled
                </SelectItem>
                <SelectItem value="not_interested">Not Interested</SelectItem>
                <SelectItem value="needs_callback">Needs Callback</SelectItem>
                <SelectItem value="information_provided">
                  Information Provided
                </SelectItem>
                <SelectItem value="follow_up_needed">
                  Follow-up Needed
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <Label htmlFor="nextAction">Next Action</Label>
          <Select
            value={disposition.nextAction}
            onValueChange={(value) =>
              setDisposition((prev) => ({ ...prev, nextAction: value }))
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select next action" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="schedule_interview">
                Schedule Interview
              </SelectItem>
              <SelectItem value="schedule_callback">
                Schedule Callback
              </SelectItem>
              <SelectItem value="send_email">Send Email</SelectItem>
              <SelectItem value="no_action">No Action Needed</SelectItem>
              <SelectItem value="remove_from_pool">Remove from Pool</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="conversationNotes">Conversation Notes</Label>
          <Textarea
            id="conversationNotes"
            placeholder="Enter details about the conversation..."
            value={disposition.conversationNotes}
            onChange={(e) =>
              setDisposition((prev) => ({
                ...prev,
                conversationNotes: e.target.value,
              }))
            }
            rows={3}
          />
        </div>

        <div>
          <Label htmlFor="internalNotes">Internal Recruiter Notes</Label>
          <Textarea
            id="internalNotes"
            placeholder="Enter internal notes (not visible to candidate)..."
            value={disposition.internalNotes}
            onChange={(e) =>
              setDisposition((prev) => ({
                ...prev,
                internalNotes: e.target.value,
              }))
            }
            rows={2}
          />
        </div>

        <div className="flex gap-2 pt-4">
          <Button
            onClick={handleSave}
            disabled={isSaving || !disposition.status || !disposition.outcome}
            className="flex-1"
          >
            {isSaving ? "Saving..." : "Save Call Disposition"}
          </Button>
          <Button onClick={onCancel} variant="outline" disabled={isSaving}>
            Cancel
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
