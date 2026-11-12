const defaultData = [
  { referencia: "1044772", data: "2026-10-13", item: "SISBAJUD", sala: "FORUM_DESEMBARGADOR_MIGUEL_SEABRA_FAGUNDES-", nome: "Luanna Vitória Silva Gomes" },
  { referencia: "S1725401", data: "2026-10-13", item: "SISTEMA_LICITACAO", sala: "FORUM_DESEMBARGADOR_MIGUEL_SEABRA_FAGUNDES-5_VARA_CIVEL", nome: "Patricia Albernaz Aquino" },
  { referencia: "S1725403", data: "2026-10-13", item: "SISTEMA_LICITACAO", sala: "FORUM_DESEMBARGADOR_MIGUEL_SEABRA_FAGUNDES-22_VARA_CIVEL", nome: "Natercia Maria Sena de Almeida" },
  { referencia: "S1725415", data: "2026-10-13", item: "SISBAJUD", sala: "FORUM_FAZENDARIO-3_VARA_DA_FAZENDA_PUBLICA", nome: "Simone Pereira da Silva" },
  { referencia: "S1725423", data: "2026-10-13", item: "SISBAJUD", sala: "FORUM_FAZENDARIO-5_JUIZADO_ESPECIAL_DA_FAZENDA_PUBLICA", nome: "Lilian Patrícia de Azevedo Marinho" },
  { referencia: "S1725443", data: "2026-10-13", item: "SISBAJUD", sala: "FORUM_FAZENDARIO-5_VARA_DA_FAZENDA_PUBLICA", nome: "Airton Pinheiro" },
  { referencia: "S1725450", data: "2026-10-13", item: "RENAJUD", sala: "FÓRUM_DA_COMARCA_DE_CURRAIS_NOVOS-2_VARA", nome: "Ricardo Antonio Menezes Cabral Fagundes" },
  { referencia: "S1725470", data: "2026-10-13", item: "SCA", sala: "FÓRUM_DA_COMARCA_DE_CURRAIS_NOVOS-2_VARA", nome: "Ricardo Antonio Menezes Cabral Fagundes" },
  { referencia: "S1725544", data: "2026-10-13", item: "SISTEMA_LICITACAO", sala: "FÓRUM_DA_COMARCA_DE_ACARI-VARA_UNICA", nome: "Aristoteles Magno Lopes Rodrigues" },
  { referencia: "S1725561", data: "2026-10-13", item: "SISBAJUD", sala: "FORUM_JESPS-3_JUIZADO_ESPECIAL_CIVEL_CENTRAL", nome: "Alice Dantas Barros" },
  { referencia: "S1725724", data: "2026-10-13", item: "SISBAJUD", sala: "FORUM_FAZENDARIO-3_JUIZADO_ESPECIAL_DA_FAZENDA_PUBLICA", nome: "Daliana de Araújo Matos" },
  { referencia: "S1725777", data: "2026-10-13", item: "SISTEMA_LICITACAO", sala: "FORUM_DESEMBARGADOR_MIGUEL_SEABRA_FAGUNDES-SECRETARIA_UNIFICADA_CRIMINAL_3A11", nome: "Ricardo Sergio Reboucas de Carvalho" },
  { referencia: "S1725814", data: "2026-10-13", item: "SISTEMA_LICITACAO", sala: "FORUM_DESEMBARGADOR_MIGUEL_SEABRA_FAGUNDES-2_VARA_CRIMINAL", nome: "Domicio Jose Alves Cordeiro" },
  { referencia: "S1725835", data: "2026-10-13", item: "SISTEMA_LICITACAO", sala: "FORUM_DESEMBARGADOR_MIGUEL_SEABRA_FAGUNDES-10_VARA_CRIMINAL", nome: "Andreza Ferreira Araújo Marinho" },
  { referencia: "S1725852", data: "2026-10-13", item: "SISBAJUD", sala: "FÓRUM_DA_COMARCA_DE_PENDÊNCIAS-VARA_UNICA", nome: "Francisco Michard da Silva Medeiros" },
  { referencia: "S1725879", data: "2026-10-13", item: "INFOJUD", sala: "FÓRUM_DA_COMARCA_DE_MOSSORÓ-4_JUIZADO_ESPECIAL_CIVEL_CRIMINAL_E_DA_FAZENDA_PUBLICA", nome: "VALMIR GODEIRO CARLOS FILHO" },
  { referencia: "1045395", data: "2026-10-13", item: "MICROSOFT AUTHENTICATOR", sala: "EXTERNOS-OAB", nome: "Victoria Soares Siqueira" }
];

