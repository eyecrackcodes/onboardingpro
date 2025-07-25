// ADP Workforce Now API Integration Service
// This service handles organization management and employee data synchronization

import type {
  ADPEmployee,
  ADPIntegration,
  OrganizationManagement,
  Candidate,
} from "./types";

// ADP API Configuration
interface ADPConfig {
  clientId: string;
  clientSecret: string;
  apiBaseUrl: string; // e.g., "https://api.adp.com"
  certificatePath?: string; // For SSL client certificate if required
}

// ADP Authentication Token
interface ADPToken {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
  obtained_at: number;
}

class ADPService implements ADPIntegration {
  private config: ADPConfig;
  private token: ADPToken | null = null;

  constructor(config: ADPConfig) {
    this.config = config;
  }

  // Authentication and token management
  private async authenticate(): Promise<void> {
    try {
      const response = await fetch(
        `${this.config.apiBaseUrl}/auth/oauth/v2/token`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
            Authorization: `Basic ${btoa(
              `${this.config.clientId}:${this.config.clientSecret}`
            )}`,
          },
          body: new URLSearchParams({
            grant_type: "client_credentials",
            scope: "api",
          }),
        }
      );

      if (!response.ok) {
        throw new Error(`ADP Authentication failed: ${response.statusText}`);
      }

