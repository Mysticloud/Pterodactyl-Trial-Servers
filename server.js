import 'dotenv/config';
import path from 'path';
import express from 'express';
import { fileURLToPath } from 'url';
import bodyParser from 'body-parser';
import { schedule as cron_Schedule } from 'node-cron';
import { MongoClient, ObjectId, ServerApiVersion } from 'mongodb';
import { createProxyMiddleware } from 'http-proxy-middleware';
import { compressAllDownload, createServer, deleteServer, getServer, getWebsocket } from './src/utils/server.js';
import { generateRandomPassword } from './src/utils/createEncryption.js';

const app = express();

const mongoDBClient = new MongoClient(process.env.MONGODB_URI, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use('/public', express.static(path.join(__dirname, 'public')));
app.use(bodyParser.json())

app.get('/api/list_server', async (req, res) => {
  let retry_count = 0;
  while (retry_count < 5) {
    try {
      await mongoDBClient.connect();
      const Servers = mongoDBClient.db('Servers');
      const List = Servers.collection('List');
      const Categories = Servers.collection('Categories');
      const serversList = await List.find().toArray();
      const categoriesList = await Categories.find().toArray();
      console.log(`[${new Date().toLocaleString()}] SERVER LIST: - ${req.ip}`)
      return res.status(200).json({ serversList, categoriesList });
    } catch {
      retry_count += 1;
    } finally {
      await mongoDBClient.close();
    }
  }
  return res.status(500).json(Object({}));
});

app.post('/api/create_server', async (req, res) => {
  const request_data = req.body;
  const CAPTCHA_SECRET = process.env.CAPTCHA_SECRET_KEY
  if (request_data?.trialServerId == null) {
    return res.status(400).json({'error': 'Valid trialServerId is needed in the request body'})
  }
  if (!((CAPTCHA_SECRET == null) || (CAPTCHA_SECRET == ''))) {
    var captcha_verified = false
    if (request_data['g-recaptcha-response'] != null) {
      const formData = new URLSearchParams();
      formData.append('secret', CAPTCHA_SECRET);
      formData.append('response', request_data['g-recaptcha-response']);
      const captcha_response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
        method: 'POST',
        body: formData,
        headers: {
          'Content-type': 'application/x-www-form-urlencoded'
        }
      });
      const captcha_json = await captcha_response.json()
      captcha_verified = captcha_json?.success || false
    }
    if (!captcha_verified) {
      console.log(`[${new Date().toLocaleString()}] SERVER CREATE [!!!CAPTCHA FAILED] - ${req.ip}`)
      return res.status(403).json({'error': 'Recaptcha Token is invalid, refresh the page and try again'})
    }
  }
  try {
    await mongoDBClient.connect();
    const Servers = mongoDBClient.db('Servers');
    const List = Servers.collection('List');
    const serverDetails = await List.findOne({ _id: new ObjectId(String(request_data?.trialServerId)) });
    if (serverDetails == null) {
      return res.status(400).json({'error': 'Valid trialServerId is needed in the request body'})
    }
    const created_server = await createServer(process.env.PTERODACTYL_HOST_URL, serverDetails.server_data, process.env.PTERODACTYL_API_KEY)
    if (created_server?.attributes == null) throw "Server Creation Failed";
    const fetched_server = await getServer(process.env.PTERODACTYL_HOST_URL, created_server?.attributes?.identifier, process.env.PTERODACTYL_API_KEY)
    if (fetched_server?.attributes == null) throw "Server Creation Failed";
    const Active = Servers.collection('Active');
    const return_data = {
      identifier: fetched_server?.attributes?.identifier,
      id: created_server?.attributes?.id,
      uuid: fetched_server?.attributes?.uuid,
      name: fetched_server?.attributes?.name,
      limits: fetched_server?.attributes?.limits,
      allocations: fetched_server?.attributes?.relationships?.allocations?.data?.map(p => p?.attributes) || [],
      created_at: new Date(),
      expiry: (serverDetails?.expiry || 4),
      hash: generateRandomPassword(46),
      ip: (req?.ip || null)
    }
    console.log(`[${new Date().toLocaleString()}] SERVER CREATE: ${fetched_server?.attributes?.identifier} - ${req.ip}`)
    await Active.insertOne(return_data)
    return res.status(201).json(return_data);
  } catch {
    return res.status(500).json(Object({}));
  } finally {
    await mongoDBClient.close();
  }
});

