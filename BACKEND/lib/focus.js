// lib/focus.js
const fetch = require('node-fetch');

const ENV = (process.env.FOCUSNFE_ENV || 'hml').toLowerCase();
const BASES = {
  hml: 'https://homologacao.focusnfe.com.br',
  prod: 'https://api.focusnfe.com.br',
};
const TOKENS = {
  hml: process.env.FOCUSNFE_TOKEN_HML,
  prod: process.env.FOCUSNFE_TOKEN_PROD,
};

function assertProdGuard() {
  if (ENV === 'prod' && String(process.env.FOCUSNFE_ALLOW_PROD) !== 'true') {
    throw new Error('Produção bloqueada. Defina FOCUSNFE_ALLOW_PROD=true para habilitar.');
  }
}

function auth() {
  const token = TOKENS[ENV];
  if (!token) throw new Error(`Token ausente para ${ENV}`);
  const b64 = Buffer.from(`${token}:`).toString('base64');
  return { Authorization: `Basic ${b64}` };
}

function base() { return BASES[ENV]; }

async function safe(r) { try { return await r.json(); } catch { return { raw: await r.text() }; } }

async function nfseEnviar(ref, body) {
  if (ENV === 'prod') assertProdGuard();
  const r = await fetch(`${base()}/v2/nfse?ref=${encodeURIComponent(ref)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify(body),
  });
  return { status: r.status, data: await safe(r) };
}

async function nfseConsultar(ref, completa=false) {
  const r = await fetch(`${base()}/v2/nfse/${encodeURIComponent(ref)}?completa=${completa?1:0}`, {
    headers: { ...auth() },
  });
  return { status: r.status, data: await safe(r) };
}

async function nfseCancelar(ref, justificativa) {
  if (ENV === 'prod') assertProdGuard();
  const r = await fetch(`${base()}/v2/nfse/${encodeURIComponent(ref)}`, {
    method: 'DELETE',
    headers: { 'Content-Type': 'application/json', ...auth() },
    body: JSON.stringify({ justificativa }),
  });
  return { status: r.status, data: await safe(r) };
}

// Healthcheck não destrutivo: espera 404 com autenticação válida
async function nfseHealthcheck() {
  const r = await fetch(`${base()}/v2/nfse/__ping_inexistente__`, { headers: { ...auth() } });
  return r.status; // 404 esperado. 401/403 indica token inválido/ambiente errado.
}

module.exports = { nfseEnviar, nfseConsultar, nfseCancelar, nfseHealthcheck };
