const stripe = require('stripe');

class StripeService {
  constructor() {
    this.accounts = {
      v1: {
        client: stripe(process.env.STRIPE_SECRET_KEY),
        priceIds: {
          monthly: process.env.STRIPE_PRICEID_MONTHLY,
          annual: process.env.STRIPE_PRICEID_ANNUAL,
        },
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
      },
      v2: {
        client: stripe(process.env.STRIPE_SECRET_KEY_V2),
        priceIds: {
          monthly: process.env.STRIPE_PRICEID_MONTHLY_V2,
          annual: process.env.STRIPE_PRICEID_ANNUAL_V2,
        },
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET_V2,
      },
    };

    this.defaultVersion = 'v2';
  }

  getClient(version = null) {
    const accountVersion = version || this.defaultVersion;

    if (!this.accounts[accountVersion]) {
      throw new Error(`Stripe account version ${accountVersion} not configured`);
    }

    return this.accounts[accountVersion].client;
  }

  getPriceId(version, planType) {
    const accountVersion = version || this.defaultVersion;

    if (!this.accounts[accountVersion]) {
      throw new Error(`Stripe account version ${accountVersion} not configured`);
    }

    if (!this.accounts[accountVersion].priceIds[planType]) {
      throw new Error(`Price ID for ${planType} not found in version ${accountVersion}`);
    }

    return this.accounts[accountVersion].priceIds[planType];
  }

  getWebhookSecret(version) {
    if (!this.accounts[version]) {
      throw new Error(`Stripe account version ${version} not configured`);
    }

    return this.accounts[version].webhookSecret;
  }

  detectVersionFromPriceId(priceId) {
    for (const [version, account] of Object.entries(this.accounts)) {
      const prices = Object.values(account.priceIds);
      if (prices.includes(priceId)) {
        return version;
      }
    }
    return null;
  }

  detectVersionFromWebhookSecret(webhookSecret) {
    for (const [version, account] of Object.entries(this.accounts)) {
      if (account.webhookSecret === webhookSecret) {
        return version;
      }
    }
    return null;
  }

  async getSubscriptionVersion(subscriptionId) {
    for (const [version, account] of Object.entries(this.accounts)) {
      try {
        const subscription = await account.client.subscriptions.retrieve(subscriptionId);
        if (subscription) {
          return version;
        }
      } catch (error) {
        continue;
      }
    }
    return null;
  }

  getDefaultVersion() {
    return this.defaultVersion;
  }
}

module.exports = new StripeService();
