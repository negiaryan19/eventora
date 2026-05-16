const axios = require('axios');

const HOVERCODE_CREATE_URL = 'https://hovercode.com/api/v2/hovercode/create/';

function getHovercodeConfig() {
  const token = process.env.HOVERCODE_API_TOKEN || process.env.HOVERCODE_TOKEN;
  const workspaceId = process.env.HOVERCODE_WORKSPACE_ID;

  return {
    token,
    workspaceId,
    isConfigured: Boolean(token && workspaceId),
  };
}

function getHovercodeErrorMessage(error) {
  const responseData = error.response?.data;

  if (typeof responseData === 'string') {
    return responseData;
  }

  if (responseData && typeof responseData === 'object') {
    return JSON.stringify(responseData);
  }

  return error.message;
}

async function createQrCode({
  qrData,
  displayName,
  qrType = 'Link',
  dynamic = false,
  generatePng = true,
}) {
  if (!qrData) {
    throw new Error('qrData is required to create a Hovercode QR code.');
  }

  if (!displayName) {
    throw new Error('displayName is required to create a Hovercode QR code.');
  }

  const { token, workspaceId } = getHovercodeConfig();

  if (!token || !workspaceId) {
    throw new Error('Set HOVERCODE_API_TOKEN and HOVERCODE_WORKSPACE_ID before creating QR codes.');
  }

  const { data } = await axios.post(
    HOVERCODE_CREATE_URL,
    {
      workspace: workspaceId,
      qr_data: qrData,
      qr_type: qrType,
      dynamic,
      display_name: displayName,
      generate_png: generatePng,
    },
    {
      headers: {
        Authorization: `Token ${token}`,
        'Content-Type': 'application/json',
      },
      timeout: 10000,
    }
  );

  return data;
}

async function createDynamicQrCode({ targetUrl, displayName, generatePng = true }) {
  return createQrCode({
    qrData: targetUrl,
    displayName,
    qrType: 'Link',
    dynamic: true,
    generatePng,
  });
}

function getQrImageUrl(hovercode) {
  return hovercode?.png || hovercode?.svg_file || '';
}

module.exports = {
  createQrCode,
  createDynamicQrCode,
  getHovercodeConfig,
  getHovercodeErrorMessage,
  getQrImageUrl,
};
