// taxonomy.js — fixed layout with arrows inline and Bootstrap checkboxes

document.addEventListener("DOMContentLoaded", async () => {
  const container = document.getElementById("taxonomy-container");
  container.innerHTML = "<p class='text-muted'>Loading taxonomy...</p>";

  let taxonomyData = null;

  // --- Load taxonomy data ---
  try {
    const res = await fetch("/api/taxonomy_json");
    if (!res.ok) throw new Error("Failed to load taxonomy");
    taxonomyData = await res.json();
  } catch (err) {
    console.error("Error loading taxonomy:", err);
    container.innerHTML = "<p class='text-danger'>Failed to load taxonomy data.</p>";
    return;
  }

  container.innerHTML = "";

  // --- Ensure array of roots ---
  const roots = Array.isArray(taxonomyData) ? taxonomyData : [taxonomyData];

  const rootUl = document.createElement("ul");
  rootUl.style.listStyleType = "none";
  rootUl.style.paddingLeft = "0";
  container.appendChild(rootUl);

  // --- Recursive node creation ---
  function createNode(node, showChildren = false) {
    const li = document.createElement("li");

    // Flex wrapper for arrow + checkbox+label
    const wrapper = document.createElement("div");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";

    const hasChildren = node.children && node.children.length > 0;

    // Arrow toggle
    const toggle = document.createElement("span");
    if (hasChildren) {
      toggle.textContent = showChildren ? "▼" : "►";
      toggle.style.cursor = "pointer";
    } else {
      toggle.textContent = "►";        // or "▼", doesn't matter
      toggle.style.visibility = "hidden"; // make invisible
    }
    toggle.style.userSelect = "none";
    toggle.style.marginRight = "5px";

    // Checkbox + label
    const checkWrapper = document.createElement("div");
    checkWrapper.classList.add("form-check", "d-flex", "align-items-center");

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `node-${node.name}`;
    checkbox.dataset.rank = `${node.rank}`;
    checkbox.dataset.taxa = `${node.name}`;
    checkbox.classList.add("form-check-input");

    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = `${node.name}${node.rank ? " (" + node.rank + ")" : ""}`;
    label.classList.add("form-check-label");
    label.style.marginLeft = "5px";

    checkWrapper.appendChild(checkbox);
    checkWrapper.appendChild(label);

    wrapper.appendChild(toggle);
    wrapper.appendChild(checkWrapper);
    li.appendChild(wrapper);

    // --- Children container ---
    let ul = null;
    if (hasChildren) {
      ul = document.createElement("ul");
      ul.style.listStyleType = "none";
      ul.style.marginLeft = "20px";
      li.appendChild(ul);

      let loaded = false;

      async function loadChildren() {
        if (loaded) return;
        node.children.forEach((child) => {
          ul.appendChild(createNode(child));
        });
        loaded = true;
      }

      // Show first level if requested
      if (showChildren) {
        loadChildren();
        ul.style.display = "block";
      } else {
        ul.style.display = "none";
      }

      toggle.addEventListener("click", async () => {
        if (ul.style.display === "none") {
          await loadChildren();
          ul.style.display = "block";
          toggle.textContent = "▼";
        } else {
          ul.style.display = "none";
          toggle.textContent = "►";
        }
      });
    }

    // --- Checkbox cascade ---
    checkbox.addEventListener("change", () => {
      if (ul) {
        requestIdleCallback(() => {
          ul.querySelectorAll("input[type=checkbox]").forEach(
            (cb) => (cb.checked = checkbox.checked)
          );
        });
      }
    });

    return li;
  }

  // --- Build tree ---
  roots.forEach((node) => {
    const li = createNode(node, true); // first-level expanded
    rootUl.appendChild(li);
  });
});
