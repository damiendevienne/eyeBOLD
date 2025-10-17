// taxonomy.js — fixed lazy loading + first level visible

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

  // --- Recursive creation ---
  function createNode(node, showChildren = false) {
    const li = document.createElement("li");
    li.className = "taxonomy-node";

    const wrapper = document.createElement("span");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";

    const hasChildren = node.children && node.children.length > 0;

    // Toggle arrow
    const toggle = document.createElement("span");
    toggle.textContent = hasChildren ? (showChildren ? "▼" : "►") : "";
    toggle.style.cursor = hasChildren ? "pointer" : "default";
    toggle.style.userSelect = "none";
    toggle.style.marginRight = "5px";

    // Checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `node-${node.name}`;

    // Label
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = `${node.name}${node.rank ? " (" + node.rank + ")" : ""}`;
    label.style.marginLeft = "5px";

    wrapper.appendChild(toggle);
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    li.appendChild(wrapper);

    // Container for potential children
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

      // If we want this node's children visible from start (root)
      if (showChildren) {
        loadChildren();
        ul.style.display = "block";
      } else {
        ul.style.display = "none";
      }

      // Toggle click
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

    // Checkbox cascade
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

  // --- Build the tree: root visible, first level open ---
  roots.forEach((node) => {
    const li = createNode(node, true);
    rootUl.appendChild(li);
  });
});
