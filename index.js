/**
 * Check Stylist Availability - PRODUCTION (Phoenix Encanto)
 *
 * Railway-deployable endpoint for Retell AI
 * Checks availability for a SPECIFIC stylist over a date range
 *
 * PRODUCTION CREDENTIALS - DO NOT USE FOR TESTING
 * Location: Keep It Cut - Phoenix Encanto (201664)
 */

const express = require('express');
const axios = require('axios');

const app = express();
app.use(express.json());

// PRODUCTION Meevo API Configuration
const CONFIG = {
  AUTH_URL: 'https://marketplace.meevo.com/oauth2/token',
  API_URL: 'https://na1pub.meevo.com/publicapi/v1',
  API_URL_V2: 'https://na1pub.meevo.com/publicapi/v2',
  CLIENT_ID: 'f6a5046d-208e-4829-9941-034ebdd2aa65',
  CLIENT_SECRET: '2f8feb2e-51f5-40a3-83af-3d4a6a454abe',
  TENANT_ID: '200507',
  LOCATION_ID: '201664'  // Phoenix Encanto
};

// PRODUCTION Stylist name to ID mapping - Phoenix Encanto
const STYLIST_MAP = {
  'joshua': '159793cd-bf26-4574-afcd-ac08017f2cf8',
  'joshua thorsvik': '159793cd-bf26-4574-afcd-ac08017f2cf8',
  'jacob': '2383ab00-8d63-4dac-9945-ac29014110eb',
  'jacob meltzer': '2383ab00-8d63-4dac-9945-ac29014110eb',
  'francisca': '2044a8ce-be0d-4244-8c01-ac47010a2b18',
  'francisca martinez': '2044a8ce-be0d-4244-8c01-ac47010a2b18',
  'tiffany': '45362667-7c72-4c54-9b56-ac5b00f44d1b',
  'tiffany montano': '45362667-7c72-4c54-9b56-ac5b00f44d1b',
  'ashley': '1b0119a5-abe8-444b-b56f-ac5b011095dc',
  'ashley demuro': '1b0119a5-abe8-444b-b56f-ac5b011095dc',
  'elizabeth': '71fa4533-7c1b-4195-89ed-ac5b0142182d',
  'elizabeth cline': '71fa4533-7c1b-4195-89ed-ac5b0142182d',
  'liliana': 'fe734b90-c392-48b5-ba4d-ac5b015d71ab',
  'liliana castillo': 'fe734b90-c392-48b5-ba4d-ac5b015d71ab',
  'frank': '4f185d55-4c46-4fea-bb3c-ac5b0171e6ce',
  'frank lopez': '4f185d55-4c46-4fea-bb3c-ac5b0171e6ce',
  'brittney': '665c58c6-d8f3-4c0c-bfaf-ac5d0004b488',
  'brittney nichols': '665c58c6-d8f3-4c0c-bfaf-ac5d0004b488',
  'angeleen': 'ee0adc0b-79de-4de9-8fd3-ac5d013c23eb',
  'angeleen habeeb': 'ee0adc0b-79de-4de9-8fd3-ac5d013c23eb',
  'keren': '8e916437-8d28-432b-b177-ac5e00dff9b9',
  'keren hernandez': '8e916437-8d28-432b-b177-ac5e00dff9b9',
  'maria': '9b36f80e-0857-4fc6-ad42-ac5e00e6e8d7',
  'maria elena': '9b36f80e-0857-4fc6-ad42-ac5e00e6e8d7',
  'maria elena esquivel': '9b36f80e-0857-4fc6-ad42-ac5e00e6e8d7',
  'saskie': 'f8567bde-87b8-4c3a-831e-ac61015f751b',
  'saskie daransky': 'f8567bde-87b8-4c3a-831e-ac61015f751b',
  'melanie': 'a7ef7d83-28d7-4bf5-a934-ac6f011cd3c4',
  'melanie vazquez': 'a7ef7d83-28d7-4bf5-a934-ac6f011cd3c4',
  'sarah': 'cbdbf3d3-0531-464f-996b-ac870143b967',
  'sarah long': 'cbdbf3d3-0531-464f-996b-ac870143b967',
  'kristina': '5dc967f1-8606-4696-9871-ad4f0110cb33',
  'kristina gordian': '5dc967f1-8606-4696-9871-ad4f0110cb33',
  'kristen': '452b3db2-0e3d-42bb-824f-ad5700082962',
  'kristen martinez': '452b3db2-0e3d-42bb-824f-ad5700082962',
  'danielle': '1875e266-ba30-48a5-ab3b-ad670141b4d0',
  'danielle carlon': '1875e266-ba30-48a5-ab3b-ad670141b4d0'
};

