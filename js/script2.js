// =========================================================================
// 🧩 1. CONFIGURAÇÃO DO NOVO ARMAZENAMENTO SEGURO (ARMÁRIO GIGANTE)
// =========================================================================
// Aqui configuramos o banco de dados do celular para aceitar muitas fotos.
localforage.config({
  driver: localforage.INDEXEDDB,
  name: 'SistemaVistorias',
  version: 1.0,
  storeName: 'dados_vistoria',
  description: 'Armazenamento seguro para fotos e relatórios de vistoria'
});

// =========================================================================
// 🧩 2. AUTOPREENCHIMENTO DO FORMULÁRIO INICIAL
// =========================================================================
document.addEventListener("DOMContentLoaded", async () => {
  const form = document.getElementById("formulario-vistoria");
  if (form) {
    const campos = form.querySelectorAll("input, select, textarea");

    // Busca as informações textuais básicas que foram salvas
    for (let campo of campos) {
      const valorSalvo = await localforage.getItem('form_' + campo.id);
      if (valorSalvo !== null) {
        campo.value = valorSalvo;
      }

      // Salva automaticamente quando o usuário digita ou altera algo
      const salvarMudanca = async () => {
        await localforage.setItem('form_' + campo.id, campo.value);
      };
      campo.addEventListener("input", salvarMudanca);
      campo.addEventListener("change", salvarMudanca);
    }
  }

  // Preenche a data de hoje automaticamente se estiver em branco
  const dataInput = document.getElementById("data");
  if (dataInput && !dataInput.value) {
    dataInput.value = new Date().toISOString().split("T")[0];
    await localforage.setItem('form_data', dataInput.value);
  }

  // Verifica se o usuário já estava em alguma aba antes de recarregar a página
  const abaSalva = await localforage.getItem("abaAtiva");
  if (abaSalva) {
    iniciarVistoria();
    setTimeout(() => {
      const botao = document.querySelector(`.icone-aba[onclick*="${abaSalva}"]`);
      if (botao) mostrarAba(abaSalva, botao);
    }, 100);
  }
});

// =========================================================================
// 🧩 3. ALTERNÂNCIA ENTRE MODO TÉCNICO E PROPRIETÁRIO
// =========================================================================
const toggle = document.getElementById("isTecnico");
const divTecnico = document.getElementById("dados-tecnico");
const divNaoTecnico = document.getElementById("dados-nao-tecnico");
const inputProprietario = document.getElementById("nomeProprietario");
const inputAlternativo = document.getElementById("nomeVistoriadorAlternativo");

if (toggle && inputProprietario && inputAlternativo) {
  const gerenciarModoTecnico = async () => {
    const modoTecnico = toggle.checked;
    if (divTecnico) divTecnico.style.display = modoTecnico ? "block" : "none";
    if (divNaoTecnico) divNaoTecnico.style.display = modoTecnico ? "none" : "block";
    
    inputAlternativo.disabled = modoTecnico;
    if (!modoTecnico) {
      inputAlternativo.value = inputProprietario.value;
      await localforage.setItem('form_' + inputAlternativo.id, inputAlternativo.value);
    }
  };

  toggle.addEventListener("change", gerenciarModoTecnico);
  inputProprietario.addEventListener("input", async () => {
    if (!toggle.checked) {
      inputAlternativo.value = inputProprietario.value;
      await localforage.setItem('form_' + inputAlternativo.id, inputAlternativo.value);
    }
  });
}

