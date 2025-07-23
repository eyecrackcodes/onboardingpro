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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Save, Plus, X } from "lucide-react";
import Link from "next/link";
import { createTrainer } from "@/lib/firestore";
import type { Trainer } from "@/lib/types";

export default function NewTrainerPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [specialization, setSpecialization] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    type: "SSS" as "SSS" | "CAP",
    callCenter: "CLT" as "CLT" | "ATX" | "Both",
    maxCapacity: 15,
    specializations: [] as string[],
    isActive: true,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newTrainer: Omit<Trainer, "id" | "createdAt" | "updatedAt"> = {
        ...formData,
        currentAssignments: [],
      };

      await createTrainer(newTrainer);
      router.push("/trainers");
    } catch (error) {
      console.error("Error creating trainer:", error);
      alert("Failed to create trainer. Please try again.");
      setLoading(false);
    }
  };

  const handleInputChange = (field: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const addSpecialization = () => {
    if (
      specialization.trim() &&
      !formData.specializations.includes(specialization.trim())
    ) {
      handleInputChange("specializations", [
        ...formData.specializations,
        specialization.trim(),
      ]);
      setSpecialization("");
    }
  };

  const removeSpecialization = (spec: string) => {
    handleInputChange(
      "specializations",
      formData.specializations.filter((s) => s !== spec)
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/trainers">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              Add New Trainer
            </h1>
            <p className="text-gray-500">Enter trainer information</p>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Basic Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="name">Full Name *</Label>
                <Input
                  id="name"
                  required
                  value={formData.name}
                  onChange={(e) => handleInputChange("name", e.target.value)}
                  placeholder="John Smith"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => handleInputChange("email", e.target.value)}
                  placeholder="trainer@callcenter.com"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => handleInputChange("phone", e.target.value)}
                  placeholder="(555) 123-4567"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxCapacity">Max Capacity *</Label>
                <Input
                  id="maxCapacity"
                  type="number"
                  required
                  min="1"
                  max="50"
                  value={formData.maxCapacity}
                  onChange={(e) =>
                    handleInputChange("maxCapacity", parseInt(e.target.value))
                  }
                />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Assignment Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="type">Trainer Type *</Label>
                <Select
                  value={formData.type}
                  onValueChange={(value) => handleInputChange("type", value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select trainer type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SSS">SSS</SelectItem>
                    <SelectItem value="CAP">CAP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="callCenter">Call Center *</Label>
                <Select
                  value={formData.callCenter}
                  onValueChange={(value) =>
                    handleInputChange("callCenter", value)
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select call center" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="CLT">Charlotte (CLT)</SelectItem>
                    <SelectItem value="ATX">Austin (ATX)</SelectItem>
                    <SelectItem value="Both">Both Centers</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Specializations</Label>
              <div className="flex gap-2">
                <Input
                  value={specialization}
                  onChange={(e) => setSpecialization(e.target.value)}
                  placeholder="e.g., Customer Service, Sales"
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      addSpecialization();
                    }
                  }}
                />
                <Button type="button" onClick={addSpecialization} size="icon">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              {formData.specializations.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.specializations.map((spec, index) => (
                    <Badge
                      key={index}
                      variant="secondary"
                      className="pl-3 pr-1 py-1"
                    >
                      {spec}
                      <button
                        type="button"
                        onClick={() => removeSpecialization(spec)}
                        className="ml-2 hover:bg-gray-300 rounded p-0.5"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isActive"
                checked={formData.isActive}
                onCheckedChange={(checked) =>
                  handleInputChange("isActive", checked)
                }
              />
              <Label htmlFor="isActive">Trainer is active</Label>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end gap-4">
          <Link href="/trainers">
            <Button variant="outline" type="button">
              Cancel
            </Button>
          </Link>
          <Button type="submit" disabled={loading}>
            <Save className="mr-2 h-4 w-4" />
            {loading ? "Creating..." : "Create Trainer"}
          </Button>
        </div>
      </form>
    </div>
  );
}
