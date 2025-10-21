let lastData = []; // store last query for export

async function runQuery() {
  document.getElementById("status").textContent = "Running ...";
  const genus = document.getElementById("genus").value;
  const vgenus = document.getElementById("vgenus").checked;
  const dup = document.getElementById("dup").checked;
  const mis = document.getElementById("mis").checked;

  const url = `/api/query?genus=${encodeURIComponent(genus)}`
            + `&verified_genus=${vgenus}`
            + `&exclude_dup=${dup}`
            + `&exclude_misclass=${mis}`;

  try {
    const res = await fetch(url);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    lastData = data;

    const tbody = document.querySelector("#results tbody");
    tbody.innerHTML = "";
    data.forEach(row => {
      const tr = document.createElement("tr");
      row.forEach(cell => {
        const td = document.createElement("td");
        td.textContent = cell;
        tr.appendChild(td);
      });
      tbody.appendChild(tr);
    });

    document.getElementById("status").textContent = `${data.length} results loaded.`;
  } catch (err) {
    console.error(err);
    document.getElementById("status").textContent = "Error fetching data.";
  }
}

function exportCSV() {
  if (!lastData.length) return alert("No data to export.");
  const csv = lastData.map(r => r.join(",")).join("\n");
  const blob = new Blob([csv], {type: 'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.csv';
  a.click();
  URL.revokeObjectURL(url);
}

function exportJSON() {
  if (!lastData.length) return alert("No data to export.");
  const json = JSON.stringify(lastData, null, 2);
  const blob = new Blob([json], {type: 'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'results.json';
  a.click();
  URL.revokeObjectURL(url);
}

async function runTest() {
  document.getElementById("status").textContent = "Building query...";
  const currentState = getCurrentQueryState();

  try {
    const res = await fetch("/api/build_query", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(currentState)
    });

    if (!res.ok) throw new Error(`Server error: ${res.status}`);
    const data = await res.json();

    // Display the generated SQL query in the debug <pre>
    document.getElementById("debug-query").textContent = data.sql;
    
    console.log(data.results);

    // Also display the JSON object sent    
    document.getElementById("debug-query-json-sent").textContent = JSON.stringify(currentState, null, 2);

    document.getElementById("status").textContent = "Query built successfully";
  } catch (err) {
    document.getElementById("debug-query").textContent = `Error: ${err.message}`;
    document.getElementById("status").textContent = "Error building query";
  }
}


// async function runTest() {
//   document.getElementById("status").textContent = "Running query...";
//   const currentState = getCurrentQueryState();
//   // Convert object to string for display
//   document.getElementById("debug-query").textContent = JSON.stringify(currentState, null, 2);
//   document.getElementById("status").textContent = "Done";
// }


function getCurrentQueryState() {

// --- Taxonomy: get name + rank of checked nodes ---
const taxonomy = Array.from(document.querySelectorAll("#taxonomy-container input[type=checkbox]:checked"))
  .filter(cb => {
    // Keep this checkbox only if no ancestor checkbox is checked
    let parentLi = cb.closest("li")?.parentElement?.closest("li");
    while (parentLi) {
      const parentCb = parentLi.querySelector("input[type=checkbox]");
      if (parentCb?.checked) return false; // parent is checked → skip this node
      parentLi = parentLi.parentElement?.closest("li");
    }
    return true; // keep this one
  })
  .map(cb => ({
    name: cb.dataset.taxa,
    rank: cb.dataset.rank
  }));

  // --- Max rank selected ---
  const rankBtn = document.querySelector("#rank-selector button.active");
  const identification_rank = rankBtn?.dataset.rank || null;


  // --- Countries ---
  const countries = Array.from(document.querySelectorAll(".geo-country:checked"))
    .map(cb => cb.value);

  // --- Climates ---
  const climates = Array.from(document.querySelectorAll(".geo-climate:checked"))
    .map(cb => cb.value);

  // --- Sequence options ---
  const seqRadio = document.querySelector("input[name='seqType']:checked");
  const seqType = seqRadio ? seqRadio.value : null;
  const primers = seqType === "primers" ? {
    forward: document.getElementById("forwardPrimer").value,
    reverse: document.getElementById("reversePrimer").value
  } : null;

  // --- Other options ---
  const options = {
    excludeDuplicates: document.getElementById("optDuplicates")?.checked || false,
    hybrids: document.querySelector("input[name='hybrids']:checked")?.value || "all",
    excludeMisclassified: document.getElementById("optMisclassified")?.checked || false,
    checkedLocationsOnly: document.getElementById("optCheckedLoc")?.checked || false
  };

  return {
    taxonomy,
    identification_rank,
    countries,
    climates,
    sequence: {
      type: seqType,
      primers: primers
    },
    options
  };
}




document.getElementById("run").addEventListener("click", runTest);
//document.getElementById("run").addEventListener("click", runQuery);

// document.getElementById("exportCsv").addEventListener("click", exportCSV);
// document.getElementById("exportJson").addEventListener("click", exportJSON);




// debug.js — displays server-built query live
// script.js — debug query display
