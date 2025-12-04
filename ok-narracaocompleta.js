// ==UserScript==
// @name         Chess.com - Áudio natural (v4.2 — ultrarrápido, análise + ao vivo + game)
// @namespace    http://tampermonkey.net/
// @version      4.2
// @description  Narra lances no Chess.com com áudio rápido, natural e detecção instantânea em análise, ao vivo e /game.
// @match        https://www.chess.com/analysis*
// @match        https://www.chess.com/pt-BR/analysis*
// @match        https://www.chess.com/live*
// @match        https://www.chess.com/pt-BR/live*
// @match        https://www.chess.com/game/*
// @match        https://www.chess.com/pt-BR/game/*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  console.log("[chess-audio] v4.2 carregado");

  const AUDIO_BASE =
    "https://raw.githubusercontent.com/carol-andradech/addonchess/main/audios/";

  const PIECE_AUDIO = {
    K: "rei.mp3",
    Q: "dama.mp3",
    R: "torre.mp3",
    B: "bispo.mp3",
    N: "cavalo.mp3",
    P: "peao.mp3",
  };

  const ACTION_AUDIO = {
    capture: "captura.mp3",
    check: "xeque.mp3",
    mate: "xeque_mate.mp3",
    promo: "promocao.mp3",
    castle_short: "roque_pequeno.mp3",
    castle_long: "roque_grande.mp3",
    en_passant: "en_passant.mp3",
  };

  // =====================================================
  // PLAY AUDIO (velocidade 1.2x)
  // =====================================================
  function playSequence(files) {
    if (!files || !files.length) return;
    let i = 0;

    function playNext() {
      if (i >= files.length) return;

      const url = AUDIO_BASE + files[i++];
      const audio = new Audio(url);

      audio.playbackRate = 1.2; // rápido e natural
      console.log("[chess-audio] tocando:", url);

      audio.addEventListener("ended", playNext);
      audio.play().catch(() => playNext());
    }

    playNext();
  }

  // =====================================================
  // PARSER SAN + FIGURINES
  // =====================================================
  function getAudioFilesFromSan(sanOriginal, el) {
    let san = sanOriginal;
    const files = [];
    if (!san) return files;

    // Roques
    if (san === "O-O") return [ACTION_AUDIO.castle_short];
    if (san === "O-O-O") return [ACTION_AUDIO.castle_long];

    // Check / Mate
    let check = false,
      mate = false;
    if (san.endsWith("+")) {
      check = true;
      san = san.slice(0, -1);
    }
    if (san.endsWith("#")) {
      mate = true;
      san = san.slice(0, -1);
    }

    // Promoção
    let promoPiece = null;
    const promoMatch = san.match(/=([QRBN])$/);
    if (promoMatch) {
      promoPiece = promoMatch[1];
      san = san.replace(/=([QRBN])$/, "");
    }

    const isCapture = san.includes("x");
    const isEnPassant = san.includes("e.p.") || san.includes("ep");

    // FIGURINE (ícone)
    let pieceLetter = null;
    let rest = san;

    const fig = el.querySelector("[data-figurine]");
    if (fig) pieceLetter = fig.getAttribute("data-figurine");

    // SAN padrão
    if (!pieceLetter) {
      if (/^[KQRBN]/.test(san[0])) {
        pieceLetter = san[0];
        rest = san.slice(1);
      } else if (/^[a-h]/.test(san[0])) {
        pieceLetter = "P";
      }
    }

    // Casa destino
    const sqMatch = rest.match(/([a-h][1-8])$/);
    const square = sqMatch ? sqMatch[1] : null;

    const isPawnSimpleMove =
      pieceLetter === "P" && !isCapture && !promoPiece && !isEnPassant;

    // Nome da peça (não peão simples, não repetir peão captura)
    if (
      pieceLetter &&
      PIECE_AUDIO[pieceLetter] &&
      !(pieceLetter === "P" && isCapture) &&
      !isPawnSimpleMove
    ) {
      files.push(PIECE_AUDIO[pieceLetter]);
    }

    // Captura
    if (isCapture) {
      if (pieceLetter === "P") files.push(PIECE_AUDIO["P"]);
      files.push(ACTION_AUDIO.capture);
    }

    // En passant
    if (isEnPassant) files.push(ACTION_AUDIO.en_passant);

    // Casa destino
    if (square) files.push(square + ".mp3");

    // Promoção
    if (promoPiece) {
      files.push(ACTION_AUDIO.promo);
      files.push(PIECE_AUDIO[promoPiece]);
    }

    // Check / Mate
    if (mate) files.push(ACTION_AUDIO.mate);
    else if (check) files.push(ACTION_AUDIO.check);

    return files;
  }

  // =====================================================
  // DETECTAR LANCE (análise, live, game)
  // =====================================================
  function getSelectedMoveElement() {
    // Análise
    let el = document.querySelector(
      "span.node-highlight-content.offset-for-annotation-icon.selected"
    );
    if (el) return el;

    // Live/game — pega último lance renderizado
    const rows = document.querySelectorAll(".main-line-row.move-list-row");
    if (rows.length) {
      const lastRow = rows[rows.length - 1];

      let move =
        lastRow.querySelector("span.node-highlight-content") ||
        lastRow.querySelector("[data-figurine]") ||
        lastRow.querySelector("span");

      return move || null;
    }

    return null;
  }

  // =====================================================
  // OBSERVER + INTERVAL (detecção ultrarrápida)
  // =====================================================
  let lastSan = null;

  function detectMove() {
    const el = getSelectedMoveElement();
    if (!el) return;

    let san = (el.innerText || el.textContent || "").trim().replace(/\s+/g, "");

    if (!san || san === lastSan) return;

    lastSan = san;
    console.log("[chess-audio] detectado:", san);

    const files = getAudioFilesFromSan(san, el);
    if (files.length) playSequence(files);
  }

  // OBSERVER OTIMIZADO
  const target =
    document.querySelector("#live-game-tab-scroll-container") ||
    document.querySelector(".move-list") ||
    document.body;

  const observer = new MutationObserver(detectMove);

  observer.observe(target, {
    subtree: true,
    childList: true,
    attributes: true,
  });

  // TIMER DE SEGURANÇA (captura atrasos do adversário)
  setInterval(detectMove, 50);
})();
