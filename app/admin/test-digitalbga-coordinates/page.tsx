"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";

export default function TestDigitalBGACoordinatesPage() {
  const [nameX, setNameX] = useState(60);
  const [nameY, setNameY] = useState(647); // 792 - 145
  const [dateX, setDateX] = useState(238);
  const [dateY, setDateY] = useState(542); // 792 - 250
  const [sigX, setSigX] = useState(40);
  const [sigY, setSigY] = useState(120);
  const [sigDateX, setSigDateX] = useState(315);
  const [sigDateY, setSigDateY] = useState(120);

  const [testResult, setTestResult] = useState("");

  const handleTest = async () => {
    setTestResult(`Current Coordinates:
    
Name Position (After "Dear"):
- X: ${nameX} (horizontal position)
- Y: ${nameY} (vertical position from bottom)

Start Date Position (After "8:00AM CST on"):
- X: ${dateX}
- Y: ${dateY}

Signature Position ("Accepted By:" field):
- X: ${sigX}
- Y: ${sigY}

Date Position (Right side date field):
- X: ${sigDateX}
- Y: ${sigDateY}

PDF Dimensions: 612 x 792 (standard letter size)

Tips for adjustment:
- Increase X to move right, decrease to move left
- Increase Y to move up, decrease to move down
- Standard letter: 612 points wide, 792 points tall
- 1 inch = 72 points`);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">DigitalBGA PDF Coordinate Tester</h1>
        <p className="text-gray-600 mt-2">
          Fine-tune the exact positions for text placement in DigitalBGA offer letters
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Coordinate Adjustment Tool</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Name Position */}
          <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
            <h3 className="font-medium text-blue-900">Name Position (After "Dear")</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="nameX">X Position</Label>
                <Input
                  id="nameX"
                  type="number"
                  value={nameX}
                  onChange={(e) => setNameX(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Left to right position</p>
              </div>
              <div>
                <Label htmlFor="nameY">Y Position</Label>
                <Input
                  id="nameY"
                  type="number"
                  value={nameY}
                  onChange={(e) => setNameY(Number(e.target.value))}
                />
                <p className="text-xs text-gray-500 mt-1">Bottom to top position</p>
              </div>
            </div>
          </div>

          {/* Date Position */}
          <div className="space-y-4 p-4 bg-green-50 rounded-lg">
            <h3 className="font-medium text-green-900">Start Date Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateX">X Position</Label>
                <Input
                  id="dateX"
                  type="number"
                  value={dateX}
                  onChange={(e) => setDateX(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="dateY">Y Position</Label>
                <Input
                  id="dateY"
                  type="number"
                  value={dateY}
                  onChange={(e) => setDateY(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Signature Position */}
          <div className="space-y-4 p-4 bg-purple-50 rounded-lg">
            <h3 className="font-medium text-purple-900">Signature Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sigX">X Position</Label>
                <Input
                  id="sigX"
                  type="number"
                  value={sigX}
                  onChange={(e) => setSigX(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="sigY">Y Position</Label>
                <Input
                  id="sigY"
                  type="number"
                  value={sigY}
                  onChange={(e) => setSigY(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          {/* Date Stamp Position */}
          <div className="space-y-4 p-4 bg-orange-50 rounded-lg">
            <h3 className="font-medium text-orange-900">Date Stamp Position</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="sigDateX">X Position</Label>
                <Input
                  id="sigDateX"
                  type="number"
                  value={sigDateX}
                  onChange={(e) => setSigDateX(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="sigDateY">Y Position</Label>
                <Input
                  id="sigDateY"
                  type="number"
                  value={sigDateY}
                  onChange={(e) => setSigDateY(Number(e.target.value))}
                />
              </div>
            </div>
          </div>

          <Button onClick={handleTest} className="w-full">
            Generate Coordinate Summary
          </Button>

          {testResult && (
            <div className="mt-6 p-4 bg-gray-100 rounded-lg">
              <pre className="text-sm whitespace-pre-wrap font-mono">{testResult}</pre>
            </div>
          )}

          <div className="mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
            <h4 className="font-medium text-yellow-900 mb-2">Instructions:</h4>
            <ol className="text-sm text-yellow-800 space-y-1 list-decimal list-inside">
              <li>Adjust the coordinates using the input fields above</li>
              <li>Click "Generate Coordinate Summary" to see current values</li>
              <li>Update the values in app/offer/[id]/page.tsx with the final coordinates</li>
              <li>Test with an actual offer to verify placement</li>
            </ol>
          </div>

          <div className="mt-4 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium mb-2">Reference Points:</h4>
            <div className="text-sm space-y-1">
              <p>• Page width: 612 points (8.5 inches)</p>
              <p>• Page height: 792 points (11 inches)</p>
              <p>• 1 inch = 72 points</p>
              <p>• Top of page: Y = 792</p>
              <p>• Bottom of page: Y = 0</p>
              <p>• Left edge: X = 0</p>
              <p>• Right edge: X = 612</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 