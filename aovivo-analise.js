// ==UserScript==
// @name         Chess.com - Áudio natural (Análise + Live + Game, velocidade 1.2x)
// @namespace    http://tampermonkey.net/
// @version      4.1
// @description  Narra lances no Chess.com em análise, jogo ao vivo e partidas no /game, com áudio natural e detecção de figurines.
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

  console.log("[chess-audio] script iniciou");

  const AUDIO_BASE =
    "https://raw.githubusercontent.com/carol-andradech/addonchess/main/audios/";
  const USE_COMPOSITION = true;

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
  // PLAY AUDIO
  // =====================================================
  function playSequence(files) {
    if (!files || !files.length) return;
    let index = 0;

    function playNext() {
      if (index >= files.length) return;

      const url = AUDIO_BASE + files[index++];
      const audio = new Audio(url);
      audio.playbackRate = 1.2; // 🔊 velocidade natural e rápida

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

    // Detectar figurine
    let pieceLetter = null;
    let rest = san;

    const figurine = el.querySelector("[data-figurine]");
    if (figurine) pieceLetter = figurine.getAttribute("data-figurine");

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

    const isPawnSimple =
      pieceLetter === "P" && !isCapture && !promoPiece && !isEnPassant;

    // Nome da peça (mas não para peão simples e não duplicar)
    if (
      pieceLetter &&
      PIECE_AUDIO[pieceLetter] &&
      !(pieceLetter === "P" && isCapture) &&
      !isPawnSimple
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

    // Casa
    if (square) files.push(square + ".mp3");

    // Promoção
    if (promoPiece) {
      files.push(ACTION_AUDIO.promo);
      files.push(PIECE_AUDIO[promoPiece]);
    }

    // Cheque / Mate
    if (mate) files.push(ACTION_AUDIO.mate);
    else if (check) files.push(ACTION_AUDIO.check);

    return files;
  }

  // =====================================================
  // DETECTAR LANCE (ANÁLISE, LIVE, GAME)
  // =====================================================
  function getSelectedMoveElement() {
    // 1) Modo análise
    let el = document.querySelector(
      "span.node-highlight-content.offset-for-annotation-icon.selected"
    );
    if (el) return el;

    // 2) Modo ao vivo /game — pegar último lance
    const rows = document.querySelectorAll(".main-line-row.move-list-row");
    if (rows.length) {
      const lastRow = rows[rows.length - 1];
      let move =
        lastRow.querySelector("span.node-highlight-content") ||
        lastRow.querySelector("[data-figurine]") ||
        lastRow.querySelector("span");

      if (move) return move;
    }

    return null;
  }

  // =====================================================
  // OBSERVER
  // =====================================================
  let lastSan = null;

  function onMutation() {
    const el = getSelectedMoveElement();
    if (!el) return;

    let san = (el.innerText || el.textContent || "").trim().replace(/\s+/g, "");

    if (!san || san === lastSan) return;

    lastSan = san;
    console.log("[chess-audio] lance:", san);

    const files = getAudioFilesFromSan(san, el);
    if (files.length) playSequence(files);
  }

  const observer = new MutationObserver(onMutation);

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
  });
})();
