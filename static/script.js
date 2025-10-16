let lastData = []; // store last query for export

async function runQuery() {
  document.getElementById("status").textContent = "Running query...";
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

document.getElementById("run").addEventListener("click", runQuery);
document.getElementById("exportCsv").addEventListener("click", exportCSV);
document.getElementById("exportJson").addEventListener("click", exportJSON);
