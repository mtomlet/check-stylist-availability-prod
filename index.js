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

// ============================================
// DYNAMIC ACTIVE EMPLOYEE CACHE (1-hour TTL)
// ============================================
let cachedActiveEmployees = null;
let cachedStylistMap = null;
let employeeCacheExpiry = null;
const EMPLOYEE_CACHE_TTL = 60 * 60 * 1000; // 1 hour

async function getActiveEmployees(authToken) {
  // Return cached if still valid
  if (cachedActiveEmployees && employeeCacheExpiry && Date.now() < employeeCacheExpiry) {
    console.log(`[Employees] Using cached list (${cachedActiveEmployees.length} active)`);
    return cachedActiveEmployees;
  }

  console.log('[Employees] Fetching active employees from Meevo...');
  try {
    const response = await axios.get(
      `${CONFIG.API_URL}/employees?tenantid=${CONFIG.TENANT_ID}&locationid=${CONFIG.LOCATION_ID}&ItemsPerPage=100`,
      { headers: { 'Authorization': `Bearer ${authToken}`, 'Accept': 'application/json' }, timeout: 5000 }
    );

    const employees = response.data?.data || [];

    // Filter: ObjectState 2026 = Active, exclude test accounts
    cachedActiveEmployees = employees
      .filter(emp => emp.objectState === 2026)
      .filter(emp => !['home', 'training', 'test'].includes((emp.firstName || '').toLowerCase()))
      .map(emp => ({
        id: emp.id,
        name: emp.nickname || emp.firstName,
        firstName: emp.firstName,
        nickname: emp.nickname
      }));

    // Build name-to-ID map (lowercase keys)
    cachedStylistMap = {};
    for (const emp of cachedActiveEmployees) {
      const name = (emp.name || '').toLowerCase();
      const firstName = (emp.firstName || '').toLowerCase();
      cachedStylistMap[name] = emp.id;
      if (firstName && firstName !== name) {
        cachedStylistMap[firstName] = emp.id;
      }
    }

    employeeCacheExpiry = Date.now() + EMPLOYEE_CACHE_TTL;
    console.log(`[Employees] Cached ${cachedActiveEmployees.length} active employees`);
    return cachedActiveEmployees;
  } catch (err) {
    console.error('[Employees] Fetch failed:', err.message);
    return cachedActiveEmployees || [];
  }
}

function resolveStylistId(input) {
  if (!input) return null;
  // If already a UUID, return as-is
  if (input.includes('-') && input.length > 30) return input;
  // Look up in cached map
  return (cachedStylistMap || {})[input.toLowerCase().trim()] || null;
}

function getAvailableStylistNames() {
  return (cachedActiveEmployees || []).map(e => e.name);
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

// ============================================
// DATE FORMATTING HELPERS (Option B fix)
// These ensure the LLM never has to do date math
// ============================================

const DAYS_OF_WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
                'July', 'August', 'September', 'October', 'November', 'December'];

function getOrdinalSuffix(day) {
  if (day > 3 && day < 21) return 'th';
  switch (day % 10) {
    case 1: return 'st';
    case 2: return 'nd';
    case 3: return 'rd';
    default: return 'th';
  }
}

function formatDateParts(dateString) {
  // Parse date string like "2026-01-21" or "2026-01-21T09:00:00"
  // Use UTC methods to avoid timezone issues on Railway servers
  const date = new Date(dateString + (dateString.includes('T') ? '' : 'T12:00:00'));

  const dayOfWeek = DAYS_OF_WEEK[date.getUTCDay()];
  const month = MONTHS[date.getUTCMonth()];
  const dayNum = date.getUTCDate();
  const dayWithSuffix = `${dayNum}${getOrdinalSuffix(dayNum)}`;

  return {
    day_of_week: dayOfWeek,
    formatted_date: `${month} ${dayWithSuffix}`,
    formatted_full_date: `${dayOfWeek}, ${month} ${dayWithSuffix}`
  };
}

function formatTime(timeString) {
  // Parse time directly from string to avoid timezone issues
  // Input: "2026-01-21T09:00:00.0000000" or "2026-01-21T09:00:00"
  const timePart = timeString.split('T')[1];
  if (!timePart) return 'Time unavailable';

  const [hourStr, minStr] = timePart.split(':');
  let hours = parseInt(hourStr, 10);
  const minutes = parseInt(minStr, 10);

  const ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  const minutesStr = minutes < 10 ? '0' + minutes : minutes;
  return `${hours}:${minutesStr} ${ampm}`;
}

function detectGap(searchStartDate, firstAvailableDate) {
  // Compare if first available is different from search start
  const searchStart = searchStartDate.split('T')[0];
  const firstAvail = firstAvailableDate.split('T')[0];
  return searchStart !== firstAvail;
}

