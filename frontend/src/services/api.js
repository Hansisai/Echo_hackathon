const BASE_URL = "http://localhost:8000/api";

async function request(endpoint, options = {}) {
  const url = `${BASE_URL}${endpoint}`;
  
  // Set default headers
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(url, config);
    
    // Check if deletion or simple status response with no body
    if (response.status === 204) {
      return null;
    }

    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.detail || `HTTP error! Status: ${response.status}`);
    }

    return data;
  } catch (error) {
    console.error(`API Request to ${endpoint} failed:`, error);
    throw error;
  }
}

export const api = {
  // Cities
  getCities: () => request("/cities"),
  getCity: (id) => request(`/cities/${id}`),
  createCity: (cityData) => request("/cities", {
    method: "POST",
    body: JSON.stringify(cityData)
  }),

  // Policies
  getPolicies: () => request("/policies"),
  generatePolicy: (prompt) => request("/policies/generate", {
    method: "POST",
    body: JSON.stringify({ prompt })
  }),

  // Simulations
  runSimulation: (cityId, policyId, parameters) => request("/simulations/run", {
    method: "POST",
    body: JSON.stringify({
      city_id: cityId,
      policy_id: policyId,
      parameters
    })
  }),
  getHistory: () => request("/simulations/history"),
  getSimulationRun: (id) => request(`/simulations/${id}`),
  deleteSimulationRun: (id) => request(`/simulations/${id}`, {
    method: "DELETE"
  }),
  
  // Export URL helper
  getExportUrl: (id) => `${BASE_URL}/simulations/${id}/export`
};
