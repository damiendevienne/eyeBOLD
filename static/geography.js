// geography.js
document.addEventListener("DOMContentLoaded", async () => {
  const countriesContainer = document.getElementById("countries-container");
  const climatesContainer = document.getElementById("climates-container");

  const countriesBlock = countriesContainer.closest(".geo-block");
  const climatesBlock = climatesContainer.closest(".geo-block");

  // --- Load countries dynamically ---
  let countries = [];
  try {
    const response = await fetch("/api/countries_csv");
    if (!response.ok) throw new Error("Failed to load countries");
    const text = await response.text();
    countries = text
      .trim()
      .split("\n")
      .slice(1)
      .map(line => line.trim())
      .filter(c => c);
  } catch (err) {
    console.error("Error loading countries:", err);
    countriesContainer.innerHTML = "<p class='text-danger'>Failed to load countries.</p>";
    return;
  }

  // --- Define continents ---
  const continentMap = {
    "Africa": ["DZ","AO","BF","BI","BJ","BW","CD","CF","CG","CI","CM","CV","DJ","EG","ER","ET","GA","GH","GM","GN","GQ","GW","KE","KM","LR","LS","LY","MA","MG","ML","MR","MU","MW","MZ","NA","NE","NG","RE","RW","SC","SD","SH","SL","SN","SO","SS","ST","SZ","TD","TG","TN","TZ","UG","YT","ZA","ZM","ZW"],
    "Europe": ["AL","AM","AT","AX","BA","BE","BG","BY","CH","CY","CZ","DE","DK","EE","ES","FI","FO","FR","GB","GE","GI","GR","HR","HU","IE","IS","IT","LI","LT","LU","LV","MC","MD","ME","MK","MT","NL","NO","PL","PT","RO","RS","RU","SE","SI","SK","SM","UA","XK"],
    "Asia": ["AE","AF","AZ","BD","BH","BN","BT","CN","HK","ID","IL","IN","IQ","IR","JO","JP","KG","KH","KP","KR","KW","KZ","LA","LB","LK","MM","MN","MO","MY","NP","OM","PH","PK","QA","SA","SG","SY","TH","TJ","TL","TM","TR","TW","UZ","VN","YE"],
    "Oceania": ["AS","AU","CK","FJ","FM","GU","KI","MH","MP","NC","NF","NR","NU","NZ","PF","PG","PN","PW","SB","TK","TO","TV","UM","VU","WF","WS"],
    "Americas": ["AG","AI","AR","AW","BB","BM","BO","BQ","BR","BS","BZ","CA","CL","CO","CR","CU","CW","DM","DO","EC","FK","GD","GF","GL","GP","GT","GY","HN","HT","JM","KN","KY","LC","MF","MQ","MS","MX","NI","PA","PE","PM","PR","PY","SR","SV","SX","TC","TT","US","UY","VC","VE","VG","VI"],
    "Antarctica": ["AQ","TF","GS"]
  };

  // --- “Unknown country” option ---
  const unknownDiv = document.createElement("div");
  unknownDiv.classList.add("continent-block");
  unknownDiv.innerHTML = `
    <input class="form-check-input geo-country" type="checkbox" value="UNKNOWN" id="country-unknown" style="margin-right: 6px;">
    <label class="form-check-label fw-bold" for="country-unknown">Unknown country</label>
  `;
  countriesContainer.appendChild(unknownDiv);

  // --- Build collapsible continent UI ---
  for (const [continent, codes] of Object.entries(continentMap)) {
    const contDiv = document.createElement("div");
    contDiv.classList.add("continent-block");

    const validCodes = codes.filter(code => countries.includes(code));

    // Arrow toggle
    const toggle = document.createElement("span");
    toggle.textContent = "►";
    toggle.style.cursor = "pointer";
    toggle.style.marginRight = "6px";
    toggle.style.userSelect = "none";

    // Continent label
    const contLabel = document.createElement("label");
    contLabel.classList.add("fw-bold");
    contLabel.textContent = continent;

    // Continent checkbox
    const contCheckbox = document.createElement("input");
    contCheckbox.classList.add("form-check-input", "continent-checkbox");
    contCheckbox.type = "checkbox";
    contCheckbox.id = `continent-${continent}`;
    contCheckbox.style.marginRight = "6px";

    // Wrap title
    const titleDiv = document.createElement("div");
    titleDiv.style.display = "flex";
    titleDiv.style.alignItems = "center";
    titleDiv.appendChild(toggle);
    titleDiv.appendChild(contCheckbox);
    titleDiv.appendChild(contLabel);
    contDiv.appendChild(titleDiv);

    // Child countries
    const ul = document.createElement("ul");
    ul.style.listStyle = "none";
    ul.style.marginLeft = "1.5em";
    ul.style.display = "none"; // collapsed by default

    validCodes.forEach(code => {
      const li = document.createElement("li");
      li.innerHTML = `
        <input class="form-check-input geo-country" type="checkbox" value="${code}" id="country-${code}">
        <label class="form-check-label" for="country-${code}">${code}</label>
      `;
      ul.appendChild(li);
    });

    contDiv.appendChild(ul);
    countriesContainer.appendChild(contDiv);

    // --- Toggle behavior ---
    toggle.addEventListener("click", () => {
      const isHidden = ul.style.display === "none";
      ul.style.display = isHidden ? "block" : "none";
      toggle.textContent = isHidden ? "▼" : "►";
    });

    // --- Continent checkbox behavior ---
    contCheckbox.addEventListener("change", () => {
      ul.querySelectorAll("input.geo-country").forEach(cb => (cb.checked = contCheckbox.checked));
      updateHighlight();
    });
  }

  // --- Highlight and exclusivity logic ---
  const updateHighlight = () => {
    const anyCountryChecked = document.querySelectorAll(".geo-country:checked").length > 0;
    const anyClimateChecked = document.querySelectorAll(".geo-climate:checked").length > 0;

    if (anyCountryChecked) {
      countriesBlock.classList.add("active");
      climatesBlock.classList.remove("active");
      climatesBlock.classList.add("disabled-block");
    } else if (anyClimateChecked) {
      climatesBlock.classList.add("active");
      countriesBlock.classList.remove("active");
      countriesBlock.classList.add("disabled-block");
    } else {
      countriesBlock.classList.remove("active", "disabled-block");
      climatesBlock.classList.remove("active", "disabled-block");
    }
  };

  const handleCountryChange = (event) => {
    if (event.target.checked) {
      document.querySelectorAll(".geo-climate:checked").forEach(cb => (cb.checked = false));
    }
    updateHighlight();
  };

  const handleClimateChange = (event) => {
    if (event.target.checked) {
      document.querySelectorAll(".geo-country:checked").forEach(cb => (cb.checked = false));
    }
    updateHighlight();
  };

  countriesContainer.addEventListener("change", handleCountryChange);
  climatesContainer.addEventListener("change", handleClimateChange);
});
