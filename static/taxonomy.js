// taxonomy.js

async function loadTaxonomy() {
  const res = await fetch("/api/taxonomy_json");
  const taxonomy = await res.json();

  const container = document.getElementById("taxonomy-container");
  container.innerHTML = "";

  function createNode(node, isRootChild = false) {
    const li = document.createElement("li");
    li.className = "taxonomy-node";

    const wrapper = document.createElement("span");
    wrapper.style.display = "flex";
    wrapper.style.alignItems = "center";

    // toggle arrow
    const hasChildren = node.children && node.children.length > 0;
    const toggle = document.createElement("span");
    toggle.textContent = hasChildren ? (isRootChild ? "▼" : "►") : "";
    toggle.style.cursor = "pointer";
    toggle.style.userSelect = "none";
    toggle.style.marginRight = "5px";

    // checkbox
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.id = `node-${node.name}`;

    // label
    const label = document.createElement("label");
    label.htmlFor = checkbox.id;
    label.textContent = `${node.name}${node.rank ? " (" + node.rank + ")" : ""}`;
    label.style.marginLeft = "5px";

    wrapper.appendChild(toggle);
    wrapper.appendChild(checkbox);
    wrapper.appendChild(label);
    li.appendChild(wrapper);

    // children
    let ul = null;
    if (hasChildren) {
      ul = document.createElement("ul");
      ul.style.listStyleType = "none";
      ul.style.marginLeft = "20px";
      node.children.forEach(child => ul.appendChild(createNode(child)));
      li.appendChild(ul);

      // show first level by default
      ul.style.display = isRootChild ? "block" : "none";

      // toggle arrow click
      toggle.addEventListener("click", () => {
        if (ul.style.display === "none") {
          ul.style.display = "block";
          toggle.textContent = "▼";
        } else {
          ul.style.display = "none";
          toggle.textContent = "►";
        }
      });
    }

    // parent → children checkbox behavior
    checkbox.addEventListener("change", () => {
      if (ul) {
        ul.querySelectorAll("input[type=checkbox]").forEach(cb => cb.checked = checkbox.checked);
      }
    });

    return li;
  }

  const rootUl = document.createElement("ul");
  rootUl.style.listStyleType = "none";
  rootUl.style.paddingLeft = "0";

  // Ensure taxonomy is always an array
  const nodesArray = Array.isArray(taxonomy) ? taxonomy : [taxonomy];

  // First level expanded
  nodesArray.forEach(node => rootUl.appendChild(createNode(node, true)));

  container.appendChild(rootUl);
}

document.addEventListener("DOMContentLoaded", loadTaxonomy);
