function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`;
}

export function buildMcpCurl(endpoint: string, token: string): string {
  const payload = JSON.stringify({ jsonrpc: '2.0', id: 1, method: 'tools/list', params: {} });
  return `curl --oauth2-bearer ${shellQuote(token)} ${shellQuote(endpoint)} -H 'Content-Type: application/json' -d ${shellQuote(payload)}`;
}
