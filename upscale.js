import fetch from "node-fetch";
import FormData from "form-data";

export const config = {
  api: { bodyParser: false },
};

function bufferFromStream(stream) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stream.on('data', (c) => chunks.push(c));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', (err) => reject(err));
  });
}

export default async function handler(req, res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ status: false, message: 'Method not allowed' });

    // read raw body (multipart form) as buffer
    const buffer = await bufferFromStream(req);

    // upload to catbox
    const form = new FormData();
    form.append('reqtype', 'fileupload');
    form.append('fileToUpload', buffer, 'image.jpg');

    const up = await fetch('https://catbox.moe/user/api.php', { method: 'POST', body: form });
    const imageUrl = (await up.text()).trim();
    if (!imageUrl.startsWith('http')) throw new Error('Gagal upload ke Catbox');

    // call upscale API
    const apiUrl = `https://api.zenzxz.my.id/tools/upscale?url=${encodeURIComponent(imageUrl)}`;
    const r = await fetch(apiUrl);
    const json = await r.json();
    if (!json?.status || !json?.result) throw new Error('Upscale API gagal');

    // return JSON with result URL
    return res.status(200).json({ status: true, result: json.result });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ status: false, message: e.message });
  }
}
