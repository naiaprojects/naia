// app/api/notify/route.js
import { NextResponse } from 'next/server';

// Generate Admin Email HTML Template
function generateAdminEmailTemplate(data) {
  const { paymentData, briefingData, invoiceNumber, paymentMethod, amount } = data;
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<body style="background-color:#e2e1e0;font-family: Open Sans, sans-serif;font-size:100%;font-weight:400;line-height:1.4;color:#000;">
  <table style="max-width:670px;margin:50px auto 10px;background-color:#fff;padding:50px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);-moz-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24); border-top: solid 10px #fbb040;">
    <thead>
      <tr>
        <th style="text-align:left;">
          <img style="max-width: 150px;" src="https://naia.web.id/assets/img/logo.png" alt="NaiaGrafika">
        </th>
        <th style="text-align:right;font-weight:400;">${currentDate}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td colspan="2" style="border: solid 1px #ddd; padding:10px 20px;">
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:150px">Subject</span><b style="color:#fbb040;font-weight:normal;margin:0">New Order Received</b></p>
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Invoice Number</span> ${invoiceNumber}</p>
        </td>
      </tr>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td style="width:50%;padding:20px;vertical-align:top">
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px">Customer Name</span> ${paymentData.customer.name}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Customer Email</span> ${paymentData.customer.email}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Customer Phone</span> ${paymentData.customer.phone}</p>
        </td>
        <td style="width:50%;padding:20px;vertical-align:top">
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Package Name</span> ${paymentData.package.name}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Website Name</span> ${briefingData.websiteName}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Payment Method</span> ${paymentMethod === 'full' ? 'Full Payment' : 'DP 50%'}</p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="font-size:20px;padding:30px 15px 0 15px;">Order Details:</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:15px;">
          <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;font-weight:bold;">
            <span style="display:block;font-size:13px;font-weight:normal;">Package: ${paymentData.package.name}</span> Rp ${amount.toLocaleString('id-ID')}
          </p>
          ${briefingData.websiteDescription ? `
          <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;">
            <span style="display:block;font-size:13px;font-weight:bold;">Website Description</span> ${briefingData.websiteDescription}
          </p>` : ''}
          ${briefingData.websitePurpose ? `
          <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;">
            <span style="display:block;font-size:13px;font-weight:bold;">Website Purpose</span> ${briefingData.websitePurpose}
          </p>` : ''}
          ${briefingData.colorPreference ? `
          <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;">
            <span style="display:block;font-size:13px;font-weight:bold;">Color Preference</span> ${briefingData.colorPreference}
          </p>` : ''}
          ${briefingData.referenceWebsites ? `
          <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;">
            <span style="display:block;font-size:13px;font-weight:bold;">Reference Websites</span> ${briefingData.referenceWebsites}
          </p>` : ''}
          ${briefingData.additionalInfo ? `
          <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;">
            <span style="display:block;font-size:13px;font-weight:bold;">Additional Information</span> ${briefingData.additionalInfo}
          </p>` : ''}
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:30px 15px 0 15px;text-align:center;color:#999;font-size:12px;">
          <p>This is an automated notification from NaiaGrafika</p>
          <p>© ${new Date().getFullYear()} NaiaGrafika. All rights reserved.</p>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
  `;
}

// Generate Customer Email HTML Template
function generateCustomerEmailTemplate(data) {
  const { paymentData, briefingData, invoiceNumber, paymentMethod, amount } = data;
  const currentDate = new Date().toLocaleDateString('en-US', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return `
<!DOCTYPE html>
<html>
<body style="background-color:#e2e1e0;font-family: Open Sans, sans-serif;font-size:100%;font-weight:400;line-height:1.4;color:#000;">
  <table style="max-width:670px;margin:50px auto 10px;background-color:#fff;padding:50px;-webkit-border-radius:3px;-moz-border-radius:3px;border-radius:3px;-webkit-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);-moz-box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24);box-shadow:0 1px 3px rgba(0,0,0,.12),0 1px 2px rgba(0,0,0,.24); border-top: solid 10px #fbb040;">
    <thead>
      <tr>
        <th style="text-align:left;">
          <img style="max-width: 150px;" src="https://naia.web.id/assets/img/logo.png" alt="NaiaGrafika">
        </th>
        <th style="text-align:right;font-weight:400;">${currentDate}</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td colspan="2" style="text-align:center;padding:20px;">
          <h2 style="margin:0;color:#333;">Thank You for Your Order!</h2>
          <p style="margin:10px 0 0 0;color:#666;">We have received your order and will process it shortly.</p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="border: solid 1px #ddd; padding:10px 20px;">
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:150px">Status</span><b style="color:#22c55e;font-weight:normal;margin:0">Order Confirmed</b></p>
          <p style="font-size:14px;margin:0 0 6px 0;"><span style="font-weight:bold;display:inline-block;min-width:146px">Invoice Number</span> ${invoiceNumber}</p>
        </td>
      </tr>
      <tr>
        <td style="height:35px;"></td>
      </tr>
      <tr>
        <td style="width:50%;padding:20px;vertical-align:top">
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px">Your Name</span> ${paymentData.customer.name}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Your Email</span> ${paymentData.customer.email}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Your Phone</span> ${paymentData.customer.phone}</p>
        </td>
        <td style="width:50%;padding:20px;vertical-align:top">
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Package</span> ${paymentData.package.name}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Website Name</span> ${briefingData.websiteName}</p>
          <p style="margin:0 0 10px 0;padding:0;font-size:14px;"><span style="display:block;font-weight:bold;font-size:13px;">Payment Method</span> ${paymentMethod === 'full' ? 'Full Payment' : 'DP 50%'}</p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="font-size:20px;padding:30px 15px 0 15px;">Order Summary:</td>
      </tr>
      <tr>
        <td colspan="2" style="padding:15px;">
          <p style="font-size:14px;margin:0;padding:10px;border:solid 1px #ddd;font-weight:bold;">
            <span style="display:block;font-size:13px;font-weight:normal;">${paymentData.package.name}</span> Rp ${amount.toLocaleString('id-ID')}
          </p>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:20px;text-align:center;">
          <p style="margin:0 0 20px 0;color:#666;">View your invoice and track your order status:</p>
          <a href="https://naia.web.id/invoice/${invoiceNumber}" style="display:inline-block;padding:15px 30px;background-color:#fbb040;color:#fff;text-decoration:none;border-radius:5px;font-weight:bold;">View Invoice</a>
        </td>
      </tr>
      <tr>
        <td colspan="2" style="padding:20px;text-align:center;background-color:#f9f9f9;border-radius:5px;">
          <p style="margin:0 0 10px 0;font-weight:bold;color:#333;">Need Help?</p>
          <p style="margin:0;color:#666;">Contact us via WhatsApp: <a href="https://wa.me/6281320858595" style="color:#fbb040;">+62 813-2085-8595</a></p>
          <p style="margin:5px 0 0 0;color:#666;">Or email us at: <a href="mailto:halo@naia.web.id" style="color:#fbb040;">halo@naia.web.id</a></p>
        </td>
      </tr>
    </tbody>
    <tfoot>
      <tr>
        <td colspan="2" style="padding:30px 15px 0 15px;text-align:center;color:#999;font-size:12px;">
          <p>Thank you for choosing NaiaGrafika!</p>
          <p>© ${new Date().getFullYear()} NaiaGrafika. All rights reserved.</p>
        </td>
      </tr>
    </tfoot>
  </table>
</body>
</html>
  `;
}

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("API /api/notify called");

    const {
      paymentData,
      briefingData,
      invoiceNumber,
      paymentMethod,
      amount
    } = data;

    // Format WhatsApp message for Fonnte
    const whatsappMessage = `*NEW ORDER - NAIA.WEB.ID*\n\n` +
      `*Invoice:* ${invoiceNumber}\n` +
      `*Date:* ${new Date().toLocaleString('en-US')}\n` +
      `*Status:* Payment Successful\n\n` +
      `*Customer Information:*\n` +
      `*Name:* ${paymentData.customer.name}\n` +
      `*Email:* ${paymentData.customer.email}\n` +
      `*Phone:* ${paymentData.customer.phone}\n\n` +
      `*Package Details:*\n` +
      `*Package:* ${paymentData.package.name}\n` +
      `*Website:* ${briefingData.websiteName}\n` +
      `*Total:* Rp ${amount.toLocaleString('id-ID')}\n` +
      `*Method:* ${paymentMethod === 'full' ? 'Full Payment' : 'DP 50%'}`;

    // Send WhatsApp using Fonnte API
    let whatsappSent = false;
    let whatsappError = null;

    try {
      console.log("Attempting to send WhatsApp via Fonnte...");

      if (!process.env.FONNTE_API_TOKEN) {
        throw new Error("FONNTE_API_TOKEN not found in environment variables");
      }

      const fonnteResponse = await fetch('https://api.fonnte.com/send', {
        method: 'POST',
        headers: {
          'Authorization': process.env.FONNTE_API_TOKEN,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          target: '6281320858595',
          message: whatsappMessage,
        }),
      });

      const responseBody = await fonnteResponse.text();
      console.log("Fonnte API Response Status:", fonnteResponse.status);
      console.log("Fonnte API Response Body:", responseBody);

      if (fonnteResponse.ok) {
        whatsappSent = true;
        console.log("WhatsApp sent successfully via Fonnte");
      } else {
        whatsappError = `Status: ${fonnteResponse.status}, Body: ${responseBody}`;
        console.error("Failed to send WhatsApp via Fonnte:", whatsappError);
      }
    } catch (error) {
      whatsappError = error.message;
      console.error("Error sending WhatsApp via Fonnte:", error);
    }

    // Send Admin Email
    let adminEmailSent = false;
    let adminEmailError = null;

    try {
      console.log("Attempting to send admin email...");

      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY not found in environment variables");
      }

      const adminEmailSubject = `New Order - ${paymentData.customer.name} - Invoice ${invoiceNumber}`;
      const adminEmailHtml = generateAdminEmailTemplate(data);

      const adminEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'NaiaGrafika <send@naia.web.id>',
          to: ['halo@naia.web.id'],
          subject: adminEmailSubject,
          html: adminEmailHtml,
        }),
      });

      const adminEmailResponseBody = await adminEmailResponse.text();
      console.log("Admin Email API Response Status:", adminEmailResponse.status);
      console.log("Admin Email API Response Body:", adminEmailResponseBody);

      if (adminEmailResponse.ok) {
        adminEmailSent = true;
        console.log("Admin email sent successfully");
      } else {
        adminEmailError = `Status: ${adminEmailResponse.status}, Body: ${adminEmailResponseBody}`;
        console.error("Failed to send admin email:", adminEmailError);
      }
    } catch (error) {
      adminEmailError = error.message;
      console.error("Error sending admin email:", error);
    }

    // Send Customer Email
    let customerEmailSent = false;
    let customerEmailError = null;

    try {
      console.log("Attempting to send customer email...");

      if (!process.env.RESEND_API_KEY) {
        throw new Error("RESEND_API_KEY not found in environment variables");
      }

      const customerEmailSubject = `Order Confirmation - ${invoiceNumber} - NaiaGrafika`;
      const customerEmailHtml = generateCustomerEmailTemplate(data);

      const customerEmailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${process.env.RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'NaiaGrafika <send@naia.web.id>',
          to: [paymentData.customer.email],
          subject: customerEmailSubject,
          html: customerEmailHtml,
        }),
      });

      const customerEmailResponseBody = await customerEmailResponse.text();
      console.log("Customer Email API Response Status:", customerEmailResponse.status);
      console.log("Customer Email API Response Body:", customerEmailResponseBody);

      if (customerEmailResponse.ok) {
        customerEmailSent = true;
        console.log("Customer email sent successfully");
      } else {
        customerEmailError = `Status: ${customerEmailResponse.status}, Body: ${customerEmailResponseBody}`;
        console.error("Failed to send customer email:", customerEmailError);
      }
    } catch (error) {
      customerEmailError = error.message;
      console.error("Error sending customer email:", error);
    }

    return NextResponse.json({
      success: whatsappSent || adminEmailSent || customerEmailSent,
      adminEmailSent,
      customerEmailSent,
      whatsappSent,
      adminEmailError,
      customerEmailError,
      whatsappError,
      message: 'Notifications processed successfully'
    });

  } catch (error) {
    console.error("Overall error in API notify:", error);
    return NextResponse.json(
      { success: false, message: `Error occurred: ${error.message}` },
      { status: 500 }
    );
  }
}