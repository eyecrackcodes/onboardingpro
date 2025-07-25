"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  UserPlus,
  Search,
  Filter,
  MoreVertical,
  Phone,
  Mail,
  Building,
  Trash2,
} from "lucide-react";
import {
  getCandidates,
  subscribeToCandidates,
  deleteCandidate,
} from "@/lib/firestore";
import { getPipelineStages, getStatusColor, formatDate } from "@/lib/utils";
import { CompactProgressPipeline } from "@/components/candidates/ProgressPipeline";
import type { Candidate } from "@/lib/types";

export default function CandidatesPage() {
  const [candidates, setCandidates] = useState<Candidate[]>([]);
  const [filteredCandidates, setFilteredCandidates] = useState<Candidate[]>([]);
  const [selectedCandidates, setSelectedCandidates] = useState<string[]>([]);
  const [deleting, setDeleting] = useState(false);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    callCenter: "all",
    licenseStatus: "all",
    status: "all",
    location: "all",
  });

  useEffect(() => {
    // Initial data fetch
    // Set up real-time listener
    const unsubscribe = subscribeToCandidates((updatedCandidates) => {
      setCandidates(updatedCandidates);
      setFilteredCandidates(updatedCandidates);
      // Apply current filters to updated data
      filterCandidates(updatedCandidates, searchTerm, filters);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filterCandidates = (
    candidatesList: Candidate[],
    search: string,
    currentFilters: typeof filters
  ) => {
    let filtered = [...candidatesList];

    // Apply search filter
    if (search) {
      filtered = filtered.filter(
        (candidate) =>
          candidate.personalInfo.name
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          candidate.personalInfo.email
            .toLowerCase()
            .includes(search.toLowerCase()) ||
          candidate.personalInfo.phone.includes(search)
      );
    }

    // Apply other filters
    if (currentFilters.callCenter !== "all") {
      filtered = filtered.filter(
        (c) => c.callCenter === currentFilters.callCenter
      );
    }
    if (currentFilters.licenseStatus !== "all") {
      filtered = filtered.filter(
        (c) => c.licenseStatus === currentFilters.licenseStatus
      );
    }
    if (currentFilters.status !== "all") {
      filtered = filtered.filter((c) => c.status === currentFilters.status);
    }

    // Apply location filter
    if (currentFilters.location !== "all") {
      filtered = filtered.filter((c) => {
        const candidateLocation = c.personalInfo.location?.toLowerCase() || "";
        if (currentFilters.location === "charlotte") {
          return (
            candidateLocation.includes("charlotte") ||
            candidateLocation.includes("nc") ||
            candidateLocation.includes("north carolina")
          );
        } else if (currentFilters.location === "austin") {
          return (
            candidateLocation.includes("austin") ||
            candidateLocation.includes("tx") ||
            candidateLocation.includes("texas")
          );
        }
        return true;
      });
    }

    setFilteredCandidates(filtered);
  };

  const handleSearchChange = (value: string) => {
    setSearchTerm(value);
    filterCandidates(candidates, value, filters);
  };

  const handleFilterChange = (key: keyof typeof filters, value: string) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    filterCandidates(candidates, searchTerm, newFilters);
  };

  // Selection handlers
  const handleSelectCandidate = (candidateId: string, checked: boolean) => {
    if (checked) {
      setSelectedCandidates((prev) => [...prev, candidateId]);
    } else {
      setSelectedCandidates((prev) => prev.filter((id) => id !== candidateId));
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedCandidates(filteredCandidates.map((c) => c.id));
    } else {
      setSelectedCandidates([]);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedCandidates.length === 0) return;

    const candidateNames = selectedCandidates
      .map((id) => candidates.find((c) => c.id === id)?.personalInfo.name)
      .filter(Boolean)
      .join(", ");

    const confirmed = window.confirm(
      `Are you sure you want to delete ${selectedCandidates.length} candidate(s)?\n\n` +
        `Candidates to be deleted:\n${candidateNames}\n\n` +
        `This action cannot be undone and will permanently remove all their data.`
    );

    if (!confirmed) return;

    const confirmText = window.prompt(
      `Please type "DELETE ALL" to confirm deletion of ${selectedCandidates.length} candidates:`
    );

    if (confirmText !== "DELETE ALL") {
      alert(
        "Deletion cancelled. You must type exactly 'DELETE ALL' to confirm."
      );
      return;
    }

    setDeleting(true);
    try {
      console.log(
        `[CandidatesList] Deleting ${selectedCandidates.length} candidates`
      );

      // Delete candidates in parallel
      await Promise.all(selectedCandidates.map((id) => deleteCandidate(id)));

      console.log(
        `[CandidatesList] ✅ Successfully deleted ${selectedCandidates.length} candidates`
      );
      setSelectedCandidates([]);

      // Refresh the candidates list
      const data = await getCandidates();
      setCandidates(data);
      filterCandidates(data, searchTerm, filters);
    } catch (error) {
      console.error("[CandidatesList] ❌ Error deleting candidates:", error);
      alert("Failed to delete some candidates. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading candidates...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Candidates</h1>
          <p className="text-gray-500">
            Manage your candidate pipeline
            {selectedCandidates.length > 0 && (
              <span className="ml-2 text-blue-600 font-medium">
                ({selectedCandidates.length} selected)
              </span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-3">
          {selectedCandidates.length > 0 && (
            <Button
              variant="destructive"
              size="sm"
              onClick={handleBulkDelete}
              disabled={deleting}
              className="flex items-center gap-2"
            >
              <Trash2 className="h-4 w-4" />
              {deleting
                ? "Deleting..."
                : `Delete ${selectedCandidates.length} Selected`}
            </Button>
          )}
          <Link href="/candidates/new">
            <Button>
              <UserPlus className="mr-2 h-4 w-4" />
              Add Candidate
            </Button>
          </Link>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Filters
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-5">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search candidates..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select
              value={filters.callCenter}
              onValueChange={(value) => handleFilterChange("callCenter", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Call Center" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Centers</SelectItem>
                <SelectItem value="CLT">Charlotte (CLT)</SelectItem>
                <SelectItem value="ATX">Austin (ATX)</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.licenseStatus}
              onValueChange={(value) =>
                handleFilterChange("licenseStatus", value)
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="License Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Licensed">Licensed</SelectItem>
                <SelectItem value="Unlicensed">Unlicensed</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.status}
              onValueChange={(value) => handleFilterChange("status", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
                <SelectItem value="Dropped">Dropped</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
              </SelectContent>
            </Select>

            <Select
              value={filters.location}
              onValueChange={(value) => handleFilterChange("location", value)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Locations</SelectItem>
                <SelectItem value="charlotte">Charlotte EST</SelectItem>
                <SelectItem value="austin">Austin CST</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Candidates List */}
      <div className="bg-white shadow-sm rounded-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  <Checkbox
                    checked={
                      selectedCandidates.length === filteredCandidates.length &&
                      filteredCandidates.length > 0
                    }
                    onCheckedChange={handleSelectAll}
                  />
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Candidate
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location / License
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Interview
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Progress
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredCandidates.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="px-6 py-12 text-center text-gray-500"
                  >
                    No candidates found matching your criteria
                  </td>
                </tr>
              ) : (
                filteredCandidates.map((candidate) => {
                  const stages = getPipelineStages(candidate);
                  return (
                    <tr key={candidate.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Checkbox
                          checked={selectedCandidates.includes(candidate.id)}
                          onCheckedChange={(checked) =>
                            handleSelectCandidate(candidate.id, !!checked)
                          }
                        />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <div className="text-sm font-medium text-gray-900">
                            {candidate.personalInfo.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            Added {formatDate(candidate.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900 flex flex-col gap-1">
                          <div className="flex items-center gap-1">
                            <Mail className="h-3 w-3 text-gray-400" />
                            {candidate.personalInfo.email}
                          </div>
                          <div className="flex items-center gap-1">
                            <Phone className="h-3 w-3 text-gray-400" />
                            {candidate.personalInfo.phone}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-gray-400" />
                          <div>
                            <div className="text-sm text-gray-900">
                              {candidate.personalInfo.location ||
                                candidate.callCenter}
                            </div>
                            <div className="text-sm text-gray-500">
                              {candidate.licenseStatus}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge
                          variant={
                            candidate.interview?.status === "Completed"
                              ? candidate.interview?.result === "Passed"
                                ? "default"
                                : "destructive"
                              : candidate.interview?.status === "In Progress"
                              ? "secondary"
                              : "outline"
                          }
                          className="text-xs"
                        >
                          {candidate.interview?.status === "Completed"
                            ? candidate.interview?.result || "No Result"
                            : candidate.interview?.status || "Not Started"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4">
                        <CompactProgressPipeline stages={stages} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={getStatusColor(candidate.status)}>
                          {candidate.status}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <Link href={`/candidates/${candidate.id}`}>
                          <Button variant="ghost" size="sm">
                            View
                          </Button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {filteredCandidates.length}
            </div>
            <p className="text-xs text-muted-foreground">Total Showing</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {filteredCandidates.filter((c) => c.status === "Active").length}
            </div>
            <p className="text-xs text-muted-foreground">Active</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {
                filteredCandidates.filter(
                  (c) => c.backgroundCheck.status === "In Progress"
                ).length
              }
            </div>
            <p className="text-xs text-muted-foreground">In BG Check</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="text-2xl font-bold">
              {filteredCandidates.filter((c) => c.readyToGo).length}
            </div>
            <p className="text-xs text-muted-foreground">Ready to Start</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
