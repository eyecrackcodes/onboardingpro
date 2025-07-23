"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
import { ArrowLeft, Save } from "lucide-react";
import Link from "next/link";
import { createCandidate } from "@/lib/firestore";
import { getAllCohortOptions } from "@/lib/cohort-dates";
import type { Candidate } from "@/lib/types";

export default function NewCandidatePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const cohortOptions = getAllCohortOptions();

  const [formData, setFormData] = useState({
    personalInfo: {
      name: "",
      email: "",
      phone: "",
      location: "",
    },
    licenseStatus: "Unlicensed" as "Licensed" | "Unlicensed",
    callCenter: "CLT" as "CLT" | "ATX",
    selectedCohortDate: "",
    notes: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Determine class type and start date from selected cohort
      let classType: "AGENT" | "UNL" =
        formData.licenseStatus === "Licensed" ? "AGENT" : "UNL";
      let startDate: Date | undefined;

      if (formData.selectedCohortDate) {
        const cohortOption = cohortOptions.find(
          (opt) => opt.value === formData.selectedCohortDate
        );
        if (cohortOption) {
          classType = cohortOption.classType;
          startDate = new Date(formData.selectedCohortDate + "T00:00:00");
        }
      }

      // Create the candidate object with all required fields
      const newCandidate: Omit<Candidate, "id" | "createdAt" | "updatedAt"> = {
        personalInfo: formData.personalInfo,
        callCenter: formData.callCenter,
        licenseStatus: formData.licenseStatus,
        notes: formData.notes,
        hiringPhase: "Initial",
        backgroundCheck: {
          initiated: false,
          status: "Pending",
          notes: "",
        },
        offers: {
          preLicenseOffer: {
            sent: false,
            signed: false,
          },
          fullAgentOffer: {
            eligible: false,
            sent: false,
            signed: false,
          },
        },
        licensing: {
          licensePassed: false,
        },
        classAssignment: {
          classType: classType,
          startDate: startDate,
          preStartCallCompleted: false,
          startConfirmed: !!startDate,
          sysOnboarding: false,
        },
        status: "Active",
        readyToGo: false,
      };

      console.log("[NewCandidate] Creating candidate with cohort assignment:", {
        name: formData.personalInfo.name,
        classType,
        startDate: startDate?.toLocaleDateString(),
        selectedCohortDate: formData.selectedCohortDate,
      });

      await createCandidate(newCandidate);
      router.push("/candidates");
    } catch (error) {
      console.error("Error creating candidate:", error);
      alert("Failed to create candidate. Please try again.");
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: string) => {
    if (field.includes(".")) {
      const [parent, child] = field.split(".");
      setFormData((prev) => ({
        ...prev,
        [parent]: {
          ...(prev as any)[parent],
          [child]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  // Filter cohort options based on license status
  const filteredCohortOptions = cohortOptions.filter((option) => {
    if (formData.licenseStatus === "Licensed") {
      return option.classType === "AGENT";
    } else {
      return option.classType === "UNL";
    }
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/candidates">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Candidate
            </h1>
            <p className="text-gray-500">
              Enter candidate information to start the onboarding process
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Personal Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name</Label>
                <Input
                  id="name"
                  value={formData.personalInfo.name}
                  onChange={(e) =>
                    handleInputChange("personalInfo.name", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.personalInfo.email}
                  onChange={(e) =>
                    handleInputChange("personalInfo.email", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.personalInfo.phone}
                  onChange={(e) =>
                    handleInputChange("personalInfo.phone", e.target.value)
                  }
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.personalInfo.location}
                  onChange={(e) =>
                    handleInputChange("personalInfo.location", e.target.value)
                  }
                  placeholder="City, State"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Position Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="licenseStatus">License Status</Label>
                <Select
                  value={formData.licenseStatus}
                  onValueChange={(value) =>
                    handleInputChange("licenseStatus", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Licensed">Licensed</SelectItem>
                    <SelectItem value="Unlicensed">Unlicensed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callCenter">Call Center</Label>
                <Select
                  value={formData.callCenter}
                  onValueChange={(value) =>
                    handleInputChange("callCenter", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">Charlotte (CLT)</SelectItem>
                    <SelectItem value="ATX">Austin (ATX)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="cohortDate">
                Target Class Start Date (Optional)
              </Label>
              <Select
                value={formData.selectedCohortDate}
                onValueChange={(value) =>
                  handleInputChange("selectedCohortDate", value)
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a specific class start date or leave blank for automatic assignment" />
                </SelectTrigger>
                <SelectContent>
                  {filteredCohortOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-sm text-gray-500">
                If not selected, the candidate will be automatically assigned to
                the next available
                {formData.licenseStatus === "Licensed"
                  ? " licensed"
                  : " unlicensed"}{" "}
                class.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Additional Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                value={formData.notes}
                onChange={(e) => handleInputChange("notes", e.target.value)}
                placeholder="Any additional information about the candidate..."
                rows={3}
              />
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/candidates">
            <Button type="button" variant="outline">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="h-4 w-4 mr-2" />
            {loading ? "Creating..." : "Create Candidate"}
          </Button>
        </div>
      </form>
    </div>
  );
}