const normalizedDefaultData = defaultData.map(item => ({ ...item, forum: normalizeForumName(item.sala) }));
let rawData = [...normalizedDefaultData];
let filteredData = [...normalizedDefaultData];
let lineChartInstance = null;
let donutChartInstance = null;
let locationChartInstance = null;
let temporaryEndDate = null;
let tableSort = { key: "data", direction: "asc" };

document.addEventListener("DOMContentLoaded", () => {
  lucide.createIcons();

  const sidebar = document.querySelector(".sidebar");
  const navLinks = document.querySelectorAll("#sidebar-nav a");
  const updateActiveNav = (href = window.location.hash === "#tabela-sec" ? "#tabela-sec" : "#") => {
    navLinks.forEach(link => {
      const isActive = link.getAttribute("href") === href;
      link.classList.toggle("active", isActive);
      if (isActive) {
        link.setAttribute("aria-current", "page");
      } else {
        link.removeAttribute("aria-current");
      }
    });
  };
  navLinks.forEach(link => {
    link.addEventListener("click", () => updateActiveNav(link.getAttribute("href")));
  });
  window.addEventListener("hashchange", () => updateActiveNav());
  updateActiveNav();

  const sidebarToggle = document.getElementById("btn-toggle-sidebar");
  sidebarToggle.addEventListener("click", () => {
    const isCollapsed = sidebar.classList.toggle("collapsed");
    const label = isCollapsed ? "Expandir menu lateral" : "Recolher menu lateral";
    sidebarToggle.setAttribute("aria-expanded", String(!isCollapsed));
    sidebarToggle.setAttribute("aria-label", label);
    sidebarToggle.title = label;
  });

  const savedSheetInput = localStorage.getItem("agile_sheet_url");
  if (savedSheetInput) {
    document.getElementById("sheet-id-input").value = savedSheetInput;
    fetchGoogleSheetData(true);
  } else {
    populateDropdowns();
    renderDashboard();
  }

  const dateStartInput = document.getElementById("date-start");
  const dateEndInput = document.getElementById("date-end");

  function syncDateRange() {
    dateEndInput.min = dateStartInput.value;
    applyFilters();
  }

  dateStartInput.addEventListener("change", syncDateRange);
  dateEndInput.addEventListener("focus", () => {
    if (!dateStartInput.value || dateEndInput.value) return;

    temporaryEndDate = dateStartInput.value;
    dateEndInput.value = temporaryEndDate;
  });
  dateEndInput.addEventListener("change", () => {
    temporaryEndDate = null;
    applyFilters();
  });
  dateEndInput.addEventListener("blur", () => {
    if (temporaryEndDate && dateEndInput.value === temporaryEndDate) {
      dateEndInput.value = "";
    }
    temporaryEndDate = null;
  });
  document.getElementById("filter-system").addEventListener("change", applyFilters);
  document.getElementById("filter-location").addEventListener("change", applyFilters);
  document.getElementById("btn-clear-filters").addEventListener("click", resetFilters);

  document.getElementById("btn-load-sheet").addEventListener("click", () => fetchGoogleSheetData(false));

  document.getElementById("btn-export-excel").addEventListener("click", exportToExcel);
  document.getElementById("btn-export-pdf").addEventListener("click", exportToPDF);
  document.querySelectorAll(".table-sort-button").forEach(button => {
    button.addEventListener("click", () => {
      if (tableSort.key === button.dataset.sortKey) {
        tableSort.direction = tableSort.direction === "asc" ? "desc" : "asc";
      } else {
        tableSort = { key: button.dataset.sortKey, direction: "asc" };
      }

      updateTableSortControls();
      renderTable();
    });
  });
  updateTableSortControls();

  setInterval(() => {
    const sheetInput = document.getElementById("sheet-id-input").value;
    if (sheetInput) fetchGoogleSheetData(true);
  }, 30000);
});

