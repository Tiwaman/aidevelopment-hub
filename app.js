(function () {
  var NUMBER_WORDS = [
    "Zero", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten",
    "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen",
    "Eighteen", "Nineteen", "Twenty",
  ];
  var UNCATEGORIZED = "Uncategorized";
  var LINK_TYPES = [
    { id: "sub", label: "aidevelopment.in subdomain" },
    { id: "custom", label: "Custom domain" },
    { id: "vercel", label: "vercel.app" },
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

  function hostOf(url) {
    var m = /^https?:\/\/([^\/?#]+)/i.exec(url || "");
    return m ? m[1].toLowerCase() : "";
  }

  function linkType(url) {
    var host = hostOf(url);
    if (/(^|\.)aidevelopment\.in$/.test(host)) return "sub";
    if (/\.vercel\.app$/.test(host)) return "vercel";
    return "custom";
  }

  function buildCard(p, o) {
    o = o || {};
    var name;
    if (o.title !== undefined || o.italic !== undefined) {
      name = ((o.title || "") + " " + (o.italic || "")).trim();
    } else {
      name = prettify(p.name || p.slug);
    }
    return {
      slug: p.slug,
      url: p.url,
      host: hostOf(p.url),
      linkType: linkType(p.url),
      name: name,
      tagline: o.tagline || "",
      description: o.description || p.description || "A new piece, fresh out of the workshop.",
      status: o.status || "",
      cta: o.cta || "Open it",
      category: (o.category && String(o.category).trim()) || UNCATEGORIZED,
      tags: Array.isArray(o.tags) ? o.tags : [],
      order: typeof o.order === "number" ? o.order : Infinity,
      createdAt: p.createdAt || 0,
    };
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
    return cards;
  }

  function searchHay(c) {
    return [c.name, c.slug, c.tagline, c.description, c.category, c.tags.join(" "), c.host]
      .join(" ")
      .toLowerCase();
  }

  function matches(c, hay, state) {
    if (state.cat && c.category !== state.cat) return false;
    if (state.link && c.linkType !== state.link) return false;
    var terms = String(state.q || "").toLowerCase().split(/\s+/).filter(Boolean);
    for (var i = 0; i < terms.length; i++) {
      if (hay.indexOf(terms[i]) === -1) return false;
    }
    return true;
  }

  function categoryList(cards) {
    var counts = {};
    cards.forEach(function (c) {
      counts[c.category] = (counts[c.category] || 0) + 1;
    });
    return Object.keys(counts)
      .sort(function (a, b) {
        if (a === UNCATEGORIZED) return 1;
        if (b === UNCATEGORIZED) return -1;
        return a.localeCompare(b);
      })
      .map(function (name) {
        return { name: name, count: counts[name] };
      });
  }

  function parseQuery(search) {
    var out = { q: "", cat: "", link: "" };
    String(search || "").replace(/^\?/, "").split("&").forEach(function (pair) {
      if (!pair) return;
      var i = pair.indexOf("=");
      var k = i < 0 ? pair : pair.slice(0, i);
      var v = i < 0 ? "" : pair.slice(i + 1);
      try {
        v = decodeURIComponent(v.replace(/\+/g, " "));
      } catch (e) {
        return;
      }
      if (k === "q") out.q = v;
      else if (k === "cat") out.cat = v;
      else if (k === "link" && v !== "all") out.link = v;
    });
    if (!LINK_TYPES.some(function (t) { return t.id === out.link; })) out.link = "";
    return out;
  }

  function serializeQuery(state) {
    var parts = [];
    if (state.q) parts.push("q=" + encodeURIComponent(state.q));
    if (state.cat) parts.push("cat=" + encodeURIComponent(state.cat));
    if (state.link) parts.push("link=" + encodeURIComponent(state.link));
    return parts.length ? "?" + parts.join("&") : "";
  }

  function rowHtml(c) {
    return (
      '<li class="row">' +
      '<span class="row-name"><a class="row-link" href="' + esc(c.url) + '">' +
      '<span class="row-title">' + esc(c.name) + "</span></a></span>" +
      '<span class="row-desc" title="' + esc(c.description) + '">' + esc(c.description) + "</span>" +
      '<span class="row-cat">' + esc(c.category) + "</span>" +
      '<a class="row-host" href="' + esc(c.url) + '" aria-label="' + esc(c.cta + ": " + c.host) + '">' +
      "<span>" + esc(c.host) + '</span><span class="arrow" aria-hidden="true">↗</span></a>' +
      "</li>"
    );
  }

  function countText(n) {
    var word = n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n);
    return word + (n === 1 ? " experiment" : " experiments");
  }

  function getJson(url) {
    return fetch(url).then(function (r) {
      if (!r.ok) throw new Error(url + " " + r.status);
      return r.json();
    });
  }

  function mount(cards) {
    var $ = function (id) {
      return document.getElementById(id);
    };
    var rows = $("rows");
    var q = $("q");
    var catSel = $("cat");
    var linkSel = $("link");
    var sortSel = $("sort");
    var clear = $("clear");
    var countEl = $("result-count");
    var empty = $("empty");

    rows.innerHTML = cards.map(rowHtml).join("");
    var entries = [];
    var els = rows.children;
    cards.forEach(function (c, i) {
      entries.push({ card: c, el: els[i], hay: searchHay(c), i: i });
    });

    var cats = categoryList(cards);
    catSel.innerHTML =
      '<option value="">All categories (' + cards.length + ")</option>" +
      cats.map(function (c) {
        return '<option value="' + esc(c.name) + '">' + esc(c.name) + " (" + c.count + ")</option>";
      }).join("");
    linkSel.innerHTML =
      '<option value="">All links</option>' +
      LINK_TYPES.map(function (t) {
        var n = cards.filter(function (c) {
          return c.linkType === t.id;
        }).length;
        return '<option value="' + t.id + '">' + esc(t.label) + " (" + n + ")</option>";
      }).join("");

    var state = parseQuery(location.search);
    if (!cats.some(function (c) { return c.name === state.cat; })) state.cat = "";
    q.value = state.q;
    catSel.value = state.cat;
    linkSel.value = state.link;

    function apply(writeUrl) {
      var shown = 0;
      entries.forEach(function (e) {
        var ok = matches(e.card, e.hay, state);
        e.el.hidden = !ok;
        if (ok) shown++;
      });
      countEl.textContent = shown + " of " + cards.length;
      empty.hidden = shown !== 0;
      clear.hidden = !(state.q || state.cat || state.link);
      if (writeUrl && window.history && history.replaceState) {
        history.replaceState(null, "", location.pathname + serializeQuery(state) + location.hash);
      }
    }

    function sortRows() {
      var key = sortSel.value;
      var list = entries.slice().sort(function (a, b) {
        if (key === "name") return a.card.name.localeCompare(b.card.name) || a.i - b.i;
        if (key === "newest") return b.card.createdAt - a.card.createdAt || a.i - b.i;
        return a.i - b.i;
      });
      var frag = document.createDocumentFragment();
      list.forEach(function (e) {
        frag.appendChild(e.el);
      });
      rows.appendChild(frag);
    }

    q.addEventListener("input", function () {
      state.q = q.value;
      apply(true);
    });
    catSel.addEventListener("change", function () {
      state.cat = catSel.value;
      apply(true);
    });
    linkSel.addEventListener("change", function () {
      state.link = linkSel.value;
      apply(true);
    });
    sortSel.addEventListener("change", sortRows);
    clear.addEventListener("click", function () {
      state = { q: "", cat: "", link: "" };
      q.value = "";
      catSel.value = "";
      linkSel.value = "";
      apply(true);
      q.focus();
    });
    document.addEventListener("keydown", function (ev) {
      var t = ev.target;
      var typing = t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (ev.key === "/" && !typing && !ev.metaKey && !ev.ctrlKey && !ev.altKey) {
        ev.preventDefault();
        q.focus();
        q.select();
      } else if (ev.key === "Escape" && t === q) {
        if (q.value) {
          q.value = "";
          state.q = "";
          apply(true);
        } else q.blur();
      }
    });

    $("toolbar").hidden = false;
    $("status").hidden = false;
    apply(false);
  }

  function init() {
    if (!document.getElementById("rows")) return;
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
        mount(cards);
        var count = document.getElementById("hero-count");
        if (count) count.textContent = countText(cards.length);
      })
      .catch(function () {});
  }

  var api = {
    prettify: prettify,
    hostOf: hostOf,
    linkType: linkType,
    mergeProjects: mergeProjects,
    searchHay: searchHay,
    matches: matches,
    categoryList: categoryList,
    parseQuery: parseQuery,
    serializeQuery: serializeQuery,
    rowHtml: rowHtml,
    countText: countText,
  };

  if (typeof module !== "undefined" && module.exports) module.exports = api;
  if (typeof document !== "undefined") init();
})();
