import axios from 'axios';

const BASE_URL = 'http://localhost:8000';

class APIClient {
  constructor() {
    this.client = axios.create({
      baseURL: BASE_URL,
      timeout: 10000,
    });
  }

  async orchestrate(signals, resources) {
    try {
      const response = await this.client.post('/orchestrate', { signals, resources });
      return response.data;
    } catch (error) {
      console.error('Orchestration failed:', error);
      throw error;
    }
  }

  async getIncidents() {
    try {
      const response = await this.client.get('/incidents');
      return response.data;
    } catch (error) {
      console.error('Failed to fetch incidents:', error);
      throw error;
    }
  }

  async checkHealth() {
    try {
      await this.client.get('/');
      return true;
    } catch (error) {
      return false;
    }
  }
}

export const api = new APIClient();