      const tokenData = await response.json();
      this.token = {
        ...tokenData,
        obtained_at: Date.now(),
      };
    } catch (error) {
      console.error("ADP Authentication error:", error);
      throw error;
    }
  }

  private async ensureAuthenticated(): Promise<void> {
    if (!this.token || this.isTokenExpired()) {
      await this.authenticate();
    }
  }

  private isTokenExpired(): boolean {
    if (!this.token) return true;
    const expirationTime =
      this.token.obtained_at + this.token.expires_in * 1000;
    return Date.now() >= expirationTime;
  }

  private async makeAuthenticatedRequest(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<Response> {
    await this.ensureAuthenticated();

    return fetch(`${this.config.apiBaseUrl}${endpoint}`, {
      ...options,
      headers: {
        Authorization: `Bearer ${this.token!.access_token}`,
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  }

  // Implementation of ADPIntegration interface
  async syncEmployeeData(candidateId: string): Promise<ADPEmployee | null> {
    try {
      // This would typically search by email or other identifier
      // For now, we'll implement a placeholder that returns null if not found
      console.log(`[ADP] Syncing employee data for candidate: ${candidateId}`);

      // In a real implementation, you would:
      // 1. Get candidate data from your database
      // 2. Search ADP for matching employee
      // 3. Return the employee data if found

      return null; // Placeholder - employee not found in ADP
    } catch (error) {
      console.error("Error syncing employee data:", error);
      throw error;
    }
  }

  async createEmployee(candidate: Candidate): Promise<string> {
    try {
      const employeeData = this.mapCandidateToADPEmployee(candidate);

      const response = await this.makeAuthenticatedRequest("/hr/v2/workers", {
        method: "POST",
        body: JSON.stringify({
          events: [
            {
              data: {
                transform: {
                  worker: employeeData,
                },
              },
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(
          `Failed to create employee in ADP: ${response.statusText}`
        );
      }

      const result = await response.json();

      // Extract the associateOID from the response
      const associateOID =
        result.events?.[0]?.data?.output?.worker?.associateOID;

      if (!associateOID) {
        throw new Error("Failed to get associateOID from ADP response");
      }

      console.log(`[ADP] Created employee with associateOID: ${associateOID}`);
      return associateOID;
    } catch (error) {
      console.error("Error creating employee in ADP:", error);
      throw error;
    }
  }

  async updateEmployee(
    associateOID: string,
    updates: Partial<ADPEmployee>
  ): Promise<void> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/hr/v2/workers/${associateOID}`,
        {
          method: "PATCH",
          body: JSON.stringify({
            events: [
              {
                data: {
                  transform: {
                    worker: updates,
                  },
                },
              },
            ],
          }),
        }
      );

      if (!response.ok) {
        throw new Error(
          `Failed to update employee in ADP: ${response.statusText}`
        );
      }

      console.log(`[ADP] Updated employee: ${associateOID}`);
    } catch (error) {
      console.error("Error updating employee in ADP:", error);
      throw error;
    }
  }

  async getEmployee(associateOID: string): Promise<ADPEmployee | null> {
    try {
      const response = await this.makeAuthenticatedRequest(
        `/hr/v2/workers/${associateOID}`
      );

      if (response.status === 404) {
        return null;
      }

      if (!response.ok) {
        throw new Error(
          `Failed to get employee from ADP: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result.workers?.[0] || null;
    } catch (error) {
      console.error("Error getting employee from ADP:", error);
      throw error;
    }
  }

  async searchEmployees(searchCriteria: {
    firstName?: string;
    lastName?: string;
    email?: string;
    workLocation?: string;
  }): Promise<ADPEmployee[]> {
    try {
      // Build search query parameters
      const searchParams = new URLSearchParams();

      if (searchCriteria.firstName) {
        searchParams.append(
          "$filter",
          `personalInfo/legalName/givenName eq '${searchCriteria.firstName}'`
        );
      }
      if (searchCriteria.lastName) {
        searchParams.append(
          "$filter",
          `personalInfo/legalName/familyName1 eq '${searchCriteria.lastName}'`
        );
      }
      if (searchCriteria.email) {
        searchParams.append(
          "$filter",
          `businessCommunication/emails[nameCode/codeValue eq 'WORK']/emailUri eq '${searchCriteria.email}'`
        );
      }

      const response = await this.makeAuthenticatedRequest(
        `/hr/v2/workers?${searchParams.toString()}`
      );

      if (!response.ok) {
        throw new Error(
          `Failed to search employees in ADP: ${response.statusText}`
        );
      }

      const result = await response.json();
      return result.workers || [];
    } catch (error) {
      console.error("Error searching employees in ADP:", error);
      throw error;
    }
  }

  // Utility function to map candidate data to ADP employee structure
  private mapCandidateToADPEmployee(
    candidate: Candidate
  ): Partial<ADPEmployee> {
    const [firstName, ...lastNameParts] =
      candidate.personalInfo.name.split(" ");
    const lastName = lastNameParts.join(" ");

    return {
      workerId: `ONB_${candidate.id}`, // Temporary worker ID
      personalInfo: {
        firstName: firstName,
        lastName: lastName,
      },
      workAssignment: {
        assignedWorkLocation: {
          nameCode: {
            codeValue: candidate.callCenter,
            shortName: candidate.callCenter === "CLT" ? "Charlotte" : "Austin",
          },
        },
        jobTitle:
          candidate.licenseStatus === "Licensed"
            ? "Insurance Agent"
            : "Insurance Agent (Unlicensed)",
        departmentCode: "SALES",
      },
      workRelationship: {
        hireDate: candidate.classAssignment?.startDate
          ?.toISOString()
          .split("T")[0],
        workRelationshipStatus: {
          statusCode: {
            codeValue: "Active",
          },
        },
      },
      businessCommunication: {
        emails: [
          {
            emailUri: candidate.personalInfo.email,
            nameCode: {
              codeValue: "WORK",
            },
          },
        ],
        landlines: candidate.personalInfo.phone
          ? [
              {
                areaDialing: candidate.personalInfo.phone.substring(0, 3),
                dialNumber: candidate.personalInfo.phone.substring(3),
                nameCode: {
                  codeValue: "WORK",
                },
              },
            ]
          : [],
      },
      customFieldGroup: {
        stringFields: [
          {
            nameCode: {
              codeValue: "ONBOARDING_TRACKER_ID",
            },
            stringValue: candidate.id,
          },
          {
            nameCode: {
              codeValue: "LICENSE_STATUS",
            },
            stringValue: candidate.licenseStatus,
          },
        ],
      },
    };
  }
}

// Organization Management Service
class OrganizationManagementService implements OrganizationManagement {
  public adp: ADPIntegration;

  constructor(adpConfig: ADPConfig) {
    this.adp = new ADPService(adpConfig);
  }

  async syncCandidateToADP(candidateId: string): Promise<void> {
    try {
      console.log(`[OrgManagement] Syncing candidate ${candidateId} to ADP`);

      // First check if employee already exists in ADP
      const existingEmployee = await this.adp.syncEmployeeData(candidateId);

      if (existingEmployee) {
        console.log(
          `[OrgManagement] Employee already exists in ADP: ${existingEmployee.associateOID}`
        );
        return;
      }

      // If not exists, we'll create during onboarding
      console.log(
        `[OrgManagement] Candidate ${candidateId} not found in ADP, will create during onboarding`
      );
    } catch (error) {
      console.error("Error syncing candidate to ADP:", error);
      throw error;
    }
  }

  async onboardNewHire(candidateId: string, startDate: Date): Promise<void> {
    try {
      console.log(
        `[OrgManagement] Onboarding new hire ${candidateId} with start date ${startDate.toDateString()}`
      );

      // This would typically:
      // 1. Get candidate data
      // 2. Create employee in ADP
      // 3. Set up payroll
      // 4. Create accounts/access
      // 5. Schedule equipment/badge

      // For now, we'll just log the action
      console.log(
        `[OrgManagement] New hire onboarding initiated for ${candidateId}`
      );
    } catch (error) {
      console.error("Error onboarding new hire:", error);
      throw error;
    }
  }

  async updateEmployeeStatus(
    candidateId: string,
    status: string
  ): Promise<void> {
    try {
      console.log(
        `[OrgManagement] Updating employee status for ${candidateId} to ${status}`
      );

      // This would typically:
      // 1. Find employee in ADP by candidateId
      // 2. Update their status
      // 3. Handle any status-specific workflows

      console.log(`[OrgManagement] Employee status updated for ${candidateId}`);
    } catch (error) {
      console.error("Error updating employee status:", error);
      throw error;
    }
  }
}

// Factory function to create organization management instance
export const createOrganizationManagement = (
  config: ADPConfig
): OrganizationManagement => {
  return new OrganizationManagementService(config);
};

// Default configuration (would typically come from environment variables)
export const getADPConfig = (): ADPConfig => {
  return {
    clientId: process.env.ADP_CLIENT_ID || "",
    clientSecret: process.env.ADP_CLIENT_SECRET || "",
    apiBaseUrl: process.env.ADP_API_BASE_URL || "https://api.adp.com",
    certificatePath: process.env.ADP_CERTIFICATE_PATH,
  };
};

// Export the main service for use in the application
export const organizationManagement = createOrganizationManagement(
  getADPConfig()
);
