"use client";

import { useState } from "react";
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
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  Shield,
  User,
  MapPin,
  Phone,
  Calendar,
  AlertTriangle,
  CheckCircle,
  Plus,
  Trash2,
} from "lucide-react";

interface I9Data {
  // Personal Information
  legalName: {
    firstName: string;
    middleName: string;
    lastName: string;
    otherNames: string; // Other names used
  };
  dateOfBirth: string;
  socialSecurityNumber: string;

  // Address Information
  currentAddress: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };

  // Previous addresses (for background check - last 7 years)
  previousAddresses: Array<{
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
    fromDate: string;
    toDate: string;
  }>;

  // Work Authorization
  workAuthorization: {
    status: "citizen" | "permanent_resident" | "authorized_alien" | "";
    alienNumber: string; // If applicable
    uscisNumber: string; // If applicable
    i94Number: string; // If applicable
    passportNumber: string; // If applicable
    countryOfIssuance: string; // If applicable
  };

  // I9 Document Verification
  documentVerification: {
    listADocument: {
      type: string;
      number: string;
      expirationDate: string;
    } | null;
    listBDocument: {
      type: string;
      number: string;
      expirationDate: string;
    } | null;
    listCDocument: {
      type: string;
      number: string;
      expirationDate: string;
    } | null;
  };

  // Emergency Contact
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
    email: string;
  };

  // Additional Information
  additionalInfo: {
    hasBeenConvicted: boolean;
    convictionDetails: string;
    hasLivedAtCurrentAddressForTwoYears: boolean;
    militaryService: boolean;
    militaryBranch: string;
  };
}

interface I9DocumentCollectionProps {
  candidateId: string;
  candidateName: string;
  onComplete: (i9Data: I9Data) => void;
  onSave?: (i9Data: I9Data) => void;
  initialData?: Partial<I9Data>;
}

// I9 Acceptable Documents Lists
const LIST_A_DOCUMENTS = [
  "U.S. Passport",
  "U.S. Passport Card",
  "Permanent Resident Card",
  "Employment Authorization Document (EAD)",
  "Driver's License with REAL ID",
  "Other (specify)",
];

const LIST_B_DOCUMENTS = [
  "Driver's License",
  "State ID Card",
  "U.S. Military Card",
  "U.S. Coast Guard Merchant Mariner Card",
  "Native American Tribal Document",
  "Other (specify)",
];

const LIST_C_DOCUMENTS = [
  "Social Security Card",
  "Certified Birth Certificate",
  "U.S. Citizen ID Card",
  "Employment Authorization Document",
  "Other (specify)",
];

const US_STATES = [
  "AL",
  "AK",
  "AZ",
  "AR",
  "CA",
  "CO",
  "CT",
  "DE",
  "FL",
  "GA",
  "HI",
  "ID",
  "IL",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MA",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NJ",
  "NM",
  "NY",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
];

