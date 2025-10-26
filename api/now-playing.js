// File: api/now-playing.js
import axios from 'axios';

// These environment variables must be set in your Vercel project settings
const {
  SPOTIFY_CLIENT_ID: client_id,
  SPOTIFY_CLIENT_SECRET: client_secret,
  SPOTIFY_REFRESH_TOKEN: refresh_token,
} = process.env;

const basic = Buffer.from(`${client_id}:${client_secret}`).toString('base64');
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`;
const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`;

// Function to get a new access token from Spotify using the refresh token
const getAccessToken = async () => {
  const response = await axios.post(TOKEN_ENDPOINT, new URLSearchParams({
    grant_type: 'refresh_token',
    refresh_token,
  }), {
    headers: {
      Authorization: `Basic ${basic}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
  });
  return response.data.access_token;
};

// The main serverless function that Vercel will run
export default async function handler(req, res) {
  // Allow requests from any origin (CORS)
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET');
  // Set cache headers to prevent Vercel from caching the response for too long
  res.setHeader('Cache-Control', 'public, s-maxage=1, stale-while-revalidate=1');

  if (!refresh_token) {
    return res.status(500).json({ error: 'SPOTIFY_REFRESH_TOKEN is not configured.' });
  }

  try {
    const accessToken = await getAccessToken();
    const response = await axios.get(NOW_PLAYING_ENDPOINT, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (response.status === 204 || !response.data || !response.data.is_playing) {
      return res.status(200).json({ isPlaying: false });
    }

    const song = response.data;
    const item = song.item;
    
    const formattedResponse = {
      isPlaying: song.is_playing,
      track: item.name,
      artist: item.artists.map((_artist) => _artist.name).join(', '),
      playlist: item.album.name, // Using album name for simplicity
      progress_ms: song.progress_ms,
      duration_ms: item.duration_ms,
    };

    return res.status(200).json(formattedResponse);

  } catch (error) {
    const errorMessage = error.response ? error.response.data : error.message;
    console.error("Error fetching Spotify data:", errorMessage);
    return res.status(500).json({ isPlaying: false, error: 'Failed to fetch data from Spotify.' });
  }
}
