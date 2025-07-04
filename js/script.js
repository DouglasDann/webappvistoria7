// 🧩 1. Autopreenchimento do formulário com localStorage
document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("formulario-vistoria");
  const campos = form.querySelectorAll("input, select");

  campos.forEach(campo => {
    const valorSalvo = localStorage.getItem(campo.id);
    if (valorSalvo !== null) {
      campo.value = valorSalvo;
    }

    campo.addEventListener("input", () => {
      localStorage.setItem(campo.id, campo.value);
    });

    campo.addEventListener("change", () => {
      localStorage.setItem(campo.id, campo.value);
    });
  });

  // Preenche a data automaticamente
  const dataInput = document.getElementById("data");
  if (dataInput) {
    dataInput.value = new Date().toISOString().split("T")[0];
  }

  // Restaura aba ativa
  const abaSalva = localStorage.getItem("abaAtiva");
  if (abaSalva) {
    iniciarVistoria();
    setTimeout(() => {
      const botao = document.querySelector(`.icone-aba[onclick*="${abaSalva}"]`);
      if (botao) {
        mostrarAba(abaSalva, botao);
        setTimeout(() => {
          restaurarAmbiente("aba-" + abaSalva);
        }, 100);
      }
    }, 100);
  }
});

// 🧩 2. Alternância entre técnico e não técnico
const toggle = document.getElementById("isTecnico");
const divTecnico = document.getElementById("dados-tecnico");
const divNaoTecnico = document.getElementById("dados-nao-tecnico");
const inputProprietario = document.getElementById("nomeProprietario");
const inputAlternativo = document.getElementById("nomeVistoriadorAlternativo");

toggle.addEventListener("change", () => {
  const modoTecnico = toggle.checked;
  divTecnico.style.display = modoTecnico ? "block" : "none";
  divNaoTecnico.style.display = modoTecnico ? "none" : "block";
  inputAlternativo.disabled = modoTecnico;
  if (!modoTecnico) {
    inputAlternativo.value = inputProprietario.value;
    localStorage.setItem(inputAlternativo.id, inputAlternativo.value);
  }
});

inputProprietario.addEventListener("input", () => {
  if (!toggle.checked) {
    inputAlternativo.value = inputProprietario.value;
    localStorage.setItem(inputAlternativo.id, inputAlternativo.value);
  }
});

// 🧩 3. Navegação entre abas
function iniciarVistoria() {
  document.getElementById("formulario-vistoria")?.classList.add("hidden");
  document.getElementById("barra-abas")?.classList.remove("hidden");
  document.getElementById("abas-vistoria")?.classList.remove("hidden");
}

function voltarFormulario() {
  document.getElementById("formulario-vistoria")?.classList.remove("hidden");
  document.getElementById("barra-abas")?.classList.add("hidden");
  document.getElementById("abas-vistoria")?.classList.add("hidden");
  document.querySelectorAll(".icone-aba").forEach(i => i.classList.remove("active"));
  document.querySelectorAll("#abas-vistoria section").forEach(s => s.classList.add("hidden"));
  localStorage.removeItem("abaAtiva");
};

function mostrarAba(id, el) {
  document.querySelectorAll("#abas-vistoria section").forEach(s => s.classList.add("hidden"));
  const ativa = document.getElementById("aba-" + id);
  if (ativa) {
    ativa.classList.remove("hidden");
    restaurarAmbiente("aba-" + id);
    ativarAutoSalvar("aba-" + id);
  }
  document.querySelectorAll(".icone-aba").forEach(i => i.classList.remove("active"));
  if (el) el.classList.add("active");
  localStorage.setItem("abaAtiva", id);
};

// 🧩 4. Ambiente: salvar, restaurar, autosalvar
function salvarAmbiente(botao) {
  const section = botao.closest("section");
  const ambienteId = section.id;
  const ambienteNome = section.querySelector("h5")?.textContent || ambienteId;
  const linhas = Array.from(section.querySelectorAll("tbody tr"));
  const dados = [];
  const pendentes = [];

  linhas.forEach((tr, i) => {
    const celulas = tr.querySelectorAll("td");
    const item = celulas[0]?.querySelector("input")?.value || celulas[0]?.textContent.trim() || `Item ${i + 1}`;
    const obs = celulas[5]?.querySelector("input")?.value || "";

    let status = "", statusId = "";
    const radios = tr.querySelectorAll("input[type=radio]");
    radios.forEach(r => {
      if (r.checked) {
        const label = section.querySelector(`label[for="${r.id}"]`);
        if (label) {
          statusId = r.id;
          status = label.textContent.trim();
        }
      }
    });

    const fotos = (JSON.parse(localStorage.getItem(ambienteId) || "[]")[i]?.fotos) || [];
    if (!statusId) pendentes.push(`• ${item}`);
    dados.push({ item, status, statusId, obs, fotos });
  });

  if (pendentes.length > 0) {
    alert(`⚠️ O ambiente **${ambienteNome}** possui itens sem status:\n\n${pendentes.join("\n")}`);
    return;
  }

  localStorage.setItem(ambienteId, JSON.stringify(dados));
  alert(`✅ Ambiente "${ambienteNome}" salvo com sucesso!`);
};

