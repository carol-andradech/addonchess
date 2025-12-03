// ==UserScript==
// @name         Chess.com - Áudio de lances (d4 + pronto para todos)
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Lê o lance selecionado na análise e toca áudios. Agora só d4, mas já preparado para todos os 77 áudios.
// @match        https://www.chess.com/analysis*
// @match        https://www.chess.com/pt-BR/analysis*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  'use strict';

  console.log("[chess-audio] script carregado");

  // 🔊 Pasta onde ficarão TODOS os áudios (77 arquivos)
  // Ajuste se mudar o repositório ou subpasta
  const AUDIO_BASE = "https://raw.githubusercontent.com/carol-andradech/addonchess/main/audios/";

  // 🔧 Controle: por enquanto deixamos a lógica completa DESLIGADA,
  // pra não tentar tocar arquivos que ainda não existem.
  // Quando você subir todos os áudios, mude para: const USE_COMPOSITION = true;
  const USE_COMPOSITION = false;

  // 🎯 Casos especiais mapeados diretamente (por enquanto só d4)
  // san limpo -> nome do arquivo
  const SPECIAL_MOVES = {
    "d4": "d4.mp3",
  };

  // 🧠 Mapeamento letra SAN -> nome de arquivo de peça
  const PIECE_AUDIO = {
    "K": "rei.mp3",
    "Q": "dama.mp3",
    "R": "torre.mp3",
    "B": "bispo.mp3",
    "N": "cavalo.mp3",
    "P": "peao.mp3", // usamos P para peão internamente
  };

  // 🔊 Ações / eventos
  const ACTION_AUDIO = {
    capture: "captura.mp3",
    check: "xeque.mp3",
    mate: "xeque_mate.mp3",
    promo: "promocao.mp3",
    castle_short: "roque_pequeno.mp3",
    castle_long: "roque_grande.mp3",
    en_passant: "en_passant.mp3",
  };

  // ============
  //  ÁUDIO
  // ============

  // Toca uma sequência de arquivos em ordem: ["peao.mp3", "d4.mp3", "xeque.mp3", ...]
  function playSequence(files) {
    if (!files || !files.length) return;

    let index = 0;

    function playNext() {
      if (index >= files.length) return;
      const file = files[index++];
      const url = AUDIO_BASE + file;
      console.log("[chess-audio] tocando:", url);

      const audio = new Audio(url);
      audio.addEventListener("ended", () => {
        playNext();
      });
      audio.play().catch(err => {
        console.error("[chess-audio] erro ao tocar", file, err);
        // tenta seguir mesmo assim
        playNext();
      });
    }

    playNext();
  }

  // ============
  //  PARSE DE SAN
  // ============

  /**
   * Converte SAN (por ex: "Nf3", "Qxe7+", "O-O", "O-O-O", "exd8=Q#")
   * em uma lista de arquivos de áudio a tocar.
   */
  function getAudioFilesFromSan(sanOriginal) {
    let san = sanOriginal;
    const files = [];

    if (!san) return files;

    // Roques
    if (san === "O-O") {
      files.push(ACTION_AUDIO.castle_short);
      return files;
    }
    if (san === "O-O-O") {
      files.push(ACTION_AUDIO.castle_long);
      return files;
    }

    let check = false;
    let mate = false;

    // Cheque (+) ou mate (#) no final
    if (san.endsWith("+")) {
      check = true;
      san = san.slice(0, -1);
    } else if (san.endsWith("#")) {
      mate = true;
      san = san.slice(0, -1);
    }

    // Promoção (=Q, =R, =B, =N)
    let promoPiece = null;
    const promoMatch = san.match(/=([QRBN])$/);
    if (promoMatch) {
      promoPiece = promoMatch[1];
      san = san.replace(/=([QRBN])$/, "");
    }

    // Captura (x)
    const isCapture = san.includes("x");

    // Peça: se começa com K Q R B N, é peça; senão é peão
    let pieceLetter = null;
    let rest = san;

    if (/^[KQRBN]/.test(san[0])) {
      pieceLetter = san[0];
      rest = san.slice(1);
    } else {
      pieceLetter = "P"; // peão
    }

    // Casa de destino: normalmente os dois últimos caracteres [a-h][1-8]
    const squareMatch = rest.match(/([a-h][1-8])$/);
    const square = squareMatch ? squareMatch[1] : null;

    // Monta a sequência de arquivos:

    // 1. Peça (opcional se você quiser)
    const pieceFile = PIECE_AUDIO[pieceLetter];
    if (pieceFile) {
      files.push(pieceFile);
    }

    // 2. Captura
    if (isCapture) {
      files.push(ACTION_AUDIO.capture);
    }

    // 3. Casa de destino
    if (square) {
      files.push(square + ".mp3"); // ex: "d4.mp3"
    }

    // 4. Promoção
    if (promoPiece) {
      files.push(ACTION_AUDIO.promo);
      const promoFile = PIECE_AUDIO[promoPiece];
      if (promoFile) {
        files.push(promoFile);
      }
    }

    // 5. Cheque / mate
    if (mate) {
      files.push(ACTION_AUDIO.mate);
    } else if (check) {
      files.push(ACTION_AUDIO.check);
    }

    return files;
  }

  // ============
  //  INTEGRAÇÃO COM CHESS.COM
  // ============

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

    let san = (span.innerText || span.textContent || "").trim();
    san = san.replace(/\s+/g, ""); // tira espaços

    if (!san) return;
    if (nodeId === lastNodeId) return;
    lastNodeId = nodeId;

    console.log("[chess-audio] lance atual:", san, "node:", nodeId);

    // 1) Primeiro: checa se é um lance especial mapeado direto (por enquanto só d4)
    if (SPECIAL_MOVES[san]) {
      const file = SPECIAL_MOVES[san];
      console.log("[chess-audio] lance especial detectado:", san, "->", file);
      playSequence([file]);
      return;
    }

    // 2) Depois: se a lógica completa estiver ativada, usa parsing de SAN
    if (USE_COMPOSITION) {
      const files = getAudioFilesFromSan(san);
      if (files.length) {
        console.log("[chess-audio] sequência de áudio para", san, ":", files);
        playSequence(files);
      } else {
        console.log("[chess-audio] nenhum áudio mapeado para", san);
      }
    } else {
      console.log("[chess-audio] USE_COMPOSITION = false, ignorando lance comum:", san);
    }
  }

  const observer = new MutationObserver(() => {
    onMoveChange();
  });

  observer.observe(document.body, {
    subtree: true,
    childList: true,
    attributes: true,
    attributeFilter: ["class"],
  });
})();
