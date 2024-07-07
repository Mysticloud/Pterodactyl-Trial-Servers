// Devley
// Developed by Yuvaraja

export async function getAllocationPort(hostUrl, node, token) {
  const HEADERS = {'Accept': 'application/json', 'Content-Type': 'application/json'}
  HEADERS['Authorization'] = `Bearer ${token}`
  var allocation_list = []
  try {
    const response = await fetch(`${hostUrl}/api/application/nodes/${node}/allocations`, { method: 'GET', headers: HEADERS })
    const response_data = await response.json()
    for (const attr in response_data?.data) {
      if (!(response_data?.data[attr]?.attributes?.assigned)) {
        allocation_list.push(response_data?.data[attr].attributes)
      }
    }
  } catch {
    allocation_list = []
  }
  return allocation_list[0] || Object({})
}