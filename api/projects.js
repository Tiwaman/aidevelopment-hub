const APEX = "aidevelopment.in";
const API = "https://api.vercel.com";
const SUB_RE = /^([a-z0-9](?:[a-z0-9-]*[a-z0-9])?)\.aidevelopment\.in$/;

let overrides = {};
try {
  overrides = require("../projects.json").overrides || {};
} catch (e) {
  overrides = {};
}

function vercelGet(path, params, token) {
  const url = new URL(API + path);
  Object.keys(params).forEach((k) => {
    if (params[k] !== undefined && params[k] !== "") url.searchParams.set(k, params[k]);
  });
  return fetch(url, {
    headers: { Authorization: "Bearer " + token },
    signal: AbortSignal.timeout(8000),
  }).then((res) => {
    if (!res.ok) throw new Error("Vercel API responded " + res.status);
    return res.json();
  });
}

async function listProjects(token, teamId) {
  const all = [];
  let until;
  for (let page = 0; page < 20; page++) {
    const data = await vercelGet("/v9/projects", { limit: 100, teamId, until }, token);
    all.push(...(data.projects || []));
    const next = data.pagination && data.pagination.next;
    if (next === undefined || next === null) break;
    until = next;
  }
  return all;
}

function hostnamesFrom(project) {
  const out = [];
  const add = (v) => {
    const name = typeof v === "string" ? v : v && (v.domain || v.name);
    if (name) out.push(String(name).toLowerCase());
  };
  const prod = project.targets && project.targets.production;
  if (prod && Array.isArray(prod.alias)) prod.alias.forEach(add);
  if (Array.isArray(project.alias)) project.alias.forEach(add);
  return out;
}

async function domainsFallback(project, token, teamId) {
  const data = await vercelGet(
    "/v9/projects/" + encodeURIComponent(project.id) + "/domains",
    { teamId, limit: 100 },
    token
  );
  return (data.domains || []).filter((d) => !d.redirect).map((d) => String(d.name).toLowerCase());
}

async function buildProjects(token, teamId, hidden) {
  const projects = await listProjects(token, teamId);
  const hostsByProject = new Map();
  for (const p of projects) hostsByProject.set(p.id, hostnamesFrom(p));

  const needFallback = projects.filter(
    (p) => !hostsByProject.get(p.id).some((h) => !h.endsWith(".vercel.app"))
  );
  for (let i = 0; i < needFallback.length; i += 10) {
    await Promise.all(
      needFallback.slice(i, i + 10).map(async (p) => {
        try {
          hostsByProject.set(p.id, await domainsFallback(p, token, teamId));
        } catch (e) {
          // a single project failing its domain lookup should not sink the list
        }
      })
    );
  }

  const cards = [];
  for (const p of projects) {
    const hosts = hostsByProject.get(p.id);
    if (hosts.includes(APEX) || hosts.includes("www." + APEX)) continue;
    const host = hosts.find((h) => SUB_RE.test(h) && h !== "www." + APEX);
    if (!host) continue;
    const slug = host.match(SUB_RE)[1];
    if (slug === "www" || (hidden[slug] && hidden[slug].hidden)) continue;
    cards.push({
      slug,
      name: p.name,
      url: "https://" + host,
      description: p.description || "",
      createdAt: p.createdAt || 0,
    });
  }
  cards.sort((a, b) => a.createdAt - b.createdAt);
  return cards;
}

async function handler(req, res) {
  const token = process.env.VERCEL_TOKEN;
  if (!token) {
    res.status(502).json({ error: "Project discovery is not configured" });
    return;
  }
  try {
    const projects = await buildProjects(token, process.env.VERCEL_TEAM_ID, overrides);
    res.setHeader("Cache-Control", "s-maxage=300, stale-while-revalidate=3600");
    res.status(200).json({ projects });
  } catch (e) {
    res.status(502).json({ error: "Could not load projects from Vercel" });
  }
}

module.exports = handler;
module.exports.buildProjects = buildProjects;
