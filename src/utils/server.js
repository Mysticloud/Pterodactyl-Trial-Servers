import { getAllocationPort } from "./allocations.js"

// Devley
// Developed by Yuvaraja

export async function createServer(hostUrl, server_data, token) {
  const HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'}
  HEADERS['Authorization'] = `Bearer ${token}`
  const allocationPort = await getAllocationPort(hostUrl, server_data.node, token)
  try {
    if (!('name' in server_data)) {
      server_data['name'] = `Trial Server - ${Math.round(Math.random() * 10000)}`
    }
    const response = await fetch(`${hostUrl}/api/application/servers`, { 
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        ...server_data,
        allocation: {
          default: allocationPort.id
        },
        "start_on_completion": true
      })
    })
    const response_data = await response.json()
    if (response.status > 300) {
      console.error(`SERVER CREATE EGG[${server_data?.egg}]: ERROR =>`, response_data)      
    }
    return response_data
  } catch (e) {
    console.error(`SERVER CREATE EGG[${server_data?.egg}]: ERROR =>`, e)
    return Object({})
  }
}

export async function getServer(hostUrl, server_id, token) {
  const HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'}
  HEADERS['Authorization'] = `Bearer ${token}`
  try {
    const response = await fetch(`${hostUrl}/api/client/servers/${server_id}`, { 
      method: 'GET',
      headers: HEADERS,
    })
    const response_data = await response.json()
    if (response.status > 300) {
      console.error(`SERVER GET: ERROR [${server_id}] =>`, response_data)      
    }
    return response_data
  } catch (e) {
    console.error(`SERVER GET: ERROR [${server_id}] =>`, e)
    return Object({})
  }
}

export async function deleteServer(hostUrl, server_id, token) {
  const HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'}
  HEADERS['Authorization'] = `Bearer ${token}`
  try {
    const response = await fetch(`${hostUrl}/api/application/servers/${server_id}/force`, { 
      method: 'DELETE',
      headers: HEADERS,
    })
    if (response.status > 300) {
      console.error(`SERVER DELETE: ERROR [${server_id}] =>`, response_data)      
    }
    return response.status
  } catch (e) {
    console.error(`SERVER DELETE: ERROR [${server_id}] =>`, e)
    return 500
  }
}

export async function getWebsocket(hostUrl, server_id, token) {
  const HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'}
  HEADERS['Authorization'] = `Bearer ${token}`
  try {
    const response = await fetch(`${hostUrl}/api/client/servers/${server_id}/websocket`, { 
      method: 'GET',
      headers: HEADERS,
    })
    const response_data = await response.json()
    if (response.status > 300) {
      console.error(`SERVER CONSOLE: ERROR [${server_id}] =>`, response_data)      
    }
    return response_data
  } catch (e) {
    console.error(`SERVER CONSOLE: ERROR [${server_id}] =>`, e)
    return Object({})
  }
}

export async function compressAllDownload(hostUrl, server_id, token) {
  const HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'}
  HEADERS['Authorization'] = `Bearer ${token}`
  try {
    const filesResponse = await fetch(`${hostUrl}/api/client/servers/${server_id}/files/list`, {
      method: 'GET',
      headers: HEADERS,
    })
    const files_data = await filesResponse.json()
    const files_list = files_data?.data?.map(file => file?.attributes?.name).filter(name => (!(name.startsWith('archive-') && name.endsWith('.tar.gz'))))
    const filesCompressResponse = await fetch(`${hostUrl}/api/client/servers/${server_id}/files/compress`, {
      method: 'POST',
      headers: HEADERS,
      body: JSON.stringify({
        root: '/',
        files: files_list
      })
    })
    const compressedFile = await filesCompressResponse.json()
    const downloadCompressFileResponse = await fetch(`${hostUrl}/api/client/servers/${server_id}/files/download?file=/${encodeURIComponent(compressedFile?.attributes?.name)}`, {
      method: 'GET',
      headers: HEADERS,
    })
    const compressedFileUrl = await downloadCompressFileResponse.json()
    return {...compressedFileUrl?.attributes, file_name: compressedFile?.attributes?.name}
  } catch (e) {
    console.error(`SERVER DOWNLOAD: ERROR [${server_id}] =>`, e)
    return Object({})
  }
}