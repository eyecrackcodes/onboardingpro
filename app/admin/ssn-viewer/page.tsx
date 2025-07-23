"use client";

import { useState, useEffect } from "react";
import { db } from "@/lib/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Shield, Eye, EyeOff, Lock } from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

interface SSNRecord {
  id: string;
  candidateName: string;
  candidateEmail: string;
  ssn: string;
  i9CompletedAt?: Date;
}

export default function SSNViewerPage() {
  const [records, setRecords] = useState<SSNRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [showSSN, setShowSSN] = useState<{ [key: string]: boolean }>({});
  const [authenticated, setAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");

  useEffect(() => {
    // Check if already authenticated in session
    const isAuth = sessionStorage.getItem("ssn-viewer-auth");
    if (isAuth === "true") {
      setAuthenticated(true);
      fetchSSNRecords();
    } else {
      setLoading(false);
    }
  }, []);

  const fetchSSNRecords = async () => {
    try {
      const records: SSNRecord[] = [];
      
      // Fetch completed I9s with SSN data
      const i9Query = query(
        collection(db, "i9Forms"),
        where("completed", "==", true)
      );
      const i9Snapshot = await getDocs(i9Query);
      
      i9Snapshot.forEach((doc) => {
        const data = doc.data();
        if (data.i9Data?.socialSecurityNumber) {
          records.push({
            id: doc.id,
            candidateName: data.candidateName || "Unknown",
            candidateEmail: data.candidateEmail || "",
            ssn: data.i9Data.socialSecurityNumber,
            i9CompletedAt: data.completedAt?.toDate(),
          });
        }
      });

      setRecords(records);
    } catch (error) {
      console.error("Error fetching SSN records:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = () => {
    // Simple passcode authentication (in production, use proper auth)
    if (passcode === "DigitalBGA2024") {
      setAuthenticated(true);
      sessionStorage.setItem("ssn-viewer-auth", "true");
      setLoading(true);
      fetchSSNRecords();
    } else {
      alert("Invalid passcode");
    }
  };

  const toggleSSN = (id: string) => {
    setShowSSN(prev => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const formatSSN = (ssn: string, show: boolean) => {
    if (!show) {
      return "***-**-" + ssn.slice(-4);
    }
    // Format SSN with dashes
    const cleaned = ssn.replace(/\D/g, '');
    if (cleaned.length === 9) {
      return `${cleaned.slice(0, 3)}-${cleaned.slice(3, 5)}-${cleaned.slice(5)}`;
    }
    return ssn;
  };

  const filteredRecords = records.filter(
    (record) =>
      record.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      record.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!authenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <Lock className="h-8 w-8 text-red-600" />
            </div>
            <CardTitle>SSN Viewer - Restricted Access</CardTitle>
            <p className="text-sm text-gray-600 mt-2">
              This page contains sensitive information. Please enter the passcode to continue.
            </p>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <Input
                type="password"
                placeholder="Enter passcode"
                value={passcode}
                onChange={(e) => setPasscode(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleAuthenticate()}
              />
              <Button onClick={handleAuthenticate} className="w-full">
                <Shield className="h-4 w-4 mr-2" />
                Authenticate
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading SSN records...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Shield className="h-8 w-8 text-red-600" />
          <h1 className="text-2xl font-bold">SSN Viewer - Restricted</h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            sessionStorage.removeItem("ssn-viewer-auth");
            window.location.reload();
          }}
        >
          Lock
        </Button>
      </div>

      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-red-800">
              <strong>Security Notice:</strong> This page contains sensitive personal information. 
              Access is logged and monitored. Only authorized HR personnel should view this information.
            </p>
          </div>
          
          <Input
            placeholder="Search by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="max-w-md"
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Security Numbers ({filteredRecords.length})</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Candidate Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>SSN</TableHead>
                <TableHead>I9 Completed</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredRecords.map((record) => (
                <TableRow key={record.id}>
                  <TableCell className="font-medium">
                    {record.candidateName}
                  </TableCell>
                  <TableCell>{record.candidateEmail}</TableCell>
                  <TableCell className="font-mono">
                    {formatSSN(record.ssn, showSSN[record.id] || false)}
                  </TableCell>
                  <TableCell>
                    {record.i9CompletedAt
                      ? new Date(record.i9CompletedAt).toLocaleDateString()
                      : "N/A"}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleSSN(record.id)}
                    >
                      {showSSN[record.id] ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredRecords.length === 0 && (
            <div className="text-center py-8 text-gray-500">
              No SSN records found
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 