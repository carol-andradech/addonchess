// ==UserScript==
// @name         Chess.com - Audio Moves (Peça + Casa)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Toca áudios para cada lance na página de análise do Chess.com (peça + casa + extras)
// @match        https://www.chess.com/analysis*
// @match        https://www.chess.com/pt-BR/analysis*
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  console.log("[AudioMoves] Script carregado");

  // =========================
  // CONFIGURAÇÃO DOS ÁUDIOS
  // =========================

  // Coloque aqui a URL base onde seus áudios estão hospedados.
  // Exemplo: "https://meu-servidor.com/audios/" ou "https://raw.githubusercontent.com/..."
  const AUDIO_BASE = "C:UsersCarolDownloadsaddonchessaudios";

  function fileUrl(name) {
    // monta "https://.../peao.mp3" ou "https://.../e4.mp3"
    return AUDIO_BASE + name + ".mp3";
  }

  // =========================
  // SISTEMA DE FILA DE ÁUDIO
  // =========================

  let audioQueue = [];
  let currentAudio = null;

  function playNextInQueue() {
    if (audioQueue.length === 0) {
      currentAudio = null;
      return;
    }

    const src = audioQueue.shift();
    const audio = new Audio(src);
    currentAudio = audio;

    audio.addEventListener("ended", () => {
      playNextInQueue();
    });

    audio.play().catch((err) => {
      console.warn("[AudioMoves] Erro ao tocar áudio:", src, err);
      // se der erro, pula pro próximo
      playNextInQueue();
    });
  }

  function playAudioSequence(names) {
    // names: ["cavalo", "captura", "f3", "cheque"]
    if (!names || names.length === 0) return;

    audioQueue = names.map(fileUrl);
    playNextInQueue();
  }

  // =========================
  // PARSE DO MOVIMENTO (SAN)
  // =========================

  function parseSAN(moveText) {
    // moveText vem tipo: "Nf3", "exd5", "Qh5+", "O-O", "O-O-O#", "e8=Q+", etc.
    if (!moveText) return null;

    let san = moveText.trim();

    // --- Roque ---
    if (/^(O-O-O|0-0-0)/.test(san)) {
      const checkType = san.includes("#")
        ? "mate"
        : san.includes("+")
        ? "cheque"
        : null;
      return {
        type: "castle",
        side: "long",
        check: checkType === "cheque",
        mate: checkType === "mate",
      };
    }

    if (/^(O-O|0-0)/.test(san)) {
      const checkType = san.includes("#")
        ? "mate"
        : san.includes("+")
        ? "cheque"
        : null;
      return {
        type: "castle",
        side: "short",
        check: checkType === "cheque",
        mate: checkType === "mate",
      };
    }

    // --- Check / mate ---
    let check = false;
    let mate = false;
    if (san.endsWith("#")) {
      mate = true;
      san = san.slice(0, -1);
    } else if (san.endsWith("+")) {
      check = true;
      san = san.slice(0, -1);
    }

    // --- Promoção (tipo e8=Q) — por enquanto só ignoramos o "=Q" pro parse da casa ---
    san = san.replace(/=([QRBN])/, "");

    // --- Captura ---
    let capture = san.includes("x") || san.includes("×");
    san = san.replace("x", "").replace("×", "");

    // --- Peça ---
    let pieceLetter = "P"; // se não tiver letra, é peão
    if (/^[KQRBN]/.test(san[0])) {
      pieceLetter = san[0];
      san = san.slice(1); // tira a letra da peça
    }

    // --- A casa final costuma ser os dois últimos caracteres: e4, d5, f3 etc ---
    const square = san.slice(-2);

    return {
      type: "normal",
      pieceLetter,
      capture,
      square,
      check,
      mate,
    };
  }

  function pieceLetterToName(pt) {
    switch (pt) {
      case "K":
        return "rei";
      case "Q":
        return "dama";
      case "R":
        return "torre";
      case "B":
        return "bispo";
      case "N":
        return "cavalo";
      case "P":
      default:
        return "peao";
    }
  }

  function buildAudioNamesFromSAN(moveText) {
    const info = parseSAN(moveText);
    if (!info) return [];

    // Roques
    if (info.type === "castle") {
      const names = [];
      if (info.side === "short") {
        names.push("roque-curto");
      } else {
        names.push("roque-longo");
      }
      if (info.mate) names.push("mate");
      else if (info.check) names.push("cheque");
      return names;
    }

    // Lance normal
    const names = [];

    const pieceName = pieceLetterToName(info.pieceLetter);
    const square = info.square.toLowerCase(); // "f3", "e4" etc.

    // peça
    names.push(pieceName);

    // captura
    if (info.capture) {
      names.push("captura");
    }

    // casa
    names.push(square);

    // cheque / mate
    if (info.mate) {
      names.push("mate");
    } else if (info.check) {
      names.push("cheque");
    }

    return names;
  }

  // =========================
  // PEGAR O LANCE SELECIONADO
  // =========================

  function getSelectedMoveSpan() {
    return document.querySelector(
      "span.node-highlight-content.offset-for-annotation-icon.selected"
    );
  }

  function getCurrentMoveData() {
    const span = getSelectedMoveSpan();
    if (!span) return null;

    const nodeDiv = span.closest("[data-node]");
    const nodeId = nodeDiv ? nodeDiv.getAttribute("data-node") : null;

    // innerText já pega texto da casa + ícone da peça (tipo "♘f3" → "Nf3" no SAN real)
    let text = span.innerText || span.textContent || "";
    text = text.trim();

    if (!text) return null;

    return { nodeId, san: text };
  }

  let lastNodeId = null;

  function onMoveSelectionChange() {
    const data = getCurrentMoveData();
    if (!data) return;

    const { nodeId, san } = data;

    // Para não repetir o mesmo lance toda hora
    if (nodeId && nodeId === lastNodeId) return;
    lastNodeId = nodeId;

    console.log("[AudioMoves] Lance selecionado:", san, "node:", nodeId);

    const names = buildAudioNamesFromSAN(san);
    if (!names.length) return;

    console.log("[AudioMoves] Tocando sequência:", names);
    playAudioSequence(names);
  }

  // =========================
  // OBSERVADOR DO DOM
  // =========================

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (
        mutation.type === "attributes" &&
        mutation.target &&
        mutation.target.classList &&
        mutation.target.classList.contains("node-highlight-content")
      ) {
        onMoveSelectionChange();
        return;
      }
    }
    // fallback: se qualquer coisa mudar, tenta também
    onMoveSelectionChange();
  });

  function startObserverWhenReady() {
    // container da lista de lances
    const list = document.querySelector(".move-list, .vertical-move-list");
    if (!list) {
      setTimeout(startObserverWhenReady, 1000);
      return;
    }

    console.log(
      "[AudioMoves] Lista de lances encontrada, iniciando observer..."
    );

    observer.observe(document.body, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ["class"],
    });

    // tenta ler o lance atual
    onMoveSelectionChange();
  }

  window.addEventListener("load", () => {
    startObserverWhenReady();
  });
})();
