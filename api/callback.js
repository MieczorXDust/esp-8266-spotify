// File: api/callback.js
import axios from 'axios';

const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  VERCEL_URL: vercel_url
} = process.env;

const redirect_uri = `https://${vercel_url}/api/callback`;
const TOKEN_ENDPOINT = 'https://accounts.spotify.com/api/token';

export default async function handler(req, res) {
  const code = req.query.code || null;

  try {
    const response = await axios.post(TOKEN_ENDPOINT, new URLSearchParams({
      grant_type: 'authorization_code',
      code: code,
      redirect_uri: redirect_uri
    }), {
      headers: {
        'Authorization': 'Basic ' + (Buffer.from(client_id + ':' + client_secret).toString('base64')),
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    });

    const { refresh_token } = response.data;
    
    // Display the refresh token to the user.
    // In a real production app, you would store this securely and redirect the user.
    res.setHeader('Content-Type', 'text/html');
    res.status(200).send(`
      <html>
        <body style="font-family: sans-serif; background: #121212; color: #eee; padding: 2rem;">
          <h1>Authentication Successful!</h1>
          <p>Copy your Refresh Token below and add it to your Vercel Environment Variables as <code style="background: #333; padding: 0.2em 0.4em; border-radius: 4px;">SPOTIFY_REFRESH_TOKEN</code>.</p>
          <pre style="background: #282828; padding: 1rem; border-radius: 8px; word-wrap: break-word; white-space: pre-wrap; font-size: 1.1rem;">${refresh_token}</pre>
          <p>After adding the token, you must <strong>re-deploy</strong> your Vercel project for the change to take effect.</p>
        </body>
      </html>
    `);

  } catch (error) {
    const errorMessage = error.response ? error.response.data : error.message;
    console.error("Error in callback:", errorMessage);
    res.status(500).json({ error: 'Failed to retrieve refresh token.' });
  }
}
