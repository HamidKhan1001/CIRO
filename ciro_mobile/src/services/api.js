import axios from 'axios';
import { dbService } from './database';
import { v4 as uuidv4 } from 'uuid';
import AsyncStorage from '@react-native-async-storage/async-storage';

const DEFAULT_BASE_URL = 'http://localhost:8000';

class APIClient {
  constructor() {
    this.client = axios.create({
      timeout: 10000,
    });
    this.baseUrl = DEFAULT_BASE_URL;
    this.init();
  }

  async init() {
    const savedUrl = await AsyncStorage.getItem('backend_url');
    if (savedUrl) {
      this.baseUrl = savedUrl;
    }
  }

  setBaseUrl(url) {
    this.baseUrl = url;
    AsyncStorage.setItem('backend_url', url);
  }

  async request(method, endpoint, data = null) {
    try {
      const response = await this.client({
        method,
        url: `${this.baseUrl}${endpoint}`,
        data,
      });
      return response.data;
    } catch (error) {
      console.warn(`API Error (${endpoint}):`, error.message);
      throw error;
    }
  }

  async submitCrisis(report) {
    const syncId = uuidv4();
    
    // Align with backend OrchestrationRequest schema
    const payload = {
      signals: [
        {
          source: 'mobile_app',
          text: `${report.crisis_type} report: ${report.description}. Location: ${report.location?.address}`,
          location: report.location,
          timestamp: Date.now()
        }
      ],
      resources: {
        ambulances: 20,
        police_units: 15,
        fire_trucks: 10,
        rescue_teams: 5
      }
    };

    try {
      // Try online first
      const result = await this.request('POST', '/orchestrate', payload);
      
      // Extract incident_id from nested classification or top level
      const incidentId = result.classification?.incident_id || result.incident_id;
      
      // Save result locally as well
      if (incidentId) {
        const classification = result.classification || {};
        await dbService.addIncident({
          ...classification,
          incident_id: incidentId,
          affected_population: classification.affected_zone?.affected_population || 0,
          sync_status: 'SYNCED',
          status: 'ACTIVE'
        });
      }
      return { ...result, incident_id: incidentId, source: 'online' };
    } catch (error) {
      // Offline fallback: Save to local DB and sync queue
      const incidentId = `offline_${Date.now()}`;
      const offlineIncident = {
        incident_id: incidentId,
        crisis_type: report.crisis_type || 'Unknown',
        severity: report.severity || 'MEDIUM',
        location_lat: report.location?.lat,
        location_lon: report.location?.lon,
        location_address: report.location?.address,
        affected_population: report.affected_count || 0,
        sync_status: 'PENDING',
        created_at: Date.now(),
        status: 'ACTIVE'
      };

      await dbService.addIncident(offlineIncident);
      await dbService.addToSyncQueue(syncId, 'CREATE_INCIDENT', payload);

      return { ...offlineIncident, source: 'offline', message: 'Report saved locally. Will sync when online.' };
    }
  }

  async getIncidents() {
    try {
      const data = await this.request('GET', '/incidents?limit=50');
      // Update local cache
      for (const inc of data) {
        await dbService.addIncident({ ...inc, sync_status: 'SYNCED' });
      }
      return data;
    } catch (error) {
      // Fallback to local DB
      return await dbService.getIncidents();
    }
  }

  async checkHealth() {
    try {
      await this.request('GET', '/');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const api = new APIClient();