// =========================================================================
// 🧩 4. GERAÇÃO DINÂMICA DOS ÍCONES DOS AMBIENTES (ABAS)
// =========================================================================
async function atualizarIcones() {
  const domInput = document.getElementById("dormitorios");
  const banInput = document.getElementById("banheiros");
  const sacInput = document.getElementById("sacada");
  const container = document.getElementById("container-icones");

  if (!container || !domInput || !banInput || !sacInput) return;

  let qtdDormitorios = parseInt(domInput.value) || 0;
  let qtdBanheiros = parseInt(banInput.value) || 0;
  let temSacada = sacInput.value;

  container.innerHTML = "";

  // 🔹 Ambientes Fixos
  container.innerHTML += `
    <div class="icone-aba" onclick="mostrarAba('cozinha', this)">
      <i class="fa-solid fa-utensils fa-2x"></i><br>
      <small>Cozinha</small>
    </div>
    <div class="icone-aba" onclick="mostrarAba('area-servico', this)">
      <i class="fa-solid fa-sink fa-2x"></i><br>
      <small>Área Serviço</small>
    </div>
    <div class="icone-aba" onclick="mostrarAba('sala', this)">
      <i class="fa-solid fa-couch fa-2x"></i><br>
      <small>Sala</small>
    </div>
  `;

  // 🛏️ Quartos dinâmicos
  for (let i = 1; i <= qtdDormitorios; i++) {
    container.innerHTML += `
      <div class="icone-aba" onclick="mostrarAba('dormitorio${i}', this)">
        <i class="fa-solid fa-bed fa-2x"></i><br>
        <small>Dorm. ${i}</small>
      </div>
    `;
  }

  // 🚽 Banheiros dinâmicos
  for (let i = 1; i <= qtdBanheiros; i++) {
    container.innerHTML += `
      <div class="icone-aba" onclick="mostrarAba('banheiro${i}', this)">
        <i class="fa-solid fa-toilet fa-2x"></i><br>
        <small>Banho ${i}</small>
      </div>
    `;
  }

  // 🏠 Sacada opcional
  if (temSacada === "sim") {
    container.innerHTML += `
      <div class="icone-aba" onclick="mostrarAba('sacada', this)">
        <i class="fa-solid fa-shield-halved fa-2x"></i><br>
        <small>Sacada</small>
      </div>
    `;
  }
  
  const abaAtiva = await localforage.getItem("abaAtiva");
  if (abaAtiva) {
    const botaoAtivo = container.querySelector(`[onclick*="'${abaAtiva}'"]`);
    if (botaoAtivo) botaoAtivo.classList.add("active");
  }
}

// Vincula os seletores numéricos para criarem as abas na hora
document.addEventListener("DOMContentLoaded", () => {
  const dom = document.getElementById("dormitorios");
  const ban = document.getElementById("banheiros");
  const sac = document.getElementById("sacada");

  if (dom) dom.addEventListener("change", atualizarIcones);
  if (ban) ban.addEventListener("change", atualizarIcones);
  if (sac) sac.addEventListener("change", atualizarIcones);

  atualizarIcones();
});

// =========================================================================
// 🧩 5. NAVEGAÇÃO ENTRE AS ABAS DA VISTORIA
// =========================================================================
async function iniciarVistoria() {
  document.getElementById("formulario-vistoria")?.classList.add("hidden");
  document.getElementById("barra-abas")?.classList.remove("hidden");
  document.getElementById("abas-vistoria")?.classList.remove("hidden");
  
  if (!(await localforage.getItem("abaAtiva"))) {
    const primeiroIcone = document.querySelector(".icone-aba");
    if (primeiroIcone) primeiroIcone.click();
  }
}

function voltarFormulario() {
  document.getElementById("formulario-vistoria")?.classList.remove("hidden");
  document.getElementById("barra-abas")?.classList.add("hidden");
  document.getElementById("abas-vistoria")?.classList.add("hidden");
  document.querySelectorAll(".icone-aba").forEach(i => i.classList.remove("active"));
  document.querySelectorAll("#abas-vistoria section").forEach(s => s.classList.add("hidden"));
  localforage.removeItem("abaAtiva");
}

async function mostrarAba(id, el) {
  document.querySelectorAll("#abas-vistoria section").forEach(s => s.classList.add("hidden"));
  
  let baseId = id;
  if (id.startsWith("banheiro")) baseId = "banheiro";
  if (id.startsWith("dormitorio")) baseId = "dormitorio";

  const ativa = document.getElementById("aba-" + baseId);
  if (ativa) {
    ativa.classList.remove("hidden");
    
    const h5 = ativa.querySelector("h5");
    if (h5) {
      const nomeLimpo = baseId.charAt(0).toUpperCase() + baseId.slice(1);
      h5.textContent = id.startsWith("banheiro") || id.startsWith("dormitorio") 
        ? `${nomeLimpo.replace("dormitorio", "Dormitório")} ${id.replace(/^\D+/g, "")}`
        : h5.textContent;
    }

    await restaurarAmbiente("aba-" + baseId, id);
    ativarAutoSalvar("aba-" + baseId, id);
  }

  document.querySelectorAll(".icone-aba").forEach(i => i.classList.remove("active"));
  if (el) el.classList.add("active");
  await localforage.setItem("abaAtiva", id);
}

