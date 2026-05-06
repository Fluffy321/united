import dataService from './dataService';

export const paymentsService = {
  isLive: false,
  async createCheckout(payload = {}) {
    return dataService.functions.invoke('create-checkout', payload);
  },
  getComingSoonMessage() {
    return 'Payments are coming soon. No money was processed.';
  },
};

export default paymentsService;
