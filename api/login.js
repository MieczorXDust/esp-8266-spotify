// File: api/login.js
const {
  SPOTIFY_CLIENT_ID: client_id,
  VERCEL_URL: vercel_url
} = process.env;

const redirect_uri = `https://${vercel_url}/api/callback`;
const scope = 'user-read-currently-playing';
const authUrl = new URL("https://accounts.spotify.com/authorize");

export default function handler(req, res) {
  const params = {
    response_type: 'code',
    client_id,
    scope,
    redirect_uri,
  };
  
  Object.keys(params).forEach(key => authUrl.searchParams.append(key, params[key]));
  
  res.redirect(authUrl.toString());
}
