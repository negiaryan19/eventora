require('dotenv').config();
const {
  createDynamicQrCode,
  getHovercodeErrorMessage,
} = require('./utils/hovercode');

const [, , cliUrl, ...nameParts] = process.argv;
const targetUrl = cliUrl || process.env.QR_TARGET_URL;
const displayName = nameParts.join(' ') || process.env.QR_DISPLAY_NAME;

async function main() {
  if (!targetUrl || !displayName) {
    console.error('Usage: node generate-qr.js <target-url> <display name>');
    console.error('Or set QR_TARGET_URL and QR_DISPLAY_NAME in your environment.');
    process.exit(1);
  }

  try {
    const qrCode = await createDynamicQrCode({
      targetUrl,
      displayName,
      generatePng: true,
    });

    console.log('Hovercode dynamic QR code created.');
    console.log(JSON.stringify({
      id: qrCode.id,
      display_name: qrCode.display_name,
      qr_data: qrCode.qr_data,
      dynamic: qrCode.dynamic,
      shortlink_url: qrCode.shortlink_url,
      png: qrCode.png,
      svg_file: qrCode.svg_file,
    }, null, 2));
  } catch (error) {
    console.error('Failed to create Hovercode QR code.');
    console.error(getHovercodeErrorMessage(error));
    process.exit(1);
  }
}

main();
