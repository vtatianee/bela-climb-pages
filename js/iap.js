/* =============================================================================
 * iap.js — Compra no App (desbloqueio do jogo completo) do Bela Climb
 * -----------------------------------------------------------------------------
 * Modelo: app grátis com as 3 primeiras fases; uma compra ÚNICA (não-consumível)
 * libera o jogo inteiro para sempre. Sem assinatura, sem coleta de dados.
 *
 * Esta camada ABSTRAI a compra:
 *   - No app nativo: fala com a StoreKit da Apple via o plugin `BelaIAP`
 *     (ver ios/.../BelaIAPPlugin.swift). A StoreKit é a fonte da verdade da posse.
 *   - No navegador (dev/preview): usa um MOCK para dar para testar o fluxo de
 *     paywall/desbloqueio sem aparelho.
 *
 * O estado é cacheado em localStorage por UX (evita re-checar a cada abertura),
 * mas no aparelho é reconciliado com a StoreKit no boot (refreshEntitlement).
 *
 * Depende de: nada além de window.Capacitor (opcional).
 *
 * FUNÇÕES/CONSTANTES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   IAP_PRODUCT_ID   : id do produto (deve casar com o App Store Connect)
 *   isUnlocked()     : true se o jogo completo está liberado
 *   iapPriceLabel()  : preço localizado para exibir (da StoreKit, ou fallback)
 *   buyFullGame()    : inicia a compra; resolve { ok, cancelled?, error?, mock? }
 *   restorePurchases(): restaura compra anterior; resolve { ok, none?, error? }
 *   loadUnlock()     : carrega o estado do cache
 *   refreshEntitlement(): reconcilia com a StoreKit (no aparelho)
 * ========================================================================== */

const IAP_PRODUCT_ID = 'com.vtatianee.belaclimb.fullunlock';
const UNLOCK_KEY = 'belaClimb.unlocked.v1';

let _unlocked = false;
let _priceLabel = null; // preenchido pela StoreKit no aparelho

/** true se o jogo completo está desbloqueado. */
function isUnlocked() { return _unlocked; }

/** Preço para exibir no paywall: o da StoreKit (localizado) ou um fallback por idioma. */
function iapPriceLabel() {
  if (_priceLabel) return _priceLabel;
  return (typeof LANG !== 'undefined' && LANG === 'pt') ? 'R$ 14,90' : '$2.99';
}

function _setUnlocked(v) {
  _unlocked = !!v;
  try { localStorage.setItem(UNLOCK_KEY, v ? '1' : '0'); } catch (e) { /* storage indisponível */ }
}

/** Plugin nativo de compras (só existe dentro do app Capacitor). */
function _nativeIAP() {
  return (window.Capacitor && window.Capacitor.Plugins && window.Capacitor.Plugins.BelaIAP) || null;
}

/** Carrega o estado de desbloqueio do cache local. */
function loadUnlock() {
  try { _unlocked = localStorage.getItem(UNLOCK_KEY) === '1'; } catch (e) { _unlocked = false; }
}

/**
 * No aparelho: pega o preço localizado e reconcilia a posse com a StoreKit
 * (fonte da verdade). No navegador, não faz nada.
 */
async function refreshEntitlement() {
  const p = _nativeIAP();
  if (!p) return;
  try {
    if (p.getProduct) {
      const info = await p.getProduct({ productId: IAP_PRODUCT_ID });
      if (info && info.price) _priceLabel = info.price;         // ex.: "R$ 14,90"
      if (info && typeof info.owned === 'boolean') _setUnlocked(info.owned);
    }
  } catch (e) { /* offline/indisponível: mantém o cache */ }
}

/**
 * Inicia a compra do desbloqueio.
 * @returns {Promise<{ok:boolean, cancelled?:boolean, error?:string, mock?:boolean}>}
 */
async function buyFullGame() {
  const p = _nativeIAP();
  if (p && p.purchase) {
    try {
      const r = await p.purchase({ productId: IAP_PRODUCT_ID });
      if (r && r.success) { _setUnlocked(true); return { ok: true }; }
      return { ok: false, cancelled: !!(r && r.cancelled) };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }
  // navegador (dev): simula a compra para testar o fluxo
  _setUnlocked(true);
  return { ok: true, mock: true };
}

/**
 * Restaura uma compra anterior (exigido pela Apple).
 * @returns {Promise<{ok:boolean, none?:boolean, error?:string}>}
 */
async function restorePurchases() {
  const p = _nativeIAP();
  if (p && p.restore) {
    try {
      const r = await p.restore();
      if (r && r.owned) { _setUnlocked(true); return { ok: true }; }
      return { ok: false, none: true };
    } catch (e) {
      return { ok: false, error: String(e && e.message || e) };
    }
  }
  // navegador (dev): nada para restaurar
  return { ok: false, none: true };
}