export function I9DocumentCollection({
  candidateId,
  candidateName,
  onComplete,
  onSave,
  initialData,
}: I9DocumentCollectionProps) {
  const [formData, setFormData] = useState<I9Data>({
    legalName: {
      firstName: "",
      middleName: "",
      lastName: "",
      otherNames: "",
    },
    dateOfBirth: "",
    socialSecurityNumber: "",
    currentAddress: {
      street: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
    },
    previousAddresses: [],
    workAuthorization: {
      status: "",
      alienNumber: "",
      uscisNumber: "",
      i94Number: "",
      passportNumber: "",
      countryOfIssuance: "",
    },
    documentVerification: {
      listADocument: null,
      listBDocument: null,
      listCDocument: null,
    },
    emergencyContact: {
      name: "",
      relationship: "",
      phone: "",
      email: "",
    },
    additionalInfo: {
      hasBeenConvicted: false,
      convictionDetails: "",
      hasLivedAtCurrentAddressForTwoYears: false,
      militaryService: false,
      militaryBranch: "",
    },
    ...initialData,
  });

  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);

  const addPreviousAddress = () => {
    setFormData((prev) => ({
      ...prev,
      previousAddresses: [
        ...prev.previousAddresses,
        {
          street: "",
          city: "",
          state: "",
          zipCode: "",
          country: "United States",
          fromDate: "",
          toDate: "",
        },
      ],
    }));
  };

  const removePreviousAddress = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      previousAddresses: prev.previousAddresses.filter((_, i) => i !== index),
    }));
  };

  const updatePreviousAddress = (
    index: number,
    field: string,
    value: string
  ) => {
    setFormData((prev) => ({
      ...prev,
      previousAddresses: prev.previousAddresses.map((addr, i) =>
        i === index ? { ...addr, [field]: value } : addr
      ),
    }));
  };

  const isValidStep = (step: number): boolean => {
    switch (step) {
      case 1: // Personal Information
        return !!(
          formData.legalName.firstName &&
          formData.legalName.lastName &&
          formData.dateOfBirth &&
          formData.socialSecurityNumber
        );
      case 2: // Address Information
        return !!(
          formData.currentAddress.street &&
          formData.currentAddress.city &&
          formData.currentAddress.state &&
          formData.currentAddress.zipCode
        );
      case 3: // Work Authorization
        return !!formData.workAuthorization.status;
      case 4: // Document Verification
        return !!(
          formData.documentVerification.listADocument ||
          (formData.documentVerification.listBDocument &&
            formData.documentVerification.listCDocument)
        );
      case 5: // Emergency Contact
        return !!(
          formData.emergencyContact.name && formData.emergencyContact.phone
        );
      default:
        return false;
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // Validate all steps
      for (let i = 1; i <= 5; i++) {
        if (!isValidStep(i)) {
          alert(`Please complete Step ${i} before submitting.`);
          setCurrentStep(i);
          setLoading(false);
          return;
        }
      }

      console.log(
        "[I9Collection] Submitting I9 data for candidate:",
        candidateId
      );
      console.log("[I9Collection] I9 data:", formData);

      onComplete(formData);
    } catch (error) {
      console.error("[I9Collection] Error submitting I9 data:", error);
      alert("Failed to submit I9 information. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveProgress = () => {
    if (onSave) {
      console.log(
        "[I9Collection] Saving I9 progress for candidate:",
        candidateId
      );
      onSave(formData);
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <div className="grid gap-4 md:grid-cols-2">
              <div>
                <Label htmlFor="firstName">Legal First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.legalName.firstName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      legalName: {
                        ...prev.legalName,
                        firstName: e.target.value,
                      },
                    }))
                  }
                  placeholder="First name as it appears on documents"
                />
              </div>
              <div>
                <Label htmlFor="middleName">Middle Name</Label>
                <Input
                  id="middleName"
                  value={formData.legalName.middleName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      legalName: {
                        ...prev.legalName,
                        middleName: e.target.value,
                      },
                    }))
                  }
                  placeholder="Middle name (if any)"
                />
              </div>
              <div>
                <Label htmlFor="lastName">Legal Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.legalName.lastName}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      legalName: {
                        ...prev.legalName,
                        lastName: e.target.value,
                      },
                    }))
                  }
                  placeholder="Last name as it appears on documents"
                />
              </div>
              <div>
                <Label htmlFor="otherNames">Other Names Used</Label>
                <Input
                  id="otherNames"
                  value={formData.legalName.otherNames}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      legalName: {
                        ...prev.legalName,
                        otherNames: e.target.value,
                      },
                    }))
                  }
                  placeholder="Maiden name, aliases, etc."
                />
              </div>
              <div>
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      dateOfBirth: e.target.value,
                    }))
                  }
                />
              </div>
              <div>
                <Label htmlFor="ssn">Social Security Number *</Label>
                <Input
                  id="ssn"
                  value={formData.socialSecurityNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      socialSecurityNumber: e.target.value,
                    }))
                  }
                  placeholder="XXX-XX-XXXX"
                  maxLength={11}
                />
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Current Address *</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="md:col-span-2">
                  <Label htmlFor="currentStreet">Street Address *</Label>
                  <Input
                    id="currentStreet"
                    value={formData.currentAddress.street}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          street: e.target.value,
                        },
                      }))
                    }
                    placeholder="123 Main Street, Apt 4B"
                  />
                </div>
                <div>
                  <Label htmlFor="currentCity">City *</Label>
                  <Input
                    id="currentCity"
                    value={formData.currentAddress.city}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          city: e.target.value,
                        },
                      }))
                    }
                    placeholder="City"
                  />
                </div>
                <div>
                  <Label htmlFor="currentState">State *</Label>
                  <Select
                    value={formData.currentAddress.state}
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          state: value,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      {US_STATES.map((state) => (
                        <SelectItem key={state} value={state}>
                          {state}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="currentZip">ZIP Code *</Label>
                  <Input
                    id="currentZip"
                    value={formData.currentAddress.zipCode}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          zipCode: e.target.value,
                        },
                      }))
                    }
                    placeholder="12345"
                    maxLength={10}
                  />
                </div>
                <div>
                  <Label htmlFor="currentCountry">Country *</Label>
                  <Input
                    id="currentCountry"
                    value={formData.currentAddress.country}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        currentAddress: {
                          ...prev.currentAddress,
                          country: e.target.value,
                        },
                      }))
                    }
                    placeholder="United States"
                  />
                </div>
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">
                  Previous Addresses (Last 7 Years)
                </h3>
                <Button
                  type="button"
                  onClick={addPreviousAddress}
                  variant="outline"
                  size="sm"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Add Address
                </Button>
              </div>

              {formData.previousAddresses.map((address, index) => (
                <Card key={index} className="mb-4">
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-center mb-3">
                      <h4 className="font-medium">
                        Previous Address {index + 1}
                      </h4>
                      <Button
                        type="button"
                        onClick={() => removePreviousAddress(index)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="md:col-span-2">
                        <Label>Street Address</Label>
                        <Input
                          value={address.street}
                          onChange={(e) =>
                            updatePreviousAddress(
                              index,
                              "street",
                              e.target.value
                            )
                          }
                          placeholder="123 Previous Street"
                        />
                      </div>
                      <div>
                        <Label>City</Label>
                        <Input
                          value={address.city}
                          onChange={(e) =>
                            updatePreviousAddress(index, "city", e.target.value)
                          }
                          placeholder="City"
                        />
                      </div>
                      <div>
                        <Label>State</Label>
                        <Select
                          value={address.state}
                          onValueChange={(value) =>
                            updatePreviousAddress(index, "state", value)
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select state" />
                          </SelectTrigger>
                          <SelectContent>
                            {US_STATES.map((state) => (
                              <SelectItem key={state} value={state}>
                                {state}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>From Date</Label>
                        <Input
                          type="date"
                          value={address.fromDate}
                          onChange={(e) =>
                            updatePreviousAddress(
                              index,
                              "fromDate",
                              e.target.value
                            )
                          }
                        />
                      </div>
                      <div>
                        <Label>To Date</Label>
                        <Input
                          type="date"
                          value={address.toDate}
                          onChange={(e) =>
                            updatePreviousAddress(
                              index,
                              "toDate",
                              e.target.value
                            )
                          }
                        />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <div>
              <Label htmlFor="workAuthStatus">
                Work Authorization Status *
              </Label>
              <Select
                value={formData.workAuthorization.status}
                onValueChange={(value) =>
                  setFormData((prev) => ({
                    ...prev,
                    workAuthorization: {
                      ...prev.workAuthorization,
                      status: value as any,
                    },
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select your work authorization status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="citizen">U.S. Citizen</SelectItem>
                  <SelectItem value="permanent_resident">
                    Lawful Permanent Resident
                  </SelectItem>
                  <SelectItem value="authorized_alien">
                    Alien Authorized to Work
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            {formData.workAuthorization.status === "permanent_resident" && (
              <div>
                <Label htmlFor="alienNumber">
                  Alien Registration Number (A-Number)
                </Label>
                <Input
                  id="alienNumber"
                  value={formData.workAuthorization.alienNumber}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      workAuthorization: {
                        ...prev.workAuthorization,
                        alienNumber: e.target.value,
                      },
                    }))
                  }
                  placeholder="A123456789"
                />
              </div>
            )}

            {formData.workAuthorization.status === "authorized_alien" && (
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="uscisNumber">USCIS Number</Label>
                  <Input
                    id="uscisNumber"
                    value={formData.workAuthorization.uscisNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workAuthorization: {
                          ...prev.workAuthorization,
                          uscisNumber: e.target.value,
                        },
                      }))
                    }
                    placeholder="1234567890"
                  />
                </div>
                <div>
                  <Label htmlFor="i94Number">I-94 Admission Number</Label>
                  <Input
                    id="i94Number"
                    value={formData.workAuthorization.i94Number}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workAuthorization: {
                          ...prev.workAuthorization,
                          i94Number: e.target.value,
                        },
                      }))
                    }
                    placeholder="12345678901"
                  />
                </div>
                <div>
                  <Label htmlFor="passportNumber">Passport Number</Label>
                  <Input
                    id="passportNumber"
                    value={formData.workAuthorization.passportNumber}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workAuthorization: {
                          ...prev.workAuthorization,
                          passportNumber: e.target.value,
                        },
                      }))
                    }
                    placeholder="123456789"
                  />
                </div>
                <div>
                  <Label htmlFor="countryOfIssuance">Country of Issuance</Label>
                  <Input
                    id="countryOfIssuance"
                    value={formData.workAuthorization.countryOfIssuance}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        workAuthorization: {
                          ...prev.workAuthorization,
                          countryOfIssuance: e.target.value,
                        },
                      }))
                    }
                    placeholder="Country name"
                  />
                </div>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h3 className="font-medium text-blue-800 mb-2">
                Document Verification Requirements
              </h3>
              <p className="text-sm text-blue-600">
                You must provide either:
                <br />• One document from List A (establishes both identity and
                work authorization), OR
                <br />• One document from List B (establishes identity) AND one
                from List C (establishes work authorization)
              </p>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">
                List A Documents (Identity + Work Authorization)
              </h3>
              <div className="space-y-3">
                <div>
                  <Label>Document Type</Label>
                  <Select
                    value={
                      formData.documentVerification.listADocument?.type || ""
                    }
                    onValueChange={(value) =>
                      setFormData((prev) => ({
                        ...prev,
                        documentVerification: {
                          ...prev.documentVerification,
                          listADocument: value && value !== "none"
                            ? { type: value, number: "", expirationDate: "" }
                            : null,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select List A document (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {LIST_A_DOCUMENTS.map((doc) => (
                        <SelectItem key={doc} value={doc}>
                          {doc}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {formData.documentVerification.listADocument && (
                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <Label>Document Number</Label>
                      <Input
                        value={
                          formData.documentVerification.listADocument.number
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            documentVerification: {
                              ...prev.documentVerification,
                              listADocument: prev.documentVerification
                                .listADocument
                                ? {
                                    ...prev.documentVerification.listADocument,
                                    number: e.target.value,
                                  }
                                : null,
                            },
                          }))
                        }
                        placeholder="Document number"
                      />
                    </div>
                    <div>
                      <Label>Expiration Date</Label>
                      <Input
                        type="date"
                        value={
                          formData.documentVerification.listADocument
                            .expirationDate
                        }
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            documentVerification: {
                              ...prev.documentVerification,
                              listADocument: prev.documentVerification
                                .listADocument
                                ? {
                                    ...prev.documentVerification.listADocument,
                                    expirationDate: e.target.value,
                                  }
                                : null,
                            },
                          }))
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {!formData.documentVerification.listADocument && (
              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <h3 className="text-lg font-medium mb-4">
                    List B Documents (Identity)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Document Type</Label>
                      <Select
                        value={
                          formData.documentVerification.listBDocument?.type ||
                          ""
                        }
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            documentVerification: {
                              ...prev.documentVerification,
                              listBDocument: value
                                ? {
                                    type: value,
                                    number: "",
                                    expirationDate: "",
                                  }
                                : null,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select List B document" />
                        </SelectTrigger>
                        <SelectContent>
                          {LIST_B_DOCUMENTS.map((doc) => (
                            <SelectItem key={doc} value={doc}>
                              {doc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.documentVerification.listBDocument && (
                      <div className="space-y-3">
                        <div>
                          <Label>Document Number</Label>
                          <Input
                            value={
                              formData.documentVerification.listBDocument.number
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                documentVerification: {
                                  ...prev.documentVerification,
                                  listBDocument: prev.documentVerification
                                    .listBDocument
                                    ? {
                                        ...prev.documentVerification
                                          .listBDocument,
                                        number: e.target.value,
                                      }
                                    : null,
                                },
                              }))
                            }
                            placeholder="Document number"
                          />
                        </div>
                        <div>
                          <Label>Expiration Date</Label>
                          <Input
                            type="date"
                            value={
                              formData.documentVerification.listBDocument
                                .expirationDate
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                documentVerification: {
                                  ...prev.documentVerification,
                                  listBDocument: prev.documentVerification
                                    .listBDocument
                                    ? {
                                        ...prev.documentVerification
                                          .listBDocument,
                                        expirationDate: e.target.value,
                                      }
                                    : null,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-medium mb-4">
                    List C Documents (Work Authorization)
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <Label>Document Type</Label>
                      <Select
                        value={
                          formData.documentVerification.listCDocument?.type ||
                          ""
                        }
                        onValueChange={(value) =>
                          setFormData((prev) => ({
                            ...prev,
                            documentVerification: {
                              ...prev.documentVerification,
                              listCDocument: value
                                ? {
                                    type: value,
                                    number: "",
                                    expirationDate: "",
                                  }
                                : null,
                            },
                          }))
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select List C document" />
                        </SelectTrigger>
                        <SelectContent>
                          {LIST_C_DOCUMENTS.map((doc) => (
                            <SelectItem key={doc} value={doc}>
                              {doc}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    {formData.documentVerification.listCDocument && (
                      <div className="space-y-3">
                        <div>
                          <Label>Document Number</Label>
                          <Input
                            value={
                              formData.documentVerification.listCDocument.number
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                documentVerification: {
                                  ...prev.documentVerification,
                                  listCDocument: prev.documentVerification
                                    .listCDocument
                                    ? {
                                        ...prev.documentVerification
                                          .listCDocument,
                                        number: e.target.value,
                                      }
                                    : null,
                                },
                              }))
                            }
                            placeholder="Document number"
                          />
                        </div>
                        <div>
                          <Label>Expiration Date</Label>
                          <Input
                            type="date"
                            value={
                              formData.documentVerification.listCDocument
                                .expirationDate
                            }
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                documentVerification: {
                                  ...prev.documentVerification,
                                  listCDocument: prev.documentVerification
                                    .listCDocument
                                    ? {
                                        ...prev.documentVerification
                                          .listCDocument,
                                        expirationDate: e.target.value,
                                      }
                                    : null,
                                },
                              }))
                            }
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">
                Emergency Contact Information
              </h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label htmlFor="emergencyName">Contact Name *</Label>
                  <Input
                    id="emergencyName"
                    value={formData.emergencyContact.name}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          name: e.target.value,
                        },
                      }))
                    }
                    placeholder="Full name"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyRelationship">Relationship *</Label>
                  <Input
                    id="emergencyRelationship"
                    value={formData.emergencyContact.relationship}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          relationship: e.target.value,
                        },
                      }))
                    }
                    placeholder="Spouse, Parent, Sibling, etc."
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyPhone">Phone Number *</Label>
                  <Input
                    id="emergencyPhone"
                    value={formData.emergencyContact.phone}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          phone: e.target.value,
                        },
                      }))
                    }
                    placeholder="(555) 123-4567"
                  />
                </div>
                <div>
                  <Label htmlFor="emergencyEmail">Email Address</Label>
                  <Input
                    id="emergencyEmail"
                    type="email"
                    value={formData.emergencyContact.email}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        emergencyContact: {
                          ...prev.emergencyContact,
                          email: e.target.value,
                        },
                      }))
                    }
                    placeholder="emergency@example.com"
                  />
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-lg font-medium mb-4">
                Additional Information
              </h3>
              <div className="space-y-4">
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="convicted"
                    checked={formData.additionalInfo.hasBeenConvicted}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        additionalInfo: {
                          ...prev.additionalInfo,
                          hasBeenConvicted: checked as boolean,
                        },
                      }))
                    }
                  />
                  <Label htmlFor="convicted">
                    Have you ever been convicted of a crime?
                  </Label>
                </div>

                {formData.additionalInfo.hasBeenConvicted && (
                  <div>
                    <Label htmlFor="convictionDetails">
                      Please provide details
                    </Label>
                    <Textarea
                      id="convictionDetails"
                      value={formData.additionalInfo.convictionDetails}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          additionalInfo: {
                            ...prev.additionalInfo,
                            convictionDetails: e.target.value,
                          },
                        }))
                      }
                      placeholder="Provide details about the conviction(s)"
                      rows={3}
                    />
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="twoYears"
                    checked={
                      formData.additionalInfo
                        .hasLivedAtCurrentAddressForTwoYears
                    }
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        additionalInfo: {
                          ...prev.additionalInfo,
                          hasLivedAtCurrentAddressForTwoYears:
                            checked as boolean,
                        },
                      }))
                    }
                  />
                  <Label htmlFor="twoYears">
                    Have you lived at your current address for more than 2
                    years?
                  </Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="military"
                    checked={formData.additionalInfo.militaryService}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({
                        ...prev,
                        additionalInfo: {
                          ...prev.additionalInfo,
                          militaryService: checked as boolean,
                        },
                      }))
                    }
                  />
                  <Label htmlFor="military">
                    Have you served in the U.S. Military?
                  </Label>
                </div>

                {formData.additionalInfo.militaryService && (
                  <div>
                    <Label htmlFor="militaryBranch">Branch of Service</Label>
                    <Select
                      value={formData.additionalInfo.militaryBranch}
                      onValueChange={(value) =>
                        setFormData((prev) => ({
                          ...prev,
                          additionalInfo: {
                            ...prev.additionalInfo,
                            militaryBranch: value,
                          },
                        }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select branch" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Army">Army</SelectItem>
                        <SelectItem value="Navy">Navy</SelectItem>
                        <SelectItem value="Air Force">Air Force</SelectItem>
                        <SelectItem value="Marines">Marines</SelectItem>
                        <SelectItem value="Coast Guard">Coast Guard</SelectItem>
                        <SelectItem value="Space Force">Space Force</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const steps = [
    { number: 1, title: "Personal Information", icon: User },
    { number: 2, title: "Address Information", icon: MapPin },
    { number: 3, title: "Work Authorization", icon: Shield },
    { number: 4, title: "Document Verification", icon: FileText },
    { number: 5, title: "Emergency Contact", icon: Phone },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            I-9 Employment Eligibility Verification
          </CardTitle>
          <p className="text-sm text-gray-600">
            Complete all sections to verify employment eligibility for{" "}
            {candidateName}
          </p>
        </CardHeader>
      </Card>

      {/* Progress Steps */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            {steps.map((step, index) => {
              const Icon = step.icon;
              const isCompleted = isValidStep(step.number);
              const isCurrent = currentStep === step.number;

              return (
                <div key={step.number} className="flex items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`
                      w-10 h-10 rounded-full flex items-center justify-center text-sm font-medium
                      ${
                        isCurrent
                          ? "bg-blue-600 text-white"
                          : isCompleted
                          ? "bg-green-600 text-white"
                          : "bg-gray-200 text-gray-600"
                      }
                    `}
                    >
                      {isCompleted && !isCurrent ? (
                        <CheckCircle className="h-5 w-5" />
                      ) : (
                        <Icon className="h-5 w-5" />
                      )}
                    </div>
                    <span className="text-xs mt-2 text-center max-w-20">
                      {step.title}
                    </span>
                  </div>
                  {index < steps.length - 1 && (
                    <div
                      className={`
                      w-16 h-0.5 mx-2
                      ${
                        isValidStep(step.number)
                          ? "bg-green-600"
                          : "bg-gray-200"
                      }
                    `}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle>
            Step {currentStep}: {steps[currentStep - 1]?.title}
          </CardTitle>
          {!isValidStep(currentStep) && (
            <div className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-sm">
                Please complete all required fields
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent>{renderStep()}</CardContent>
      </Card>

      {/* Navigation */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between">
            <Button
              onClick={() => setCurrentStep(Math.max(1, currentStep - 1))}
              disabled={currentStep === 1}
              variant="outline"
            >
              Previous
            </Button>

            <div className="flex gap-2">
              {onSave && (
                <Button onClick={handleSaveProgress} variant="outline">
                  Save Progress
                </Button>
              )}

              {currentStep < 5 ? (
                <Button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!isValidStep(currentStep)}
                >
                  Next
                </Button>
              ) : (
                <Button
                  onClick={handleSubmit}
                  disabled={loading || !isValidStep(currentStep)}
                  className="bg-green-600 hover:bg-green-700"
                >
                  {loading ? "Submitting..." : "Complete I-9 Form"}
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