// =========================================================================
// 🧩 6. SALVAMENTO E RESTAURAÇÃO DE ITENS E FOTOS (MIGRAÇÃO INDEXEDDB)
// =========================================================================
async function obterDadosTabela(section, chaveInstancia) {
  const linhas = section.querySelectorAll("tbody tr");
  const dados = [];

  for (let i = 0; i < linhas.length; i++) {
    const tr = linhas[i];
    const celulas = tr.querySelectorAll("td");
    if (celulas.length < 6) continue;

    const item = celulas[0]?.querySelector("input")?.value || celulas[0]?.textContent.trim() || `Item ${i + 1}`;
    const obs = celulas[5]?.querySelector("input")?.value || "";

    let status = "", statusId = "";
    const radios = tr.querySelectorAll("input[type=radio]");
    radios.forEach(r => {
      if (r.checked) {
        statusId = r.id;
        const label = section.querySelector(`label[for="${r.id}"]`);
        if (label) status = label.textContent.trim();
      }
    });

    // Pega as fotos antigas direto do banco seguro para não perdê-las
    const dadosAntigos = await localforage.getItem(chaveInstancia) || [];
    const fotos = dadosAntigos[i]?.fotos || [];

    dados.push({ item, status, statusId, obs, fotos, isDinamica: tr.classList.contains("linha-dinamica") });
  }

  return dados;
}

async function salvarAmbiente(botao) {
  const section = botao.closest("section");
  const virtualId = await localforage.getItem("abaAtiva") || section.id.replace("aba-", "");
  const h5Texto = section.querySelector("h5")?.textContent || virtualId;
  
  const dados = await obterDadosTabela(section, virtualId);
  const pendentes = [];

  dados.forEach(d => {
    if (!d.statusId) pendentes.push(`• ${d.item}`);
  });

  if (pendentes.length > 0) {
    alert(`⚠️ O ambiente **${h5Texto}** possui itens sem status:\n\n${pendentes.join("\n")}`);
    return;
  }

  await localforage.setItem(virtualId, dados);
  alert(`✅ Ambiente "${h5Texto}" salvo com sucesso com armazenamento expandido!`);
}

async function salvarAmbienteManual(section, chaveInstancia) {
  const dados = await obterDadosTabela(section, chaveInstancia);
  await localforage.setItem(chaveInstancia, dados);
}

function activarAutoSalvar(ambienteId, chaveInstancia) {
  const section = document.getElementById(ambienteId);
  if (!section) return;

  section.querySelectorAll("input").forEach(input => {
    if(input.type !== 'file') {
      const novoInput = input.cloneNode(true);
      input.parentNode.replaceChild(novoInput, input);
    }
  });

  const campos = section.querySelectorAll("input[type=radio], input[type=text]");
  campos.forEach(input => {
    input.addEventListener("change", () => salvarAmbienteManual(section, chaveInstancia));
    input.addEventListener("input", () => salvarAmbienteManual(section, chaveInstancia));
  });
}

