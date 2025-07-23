"use client";

import { useState, useEffect } from "react";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { FileText, Download, Search, Filter, Calendar, User } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface SignedDocument {
  id: string;
  type: "offer" | "i9" | "background";
  candidateName: string;
  candidateEmail: string;
  documentName: string;
  signedAt: Date;
  downloadUrl?: string;
  hasBase64?: boolean;
  fileUrl?: string;
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<SignedDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    setLoading(true);
    try {
      const docs: SignedDocument[] = [];

      // Fetch signed offers
      const offersQuery = query(
        collection(db, "offers"),
        where("signed", "==", true)
      );
      const offersSnapshot = await getDocs(offersQuery);
      
      offersSnapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          type: "offer",
          candidateName: data.candidateName || "Unknown",
          candidateEmail: data.candidateEmail || "",
          documentName: `Offer Letter - ${data.templateId || "Unknown Template"}`,
          signedAt: data.signedAt?.toDate() || new Date(),
          downloadUrl: data.downloadUrl,
          hasBase64: !!data.signedPdfBase64,
        });
      });

      // Fetch all completed I9s (both manual uploads and electronic)
      const i9Query = query(
        collection(db, "i9Forms"),
        where("completed", "==", true)
      );
      const i9Snapshot = await getDocs(i9Query);
      
      i9Snapshot.forEach((doc) => {
        const data = doc.data();
        docs.push({
          id: doc.id,
          type: "i9",
          candidateName: data.candidateName || "Unknown",
          candidateEmail: data.candidateEmail || "",
          documentName: `I-9 Form - ${data.manualUpload ? (data.fileName || "Manual Upload") : "Electronic Submission"}`,
          signedAt: data.completedAt?.toDate() || data.uploadedAt?.toDate() || new Date(),
          fileUrl: data.fileUrl,
          hasBase64: !!data.fileBase64,
        });
      });

      // Sort by date, newest first
      docs.sort((a, b) => b.signedAt.getTime() - a.signedAt.getTime());

      setDocuments(docs);
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (doc: SignedDocument) => {
    setDownloading(doc.id);
    try {
      if (doc.type === "offer") {
        // Fetch the full offer document
        const { getDoc, doc: firestoreDoc } = await import("firebase/firestore");
        const offerDoc = await getDoc(firestoreDoc(db, "offers", doc.id));
        
        if (!offerDoc.exists()) {
          alert("Document not found");
          return;
        }

        const offerData = offerDoc.data();
        
        if (offerData.downloadUrl) {
          window.open(offerData.downloadUrl, "_blank");
        } else if (offerData.signedPdfBase64) {
          // Convert base64 to blob and download
          const base64 = offerData.signedPdfBase64;
          const byteCharacters = atob(base64);
          const byteNumbers = new Array(byteCharacters.length);
          
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `${doc.candidateName.replace(/\s+/g, '-')}-signed-offer.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      } else if (doc.type === "i9" && doc.fileUrl) {
        window.open(doc.fileUrl, "_blank");
      } else if (doc.type === "i9" && doc.hasBase64) {
        // Fetch and convert base64
        const { getDoc, doc: firestoreDoc } = await import("firebase/firestore");
        const i9Doc = await getDoc(firestoreDoc(db, "i9Forms", doc.id));
        
        if (i9Doc.exists() && i9Doc.data().fileBase64) {
          const base64 = i9Doc.data().fileBase64;
          const blob = new Blob([Buffer.from(base64, 'base64')], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          window.open(url, "_blank");
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      } else if (doc.type === "i9") {
        // Electronic I9 - generate PDF from data
        const { getDoc, doc: firestoreDoc } = await import("firebase/firestore");
        const i9Doc = await getDoc(firestoreDoc(db, "i9Forms", doc.id));
        
        if (i9Doc.exists() && i9Doc.data().i9Data) {
          const { generateI9PDF } = await import("@/lib/generate-i9-pdf");
          const i9Data = i9Doc.data().i9Data;
          const candidateName = i9Doc.data().candidateName;
          
          const pdfBytes = await generateI9PDF(i9Data, candidateName);
          const blob = new Blob([pdfBytes], { type: 'application/pdf' });
          const url = URL.createObjectURL(blob);
          
          const a = document.createElement('a');
          a.href = url;
          a.download = `${candidateName.replace(/\s+/g, '-')}-I9-form.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          
          setTimeout(() => URL.revokeObjectURL(url), 100);
        }
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Failed to download document");
    } finally {
      setDownloading(null);
    }
  };

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.candidateEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.documentName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Signed Documents</h1>
        <Badge variant="outline" className="text-lg px-3 py-1">
          {documents.length} Documents
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Document Repository
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Search Bar */}
          <div className="mb-6 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              type="text"
              placeholder="Search by candidate name, email, or document type..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Documents Table */}
          {loading ? (
            <div className="text-center py-8 text-gray-500">
              Loading documents...
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No documents found
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Document Type</TableHead>
                    <TableHead>Candidate</TableHead>
                    <TableHead>Document Name</TableHead>
                    <TableHead>Date Signed</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDocuments.map((doc) => (
                    <TableRow key={doc.id}>
                      <TableCell>
                        <Badge
                          variant={
                            doc.type === "offer"
                              ? "default"
                              : doc.type === "i9"
                              ? "secondary"
                              : "outline"
                          }
                        >
                          {doc.type.toUpperCase()}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div>
                          <div className="flex items-center gap-1">
                            <User className="h-3 w-3" />
                            <span className="font-medium">{doc.candidateName}</span>
                          </div>
                          <span className="text-sm text-gray-500">
                            {doc.candidateEmail}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{doc.documentName}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1 text-sm">
                          <Calendar className="h-3 w-3" />
                          {formatDate(doc.signedAt)}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleDownload(doc)}
                          disabled={downloading === doc.id}
                        >
                          {downloading === doc.id ? (
                            "Downloading..."
                          ) : (
                            <>
                              <Download className="h-4 w-4 mr-1" />
                              Download
                            </>
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Summary Stats */}
          <div className="mt-6 grid gap-4 md:grid-cols-3 border-t pt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-blue-600">
                {documents.filter((d) => d.type === "offer").length}
              </div>
              <div className="text-sm text-gray-500">Signed Offers</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {documents.filter((d) => d.type === "i9").length}
              </div>
              <div className="text-sm text-gray-500">I-9 Forms</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-purple-600">
                {documents.filter((d) => d.type === "background").length}
              </div>
              <div className="text-sm text-gray-500">Background Checks</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 