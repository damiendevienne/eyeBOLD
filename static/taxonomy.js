// taxonomy.js — full tree with lazy loading, arrows, and checkbox propagation

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

  // --- Recursive node creation ---
  function createNode(node, showChildren = false, parentChecked = false) {
    const li = document.createElement("li");

    // Flex wrapper for arrow + checkbox + label
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
    checkbox.dataset.rank = node.rank;
    checkbox.dataset.taxa = node.name;
    checkbox.classList.add("form-check-input");

    // Inherit parent checked state
    if (parentChecked) checkbox.checked = true;

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

      function loadChildren() {
        if (loaded) return;
        node.children.forEach((child) => {
          ul.appendChild(createNode(child, false, checkbox.checked));
        });
        loaded = true;
      }

      if (showChildren) {
        loadChildren();
        ul.style.display = "block";
      } else {
        ul.style.display = "none";
      }

      toggle.addEventListener("click", () => {
        if (ul.style.display === "none") {
          loadChildren();
          ul.style.display = "block";
          toggle.textContent = "▼";
        } else {
          ul.style.display = "none";
          toggle.textContent = "►";
        }
      });
    }

    // --- Downward propagation ---
    checkbox.addEventListener("change", () => {
      if (ul) {
        ul.querySelectorAll("input[type=checkbox]").forEach((cb) => {
          cb.checked = checkbox.checked;
        });
      }
      // --- Upward uncheck propagation ---
      if (!checkbox.checked) {
        let parentLi = li.parentElement.closest("li");
        while (parentLi) {
          const parentCheckbox = parentLi.querySelector("input[type=checkbox]");
          if (parentCheckbox.checked) parentCheckbox.checked = false;
          parentLi = parentLi.parentElement.closest("li");
        }
      } else {
        // --- Upward check if all siblings checked ---
        propagateCheckUp(li);
      }
    });

    return li;
  }

  // --- Function to propagate check upwards if all siblings checked ---
  function propagateCheckUp(li) {
    const parentLi = li.parentElement.closest("li");
    if (!parentLi) return;
    const siblingCheckboxes = Array.from(
      li.parentElement.querySelectorAll(":scope > li > div > div > input[type=checkbox]")
    );
    if (siblingCheckboxes.every(cb => cb.checked)) {
      const parentCheckbox = parentLi.querySelector("input[type=checkbox]");
      if (!parentCheckbox.checked) {
        parentCheckbox.checked = true;
        propagateCheckUp(parentLi);
      }
    }
  }

  // --- Build tree ---
  roots.forEach((node) => {
    const li = createNode(node, true);
    rootUl.appendChild(li);
  });
});
