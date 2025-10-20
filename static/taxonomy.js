// taxonomy.js — fixed layout with arrows inline, Bootstrap checkboxes, sorted children

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

  const roots = Array.isArray(taxonomyData) ? taxonomyData : [taxonomyData];

  const rootUl = document.createElement("ul");
  rootUl.style.listStyleType = "none";
  rootUl.style.paddingLeft = "0";
  container.appendChild(rootUl);

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
      toggle.textContent = "►";
      toggle.style.visibility = "hidden";
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

        // Sort children alphabetically by name
        node.children.sort((a, b) => a.name.localeCompare(b.name));

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

          // If parent checkbox is checked, check all newly loaded children
          if (checkbox.checked) {
            ul.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = true));
          }
        } else {
          ul.style.display = "none";
          toggle.textContent = "►";
        }
      });
    }

    // --- Propagate down ---
    function propagateDown(checked) {
      if (ul) {
        ul.querySelectorAll("input[type=checkbox]").forEach((cb) => (cb.checked = checked));
      }
    }

    // --- Propagate up ---
    function propagateUp(cb) {
      const li = cb.closest("li");
      const parentUl = li.parentElement;
      const parentLi = parentUl.closest("li");
      if (!parentLi) return;

      const parentCheckbox = parentLi.querySelector("input[type=checkbox]");

      const siblingCheckboxes = Array.from(
        parentUl.querySelectorAll(":scope > li > div > div > input[type=checkbox]")
      );
      parentCheckbox.checked = siblingCheckboxes.every((s) => s.checked);

      propagateUp(parentCheckbox);
    }

    // --- Checkbox change handler ---
    checkbox.addEventListener("change", () => {
      propagateDown(checkbox.checked);
      propagateUp(checkbox);
    });

    return li;
  }

  // --- Build tree ---
  roots.forEach((node) => {
    const li = createNode(node, true);
    rootUl.appendChild(li);
  });
});
