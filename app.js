(function (root) {
  var NUMBER_WORDS = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen", "Twenty",
  ];

  function esc(s) {
    return String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function prettify(name) {
    return String(name || "")
      .replace(/[-_]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b[a-z]/g, function (c) {
        return c.toUpperCase();
      });
  }

  function hashString(s) {
    var h = 2166136261;
    for (var i = 0; i < s.length; i++) {
      h ^= s.charCodeAt(i);
      h = Math.imul(h, 16777619) >>> 0;
    }
    return h >>> 0;
  }

  function hslToRgb(h, s, l) {
    var c = (1 - Math.abs(2 * l - 1)) * s;
    var x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    var m = l - c / 2;
    var r = 0, g = 0, b = 0;
    if (h < 60) { r = c; g = x; }
    else if (h < 120) { r = x; g = c; }
    else if (h < 180) { g = c; b = x; }
    else if (h < 240) { g = x; b = c; }
    else if (h < 300) { r = x; b = c; }
    else { r = c; b = x; }
    return [r + m, g + m, b + m].map(function (v) {
      return Math.round(v * 255);
    });
  }

  function toHex(rgb) {
    return "#" + rgb.map(function (v) {
      return ("0" + v.toString(16)).slice(-2);
    }).join("");
  }

  function luminance(rgb) {
    var c = rgb.map(function (v) {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  }

  var DARK_FG = { hex: "#161413", lum: luminance([22, 20, 19]) };
  var LIGHT_FG = { hex: "#f8f1e3", lum: luminance([248, 241, 227]) };

  function skinFor(slug) {
    var h = hashString(slug);
    var hue = h % 360;
    var sat = 0.55 + ((h >>> 9) % 25) / 100;
    var light = 0.38 + ((h >>> 17) % 24) / 100;
    var rgb, darkContrast, lightContrast, useDark;
    for (var i = 0; i < 20; i++) {
      rgb = hslToRgb(hue, sat, light);
      var bgLum = luminance(rgb);
      darkContrast = (bgLum + 0.05) / (DARK_FG.lum + 0.05);
      lightContrast = (LIGHT_FG.lum + 0.05) / (bgLum + 0.05);
      useDark = darkContrast >= lightContrast;
      if (Math.max(darkContrast, lightContrast) >= 4.5) break;
      light += useDark ? 0.02 : -0.02;
    }
    return { bg: toHex(rgb), fg: useDark ? DARK_FG.hex : LIGHT_FG.hex };
  }

  function buildCard(p, o) {
    o = o || {};
    var title = o.title;
    var italic = o.italic;
    if (title === undefined && italic === undefined) {
      var words = prettify(p.name || p.slug).split(" ");
      italic = words.pop();
      title = words.join(" ");
    }
    var card = {
      slug: p.slug,
      url: p.url,
      title: title || "",
      italic: italic || "",
      tagline: o.tagline || "New in the workshop",
      description: o.description || p.description || "A new piece, fresh out of the workshop.",
      status: o.status || "new",
      cta: o.cta || "Open it",
      tags: Array.isArray(o.tags) ? o.tags : [],
      large: o.size === "large",
      skin: o.skin || "",
      order: typeof o.order === "number" ? o.order : Infinity,
      createdAt: p.createdAt || 0,
    };
    if (!card.skin) {
      var c = o.color || skinFor(p.slug);
      card.style = "--tile-bg:" + c.bg + ";--tile-fg:" + c.fg;
    }
    return card;
  }

  function mergeProjects(apiProjects, overrides) {
    overrides = overrides || {};
    var cards = [];
    (apiProjects || []).forEach(function (p) {
      var o = overrides[p.slug];
      if (o && o.hidden) return;
      cards.push(buildCard(p, o));
    });
    cards.sort(function (a, b) {
      if (a.order !== b.order) return a.order < b.order ? -1 : 1;
      return a.createdAt - b.createdAt;
    });
    var auto = cards.filter(function (c) {
      return !c.skin && !c.large;
    });
    auto.forEach(function (c) {
      c.span = "tile-w4";
    });
    var rem = auto.length % 3;
    if (rem === 1) auto[auto.length - 1].span = "tile-w8";
    if (rem === 2) {
      auto[auto.length - 1].span = "tile-w6";
      auto[auto.length - 2].span = "tile-w6";
    }
    return cards;
  }

  function cardTitleText(c) {
    return (c.title + " " + c.italic).trim();
  }

  function pad(n) {
    return n < 10 ? "0" + n : String(n);
  }

  function tileHtml(c, i) {
    var cls = ["tile", c.skin || "tile-auto"];
    if (c.large) cls.push("tile-large");
    if (c.span) cls.push(c.span);
    cls.push("lift-in", "delay-" + (2 + (i % 5)));
    var name =
      (c.title ? esc(c.title) + " " : "") +
      (c.italic ? '<span class="italic">' + esc(c.italic) + "</span>" : "");
    var tags = c.tags.length
      ? '<div class="tile-meta">' +
        c.tags.map(function (t) {
          return '<span class="meta-pill">' + esc(t) + "</span>";
        }).join("") +
        "</div>"
      : "";
    return (
      '<a href="' + esc(c.url) + '" class="' + cls.join(" ") + '"' +
      (c.style ? ' style="' + esc(c.style) + '"' : "") + ">" +
      '<div class="tile-corner"><span class="tile-num">№ ' + pad(i + 1) + "</span>" +
      '<span class="tile-status">' + esc(c.status) + "</span></div>" +
      '<div class="tile-bottom">' +
      '<p class="tile-tagline">' + esc(c.tagline) + "</p>" +
      '<h2 class="tile-name">' + name + "</h2>" +
      '<p class="tile-desc">' + esc(c.description) + "</p>" +
      tags +
      '<div class="tile-cta"><span>' + esc(c.cta) + '</span><span class="arrow" aria-hidden="true">↗</span></div>' +
      "</div></a>"
    );
  }

  function countText(n) {
    var word = n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
    return word + (n === 1 ? " experiment" : " experiments");
  }

  function asideHtml(cards) {
    return cards.map(function (c, i) {
      return '<li><span class="aside-num">' + pad(i + 1) + "</span> " + esc(cardTitleText(c)) + "</li>";
    }).join("");
  }

  function getJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function init() {
    var grid = document.querySelector(".grid");
    if (!grid) return;
    Promise.all([
      getJson("/api/projects"),
      getJson("/projects.json").catch(function () {
        return {};
      }),
    ])
      .then(function (res) {
        if (!res[0] || !Array.isArray(res[0].projects)) throw new Error("bad response");
        var cards = mergeProjects(res[0].projects, res[1].overrides);
        if (!cards.length) return;
        grid.innerHTML = cards.map(tileHtml).join("");
        var count = document.getElementById("hero-count");
        if (count) count.textContent = countText(cards.length);
        var list = document.querySelector(".aside-list");
        if (list) list.innerHTML = asideHtml(cards);
      })
      .catch(function () {});
  }

  var api = {
    prettify: prettify,
    skinFor: skinFor,
    mergeProjects: mergeProjects,
    tileHtml: tileHtml,
    countText: countText,
    asideHtml: asideHtml,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") init();
})(this);