function buildGapMessage(searchStartDate, firstAvailableDate) {
  const searchParts = formatDateParts(searchStartDate);
  const firstParts = formatDateParts(firstAvailableDate);
  return `No availability on ${searchParts.formatted_full_date}. First opening is ${firstParts.formatted_full_date}.`;
}

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

  // Get active employees first (cached for 1 hour) - needed for name resolution
  const authToken = await getToken();
  await getActiveEmployees(authToken);

  const locationId = location_id || CONFIG.LOCATION_ID;
  const resolvedStylistId = resolveStylistId(employee_id || stylist_name);

  if (!resolvedStylistId) {
    return res.json({
      success: false,
      error: 'Missing or invalid stylist. Provide employee_id (UUID) or stylist_name',
      available_stylists: getAvailableStylistNames()
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
    const [stylistName, serviceName] = await Promise.all([
      getStylistName(authToken, resolvedStylistId),
      getServiceName(authToken, service_id)
    ]);

    // Build ScanServices array - primary service + any add-ons
    const scanServices = [{ ServiceId: service_id, EmployeeIds: [resolvedStylistId] }];
    for (const addonId of addonServiceIds) {
      scanServices.push({ ServiceId: addonId, EmployeeIds: [resolvedStylistId] });
    }

    // Meevo V2 API has 8-slot limit per request
    // Make two requests (morning + afternoon) and combine to get ALL slots
    async function scanTimeRange(startTime, endTime) {
      const scanRequest = {
        LocationId: parseInt(locationId),
        TenantId: parseInt(CONFIG.TENANT_ID),
        ScanDateType: 1,
        StartDate: startDate,
        EndDate: endDate,
        ScanTimeType: 1,
        StartTime: startTime,
        EndTime: endTime,
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

      return (result.data?.data || []).flatMap(item => item.serviceOpenings || []);
    }

    // Scan morning and afternoon in parallel
    const [morningSlots, afternoonSlots] = await Promise.all([
      scanTimeRange('00:00', '14:00'),
      scanTimeRange('14:00', '23:59')
    ]);

    // Combine and deduplicate by startTime
    const seenTimes = new Set();
    const allSlots = [...morningSlots, ...afternoonSlots].filter(slot => {
      if (seenTimes.has(slot.startTime)) return false;
      seenTimes.add(slot.startTime);
      return true;
    });

    // Sort by start time
    allSlots.sort((a, b) => new Date(a.startTime) - new Date(b.startTime));

    const openings = allSlots.map(slot => {
      const dateParts = formatDateParts(slot.startTime);
      const formattedTime = formatTime(slot.startTime);
      return {
        startTime: slot.startTime,
        endTime: slot.endTime,
        date: slot.date,
        employeeId: slot.employeeId,
        employeeFirstName: slot.employeeFirstName,
        employeeDisplayName: slot.employeeDisplayName,
        serviceId: slot.serviceId,
        serviceName: slot.serviceName,
        price: slot.employeePrice,
        // Pre-formatted date fields so LLM doesn't do date math
        day_of_week: dateParts.day_of_week,
        formatted_date: dateParts.formatted_date,
        formatted_time: formattedTime,
        formatted_full: `${dateParts.formatted_full_date} at ${formattedTime}`
      };
    });

    console.log(`PRODUCTION: Found ${openings.length} available slots for ${stylistName}`);

    // Build first_available summary and gap detection
    let firstAvailable = null;
    let gapDetected = false;
    let gapMessage = null;

    if (openings.length > 0) {
      const firstSlot = openings[0];
      const firstDateParts = formatDateParts(firstSlot.startTime);
      const firstTime = formatTime(firstSlot.startTime);

      firstAvailable = {
        date: firstSlot.startTime.split('T')[0],
        day_of_week: firstDateParts.day_of_week,
        formatted_date: firstDateParts.formatted_date,
        formatted_full_date: firstDateParts.formatted_full_date,
        time: firstTime,
        formatted_full: `${firstDateParts.formatted_full_date} at ${firstTime}`
      };

      // Check if there's a gap between search start and first available
      gapDetected = detectGap(startDate, firstSlot.startTime);
      if (gapDetected) {
        gapMessage = buildGapMessage(startDate, firstSlot.startTime);
        console.log(`PRODUCTION: Gap detected - ${gapMessage}`);
      }
    }

    return res.json({
      success: true,
      stylist_name: stylistName,
      stylist_id: resolvedStylistId,
      service_name: serviceName,
      service_id: service_id,
      date_range: { start: startDate, end: endDate },
      // NEW: First available summary for easy LLM consumption
      first_available: firstAvailable,
      // NEW: Gap detection - tells LLM if search date had no availability
      search_started_from: startDate,
      gap_detected: gapDetected,
      gap_message: gapMessage,
      available_slots: openings,
      total_openings: openings.length,
      message: openings.length > 0
        ? `Found ${openings.length} available time(s) with ${stylistName}`
        : `No availability found for ${stylistName} during this period`
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
    version: '2.0.0',
    features: [
      'DYNAMIC active employee fetching (1-hour cache)',
      'additional_services support for add-ons',
      'formatted date fields (day_of_week, formatted_date, formatted_time)',
      'first_available summary',
      'gap_detected and gap_message for date mismatches',
      'full slot retrieval (morning + afternoon scan to bypass 8-slot API limit)'
    ],
    stylists: 'dynamic (fetched from Meevo API)'
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`PRODUCTION Check Stylist Availability listening on port ${PORT}`);
  console.log('Active stylists fetched dynamically from Meevo API (1-hour cache)');
});
