"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { UserCheck, Plus, Mail, Phone, Users, Building } from "lucide-react";
import { getTrainers, createTrainer } from "@/lib/firestore";
import type { Trainer } from "@/lib/types";

export default function TrainersPage() {
  const [trainers, setTrainers] = useState<Trainer[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTrainers();
  }, []);

  const fetchTrainers = async () => {
    try {
      const data = await getTrainers();
      setTrainers(data);
      setLoading(false);
    } catch (error) {
      console.error("Error fetching trainers:", error);
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading trainers...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Trainers</h1>
          <p className="text-gray-500">Manage call center training staff</p>
        </div>
        <Link href="/trainers/new">
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            Add Trainer
          </Button>
        </Link>
      </div>

      {/* Summary Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  Total Trainers
                </p>
                <p className="text-2xl font-bold">{trainers.length}</p>
              </div>
              <UserCheck className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Active</p>
                <p className="text-2xl font-bold">
                  {trainers.filter((t) => t.isActive).length}
                </p>
              </div>
              <Users className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  SSS Trainers
                </p>
                <p className="text-2xl font-bold">
                  {trainers.filter((t) => t.type === "SSS").length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">
                  CAP Trainers
                </p>
                <p className="text-2xl font-bold">
                  {trainers.filter((t) => t.type === "CAP").length}
                </p>
              </div>
              <UserCheck className="h-8 w-8 text-gray-400" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Trainers Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {trainers.map((trainer) => (
          <Card key={trainer.id} className="hover:shadow-lg transition-shadow">
            <CardHeader>
              <div className="flex justify-between items-start">
                <div>
                  <CardTitle className="text-lg">{trainer.name}</CardTitle>
                  <p className="text-sm text-gray-500 mt-1">
                    {trainer.type} Trainer
                  </p>
                </div>
                <Badge variant={trainer.isActive ? "default" : "secondary"}>
                  {trainer.isActive ? "Active" : "Inactive"}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <span>{trainer.email}</span>
                </div>
                {trainer.phone && (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <span>{trainer.phone}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Building className="h-4 w-4 text-gray-400" />
                  <span>{trainer.callCenter}</span>
                </div>
              </div>

              <div className="pt-3 border-t">
                <div className="flex justify-between items-center text-sm">
                  <span className="text-gray-600">Current Cohorts</span>
                  <span className="font-medium">
                    {trainer.currentAssignments.length}
                  </span>
                </div>
                <div className="flex justify-between items-center text-sm mt-1">
                  <span className="text-gray-600">Max Capacity</span>
                  <span className="font-medium">{trainer.maxCapacity}</span>
                </div>
              </div>

              {trainer.specializations.length > 0 && (
                <div className="pt-3 border-t">
                  <p className="text-xs font-medium text-gray-600 mb-1">
                    Specializations
                  </p>
                  <div className="flex flex-wrap gap-1">
                    {trainer.specializations.map((spec, index) => (
                      <Badge key={index} variant="outline" className="text-xs">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {trainers.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <UserCheck className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No trainers found
            </h3>
            <p className="text-gray-500 mb-4">
              Get started by adding your first trainer.
            </p>
            <Link href="/trainers/new">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add First Trainer
              </Button>
            </Link>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