async function fetchGoogleSheetData(isSilent = false) {
  const input = document.getElementById("sheet-id-input").value.trim();
  if (!input) {
    if (!isSilent) alert("Por favor, insira o ID da planilha ou a URL de compartilhamento.");
    return;
  }

  const csvUrl = getGoogleSheetCsvUrl(input);
  if (!csvUrl) {
    document.getElementById("sync-text").innerText = "URL da planilha inválida";
    if (!isSilent) alert("Informe um ID válido ou uma URL HTTPS de uma planilha do Google.");
    return;
  }

  localStorage.setItem("agile_sheet_url", input);

  try {
    if (!isSilent) document.getElementById("sync-text").innerText = "Sincronizando...";
    const response = await fetch(csvUrl);
    if (!response.ok) throw new Error("Erro ao acessar a planilha.");
    
    const csvText = await response.text();
    const parsed = parseCSV(csvText);

    if (parsed.length > 0) {
      if (!areDataRowsEqual(rawData, parsed)) {
        rawData = parsed;
        populateDropdowns();
        applyFilters(true);
      }
    }
    
    if (!isSilent) {
      document.getElementById("sync-text").innerText = "Atualizado com Sucesso";
      setTimeout(() => document.getElementById("sync-text").innerText = "Conectado à Planilha", 3000);
    }
  } catch (err) {
    console.error(err);
    if (!isSilent) alert("Falha ao carregar os dados. Verifique se a planilha está configurada como 'Qualquer pessoa com o link pode ver' (Modo Leitor).");
    document.getElementById("sync-text").innerText = "Erro na Conexão";
  }
}

