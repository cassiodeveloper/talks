/* Talks filter — client-side filtering for the talks grid.
   Reads data-* attributes emitted on each .postbox-item card,
   builds the Event / Topic / Year / Language dropdowns from the
   DOM (so new talks populate the filters automatically), and
   shows/hides cards on change. No dependencies. */
(function () {
    "use strict";

    function ready(fn) {
        if (document.readyState !== "loading") { fn(); }
        else { document.addEventListener("DOMContentLoaded", fn); }
    }

    ready(function () {
        var toolbar = document.getElementById("talks-toolbar");
        var grid = document.querySelector(".listrecent");
        if (!toolbar || !grid) { return; }

        var cards = Array.prototype.slice.call(grid.querySelectorAll(".postbox-item"));
        if (!cards.length) { return; }

        var elSearch = document.getElementById("tb-search");
        var elEvent = document.getElementById("tb-event");
        var elTopic = document.getElementById("tb-topic");
        var elYear = document.getElementById("tb-year");
        var elLang = document.getElementById("tb-lang");
        var elCount = document.getElementById("tb-count");
        var elClear = document.getElementById("tb-clear");
        var elEmpty = document.getElementById("talks-empty");

        function attrList(card, name) {
            var v = (card.getAttribute(name) || "").trim();
            return v ? v.split(/\s+/) : [];
        }

        // Titleize a slug for display (fatec -> Fatec, threat-modeling -> Threat Modeling)
        function label(v) {
            return v.replace(/[-_]+/g, " ").replace(/\b\w/g, function (c) { return c.toUpperCase(); });
        }

        // Populate a <select> with sorted unique values, keeping the first (placeholder) option.
        function fill(select, values, opts) {
            opts = opts || {};
            var uniq = {};
            values.forEach(function (v) { if (v) { uniq[v] = (uniq[v] || 0) + 1; } });
            Object.keys(uniq).sort(function (a, b) {
                if (opts.desc) { return b.localeCompare(a, undefined, { numeric: true }); }
                return a.localeCompare(b, undefined, { numeric: true });
            }).forEach(function (v) {
                var o = document.createElement("option");
                o.value = v;
                o.textContent = (opts.label ? opts.label(v) : v) + " (" + uniq[v] + ")";
                select.appendChild(o);
            });
        }

        var allEvents = [], allTopics = [], allYears = [], allLangs = [];
        cards.forEach(function (card) {
            var ev = (card.getAttribute("data-event") || "").trim();
            if (ev) { allEvents.push(ev); }
            allTopics = allTopics.concat(attrList(card, "data-topics"));
            var y = card.getAttribute("data-year"); if (y) { allYears.push(y); }
            var l = card.getAttribute("data-lang"); if (l) { allLangs.push(l); }
        });

        fill(elEvent, allEvents, {});   // event names are already human-readable
        fill(elTopic, allTopics, { label: label });
        fill(elYear, allYears, { desc: true });
        fill(elLang, allLangs, { label: function (v) { return v.toUpperCase(); } });

        function apply() {
            var q = (elSearch.value || "").trim().toLowerCase();
            var ev = elEvent.value, tp = elTopic.value, yr = elYear.value, lg = elLang.value;
            var shown = 0;

            cards.forEach(function (card) {
                var ok = true;
                if (ev && (card.getAttribute("data-event") || "") !== ev) { ok = false; }
                if (ok && tp && attrList(card, "data-topics").indexOf(tp) === -1) { ok = false; }
                if (ok && yr && card.getAttribute("data-year") !== yr) { ok = false; }
                if (ok && lg && card.getAttribute("data-lang") !== lg) { ok = false; }
                if (ok && q && (card.getAttribute("data-search") || "").indexOf(q) === -1) { ok = false; }

                card.classList.toggle("postbox-hidden", !ok);
                if (ok) { shown++; }
            });

            var total = cards.length;
            if (elCount) {
                elCount.innerHTML = shown === total
                    ? "<b>" + total + "</b> talks"
                    : "<b>" + shown + "</b> of " + total + " talks";
            }
            if (elEmpty) { elEmpty.classList.toggle("show", shown === 0); }

            var active = q || ev || tp || yr || lg;
            if (elClear) { elClear.hidden = !active; }
        }

        [elEvent, elTopic, elYear, elLang].forEach(function (s) { s.addEventListener("change", apply); });
        elSearch.addEventListener("input", apply);
        if (elClear) {
            elClear.addEventListener("click", function () {
                elSearch.value = ""; elEvent.value = ""; elTopic.value = "";
                elYear.value = ""; elLang.value = ""; apply();
            });
        }

        apply();
    });
})();
