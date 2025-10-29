import axios, { AxiosError } from "axios";
import { getDynamics365AccessToken, getDynamics365ApiUrl, isDynamics365Enabled } from "./dynamics365Auth";

export interface Dynamics365Lead {
  subject: string;
  companyname?: string;
  firstname?: string;
  lastname?: string;
  emailaddress1?: string;
  telephone1?: string;
  description?: string;
  estimatedvalue?: number;
  estimatedclosedate?: string;
  leadsourcecode?: number; // 1=Advertisement, 2=Employee Referral, 3=External Referral, 4=Partner, 5=Public Relations, 6=Seminar, 7=Trade Show, 8=Web, 9=Word of Mouth, 10=Other
  leadqualitycode?: number; // 1=Hot, 2=Warm, 3=Cold
}

export interface Dynamics365Opportunity {
  name: string;
  description?: string;
  estimatedvalue?: number;
  estimatedclosedate?: string;
  budgetamount?: number;
  stepname?: string;
  customerid_account?: string; // Lookup to account (use @odata.bind format)
}

export interface Dynamics365Response {
  success: boolean;
  id?: string;
  error?: string;
  details?: any;
}

/**
 * Create common headers for Dynamics 365 API requests
 */
async function getApiHeaders(): Promise<Record<string, string>> {
  const accessToken = await getDynamics365AccessToken();
  
  return {
    "Authorization": `Bearer ${accessToken}`,
    "Content-Type": "application/json; charset=utf-8",
    "OData-MaxVersion": "4.0",
    "OData-Version": "4.0",
    "Accept": "application/json",
    "Prefer": "return=representation", // Return the created entity
  };
}

/**
 * Handle Dynamics 365 API errors
 */
function handleApiError(error: unknown): Dynamics365Response {
  if (axios.isAxiosError(error)) {
    const axiosError = error as AxiosError;
    const status = axiosError.response?.status;
    const data = axiosError.response?.data as any;
    
    let errorMessage = "Unknown error occurred";
    
    if (data?.error?.message) {
      errorMessage = data.error.message;
    } else if (axiosError.message) {
      errorMessage = axiosError.message;
    }
    
    console.error("Dynamics 365 API Error:", {
      status,
      message: errorMessage,
      details: data,
    });
    
    return {
      success: false,
      error: errorMessage,
      details: {
        status,
        data,
      },
    };
  }
  
  console.error("Unexpected error:", error);
  return {
    success: false,
    error: error instanceof Error ? error.message : "Unknown error",
  };
}

/**
 * Create a lead in Dynamics 365
 */
export async function createDynamics365Lead(lead: Dynamics365Lead): Promise<Dynamics365Response> {
  if (!isDynamics365Enabled()) {
    return {
      success: false,
      error: "Dynamics 365 integration is not enabled",
    };
  }

  try {
    const apiUrl = getDynamics365ApiUrl();
    const headers = await getApiHeaders();
    
    const response = await axios.post(
      `${apiUrl}/leads`,
      lead,
      { headers }
    );
    
    // Extract the lead ID from the response
    const leadId = response.data?.leadid;
    
    console.log("Successfully created lead in Dynamics 365:", leadId);
    
    return {
      success: true,
      id: leadId,
      details: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Create an opportunity in Dynamics 365
 */
export async function createDynamics365Opportunity(opportunity: Dynamics365Opportunity): Promise<Dynamics365Response> {
  if (!isDynamics365Enabled()) {
    return {
      success: false,
      error: "Dynamics 365 integration is not enabled",
    };
  }

  try {
    const apiUrl = getDynamics365ApiUrl();
    const headers = await getApiHeaders();
    
    const response = await axios.post(
      `${apiUrl}/opportunities`,
      opportunity,
      { headers }
    );
    
    // Extract the opportunity ID from the response
    const opportunityId = response.data?.opportunityid;
    
    console.log("Successfully created opportunity in Dynamics 365:", opportunityId);
    
    return {
      success: true,
      id: opportunityId,
      details: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update a lead in Dynamics 365
 */
export async function updateDynamics365Lead(leadId: string, updates: Partial<Dynamics365Lead>): Promise<Dynamics365Response> {
  if (!isDynamics365Enabled()) {
    return {
      success: false,
      error: "Dynamics 365 integration is not enabled",
    };
  }

  try {
    const apiUrl = getDynamics365ApiUrl();
    const headers = await getApiHeaders();
    
    await axios.patch(
      `${apiUrl}/leads(${leadId})`,
      updates,
      { headers }
    );
    
    console.log("Successfully updated lead in Dynamics 365:", leadId);
    
    return {
      success: true,
      id: leadId,
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Update an opportunity in Dynamics 365
 */
export async function updateDynamics365Opportunity(opportunityId: string, updates: Partial<Dynamics365Opportunity>): Promise<Dynamics365Response> {
  if (!isDynamics365Enabled()) {
    return {
      success: false,
      error: "Dynamics 365 integration is not enabled",
    };
  }

  try {
    const apiUrl = getDynamics365ApiUrl();
    const headers = await getApiHeaders();
    
    await axios.patch(
      `${apiUrl}/opportunities(${opportunityId})`,
      updates,
      { headers }
    );
    
    console.log("Successfully updated opportunity in Dynamics 365:", opportunityId);
    
    return {
      success: true,
      id: opportunityId,
    };
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * Test Dynamics 365 connection
 */
export async function testDynamics365Connection(): Promise<Dynamics365Response> {
  if (!isDynamics365Enabled()) {
    return {
      success: false,
      error: "Dynamics 365 integration is not enabled",
    };
  }

  try {
    const apiUrl = getDynamics365ApiUrl();
    const headers = await getApiHeaders();
    
    // Call WhoAmI function to test connection
    const response = await axios.get(
      `${apiUrl}/WhoAmI`,
      { headers }
    );
    
    console.log("Dynamics 365 connection test successful:", response.data);
    
    return {
      success: true,
      details: response.data,
    };
  } catch (error) {
    return handleApiError(error);
  }
}
