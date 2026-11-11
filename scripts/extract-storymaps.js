#!/usr/bin/env node
/**
 * One-shot extractor: ArcGIS StoryMaps → videos.json
 * Usage: node extract-storymaps.js
 * Optional: STORY_TOKEN=... node extract-storymaps.js  (if items become private)
 */

const fs = require("fs");
const path = require("path");

const PORTAL = "https://geoportal.strategizeit.us/arcgis";
const STORY_IDS = [
  "bb05b26addb6450e81d6f28a27b2083b",
  "cdad0a1cdcc54372b7b2b18c7d1513d0",
  "dee85ed1477c49f9a2dcbcd1d3ae4a53",
];

const GOVERNORATES = [
  "محافظة القاهرة",
  "محافظة الجيزة",
  "محافظة القليوبية",
  "محافظة الإسكندرية",
  "محافظة البحيرة",
  "محافظة مطروح",
  "محافظة الدقهلية",
  "محافظة كفر الشيخ",
  "محافظة الغربية",
  "محافظة المنوفية",
  "محافظة دمياط",
  "محافظة بورسعيد",
  "محافظة الإسماعيلية",
  "محافظة السويس",
  "محافظة الشرقية",
  "محافظة شمال سيناء",
  "محافظة جنوب سيناء",
  "محافظة بني سويف",
  "محافظة المنيا",
  "محافظة الفيوم",
  "محافظة أسيوط",
  "محافظة الوادي الجديد",
  "محافظة سوهاج",
  "محافظة قنا",
  "محافظة الأقصر",
  "محافظة أسوان",
  "محافظة البحر الأحمر",
];

const UNSPECIFIED = "غير محدد";
const TOKEN = process.env.STORY_TOKEN || "";

function withToken(url) {
  if (!TOKEN) return url;
  const sep = url.includes("?") ? "&" : "?";
  return `${url}${sep}token=${encodeURIComponent(TOKEN)}`;
}

async function fetchJson(url) {
  const res = await fetch(withToken(url));
  if (!res.ok) {
    throw new Error(`HTTP ${res.status} for ${url}`);
  }
  const data = await res.json();
  if (data.error) {
    throw new Error(
      `Portal error ${data.error.code}: ${data.error.message}. ` +
        (data.error.code === 403 || data.error.code === 498
          ? "Items may be private — set STORY_TOKEN env var (portal sharing token)."
          : "")
    );
  }
  return data;
}

function collectText(nodes) {
  const chunks = [];
  for (const node of Object.values(nodes || {})) {
    if (!node || !node.data) continue;
    if (typeof node.data.text === "string" && node.data.text.trim()) {
      chunks.push(node.data.text);
    }
    if (typeof node.data.title === "string" && node.data.title.trim()) {
      chunks.push(node.data.title);
    }
    if (typeof node.data.summary === "string" && node.data.summary.trim()) {
      chunks.push(node.data.summary);
    }
    if (typeof node.data.caption === "string" && node.data.caption.trim()) {
      chunks.push(node.data.caption);
    }
    if (typeof node.data.content === "string" && node.data.content.trim()) {
      chunks.push(node.data.content);
    }
  }
  return chunks.join("\n");
}

function detectGovernorate(text) {
  for (const gov of GOVERNORATES) {
    if (text.includes(gov)) return gov;
  }
  // Match short city name without "محافظة" prefix (e.g. القاهرة)
  for (const gov of GOVERNORATES) {
    const short = gov.replace(/^محافظة\s+/, "");
    if (short && text.includes(short)) return gov;
  }
  return UNSPECIFIED;
}

