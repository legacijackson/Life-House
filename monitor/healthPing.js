// Life House Health Monitoring Function
// Pre-Flight Script v11 - Notification Hook
// This function pings /health endpoint every 5 minutes
// On non-200 response, sends Slack DM to SuperAdmin

const https = require('https');

// Configuration
const HEALTH_URL = process.env.HEALTH_URL || 'https://lifehouse.replit.dev/health';
const SLACK_WEBHOOK = process.env.SLACK_WEBHOOK_URL;
const CHECK_INTERVAL = 5 * 60 * 1000; // 5 minutes

async function checkHealth() {
  return new Promise((resolve, reject) => {
    https.get(HEALTH_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          resolve({ status: 'healthy', code: res.statusCode });
        } else {
          reject({ 
            status: 'unhealthy', 
            code: res.statusCode,
            body: data,
            timestamp: new Date().toISOString()
          });
        }
      });
    }).on('error', (err) => {
      reject({ 
        status: 'error', 
        error: err.message,
        timestamp: new Date().toISOString()
      });
    });
  });
}

async function sendSlackAlert(error) {
  if (!SLACK_WEBHOOK) {
    console.error('SLACK_WEBHOOK_URL not configured');
    return;
  }

  const message = {
    text: `🚨 Life House Health Check Failed`,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 Life House Health Check Failed'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Status Code:* ${error.code || 'N/A'}`
          },
          {
            type: 'mrkdwn',
            text: `*Timestamp:* ${error.timestamp}`
          }
        ]
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `*Error Details:*\n\`\`\`${JSON.stringify(error, null, 2)}\`\`\``
        }
      }
    ]
  };

  // Send to Slack
  try {
    const webhookUrl = new URL(SLACK_WEBHOOK);
    const options = {
      hostname: webhookUrl.hostname,
      path: webhookUrl.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    };

    const req = https.request(options, (res) => {
      console.log(`Slack alert sent: ${res.statusCode}`);
    });

    req.on('error', (e) => {
      console.error(`Slack alert failed: ${e.message}`);
    });

    req.write(JSON.stringify(message));
    req.end();
  } catch (e) {
    console.error('Failed to send Slack alert:', e);
  }
}

// Main monitoring loop
async function monitor() {
  try {
    const result = await checkHealth();
    console.log(`Health check passed: ${result.status}`);
  } catch (error) {
    console.error('Health check failed:', error);
    await sendSlackAlert(error);
  }
}

// Start monitoring
console.log('Starting Life House health monitoring...');
monitor(); // Initial check
setInterval(monitor, CHECK_INTERVAL);

// Export for testing
module.exports = { checkHealth, sendSlackAlert };