async function restaurarAmbiente(ambienteId, chaveInstancia) {
  const section = document.getElementById(ambienteId);
  if (!section) return;
  const tbody = section.querySelector("table tbody");
  if (!tbody) return;

  const dados = await localforage.getItem(chaveInstancia) || [];
  
  tbody.querySelectorAll(".linha-dinamica").forEach(l => l.remove());
  const linhasEstaticas = Array.from(tbody.querySelectorAll("tr"));

  dados.forEach((dadosLinha, i) => {
    let tr = linhasEstaticas[i];

    if (!tr && dadosLinha.isDinamica) {
      tr = adicionarLinhaRetorno(tbody, dadosLinha.item);
    }

    if (!tr) return;
    const celulas = tr.querySelectorAll("td");
    
    const inputItem = celulas[0].querySelector("input");
    if (inputItem) inputItem.value = dadosLinha.item;

    if (dadosLinha.statusId) {
      const radio = tr.classList.contains("linha-dinamica") 
        ? tr.querySelector(`input[type="radio"][id^="${dadosLinha.statusId.substring(0, 2)}"]`)
        : section.querySelector(`input[type="radio"]#${dadosLinha.statusId}`);
        
      if (radio) radio.checked = true;
    }

    const obsInput = celulas[5].querySelector("input");
    if (obsInput) obsInput.value = dadosLinha.obs;

    const containerFotos = celulas[4].querySelector(".fotos-container");
    if (containerFotos) {
      containerFotos.innerHTML = "";
      dadosLinha.fotos.forEach(src => {
        const img = document.createElement("img");
        img.src = src;
        img.style.width = "45px";
        img.style.height = "45px";
        img.style.objectFit = "cover";
        img.style.borderRadius = "4px";
        img.style.marginRight = "5px";
        containerFotos.appendChild(img);
      });
    }
  });

  if (dados.length === 0) {
    linhasEstaticas.forEach(tr => {
      tr.querySelectorAll("input[type=radio]").forEach(r => r.checked = false);
      tr.querySelectorAll("input[type=text]").forEach(i => i.value = "");
      const c = tr.querySelector(".fotos-container");
      if (c) c.innerHTML = "";
    });
  }
}

// =========================================================================
// 🧩 7. ADICIONAR E EXCLUIR LINHAS CUSTOMIZADAS
// =========================================================================
function adicionarLinha(botao) {
  const tbody = botao.closest("section")?.querySelector("table tbody");
  if (!tbody) return;
  adicionarLinhaRetorno(tbody, "");
}

function adicionarLinhaRetorno(tbody, valorItem) {
  const timestamp = Date.now() + Math.floor(Math.random() * 1000);
  const novaLinha = document.createElement("tr");
  novaLinha.classList.add("linha-dinamica");

  novaLinha.innerHTML = `
    <td><input type="text" class="form-control" placeholder="Novo item" value="${valorItem}" /></td>
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
      <div class="fotos-container" style="display: inline-block; margin-bottom: 4px;"></div>
      <label class="cursor-pointer" style="display: block;">
        <i class="fa-solid fa-camera"></i>
        <input type="file" accept="image/*" capture="environment" style="display: none;" onchange="previewFoto(this)">
      </label>
    </td>
    <td><input type="text" class="form-control" placeholder="Observações" /></td>
  `;

  tbody.appendChild(novaLinha);
  return novaLinha;
}

async function excluirUltimaLinha(botao) {
  const tbody = botao.closest("section")?.querySelector("table tbody");
  const linhasDinamicas = tbody?.querySelectorAll(".linha-dinamica");
  if (linhasDinamicas && linhasDinamicas.length > 0) {
    linhasDinamicas[linhasDinamicas.length - 1].remove();
    const section = botao.closest("section");
    const virtualId = await localforage.getItem("abaAtiva") || section.id.replace("aba-", "");
    await salvarAmbienteManual(section, virtualId);
  } else {
    alert("Não existem mais itens customizados para excluir neste ambiente.");
  }
}

