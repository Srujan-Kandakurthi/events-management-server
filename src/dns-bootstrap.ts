import * as dns from 'dns';

/**
 * When Node's resolver list is loopback-only (common on Windows), SRV lookups for
 * mongodb+srv often fail with querySrv ECONNREFUSED. Prefer DNS_SERVERS from env,
 * otherwise fall back to public resolvers only in that situation.
 */
const fromEnv = process.env.DNS_SERVERS?.split(',')
  .map((s) => s.trim())
  .filter(Boolean);
if (fromEnv?.length) {
  dns.setServers(fromEnv);
} else {
  const current = dns.getServers();
  // On Windows, the DNS server is often a local router IP (e.g. 192.168.1.1) rather than loopback,
  // which can still fail to resolve SRV records for MongoDB.
  // We unconditionally fallback to public resolvers here if DNS_SERVERS is not provided.
  dns.setServers(['8.8.8.8', '1.1.1.1']);
}