function findGoogleMapsUrl(text) {
  const re =
    /https?:\/\/(?:www\.)?(?:maps\.google\.[^\s"'<>]+|google\.[^\s"'<>]*\/maps[^\s"'<>]*|goo\.gl\/maps[^\s"'<>]*|maps\.app\.goo\.gl[^\s"'<>]*)/gi;
  const match = text.match(re);
  return match ? match[0] : null;
}

/** Convert Web Mercator (EPSG:3857 / 102100) meters → WGS84 lat/lng */
function webMercatorToWgs84(x, y) {
  const R = 6378137;
  const lon = (x / R) * (180 / Math.PI);
  const lat =
    (Math.PI / 2 - 2 * Math.atan(Math.exp(-y / R))) * (180 / Math.PI);
  return { lat, lon };
}

function isWebMercator(sr) {
  if (!sr) return false;
  const wkid = sr.latestWkid || sr.wkid;
  return wkid === 3857 || wkid === 102100;
}

/**
 * Build a Google Maps URL from the story's embedded webmap center/extent.
 * Prefers node.data.center; falls back to extent midpoint.
 */
function mapUrlFromWebmap(nodes) {
  for (const node of Object.values(nodes || {})) {
    if (node.type !== "webmap" || !node.data) continue;
    const { center, extent, zoom } = node.data;
    let x;
    let y;
    let sr;

    if (center && typeof center.x === "number" && typeof center.y === "number") {
      x = center.x;
      y = center.y;
      sr = center.spatialReference;
    } else if (
      extent &&
      typeof extent.xmin === "number" &&
      typeof extent.xmax === "number"
    ) {
      x = (extent.xmin + extent.xmax) / 2;
      y = (extent.ymin + extent.ymax) / 2;
      sr = extent.spatialReference;
    } else {
      continue;
    }

    let lat;
    let lon;
    if (isWebMercator(sr)) {
      ({ lat, lon } = webMercatorToWgs84(x, y));
    } else if (
      sr &&
      (sr.wkid === 4326 || sr.latestWkid === 4326)
    ) {
      // Already geographic: ArcGIS often stores lon as x, lat as y
      lon = x;
      lat = y;
    } else if (Math.abs(x) <= 180 && Math.abs(y) <= 90) {
      lon = x;
      lat = y;
    } else if (Math.abs(x) > 180) {
      // Heuristic: large meter values → Web Mercator
      ({ lat, lon } = webMercatorToWgs84(x, y));
    } else {
      continue;
    }

    if (!Number.isFinite(lat) || !Number.isFinite(lon)) continue;
    if (lat < -90 || lat > 90 || lon < -180 || lon > 180) continue;

    const z =
      typeof zoom === "number" && Number.isFinite(zoom)
        ? Math.max(1, Math.min(21, Math.round(zoom)))
        : 18;
    return `https://www.google.com/maps?q=${lat.toFixed(6)},${lon.toFixed(6)}&z=${z}`;
  }
  return null;
}

function resolveMapUrl(nodes, text) {
  return findGoogleMapsUrl(text) || mapUrlFromWebmap(nodes) || UNSPECIFIED;
}

function findDate(text) {
  const iso = text.match(/\b(20\d{2}-\d{2}-\d{2})\b/);
  if (iso) return iso[1];
  const ar = text.match(
    /(?:تاريخ(?:\s+التصوير)?[:：]?\s*)(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/
  );
  if (ar) return ar[1];
  return UNSPECIFIED;
}

function getCoverTitle(nodes) {
  for (const node of Object.values(nodes || {})) {
    if (node.type === "storycover" && node.data && node.data.title) {
      return String(node.data.title).trim();
    }
  }
  return "";
}

function nearestHeading(nodes, videoNodeId) {
  // Prefer cover title; else first non-empty h2/h3/h4 text
  const cover = getCoverTitle(nodes);
  if (cover) return cover;

  for (const [id, node] of Object.entries(nodes || {})) {
    if (id === videoNodeId) continue;
    if (
      node.type === "text" &&
      node.data &&
      ["h2", "h3", "h4", "h1"].includes(node.data.type) &&
      node.data.text &&
      node.data.text.trim()
    ) {
      return node.data.text.trim();
    }
  }
  return UNSPECIFIED;
}

function classifyExternalUrl(url) {
  const u = url.toLowerCase();
  if (u.includes("youtube.com") || u.includes("youtu.be")) return "youtube";
  if (u.includes("vimeo.com")) return "vimeo";
  if (u.includes(".m3u8")) return "hls";
  if (u.match(/\.(mp4|webm|ogg)(\?|$)/)) return "mp4";
  return "iframe";
}

function youtubeEmbed(url) {
  try {
    const u = new URL(url);
    let id = u.searchParams.get("v");
    if (!id && u.hostname.includes("youtu.be")) {
      id = u.pathname.replace(/^\//, "");
    }
    if (!id && u.pathname.includes("/embed/")) {
      id = u.pathname.split("/embed/")[1];
    }
    return id ? `https://www.youtube.com/embed/${id}` : url;
  } catch {
    return url;
  }
}

function vimeoEmbed(url) {
  const m = url.match(/vimeo\.com\/(?:video\/)?(\d+)/);
  return m ? `https://player.vimeo.com/video/${m[1]}` : url;
}

function resourceUrl(storyId, resourceName) {
  return `${PORTAL}/sharing/rest/content/items/${storyId}/resources/${resourceName}`;
}

function extractVideosFromStory(storyId, item, data) {
  const nodes = data.nodes || {};
  const resources = data.resources || {};
  const allText = collectText(nodes);
  const governorate = detectGovernorate(allText);
  const date = findDate(allText);
  const mapUrl = resolveMapUrl(nodes, allText);
  const baseStoryUrl =
    item.url || `${PORTAL}/apps/storymaps/stories/${storyId}`;
  const storyUrl = baseStoryUrl.includes("locale=")
    ? baseStoryUrl
    : `${baseStoryUrl}${baseStoryUrl.includes("?") ? "&" : "?"}locale=ar`;
  const defaultName =
    getCoverTitle(nodes) ||
    (item.title && String(item.title).trim()) ||
    UNSPECIFIED;

  const videos = [];
  const failures = [];

  for (const [nodeId, node] of Object.entries(nodes)) {
    if (node.type === "video") {
      const videoRef = node.data && node.data.video;
      const caption =
        (node.data && node.data.caption) ||
        nearestHeading(nodes, nodeId) ||
        defaultName;
      const name = (caption && String(caption).trim()) || defaultName;

      if (!videoRef || !resources[videoRef]) {
        failures.push({
          storyId,
          nodeId,
          reason: "video node missing resource reference",
        });
        continue;
      }

      const res = resources[videoRef];
      const resData = res.data || {};

      if (resData.provider === "item-resource" && resData.resourceId) {
        const videoUrl = resourceUrl(storyId, resData.resourceId);
        const lower = resData.resourceId.toLowerCase();
        let videoType = "mp4";
        if (lower.endsWith(".m3u8")) videoType = "hls";
        else if (lower.match(/\.(webm|ogg)$/)) videoType = "mp4";

        videos.push({
          id: `${storyId}-${nodeId}`,
          storyId,
          name,
          governorate,
          date,
          mapUrl,
          videoUrl,
          videoType,
          storyUrl,
        });
      } else if (resData.url) {
        const videoType = classifyExternalUrl(resData.url);
        let videoUrl = resData.url;
        if (videoType === "youtube") videoUrl = youtubeEmbed(resData.url);
        if (videoType === "vimeo") videoUrl = vimeoEmbed(resData.url);
        videos.push({
          id: `${storyId}-${nodeId}`,
          storyId,
          name,
          governorate,
          date,
          mapUrl,
          videoUrl,
          videoType,
          storyUrl,
        });
      } else {
        failures.push({
          storyId,
          nodeId,
          reason: "unresolved video resource (no resourceId or url)",
        });
      }
    }

    // embed / webpage nodes pointing at video hosts
    if (node.type === "embed" || node.type === "webpage") {
      const url =
        (node.data && (node.data.url || node.data.src || node.data.link)) || "";
      if (!url) continue;
      const videoType = classifyExternalUrl(url);
      if (
        videoType === "youtube" ||
        videoType === "vimeo" ||
        videoType === "mp4" ||
        videoType === "hls"
      ) {
        let videoUrl = url;
        if (videoType === "youtube") videoUrl = youtubeEmbed(url);
        if (videoType === "vimeo") videoUrl = vimeoEmbed(url);
        const name =
          (node.data && node.data.caption) ||
          nearestHeading(nodes, nodeId) ||
          defaultName;
        videos.push({
          id: `${storyId}-${nodeId}`,
          storyId,
          name: String(name).trim() || defaultName,
          governorate,
          date,
          mapUrl,
          videoUrl,
          videoType,
          storyUrl,
        });
      }
    }
  }

  if (videos.length === 0) {
    failures.push({
      storyId,
      reason: "no video/embed nodes found in story JSON",
    });
  }

  return { videos, failures };
}

async function main() {
  const allVideos = [];
  const allFailures = [];

  for (const storyId of STORY_IDS) {
    process.stdout.write(`Fetching story ${storyId}...\n`);
    const itemUrl = `${PORTAL}/sharing/rest/content/items/${storyId}?f=json`;
    const dataUrl = `${PORTAL}/sharing/rest/content/items/${storyId}/data?f=json`;
    const [item, data] = await Promise.all([
      fetchJson(itemUrl),
      fetchJson(dataUrl),
    ]);
    const { videos, failures } = extractVideosFromStory(storyId, item, data);
    allVideos.push(...videos);
    allFailures.push(...failures);
    process.stdout.write(`  → ${videos.length} video(s)\n`);
  }

  const outPath = path.join(__dirname, "..", "public", "videos.json");
  fs.writeFileSync(outPath, JSON.stringify(allVideos, null, 2), "utf8");
  process.stdout.write(`\nWrote ${allVideos.length} records to ${outPath}\n`);

  if (allFailures.length) {
    process.stdout.write("\nCould not extract:\n");
    for (const f of allFailures) {
      process.stdout.write(`  - ${JSON.stringify(f)}\n`);
    }
  } else {
    process.stdout.write("All videos extracted successfully.\n");
  }
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
