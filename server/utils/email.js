async function sendEmail({ to, subject, text, html }) {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;

  if (!apiKey || !from || !to) {
    return { skipped: true, reason: 'Email is not configured' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from,
        to,
        subject,
        text,
        html: html || text
      })
    });

    if (!res.ok) {
      const body = await res.text();
      console.error('Resend email failed:', res.status, body);
      return { skipped: false, error: body };
    }

    return await res.json();
  } catch (e) {
    console.error('sendEmail() failed:', e);
    return { skipped: false, error: e.message };
  }
}

module.exports = { sendEmail };
