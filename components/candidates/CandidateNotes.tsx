"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  CandidateNotesService,
  type CandidateNote,
} from "@/lib/candidate-notes-service";
import {
  Phone,
  MessageSquare,
  Calendar,
  User,
  Plus,
  Clock,
} from "lucide-react";

interface CandidateNotesProps {
  candidateId: string;
  candidateName: string;
}

export function CandidateNotes({
  candidateId,
  candidateName,
}: CandidateNotesProps) {
  const [notes, setNotes] = useState<CandidateNote[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddNote, setShowAddNote] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    loadNotes();
  }, [candidateId]);

  const loadNotes = async () => {
    try {
      setLoading(true);
      const candidateNotes = await CandidateNotesService.getCandidateNotes(
        candidateId
      );
      setNotes(candidateNotes);
    } catch (error) {
      console.error("Error loading notes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;

    try {
      setSaving(true);
      await CandidateNotesService.addGeneralNote(candidateId, newNote.trim());
      setNewNote("");
      setShowAddNote(false);
      await loadNotes(); // Refresh notes
    } catch (error) {
      console.error("Error adding note:", error);
      alert("Failed to add note. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "call":
        return <Phone className="h-4 w-4" />;
      case "interview":
        return <Calendar className="h-4 w-4" />;
      case "follow_up":
        return <Clock className="h-4 w-4" />;
      default:
        return <MessageSquare className="h-4 w-4" />;
    }
  };

  const getTypeBadgeColor = (type: string) => {
    switch (type) {
      case "call":
        return "bg-blue-100 text-blue-800";
      case "interview":
        return "bg-green-100 text-green-800";
      case "follow_up":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Candidate Notes
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8 text-gray-500">Loading notes...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <MessageSquare className="h-5 w-5" />
            Notes for {candidateName}
            <Badge variant="secondary">{notes.length}</Badge>
          </CardTitle>
          <Button
            onClick={() => setShowAddNote(!showAddNote)}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Add Note
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {showAddNote && (
          <Card className="border-dashed">
            <CardContent className="pt-4">
              <div className="space-y-3">
                <div className="flex items-center gap-2 text-sm font-medium">
                  <User className="h-4 w-4" />
                  Add New Note
                </div>
                <Textarea
                  placeholder="Enter your note about this candidate..."
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  rows={3}
                  className="resize-none"
                />
                <div className="flex gap-2">
                  <Button
                    onClick={handleAddNote}
                    disabled={saving || !newNote.trim()}
                    size="sm"
                    className="flex-1"
                  >
                    {saving ? "Saving..." : "Save Note"}
                  </Button>
                  <Button
                    onClick={() => {
                      setShowAddNote(false);
                      setNewNote("");
                    }}
                    variant="outline"
                    size="sm"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        <div className="space-y-3">
          {notes.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
              <p className="text-lg font-medium">No notes yet</p>
              <p className="text-sm">Add the first note about this candidate</p>
            </div>
          ) : (
            notes.map((note) => (
              <Card key={note.id} className="border-l-4 border-l-blue-500">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {getTypeIcon(note.type)}
                      <Badge className={getTypeBadgeColor(note.type)}>
                        {note.type.replace("_", " ").toUpperCase()}
                      </Badge>
                      {note.disposition && (
                        <Badge variant="outline">
                          {note.disposition.status}
                        </Badge>
                      )}
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatDate(note.createdAt)}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <p className="text-sm leading-relaxed">{note.content}</p>

                    {note.disposition && (
                      <div className="bg-gray-50 p-3 rounded-md space-y-2 text-xs">
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <span className="font-medium">Status:</span>
                            <span className="ml-1">
                              {note.disposition.status}
                            </span>
                          </div>
                          <div>
                            <span className="font-medium">Outcome:</span>
                            <span className="ml-1">
                              {note.disposition.outcome}
                            </span>
                          </div>
                        </div>
                        {note.disposition.nextAction && (
                          <div>
                            <span className="font-medium">Next Action:</span>
                            <span className="ml-1">
                              {note.disposition.nextAction}
                            </span>
                          </div>
                        )}
                        {note.disposition.conversationNotes && (
                          <div>
                            <span className="font-medium">Conversation:</span>
                            <p className="mt-1 text-gray-600">
                              {note.disposition.conversationNotes}
                            </p>
                          </div>
                        )}
                        {note.disposition.internalNotes && (
                          <div>
                            <span className="font-medium">Internal Notes:</span>
                            <p className="mt-1 text-gray-600">
                              {note.disposition.internalNotes}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
}