function salvarAmbienteManual(section) {
  const ambienteId = section.id;
  const linhas = section.querySelectorAll("tbody tr");
  const dados = [];

  linhas.forEach(tr => {
    const celulas = tr.querySelectorAll("td");
    const item = celulas[0]?.querySelector("input")?.value || celulas[0]?.textContent.trim();
    const obs = celulas[5]?.querySelector("input")?.value || "";

    let status = "", statusId = "";
    const radios = tr.querySelectorAll("input[type=radio]");
    radios.forEach(r => {
      if (r.checked) {
        const label = section.querySelector(`label[for="${r.id}"]`);
        if (label) {
          statusId = r.id;
          status = label.textContent.trim();
        }
      }
    });

    const fotos = (JSON.parse(localStorage.getItem(ambienteId) || "[]").find(l => l.item === item)?.fotos) || [];
    dados.push({ item, status, statusId, obs, fotos });
  });

  localStorage.setItem(ambienteId, JSON.stringify(dados));
};

function ativarAutoSalvar(ambienteId) {
  const section = document.getElementById(ambienteId);
  if (!section || section.dataset.autosalvador === "ativado") return;
  section.dataset.autosalvador = "ativado";

  const campos = section.querySelectorAll("input[type=radio], input[type=text]");
  campos.forEach(input => {
    input.addEventListener("change", () => {
      salvarAmbienteManual(section);
    });
  });
};

function restaurarAmbiente(ambienteId) {
  const section = document.getElementById(ambienteId);
  if (!section) return;
  const tbody = section.querySelector("table tbody");
  const dados = JSON.parse(localStorage.getItem(ambienteId) || "[]");
  const linhas = Array.from(tbody.querySelectorAll("tr"));

  linhas.forEach((tr, i) => {
    const dadosLinha = dados[i];
    if (!dadosLinha) return;
    const celulas = tr.querySelectorAll("td");

    const inputItem = celulas[0].querySelector("input");
    if (inputItem) inputItem.value = dadosLinha.item;
    if (dadosLinha.statusId) {
      const radio = tr.querySelector(`input[type="radio"]#${dadosLinha.statusId}`);
      if (radio) radio.checked = true;
    }

    const obsInput = celulas[5].querySelector("input");
    if (obsInput) obsInput.value = dadosLinha.obs;
  });
};

// 🧩 5. Dinâmica das linhas
function adicionarLinha(botao) {
  const tabela = botao.closest("section")?.querySelector("table tbody");
  if (!tabela) return;
  const timestamp = Date.now();
  const novaLinha = document.createElement("tr");
  novaLinha.classList.add("linha-dinamica");

  novaLinha.innerHTML = `
    <td><input type="text" class="form-control" placeholder="Novo item" /></td>
    <td class="text-center status">
      <input type="radio" name="status${timestamp}" id="na${timestamp}" />
      <label for="na${timestamp}">N/A</label>
    </td>
    <td class="text-center status">
      <input type="radio" name="status${timestamp}" id="c${timestamp}" />
      <label for="c${timestamp}">Conforme</label>
    </td>
    <td class="text-center status">
      <input type="radio" name="status${timestamp}" id="nc${timestamp}" />
      <label for="nc${timestamp}">Não Conforme</label>
    </td>
    <td class="text-center foto-col">
      <div class="fotos-container"></div>
      <label class="cursor-pointer">
        <i class="fa-solid fa-camera"></i>
        <input type="file" accept="image/*" capture="environment" style="display: none;" onchange="previewFoto(this)">
      </label>
    </td>
    <td><input type="text" class="form-control" placeholder="Observações" /></td>
  `;

  tabela.appendChild(novaLinha);
};

function salvarVistoria() {
  const ambientes = document.querySelectorAll("section[id]");
  let pendentes = [];

  // 1. Verifica se todos os ambientes têm todos os itens avaliados
  ambientes.forEach(section => {
    const ambienteId = section.id;
    const ambienteNome = section.querySelector("h5")?.textContent || ambienteId;
    const linhas = section.querySelectorAll("tbody tr");

    linhas.forEach((tr, i) => {
      const item = tr.querySelector("td input")?.value || tr.querySelector("td")?.textContent.trim() || `Item ${i + 1}`;
      const radios = tr.querySelectorAll("input[type=radio]");
      const algumSelecionado = Array.from(radios).some(r => r.checked);
      if (!algumSelecionado) {
        pendentes.push(`• [${ambienteNome}] → ${item}`);
      }
    });
  });

  if (pendentes.length > 0) {
    alert(`⚠️ Existem itens sem status definido:\n\n${pendentes.join("\n")}\n\nPor favor, revise antes de finalizar.`);
    return;
  }

  // 2. Pergunta se a vistoria foi aprovada
  const resultado = confirm("✅ A vistoria foi aprovada?\nClique em OK para SIM ou Cancelar para NÃO");
  localStorage.setItem("vistoria_aprovada", resultado ? "sim" : "nao");

  // 3. Redireciona para outro arquivo HTML
  window.location.href = "relatorio.html"; // troque para o nome do seu arquivo destino
}

if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("service-worker.js")
    .then(() => console.log("✔️ Service Worker registrado com sucesso"))
    .catch(err => console.warn("❌ Falha ao registrar Service Worker:", err));
};