app.get('/api/server/:serverId', async (req, res) => {
  const serverId = req.params.serverId;
  const serverHash = req.headers.authorization
  let retry_count = (serverHash == null) ? 3 : 0;
  while (retry_count < 2) {
    try {
      await mongoDBClient.connect();
      const Servers = mongoDBClient.db('Servers');
      const Active = Servers.collection('Active');
      let activeServer = await Active.findOne({ uuid: serverId, hash: serverHash.split(' ').slice(-1)[0] })
      if (activeServer?.identifier == null) break;
      const fetched_server = await getServer(process.env.PTERODACTYL_HOST_URL, activeServer?.identifier, process.env.PTERODACTYL_API_KEY)
      const server_websocket = await getWebsocket(process.env.PTERODACTYL_HOST_URL, activeServer?.identifier, process.env.PTERODACTYL_API_KEY)
      activeServer = {
        identifier: fetched_server?.attributes?.identifier,
        uuid: fetched_server?.attributes?.uuid,
        name: fetched_server?.attributes?.name,
        created_at: activeServer?.created_at,
        expiry: (activeServer?.expiry || 4),
        limits: fetched_server?.attributes?.limits,
        allocations: fetched_server?.attributes?.relationships?.allocations?.data?.map(p => p?.attributes) || [],
        websocket: server_websocket?.data
      }
      if (activeServer?.identifier == null) break;
      console.log(`[${new Date().toLocaleString()}] SERVER FETCH: ${serverId} - ${req.ip}`)
      return res.status(200).json(activeServer);
    } catch {
      retry_count += 1;
    } finally {
      await mongoDBClient.close();
    }
  }
  return res.status(403).json({ error: 'serverHash Key is not matching' })
});

app.get('/api/server/:serverId/download', async (req, res) => {
  const serverId = req.params.serverId;
  const serverHash = req.headers.authorization
  let retry_count = (serverHash == null) ? 3 : 0;
  while (retry_count < 2) {
    try {
      await mongoDBClient.connect();
      const Servers = mongoDBClient.db('Servers');
      const Active = Servers.collection('Active');
      let activeServer = await Active.findOne({ uuid: serverId, hash: serverHash.split(' ').slice(-1)[0] })
      if (activeServer?.identifier == null) break;
      const downloadFile = await compressAllDownload(process.env.PTERODACTYL_HOST_URL, activeServer?.identifier, process.env.PTERODACTYL_API_KEY)
      console.log(`[${new Date().toLocaleString()}] SERVER DOWNLOAD: ${serverId} - ${req.ip}`)
      return res.status(200).json(downloadFile);
    } catch {
      retry_count += 1;
    } finally {
      await mongoDBClient.close();
    }
  }
  return res.status(403).json({ error: 'serverHash Key is not matching' })
});

app.use(
  '/',
  createProxyMiddleware({
    target: 'http://localhost:3500',
    changeOrigin: true,
    ws: true,
    logLevel: 'debug',
  })
);

cron_Schedule('*/5 * * * *', async () => {
  try {
    await mongoDBClient.connect();
    const Servers = mongoDBClient.db('Servers');
    const Active = Servers.collection('Active');
    const activeServersList = await Active.find().toArray();
    for (const server in activeServersList) {
      const created_at = activeServersList[server]?.created_at
      const EXPIRY = activeServersList[server]?.expiry
      const expiryTime = new Date(created_at.getTime() + (EXPIRY * (60 * 60) * 1000));
      if (expiryTime < new Date()) {
        await deleteServer(process.env.PTERODACTYL_HOST_URL, activeServersList[server]?.id, process.env.PTERODACTYL_API_KEY)
        await Active.deleteOne({ _id: activeServersList[server]?._id })
      }
    }
  } finally {
    await mongoDBClient.close();
  }
  console.log("DONE: Period check for deleting Expired Servers")
})

app.listen(process.env.PORT, () => {
  console.log(`  ➜  Node:   http://localhost:${process.env.PORT}`);
});
