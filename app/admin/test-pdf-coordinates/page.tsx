"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, TestTube, Target } from "lucide-react";

export default function TestPDFCoordinatesPage() {
  const [testData, setTestData] = useState({
    candidateName: "John Test Doe",
    projectedStartDate: "August 4, 2025",
    nameX: 425,
    nameY: 362, // height - 430 for typical 792 height
    dateX: 540,
    dateY: 284, // height - 508 for typical 792 height
  });

  const [templateType, setTemplateType] = useState(
    "MASTER Austin UNLICENSED Agent - Offer of Employment Letter.docx"
  );

  const handleGenerateTestPDF = async () => {
    try {
      console.log("[PDFTest] Generating test PDF with coordinates:", testData);

      // Create a test offer document in Firestore
      const testOfferId = "test-pdf-coordinates-" + Date.now();

      // Use the existing offer signing page with test coordinates
      const testURL = `/offer/${testOfferId}?test=true&nameX=${
        testData.nameX
      }&nameY=${testData.nameY}&dateX=${testData.dateX}&dateY=${
        testData.dateY
      }&candidateName=${encodeURIComponent(
        testData.candidateName
      )}&startDate=${encodeURIComponent(
        testData.projectedStartDate
      )}&templateId=${encodeURIComponent(templateType)}`;

      window.open(testURL, "_blank");
    } catch (error) {
      console.error("[PDFTest] Error generating test PDF:", error);
      alert("Failed to generate test PDF");
    }
  };

  const presetCoordinates = {
    "Austin UNLICENSED": {
      nameX: 425,
      nameY: 362,
      dateX: 540,
      dateY: 284,
    },
    "Austin Licensed": {
      nameX: 430,
      nameY: 365,
      dateX: 545,
      dateY: 287,
    },
    "Charlotte UNLICENSED": {
      nameX: 425,
      nameY: 362,
      dateX: 540,
      dateY: 284,
    },
    "Charlotte Licensed": {
      nameX: 430,
      nameY: 365,
      dateX: 545,
      dateY: 287,
    },
  };

  const loadPreset = (preset: keyof typeof presetCoordinates) => {
    const coords = presetCoordinates[preset];
    setTestData((prev) => ({
      ...prev,
      ...coords,
    }));
  };

  const adjustCoordinate = (field: keyof typeof testData, delta: number) => {
    setTestData((prev) => ({
      ...prev,
      [field]: typeof prev[field] === 'number' ? prev[field] + delta : prev[field],
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">
            PDF Coordinate Testing
          </h1>
          <p className="text-gray-500">
            Test and adjust PDF text positioning for offer letters
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Test Configuration */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TestTube className="h-5 w-5" />
              Test Configuration
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label htmlFor="candidateName">Test Candidate Name</Label>
              <Input
                id="candidateName"
                value={testData.candidateName}
                onChange={(e) =>
                  setTestData((prev) => ({
                    ...prev,
                    candidateName: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="startDate">Test Start Date</Label>
              <Input
                id="startDate"
                value={testData.projectedStartDate}
                onChange={(e) =>
                  setTestData((prev) => ({
                    ...prev,
                    projectedStartDate: e.target.value,
                  }))
                }
              />
            </div>

            <div>
              <Label htmlFor="template">Template Type</Label>
              <select
                id="template"
                value={templateType}
                onChange={(e) => setTemplateType(e.target.value)}
                className="w-full p-2 border rounded-md"
              >
                <option value="MASTER Austin UNLICENSED Agent - Offer of Employment Letter.docx">
                  Austin - Unlicensed
                </option>
                <option value="MASTER Austin Agent - Offer of Employment Letter">
                  Austin - Licensed
                </option>
                <option value="MASTER Charlotte UNLICENSED Agent - Offer of Employment Letter.docx">
                  Charlotte - Unlicensed
                </option>
                <option value="MASTER Charlotte Agent - Offer of Employment Letter.docx">
                  Charlotte - Licensed
                </option>
              </select>
            </div>

            <div className="space-y-2">
              <Label>Quick Presets</Label>
              <div className="grid grid-cols-2 gap-2">
                {Object.keys(presetCoordinates).map((preset) => (
                  <Button
                    key={preset}
                    onClick={() =>
                      loadPreset(preset as keyof typeof presetCoordinates)
                    }
                    variant="outline"
                    size="sm"
                  >
                    {preset}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coordinate Adjustment */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Coordinate Adjustment
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Candidate Name Position */}
            <div>
              <h3 className="font-medium mb-3">
                Candidate Name Position (&quot;Dear ____&quot;)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>X Position (Left/Right)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => adjustCoordinate("nameX", -5)}
                      variant="outline"
                      size="sm"
                    >
                      ←
                    </Button>
                    <Input
                      type="number"
                      value={testData.nameX}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          nameX: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="text-center"
                    />
                    <Button
                      onClick={() => adjustCoordinate("nameX", 5)}
                      variant="outline"
                      size="sm"
                    >
                      →
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Y Position (Up/Down)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => adjustCoordinate("nameY", 5)}
                      variant="outline"
                      size="sm"
                    >
                      ↑
                    </Button>
                    <Input
                      type="number"
                      value={testData.nameY}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          nameY: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="text-center"
                    />
                    <Button
                      onClick={() => adjustCoordinate("nameY", -5)}
                      variant="outline"
                      size="sm"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            {/* Start Date Position */}
            <div>
              <h3 className="font-medium mb-3">
                Start Date Position (&quot;8:00AM CST on ____&quot;)
              </h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>X Position (Left/Right)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => adjustCoordinate("dateX", -5)}
                      variant="outline"
                      size="sm"
                    >
                      ←
                    </Button>
                    <Input
                      type="number"
                      value={testData.dateX}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          dateX: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="text-center"
                    />
                    <Button
                      onClick={() => adjustCoordinate("dateX", 5)}
                      variant="outline"
                      size="sm"
                    >
                      →
                    </Button>
                  </div>
                </div>
                <div>
                  <Label>Y Position (Up/Down)</Label>
                  <div className="flex items-center gap-2">
                    <Button
                      onClick={() => adjustCoordinate("dateY", 5)}
                      variant="outline"
                      size="sm"
                    >
                      ↑
                    </Button>
                    <Input
                      type="number"
                      value={testData.dateY}
                      onChange={(e) =>
                        setTestData((prev) => ({
                          ...prev,
                          dateY: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="text-center"
                    />
                    <Button
                      onClick={() => adjustCoordinate("dateY", -5)}
                      variant="outline"
                      size="sm"
                    >
                      ↓
                    </Button>
                  </div>
                </div>
              </div>
            </div>

            <Button
              onClick={handleGenerateTestPDF}
              className="w-full bg-blue-600 hover:bg-blue-700"
            >
              <Download className="h-4 w-4 mr-2" />
              Generate Test PDF
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* Instructions */}
      <Card>
        <CardHeader>
          <CardTitle>How to Use This Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                📍 Coordinate System
              </h3>
              <ul className="text-sm text-blue-700 space-y-1">
                <li>• X: 0 = far left, higher = move right</li>
                <li>• Y: 0 = bottom, higher = move up</li>
                <li>• PDF height is typically 792 points</li>
                <li>• PDF width is typically 612 points</li>
              </ul>
            </div>

            <div className="p-4 bg-green-50 rounded-lg border border-green-200">
              <h3 className="font-medium text-green-800 mb-2">
                🎯 Testing Process
              </h3>
              <ul className="text-sm text-green-700 space-y-1">
                <li>1. Load a preset or enter coordinates</li>
                <li>2. Generate test PDF and review</li>
                <li>3. Adjust coordinates using +/- buttons</li>
                <li>4. Repeat until positioning is perfect</li>
              </ul>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h3 className="font-medium text-yellow-800 mb-2">💡 Tips</h3>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• Small adjustments (5-10 points) usually work best</li>
              <li>• Different templates may need different coordinates</li>
              <li>• Test with both short and long names/dates</li>
              <li>• Use browser developer tools to inspect PDF if needed</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Current Coordinates Summary */}
      <Card>
        <CardHeader>
          <CardTitle>Current Coordinates (Copy to Code)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="p-4 bg-gray-900 text-gray-100 rounded-lg font-mono text-sm">
            <div className="space-y-2">
              <div>{`// Candidate Name Position`}</div>
              <div>nameX: {testData.nameX},</div>
              <div>
                nameY: {testData.nameY}, {`// or (height - ${792 - testData.nameY})`}
              </div>
              <div></div>
              <div>{`// Start Date Position`}</div>
              <div>dateX: {testData.dateX},</div>
              <div>
                dateY: {testData.dateY}, {`// or (height - ${792 - testData.dateY})`}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