// =========================================================================
// 🧩 8. CAPTURA DA CÂMERA E COMPRESSÃO DA FOTO (NOVO!)
// =========================================================================
// Esta função tira a foto e diminui o tamanho dela de forma inteligente para não pesar.
function previewFoto(input) {
  if (!input.files || !input.files[0]) return;

  const file = input.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    const imgOriginal = new Image();
    imgOriginal.src = e.target.result;

    imgOriginal.onload = async function() {
      // Cria uma tela invisível para redimensionar a imagem de campo
      const canvas = document.createElement('canvas');
      let largura = imgOriginal.width;
      let altura = imgOriginal.height;
      
      // Define uma resolução máxima padrão excelente para relatórios (1280px)
      const MAX_RESOLUCAO = 1280;
      if (largura > altura) {
        if (largura > MAX_RESOLUCAO) {
          altura *= MAX_RESOLUCAO / largura;
          largura = MAX_RESOLUCAO;
        }
      } else {
        if (altura > MAX_RESOLUCAO) {
          largura *= MAX_RESOLUCAO / altura;
          altura = MAX_RESOLUCAO;
        }
      }

      canvas.width = largura;
      canvas.height = altura;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(imgOriginal, 0, 0, largura, altura);

      // Converte a imagem comprimida com qualidade de 70% (fica leve e nítida)
      const fotoComprimidaBase64 = canvas.toDataURL('image/jpeg', 0.7);

      const td = input.closest("td");
      const container = td.querySelector(".fotos-container");

      // Mostra a miniatura na tabela
      const imgMiniatura = document.createElement("img");
      imgMiniatura.src = fotoComprimidaBase64;
      imgMiniatura.style.width = "45px";
      imgMiniatura.style.height = "45px";
      imgMiniatura.style.objectFit = "cover";
      imgMiniatura.style.borderRadius = "4px";
      imgMiniatura.style.marginRight = "5px";
      container.appendChild(imgMiniatura);

      // Salva a foto direto no novo armário seguro do celular
      const section = input.closest("section");
      const tr = input.closest("tr");
      const virtualId = await localforage.getItem("abaAtiva") || section.id.replace("aba-", "");
      const linhas = Array.from(section.querySelectorAll("tbody tr"));
      const indexLinha = linhas.indexOf(tr);

      if (indexLinha !== -1) {
        const dadosAmbiente = await localforage.getItem(virtualId) || [];
        if (!dadosAmbiente[indexLinha]) {
          dadosAmbiente[indexLinha] = { item: "", status: "", statusId: "", obs: "", fotos: [] };
        }
        if (!dadosAmbiente[indexLinha].fotos) dadosAmbiente[indexLinha].fotos = [];
        
        dadosAmbiente[indexLinha].fotos.push(fotoComprimidaBase64);
        await localforage.setItem(virtualId, dadosAmbiente);
      }
    };
  };

  reader.readAsDataURL(file);
}

// =========================================================================
// 🧩 9. FINALIZAÇÃO E VALIDAÇÃO DA VISTORIA
// =========================================================================
async function salvarVistoria() {
  const domInput = document.getElementById("dormitorios");
  const banInput = document.getElementById("banheiros");
  const sacInput = document.getElementById("sacada");

  if (!domInput || !banInput || !sacInput) return;

  let qtdDormitorios = parseInt(domInput.value) || 0;
  let qtdBanheiros = parseInt(banInput.value) || 0;
  let temSacada = sacInput.value;

  let chavesObrigatorias = ["cozinha", "area-servico", "sala"];
  for (let i = 1; i <= qtdDormitorios; i++) chavesObrigatorias.push(`dormitorio${i}`);
  for (let i = 1; i <= qtdBanheiros; i++) chavesObrigatorias.push(`banheiro${i}`);
  if (temSacada === "sim") chavesObrigatorias.push("sacada");

  let pendentes = [];

  for (let chave of chavesObrigatorias) {
    const dados = await localforage.getItem(chave) || [];
    const nomeAmigavel = chave.charAt(0).toUpperCase() + chave.slice(1);

    if (dados.length === 0) {
      pendentes.push(`• Ambiente não aberto/avaliado: [${nomeAmigavel}]`);
    } else {
      dados.forEach(item => {
        if (!item.statusId) {
          pendentes.push(`• [${nomeAmigavel}] → ${item.item}`);
        }
      });
    }
  }

  if (pendentes.length > 0) {
    alert(`⚠️ Existem pendências para finalizar a vistoria:\n\n${pendentes.join("\n")}\n\nPor favor, revise antes de concluir.`);
    return;
  }

  const resultado = confirm("✅ Todos os itens foram validados! A vistoria foi APROVADA?\n\nClique em OK para SIM\nClique em CANCELAR para NÃO.");
  await localforage.setItem("vistoria_aprovada", resultado ? "sim" : "nao");

  window.location.href = "relatorio.html";
}