function getGoogleSheetCsvUrl(input) {
  let sheetId = input;
  if (input.toLowerCase().includes("docs.google.com")) {
    let spreadsheetUrl;
    try {
      spreadsheetUrl = new URL(/^[a-z][a-z\d+.-]*:\/\//i.test(input) ? input : `https://${input}`);
    } catch {
      return "";
    }

    const match = spreadsheetUrl.pathname.match(/^\/spreadsheets\/(?:u\/\d+\/)?d\/([a-zA-Z0-9_-]+)(?:\/|$)/);
    if (spreadsheetUrl.protocol !== "https:" || spreadsheetUrl.hostname !== "docs.google.com" || !match) {
      return "";
    }
    sheetId = match[1];
  } else if (!/^[a-zA-Z0-9_-]+$/.test(input)) {
    return "";
  }

  const gidMatch = input.match(/[?&#]gid=(\d+)/);
  const gidParameter = gidMatch ? `&gid=${gidMatch[1]}` : "";
  return `https://docs.google.com/spreadsheets/d/${sheetId}/export?format=csv${gidParameter}`;
}

function normalizeDateValue(value) {
  if (value === null || value === undefined) return "";

  let raw = String(value).trim();
  if (!raw) return "";

  raw = raw.replace(/\s+\d{2}:\d{2}(:\d{2})?.*$/, "");

  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  if (/^\d{4}\/\d{2}\/\d{2}$/.test(raw)) return raw.replace(/\//g, '-');
  if (/^\d{2}[/-]\d{2}[/-]\d{4}$/.test(raw)) {
    const [day, month, year] = raw.split(/[/-]/);
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(raw)) {
    const [day, month, year] = raw.split(/[/-]/);
    const cleanYear = year.length === 2 ? `20${year}` : year;
    return `${cleanYear}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }

  return raw;
}

function normalizeForumName(value) {
  if (!value) return "Não informado";

  let forum = String(value).trim();
  if (!forum) return "Não informado";

  const suffixPatterns = [
    /-SECRETARIA.*$/i,
    /-SECRETA.*$/i,
    /-\d+_VARA.*$/i,
    /-\d+_JUIZADO.*$/i,
    /-\d+°.*$/i,
    /-\d+.*$/i,
    /-VARA.*$/i,
    /-JUIZADO.*$/i,
    /-TRIBUNAL.*$/i,
    /-SALA.*$/i,
    /-CENTRAL.*$/i,
    /-UNIFICADA.*$/i,
    /-GABINETE.*$/i,
    /-OFICINA.*$/i,
    /-NIP.*$/i,
    /-.*$/i
  ];

  for (const pattern of suffixPatterns) {
    if (pattern.test(forum)) {
      forum = forum.replace(pattern, "");
      break;
    }
  }

  return forum.trim() || "Não informado";
}

function getForumName(item) {
  return normalizeForumName(item.sala || item.forum);
}

function parseCSV(text) {
  const rows = [];
  let row = [];
  let cell = "";
  let insideQuotes = false;
  const csvText = text.replace(/^\uFEFF/, "");

  for (let index = 0; index < csvText.length; index += 1) {
    const character = csvText[index];

    if (insideQuotes) {
      if (character === '"' && csvText[index + 1] === '"') {
        cell += '"';
        index += 1;
      } else if (character === '"') {
        insideQuotes = false;
      } else {
        cell += character;
      }
    } else if (character === '"' && cell.length === 0) {
      insideQuotes = true;
    } else if (character === ",") {
      row.push(cell.trim());
      cell = "";
    } else if (character === "\n" || character === "\r") {
      row.push(cell.trim());
      if (row.some(value => value !== "")) rows.push(row);
      row = [];
      cell = "";
      if (character === "\r" && csvText[index + 1] === "\n") index += 1;
    } else {
      cell += character;
    }
  }

  if (insideQuotes) throw new Error("CSV inválido: campo entre aspas não foi finalizado.");

  row.push(cell.trim());
  if (row.some(value => value !== "")) rows.push(row);
  if (rows.length < 2) return [];

  return rows.slice(1).map(cols => {

    const sala = cols[3] || "Não especificado";

    return {
      referencia: cols[0] || "",
      data: normalizeDateValue(cols[1]),
      item: cols[2] || "Não especificado",
      sala,
      forum: normalizeForumName(sala),
      nome: cols[4] || "Não especificado"
    };
  });
}

function areDataRowsEqual(currentRows, nextRows) {
  const fields = ["referencia", "data", "item", "sala", "forum", "nome"];
  return currentRows.length === nextRows.length
    && currentRows.every((row, index) => fields.every(field => row[field] === nextRows[index][field]));
}

function populateDropdowns() {
  const systemSelect = document.getElementById("filter-system");
  const locationSelect = document.getElementById("filter-location");
  const selectedSystem = systemSelect.value;
  const selectedLocation = locationSelect.value;

  const systems = [...new Set(rawData.map(d => d.item))].sort();
  const locations = [...new Set(rawData.map(getForumName))].sort();

  function updateOptions(select, defaultLabel, values, selectedValue) {
    select.replaceChildren(new Option(defaultLabel, ""));
    values.forEach(value => select.add(new Option(value, value)));

    if (selectedValue && !values.includes(selectedValue)) {
      select.add(new Option(`${selectedValue} (não encontrado nos dados atuais)`, selectedValue));
    }

    select.value = selectedValue;
  }

  updateOptions(systemSelect, "Todos os Sistemas", systems, selectedSystem);
  updateOptions(locationSelect, "Todos os Locais", locations, selectedLocation);
}

function applyFilters(animateCharts = false) {
  const startInput = document.getElementById("date-start");
  const endInput = document.getElementById("date-end");
  const start = startInput.value;
  const end = endInput.value === temporaryEndDate ? "" : endInput.value;

  if (start && end && end < start) {
    endInput.setCustomValidity("A Data Final deve ser igual ou posterior à Data Inicial.");
    endInput.reportValidity();
    return;
  }

  endInput.setCustomValidity("");
  const system = document.getElementById("filter-system").value;
  const location = document.getElementById("filter-location").value;

  filteredData = rawData.filter(item => {
    const itemDate = normalizeDateValue(item.data);
    const itemForum = getForumName(item);
    const matchStart = !start || !itemDate || itemDate >= start;
    const matchEnd = !end || !itemDate || itemDate <= end;
    const matchSystem = !system || item.item === system;
    const matchLocation = !location || itemForum === location;

    return matchStart && matchEnd && matchSystem && matchLocation;
  });

  renderDashboard(animateCharts);
}

function resetFilters() {
  temporaryEndDate = null;
  document.getElementById("date-start").value = "";
  document.getElementById("date-end").value = "";
  document.getElementById("date-end").min = "";
  document.getElementById("filter-system").value = "";
  document.getElementById("filter-location").value = "";
  applyFilters();
}

function renderDashboard(animateCharts = false) {
  document.getElementById("kpi-total").innerText = filteredData.length;
  document.getElementById("kpi-systems").innerText = new Set(filteredData.map(d => d.item)).size;
  document.getElementById("kpi-locations").innerText = new Set(filteredData.map(getForumName)).size;
  document.getElementById("kpi-people").innerText = new Set(filteredData.map(d => d.nome)).size;

  renderTable();
  renderCharts(animateCharts);
}

function renderTable() {
  const tbody = document.getElementById("table-body");
  document.getElementById("table-count-badge").innerText = `${filteredData.length} registros encontrados`;

  const tableRows = getSortedTableData(filteredData).map(row => {
    const dateFormatted = row.data ? row.data.split('-').reverse().join('/') : '-';
    const tableRow = document.createElement("tr");
    const referenceCell = document.createElement("td");
    const reference = document.createElement("strong");
    reference.textContent = row.referencia;
    referenceCell.append(reference);

    const itemCell = document.createElement("td");
    const itemBadge = document.createElement("span");
    itemBadge.className = "badge-item";
    itemBadge.textContent = row.item;
    itemCell.append(itemBadge);

    const dateCell = document.createElement("td");
    dateCell.textContent = dateFormatted;
    const locationCell = document.createElement("td");
    locationCell.textContent = row.sala;
    const nameCell = document.createElement("td");
    nameCell.textContent = row.nome;

    tableRow.append(referenceCell, dateCell, itemCell, locationCell, nameCell);

    return tableRow;
  });
  tbody.replaceChildren(...tableRows);
}

function getSortedTableData(rows) {
  return [...rows].sort((rowA, rowB) => {
    const valueA = tableSort.key === "data"
      ? normalizeDateValue(rowA.data)
      : String(rowA[tableSort.key] || "").trim();
    const valueB = tableSort.key === "data"
      ? normalizeDateValue(rowB.data)
      : String(rowB[tableSort.key] || "").trim();

    if (!valueA || !valueB) {
      if (!valueA && !valueB) return 0;
      return valueA ? -1 : 1;
    }

    const comparison = tableSort.key === "data"
      ? valueA.localeCompare(valueB)
      : valueA.localeCompare(valueB, "pt-BR", { sensitivity: "base", numeric: true });

    return tableSort.direction === "asc" ? comparison : -comparison;
  });
}

function updateTableSortControls() {
  document.querySelectorAll(".table-sort-button").forEach(button => {
    const isActive = button.dataset.sortKey === tableSort.key;
    const directionLabel = tableSort.direction === "asc" ? "crescente" : "decrescente";
    const nextDirectionLabel = tableSort.direction === "asc" ? "decrescente" : "crescente";
    const indicator = button.querySelector(".sort-indicator");

    button.closest("th").setAttribute(
      "aria-sort",
      isActive ? (tableSort.direction === "asc" ? "ascending" : "descending") : "none"
    );
    indicator.textContent = isActive
      ? (tableSort.direction === "asc" ? "↑" : "↓")
      : "↕";
    button.setAttribute(
      "aria-label",
      isActive
        ? `${button.dataset.sortLabel} em ordem ${directionLabel}. Clique para ordenar em ordem ${nextDirectionLabel}.`
        : `Ordenar por ${button.dataset.sortLabel} em ordem crescente`
    );
  });
}

function renderCharts(animateCharts = false) {
  const systemCounts = Object.create(null);
  filteredData.forEach(d => systemCounts[d.item] = (systemCounts[d.item] || 0) + 1);

  const dateCounts = Object.create(null);
  filteredData.forEach(d => {
    const dateLabel = d.data ? d.data.split('-').reverse().join('/') : 'S/D';
    dateCounts[dateLabel] = (dateCounts[dateLabel] || 0) + 1;
  });

  const dateEntries = Object.entries(dateCounts).sort(([dateA], [dateB]) => {
    const [dayA, monthA, yearA] = dateA.split('/').map(Number);
    const [dayB, monthB, yearB] = dateB.split('/').map(Number);
    return new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB);
  });

  const seriesLabels = dateEntries.map(([date]) => date);
  const seriesValues = dateEntries.map(([, value]) => value);

  const locationCounts = Object.create(null);
  filteredData.forEach(d => {
    const forumName = getForumName(d);
    locationCounts[forumName] = (locationCounts[forumName] || 0) + 1;
  });

  const sortedLocations = Object.entries(locationCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10);

  const locLabels = sortedLocations.map(item => item[0]).reverse();
  const locValues = sortedLocations.map(item => item[1]).reverse();

  if (lineChartInstance && donutChartInstance && locationChartInstance) {
    donutChartInstance.data.labels = Object.keys(systemCounts);
    donutChartInstance.data.datasets[0].data = Object.values(systemCounts);
    if (animateCharts) donutChartInstance.update();
    else donutChartInstance.update('none');

    lineChartInstance.data.labels = seriesLabels;
    lineChartInstance.data.datasets[0].data = seriesValues;
    if (animateCharts) lineChartInstance.update();
    else lineChartInstance.update('none');

    locationChartInstance.data.labels = locLabels;
    locationChartInstance.data.datasets[0].data = locValues;
    if (animateCharts) locationChartInstance.update();
    else locationChartInstance.update('none');
    return;
  }

  const ctxDonut = document.getElementById('systemChart').getContext('2d');
  donutChartInstance = new Chart(ctxDonut, {
    type: 'doughnut',
    data: {
      labels: Object.keys(systemCounts),
      datasets: [{
        data: Object.values(systemCounts),
        backgroundColor: ['#00c6ff', '#8e2de2', '#f8b500', '#ff7e5f', '#22c55e', '#64748b', '#36d399', '#f472b6', '#facc15'],
        borderWidth: 0,
        borderColor: '#ffffff'
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      cutout: '58%',
      plugins: {
        legend: {
          position: 'bottom',
          labels: {
            usePointStyle: true,
            pointStyle: 'circle',
            boxWidth: 10,
            boxHeight: 10,
            padding: 12,
            color: '#334155',
            font: { size: 11 }
          }
        },
        tooltip: {
          enabled: false,
          external: ({ chart, tooltip }) => {
            const container = chart.canvas.closest('.donut-chart-container')
              ?.querySelector('.system-chart-tooltip');
            if (!container) return;

            if (tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
              container.replaceChildren();
              container.classList.remove('is-visible');
              return;
            }

            const point = tooltip.dataPoints[0];
            const swatch = document.createElement('span');
            swatch.className = 'system-chart-tooltip-swatch';
            swatch.style.backgroundColor = point.element.options.backgroundColor;

            const text = document.createElement('span');
            text.textContent = `${point.label}: ${point.parsed} atendimentos`;

            container.replaceChildren(swatch, text);
            container.classList.add('is-visible');
          }
        }
      }
    }
  });

  const ctxLine = document.getElementById('timeSeriesChart').getContext('2d');
  lineChartInstance = new Chart(ctxLine, {
    type: 'line',
    data: {
      labels: seriesLabels,
      datasets: [{
        label: 'Quantidade de Atendimentos',
        data: seriesValues,
        borderColor: '#2563eb',
        backgroundColor: 'rgba(37, 99, 235, 0.10)',
        borderWidth: 3,
        pointBackgroundColor: '#2563eb',
        pointBorderColor: '#ffffff',
        pointBorderWidth: 2,
        pointRadius: 3,
        pointHoverRadius: 5,
        fill: true,
        cubicInterpolationMode: 'monotone',
        tension: 0.35,
        spanGaps: true
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      interaction: {
        mode: 'nearest',
        intersect: false
      },
      plugins: {
        legend: {
          display: false
        },
        tooltip: {
          enabled: false,
          external: ({ chart, tooltip }) => {
            const container = chart.canvas.parentElement
              ?.querySelector('.line-chart-tooltip');
            if (!container) return;

            if (tooltip.opacity === 0 || !tooltip.dataPoints?.length) {
              container.classList.remove('is-visible');
              return;
            }

            const point = tooltip.dataPoints[0];
            const swatch = document.createElement('span');
            swatch.className = 'line-chart-tooltip-swatch';

            const text = document.createElement('span');
            text.textContent = `${point.label}: ${point.parsed.y} atendimentos`;

            container.replaceChildren(swatch, text);
            container.classList.add('is-visible');

            const wrapper = chart.canvas.parentElement;
            const wrapperRect = wrapper.getBoundingClientRect();
            const canvasRect = chart.canvas.getBoundingClientRect();
            const scaleX = canvasRect.width / chart.width;
            const scaleY = canvasRect.height / chart.height;
            const pointX = canvasRect.left - wrapperRect.left + tooltip.caretX * scaleX;
            const pointY = canvasRect.top - wrapperRect.top + tooltip.caretY * scaleY;
            const chartTop = canvasRect.top - wrapperRect.top + chart.chartArea.top * scaleY;
            const gap = 8;
            const inset = 4;
            const tooltipWidth = container.offsetWidth;
            const tooltipHeight = container.offsetHeight;
            const isNearTop = pointY - chartTop < tooltipHeight + gap;

            const left = isNearTop
              ? (pointX < wrapper.clientWidth / 2
                ? pointX + gap
                : pointX - tooltipWidth - gap)
              : pointX - tooltipWidth / 2;
            const top = isNearTop
              ? pointY - tooltipHeight / 2
              : pointY - tooltipHeight - gap;

            container.style.left = `${Math.max(inset, Math.min(left, wrapper.clientWidth - tooltipWidth - inset))}px`;
            container.style.top = `${Math.max(inset, Math.min(top, wrapper.clientHeight - tooltipHeight - inset))}px`;
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: 'rgba(148,163,184,0.12)',
            drawBorder: false
          },
          ticks: {
            color: '#475569',
            maxRotation: 0,
            minRotation: 0,
            autoSkip: true,
            maxTicksLimit: 10,
            callback: function(value) {
              const label = this.getLabelForValue(value);
              if (!label) return '';
              if (label.includes('/')) {
                return label.split('/').slice(0, 2).join('/');
              }
              return label;
            }
          }
        },
        y: {
          beginAtZero: true,
          suggestedMin: 0,
          ticks: {
            stepSize: 1,
            color: '#475569'
          },
          grid: {
            color: 'rgba(148,163,184,0.12)',
            drawBorder: false
          }
        }
      }
    }
  });

  const ctxLocation = document.getElementById('locationChart').getContext('2d');
  locationChartInstance = new Chart(ctxLocation, {
    type: 'bar',
    data: {
      labels: locLabels,
      datasets: [{
        label: 'Atendimentos',
        data: locValues,
        backgroundColor: '#8e2de2',
        borderRadius: 4,
        borderSkipped: false
      }]
    },
    options: {
      indexAxis: 'y',
      responsive: true,
      maintainAspectRatio: false,
      animation: { duration: 700 },
      interaction: {
        mode: 'nearest',
        intersect: false,
        axis: 'y'
      },
      plugins: {
        legend: { display: false },
        tooltip: {
          mode: 'nearest',
          intersect: false,
          axis: 'y',
          callbacks: {
            label: (context) => `${context.parsed.x} atendimentos`
          }
        }
      },
      scales: {
        x: {
          beginAtZero: true,
          ticks: { stepSize: 1 }
        },
        y: {
          ticks: {
            font: { size: 11 }
          }
        }
      }
    }
  });

}

function exportToExcel() {
  const startInput = document.getElementById("date-start").value;
  const endInput = document.getElementById("date-end").value;

  if (!startInput || !endInput) {
    alert("Por favor, preencha a Data Inicial e a Data Final no filtro antes de gerar o relatório.");
    return;
  }

  const startDate = startInput.split('-').reverse().join('/');
  const endDate = endInput.split('-').reverse().join('/');

  const aoaData = [
    ["Atendimentos Agile"],
    [`Período: ${startDate} a ${endDate}`],
    [""],
    ["Referência", "Data", "Item (Sistema)", "Salas do edifício", "Nome afetado"]
  ];

  filteredData.forEach(d => {
    const dateFormatted = d.data ? d.data.split('-').reverse().join('/') : '-';
    aoaData.push([d.referencia, dateFormatted, d.item, d.sala, d.nome]);
  });

  const worksheet = XLSX.utils.aoa_to_sheet(aoaData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Atendimentos");
  XLSX.writeFile(workbook, `atendimentos_agile_${startInput}_a_${endInput}.xlsx`);
}

function exportToPDF() {
  const startInput = document.getElementById("date-start").value;
  const endInput = document.getElementById("date-end").value;

  if (!startInput || !endInput) {
    alert("Por favor, preencha a Data Inicial e a Data Final no filtro antes de gerar o relatório.");
    return;
  }

  const startDate = startInput.split('-').reverse().join('/');
  const endDate = endInput.split('-').reverse().join('/');
  const JsPDF = window.jspdf && window.jspdf.jsPDF;
  if (!JsPDF) {
    alert("Não foi possível carregar a biblioteca necessária para gerar o PDF. Atualize a página e tente novamente.");
    return;
  }

  const pdf = new JsPDF({ orientation: 'landscape', unit: 'pt', format: 'letter' });
  const pageWidth = pdf.internal.pageSize.getWidth();
  const pageHeight = pdf.internal.pageSize.getHeight();
  const margin = 28;
  const tableWidth = pageWidth - margin * 2;
  const columnWidths = [0.13, 0.1, 0.2, 0.39, 0.18].map(width => tableWidth * width);
  const headers = ['Referência', 'Data', 'Item (Sistema)', 'Salas do edifício', 'Nome afetado'];
  const fontSize = 7.5;
  const lineHeight = 9;
  const cellPadding = 5;
  const bottom = pageHeight - margin - 12;

  let y = margin;
  let pageNumber = 1;

  function drawTableHeader() {
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(255, 255, 255);
    pdf.setDrawColor(71, 85, 105);

    const headerLines = headers.map((header, index) =>
      pdf.splitTextToSize(header, columnWidths[index] - cellPadding * 2)
    );
    const headerHeight = Math.max(24, ...headerLines.map(lines => lines.length * lineHeight + cellPadding * 2));
    let x = margin;

    headerLines.forEach((lines, index) => {
      pdf.setFillColor(89, 140, 54);
      pdf.rect(x, y, columnWidths[index], headerHeight, 'FD');
      pdf.text(lines, x + cellPadding, y + (headerHeight - lines.length * lineHeight) / 2 + fontSize);
      x += columnWidths[index];
    });

    y += headerHeight;
  }

  function startPage() {
    if (pageNumber > 1) pdf.addPage();
    y = margin;
    if (pageNumber === 1) {
      pdf.setTextColor(15, 23, 42);
      pdf.setFont('helvetica', 'bold');
      pdf.setFontSize(14);
      pdf.text('Atendimentos Agile', margin, y + 14);
      pdf.setFont('helvetica', 'normal');
      pdf.setFontSize(9);
      pdf.setTextColor(51, 65, 85);
      pdf.text(`Período: ${startDate} a ${endDate}`, margin, y + 28);
      y += 38;
    }
    drawTableHeader();
  }

  function drawRowSegment(linesByColumn, height, rowIndex) {
    let x = margin;
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(15, 23, 42);
    pdf.setDrawColor(100, 116, 139);

    linesByColumn.forEach((lines, index) => {
      pdf.setFillColor(rowIndex % 2 === 0 ? 255 : 248, rowIndex % 2 === 0 ? 255 : 250, rowIndex % 2 === 0 ? 255 : 252);
      pdf.rect(x, y, columnWidths[index], height, 'FD');
      if (lines.length) {
        const textHeight = lines.length * lineHeight;
        pdf.text(lines, x + cellPadding, y + (height - textHeight) / 2 + fontSize);
      }
      x += columnWidths[index];
    });
    y += height;
  }

  startPage();

  if (filteredData.length === 0) {
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(fontSize);
    pdf.setTextColor(15, 23, 42);
    pdf.setDrawColor(100, 116, 139);
    pdf.setFillColor(255, 255, 255);
    pdf.rect(margin, y, tableWidth, 24, 'FD');
    pdf.text('Nenhum registro encontrado para o período selecionado.', margin + cellPadding, y + 15);
  } else {
    filteredData.forEach((row, rowIndex) => {
      const dateFormatted = row.data ? row.data.split('-').reverse().join('/') : '-';
      const values = [row.referencia, dateFormatted, row.item, row.sala, row.nome];
      const cellLines = values.map((value, index) =>
        pdf.splitTextToSize(String(value || '-'), columnWidths[index] - cellPadding * 2)
      );
      let lineOffset = 0;
      let isFirstSegment = true;

      while (cellLines.some(lines => lineOffset < lines.length) || isFirstSegment) {
        const minimumHeight = lineHeight + cellPadding * 2;
        if (y + minimumHeight > bottom) {
          pageNumber += 1;
          startPage();
        }

        const linesThatFit = Math.max(1, Math.floor((bottom - y - cellPadding * 2) / lineHeight));
        const segmentLines = cellLines.map(lines => lines.slice(lineOffset, lineOffset + linesThatFit));
        const lineCount = Math.max(1, ...segmentLines.map(lines => lines.length));
        const segmentHeight = Math.max(20, lineCount * lineHeight + cellPadding * 2);

        if (y + segmentHeight > bottom && lineOffset > 0) {
          pageNumber += 1;
          startPage();
          continue;
        }

        drawRowSegment(segmentLines, segmentHeight, rowIndex);
        lineOffset += lineCount;
        isFirstSegment = false;
      }
    });
  }

  const totalPages = pdf.internal.getNumberOfPages();
  for (let page = 1; page <= totalPages; page += 1) {
    pdf.setPage(page);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(8);
    pdf.setTextColor(100, 116, 139);
    pdf.text(`Página ${page} de ${totalPages}`, pageWidth - margin, pageHeight - 12, { align: 'right' });
  }

  pdf.save(`relatorio_atendimentos_${startInput}_a_${endInput}.pdf`);
}