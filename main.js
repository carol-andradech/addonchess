// ==UserScript==
// @name         Chess.com - d4 Áudio
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  Toca o áudio d4.mp3 quando o lance atual for d4 na página de análise
// @match        https://www.chess.com/analysis*
// @match        https://www.chess.com/pt-BR/analysis*
// @run-at       document-end
// @grant        none
// ==/UserScript==

(function () {
  "use strict";

  console.log("[d4-test] script carregado");

  // link RAW do GitHub (que você já viu que baixa o mp3)
  const AUDIO_URL =
    "https://raw.githubusercontent.com/carol-andradech/addonchess/main/audios/d4.mp3";

  // pega o span do lance selecionado na lista
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

    san = san.replace(/\s+/g, ""); // tira espaços esquisitos

    if (nodeId === lastNodeId) return;
    lastNodeId = nodeId;

    console.log("[d4-test] lance atual:", san, "node:", nodeId);

    if (san === "d4") {
      console.log("[d4-test] d4 detectado, tocando áudio:", AUDIO_URL);
      const audio = new Audio(AUDIO_URL);
      audio
        .play()
        .then(() => console.log("[d4-test] áudio tocando"))
        .catch((err) => console.error("[d4-test] erro ao tocar:", err));
    }
  }

  // observa mudanças na árvore pra saber quando o "selected" muda
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