function resolveStylistId(input) {
  if (!input) return null;
  if (input.includes('-') && input.length > 30) return input;
  return STYLIST_MAP[input.toLowerCase().trim()] || null;
}

// PRODUCTION Service IDs (Phoenix Encanto) - for add-on resolution
const SERVICE_MAP = {
  'haircut_standard': 'f9160450-0b51-4ddc-bcc7-ac150103d5c0',
  'haircut standard': 'f9160450-0b51-4ddc-bcc7-ac150103d5c0',
  'standard': 'f9160450-0b51-4ddc-bcc7-ac150103d5c0',
  'haircut': 'f9160450-0b51-4ddc-bcc7-ac150103d5c0',
  'haircut_skin_fade': '14000cb7-a5bb-4a26-9f23-b0f3016cc009',
  'skin_fade': '14000cb7-a5bb-4a26-9f23-b0f3016cc009',
  'skin fade': '14000cb7-a5bb-4a26-9f23-b0f3016cc009',
  'fade': '14000cb7-a5bb-4a26-9f23-b0f3016cc009',
  'long_locks': '721e907d-fdae-41a5-bec4-ac150104229b',
  'long locks': '721e907d-fdae-41a5-bec4-ac150104229b',
  'wash': '67c644bc-237f-4794-8b48-ac150106d5ae',
  'shampoo': '67c644bc-237f-4794-8b48-ac150106d5ae',
  'grooming': '65ee2a0d-e995-4d8d-a286-ac150106994b',
  'beard': '65ee2a0d-e995-4d8d-a286-ac150106994b',
  'beard_trim': '65ee2a0d-e995-4d8d-a286-ac150106994b'
};

// Helper to resolve service name to ID
function resolveServiceId(input) {
  if (!input) return null;
  if (input.includes('-') && input.length > 30) return input;
  return SERVICE_MAP[input.toLowerCase().trim()] || null;
}

let token = null;
let tokenExpiry = null;

async function getToken() {
  if (token && tokenExpiry && Date.now() < tokenExpiry - 300000) {
    return token;
  }

  console.log('PRODUCTION: Getting fresh token...');
  const res = await axios.post(CONFIG.AUTH_URL, {
    client_id: CONFIG.CLIENT_ID,
    client_secret: CONFIG.CLIENT_SECRET
  });

  token = res.data.access_token;
  tokenExpiry = Date.now() + (res.data.expires_in * 1000);
  return token;
}

