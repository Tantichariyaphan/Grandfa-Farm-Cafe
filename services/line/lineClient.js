// services/line/lineClient.js
// Single shared LINE Messaging API client used by every LINE service
// (reply, push, multicast, broadcast, richMenu). Also exports the
// webhook config needed for signature verification middleware.

const { messagingApi, middleware } = require('@line/bot-sdk');
const config = require('../../config');

const lineConfig = {
  channelAccessToken: config.line.messaging.channelAccessToken,
  channelSecret: config.line.messaging.channelSecret,
};

const client = new messagingApi.MessagingApiClient({
  channelAccessToken: lineConfig.channelAccessToken,
});

const blobClient = new messagingApi.MessagingApiBlobClient({
  channelAccessToken: lineConfig.channelAccessToken,
});

// Created only when the webhook route is mounted. This keeps modules
// loadable in test tooling without weakening production validation.
function createLineWebhookMiddleware() {
  return middleware(lineConfig);
}

module.exports = { client, blobClient, createLineWebhookMiddleware, lineConfig };
