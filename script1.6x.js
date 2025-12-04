// ==UserScript==
// @name         Chess.com - Áudio natural (velocidade 1.6x, sem "peão" desnecessário)
// @namespace    http://tampermonkey.net/
// @version      3.2
// @description  Narra lances no Chess.com com áudios personalizados de forma natural e rápida
// @match        https://www.chess.com/analysis*
// @match        https://www.chess.com/pt-BR/analysis*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  console.log("[chess-audio] script carregado");

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
  // ÁUDIO
  // =====================================================
  function playSequence(files) {
    if (!files || !files.length) return;

    let index = 0;

    function playNext() {
      if (index >= files.length) return;

      const url = AUDIO_BASE + files[index++];
      const audio = new Audio(url);

      audio.playbackRate = 1.6; // ⚡ fala mais rápido (40%)

      console.log("[chess-audio] tocando:", url);

      audio.addEventListener("ended", playNext);
      audio.play().catch(() => playNext());
    }

    playNext();
  }

  // =====================================================
  // PARSER SAN + FIGURINES
  // =====================================================
  function getAudioFilesFromSan(sanOriginal, spanEl) {
    let san = sanOriginal;
    const files = [];
    if (!san) return files;

    // --------------------------
    // ROQUE
    // --------------------------
    if (san === "O-O") return [ACTION_AUDIO.castle_short];
    if (san === "O-O-O") return [ACTION_AUDIO.castle_long];

    // --------------------------
    // CHEQUE / MATE
    // --------------------------
    let check = false;
    let mate = false;

    if (san.endsWith("+")) {
      check = true;
      san = san.slice(0, -1);
    } else if (san.endsWith("#")) {
      mate = true;
      san = san.slice(0, -1);
    }

    // --------------------------
    // PROMOÇÃO
    // --------------------------
    let promoPiece = null;
    const promoMatch = san.match(/=([QRBN])$/);
    if (promoMatch) {
      promoPiece = promoMatch[1];
      san = san.replace(/=([QRBN])$/, "");
    }

    const isCapture = san.includes("x");
    const isEnPassant = san.includes("e.p.") || san.includes("ep");

    // --------------------------
    // DETECTAR FIGURINE (icone)
    // --------------------------
    let pieceLetter = null;
    let rest = san;

    const figurineEl = spanEl.querySelector("[data-figurine]");
    if (figurineEl) {
      pieceLetter = figurineEl.getAttribute("data-figurine"); // K,Q,R,B,N
    }

    // --------------------------
    // SAN normal (se sem figurine)
    // --------------------------
    if (!pieceLetter) {
      if (/^[KQRBN]/.test(san[0])) {
        pieceLetter = san[0];
        rest = san.slice(1);
      } else if (/^[a-h]/.test(san[0]) && !/[KQRBN]/.test(san)) {
        pieceLetter = "P"; // peão simples, mas NÃO falar
      }
    }

    // --------------------------
    // CASA DESTINO
    // --------------------------
    const squareMatch = rest.match(/([a-h][1-8])$/);
    const square = squareMatch ? squareMatch[1] : null;

    // --------------------------
    // TIPO DE PEÃO
    // --------------------------
    const isPawnSimpleMove =
      pieceLetter === "P" && !isCapture && !promoPiece && !isEnPassant;

    // --------------------------
    // MONTAR ÁUDIO
    // --------------------------

    // 1) Nome da peça (exceto peão simples, ou peão captura dupla)
    if (
      pieceLetter &&
      PIECE_AUDIO[pieceLetter] &&
      !(pieceLetter === "P" && isCapture) &&
      !isPawnSimpleMove
    ) {
      files.push(PIECE_AUDIO[pieceLetter]);
    }

    // 2) Captura
    if (isCapture) {
      if (pieceLetter === "P") files.push(PIECE_AUDIO["P"]); // uma vez só
      files.push(ACTION_AUDIO.capture);
    }

    // 3) En passant
    if (isEnPassant) {
      files.push(ACTION_AUDIO.en_passant);
    }

    // 4) Casa destino
    if (square) {
      files.push(square + ".mp3");
    }

    // 5) Promoção
    if (promoPiece) {
      files.push(ACTION_AUDIO.promo);
      files.push(PIECE_AUDIO[promoPiece]);
    }

    // 6) Xeque / Mate
    if (mate) files.push(ACTION_AUDIO.mate);
    else if (check) files.push(ACTION_AUDIO.check);

    return files;
  }

  // =====================================================
  // DETECTAR MUDANÇA DE LANCE
  // =====================================================
  function getSelectedSpan() {
    return document.querySelector(
      "span.node-highlight-content.offset-for-annotation-icon.selected"
    );
  }

  let lastNodeId = null;

  function onMoveChange() {
    const span = getSelectedSpan();
    if (!span) return;

    const node = span.closest("[data-node]");
    const nodeId = node ? node.getAttribute("data-node") : null;

    let san = (span.innerText || span.textContent || "")
      .trim()
      .replace(/\s+/g, "");

    if (!san || nodeId === lastNodeId) return;
    lastNodeId = nodeId;

    console.log("[chess-audio] lance:", san);

    const files = getAudioFilesFromSan(san, span);
    if (files.length) playSequence(files);
  }

  const observer = new MutationObserver(onMoveChange);

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
})();