async function getStylistName(authToken, employeeId) {
  try {
    const result = await axios.get(
      `${CONFIG.API_URL}/employees?TenantId=${CONFIG.TENANT_ID}&LocationId=${CONFIG.LOCATION_ID}`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    const employee = result.data?.data?.find(e => e.id === employeeId);
    return employee ? `${employee.firstName} ${employee.lastName}` : 'Stylist';
  } catch (error) {
    return 'Stylist';
  }
}

async function getServiceName(authToken, serviceId) {
  try {
    const result = await axios.get(
      `${CONFIG.API_URL}/services?TenantId=${CONFIG.TENANT_ID}&LocationId=${CONFIG.LOCATION_ID}`,
      { headers: { 'Authorization': `Bearer ${authToken}` } }
    );
    const service = result.data?.data?.find(s => s.serviceId === serviceId);
    return service ? service.displayName : 'Service';
  } catch (error) {
    return 'Service';
  }
}

// Check if stylist is scheduled by seeing if others have availability
// If no one has availability = shop closed; if others do but not this stylist = not scheduled
async function checkStylistSchedule(authToken, employeeId, startDate, endDate, serviceId) {
  try {
    // Check if ANY employee has availability (shop open check)
    const scanRequest = {
      LocationId: parseInt(CONFIG.LOCATION_ID),
      TenantId: parseInt(CONFIG.TENANT_ID),
      ScanDateType: 1,
      StartDate: startDate,
      EndDate: endDate,
      ScanTimeType: 1,
      StartTime: '00:00',
      EndTime: '23:59',
      ScanServices: [{ ServiceId: serviceId }]  // No employee filter = all employees
    };

    const result = await axios.post(
      `${CONFIG.API_URL_V2}/scan/openings?TenantId=${CONFIG.TENANT_ID}&LocationId=${CONFIG.LOCATION_ID}`,
      scanRequest,
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Content-Type': 'application/json' } }
    );

    const allOpenings = result.data?.data?.flatMap(item => item.serviceOpenings || []) || [];

    if (allOpenings.length === 0) {
      // No one has availability - shop might be closed
      return null; // Can't determine
    }

    // Check if this specific stylist has ANY slots in the full availability scan
    const stylistHasSlots = allOpenings.some(s => s.employeeId === employeeId);
    return stylistHasSlots; // true = scheduled (has slots), false = not on schedule
  } catch (error) {
    console.log('Schedule check failed:', error.message);
    return null;
  }
}

app.post('/check-stylist-availability', async (req, res) => {
  const {
    employee_id,
    stylist_name,
    service_id,
    date_start,
    date_end,
    specific_date,
    location_id,
    additional_services
  } = req.body;

  const locationId = location_id || CONFIG.LOCATION_ID;
  const resolvedStylistId = resolveStylistId(employee_id || stylist_name);

  if (!resolvedStylistId) {
    return res.json({
      success: false,
      error: 'Missing or invalid stylist. Provide employee_id (UUID) or stylist_name',
      available_stylists: Object.keys(STYLIST_MAP).filter(k => k.includes(' '))
    });
  }

  if (!service_id) {
    return res.json({
      success: false,
      error: 'Missing required field: service_id'
    });
  }

  let startDate, endDate;
  if (specific_date) {
    startDate = specific_date;
    endDate = specific_date;
  } else if (date_start && date_end) {
    startDate = date_start;
    endDate = date_end;
  } else {
    const today = new Date();
    const threeDaysLater = new Date();
    threeDaysLater.setDate(today.getDate() + 3);
    startDate = today.toISOString().split('T')[0];
    endDate = threeDaysLater.toISOString().split('T')[0];
  }

  // Resolve add-on service IDs if provided
  let addonServiceIds = [];
  if (additional_services && Array.isArray(additional_services)) {
    addonServiceIds = additional_services
      .map(s => resolveServiceId(s))
      .filter(s => s !== null);
  }

  console.log('PRODUCTION: Check stylist availability:', {
    stylist: stylist_name || employee_id,
    resolved_id: resolvedStylistId,
    date_range: `${startDate} to ${endDate}`,
    addons: addonServiceIds.length > 0 ? addonServiceIds : 'none'
  });

  try {
    const authToken = await getToken();

    const [stylistName, serviceName, isScheduled] = await Promise.all([
      getStylistName(authToken, resolvedStylistId),
      getServiceName(authToken, service_id),
      checkStylistSchedule(authToken, resolvedStylistId, startDate, endDate, service_id)
    ]);

    // Build ScanServices array - primary service + any add-ons
    const scanServices = [{ ServiceId: service_id, EmployeeIds: [resolvedStylistId] }];
    for (const addonId of addonServiceIds) {
      scanServices.push({ ServiceId: addonId, EmployeeIds: [resolvedStylistId] });
    }

    const scanRequest = {
      LocationId: parseInt(locationId),
      TenantId: parseInt(CONFIG.TENANT_ID),
      ScanDateType: 1,
      StartDate: startDate,
      EndDate: endDate,
      ScanTimeType: 1,
      StartTime: '00:00',
      EndTime: '23:59',
      ScanServices: scanServices
    };

    const result = await axios.post(
      `${CONFIG.API_URL_V2}/scan/openings?TenantId=${CONFIG.TENANT_ID}&LocationId=${locationId}`,
      scanRequest,
      {
        headers: {
          'Authorization': `Bearer ${authToken}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const rawData = result.data?.data || [];
    const openings = rawData.flatMap(item =>
      (item.serviceOpenings || []).map(slot => ({
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: slot.date,
        employeeId: slot.employeeId,
        employeeFirstName: slot.employeeFirstName,
        employeeDisplayName: slot.employeeDisplayName,
        serviceId: slot.serviceId,
        serviceName: slot.serviceName,
        price: slot.employeePrice
      }))
    );

    console.log(`PRODUCTION: Found ${openings.length} available slots for ${stylistName}, scheduled: ${isScheduled}`);

    // Determine message based on schedule and availability
    let message;
    if (openings.length > 0) {
      message = `Found ${openings.length} available time(s) with ${stylistName}`;
    } else if (isScheduled === false) {
      message = `${stylistName} is not on the schedule during this period`;
    } else {
      message = `${stylistName} is all booked up during this period`;
    }

    return res.json({
      success: true,
      stylist_name: stylistName,
      stylist_id: resolvedStylistId,
      service_name: serviceName,
      service_id: service_id,
      date_range: { start: startDate, end: endDate },
      available_slots: openings,
      total_openings: openings.length,
      stylist_scheduled: isScheduled,
      message: message
    });

  } catch (error) {
    console.error('PRODUCTION Error:', error.response?.data || error.message);
    return res.json({
      success: false,
      error: error.response?.data?.error?.message || error.message
    });
  }
});

app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    environment: 'PRODUCTION',
    location: 'Phoenix Encanto',
    service: 'Check Stylist Availability',
    version: '1.2.0',
    features: ['additional_services support for add-ons', 'stylist_scheduled field']
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PRODUCTION Check Stylist Availability listening on port ${PORT}`);
});
