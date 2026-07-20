/* =============================================================================
 * i18n.js — Internacionalização (Português / Inglês) do Bela Climb
 * -----------------------------------------------------------------------------
 * Detecta o idioma do aparelho (navigator.language, que reflete o locale do
 * dispositivo no WebView do Capacitor) e mostra PT ou EN automaticamente —
 * sem menu de configuração. Português para pt-*; inglês para todo o resto.
 *
 * Carregado LOGO APÓS config.js (antes dos módulos que exibem texto). Como os
 * <script> ficam no fim do <body>, o DOM já existe e applyStaticI18n() roda na
 * hora, traduzindo os elementos marcados com data-i18n.
 *
 * FUNÇÕES QUE ESTE ARQUIVO INJETA NO ESCOPO GLOBAL:
 *   LANG            : 'pt' | 'en' (idioma escolhido)
 *   t(key, ...args) : retorna a string traduzida, com placeholders {0}, {1}...
 *   applyStaticI18n : preenche todo elemento com atributo data-i18n
 * ========================================================================== */

const LANG = ((navigator.language || navigator.userLanguage || 'en')
  .toLowerCase().startsWith('pt')) ? 'pt' : 'en';

const I18N = {
  pt: {
    choose_difficulty: 'Escolha a dificuldade',
    mode_easy: 'Modo Cabra Mansa',
    mode_hard: 'Modo Cabra da Peste',
    hint: 'Arraste a Bela para trás e solte para pular entre as plataformas. Desvie do obstáculo na base e suba os 5 biomas até o Super Capim Sagrado. Cada salto conta: errar custa uma vida 🐾 (até 5).',
    pause_title: 'PAUSA',
    resume: 'Continuar',
    restart: 'Reiniciar Fase',
    change_difficulty: 'Trocar Dificuldade',
    rotate: 'Gire o celular na vertical para jogar 🐐',
    force: 'FORÇA',
    world_level: 'Mundo {0}-{1}',
    next_level: 'Mundo {0}-{1} — Vamos lá!',
    win_easy: '🎉 Super Capim Sagrado! {0}',
    win_hard: '🌶️ Que ardido! {0}',
    lost_jump: '🐐 Salto perdido! ↩',
    fell: '🐐 Bela caiu!',
    remaining: '{0} restantes',
    game_over: '💀 Fim de jogo! Toque para reiniciar a fase.',
    restart_btn: '↻ Reiniciar Fase',
    rock_moved: '⚠️ Uma pedra se mexeu!',
    rolling_rock: '🪨 Pedra rolante!',
    wolf_caught: '🐺 O Lobo Faminto pegou a Bela! Fim de jogo.',
    chaotic: '🌪️ Fase caótica! Cuidado com a gravidade!',
    paywall_title: 'Jogo Completo',
    paywall_desc: 'Você jogou as 3 fases grátis! Desbloqueie o jogo inteiro: 5 biomas, fases infinitas, o modo Cabra da Peste e as fases caóticas surpresa.',
    paywall_unlock: 'Desbloquear — {0}',
    paywall_restore: 'Restaurar compra',
    paywall_back: 'Voltar',
    paywall_buying: 'Processando…',
    paywall_thanks: '🎉 Obrigado! Jogo completo desbloqueado.',
    paywall_restored: '✅ Compra restaurada!',
    paywall_none: 'Nenhuma compra encontrada para restaurar.',
    paywall_error: 'Não foi possível concluir. Tente de novo.',
  },
  en: {
    choose_difficulty: 'Choose your difficulty',
    mode_easy: 'Gentle Goat',
    mode_hard: 'Wild Goat',
    hint: 'Drag Bela back and release to jump between platforms. Dodge the obstacle at the base and climb 5 biomes up to the Sacred Super Grass. Every jump counts: a miss costs a life 🐾 (up to 5).',
    pause_title: 'PAUSED',
    resume: 'Resume',
    restart: 'Restart Level',
    change_difficulty: 'Change Difficulty',
    rotate: 'Rotate your phone upright to play 🐐',
    force: 'POWER',
    world_level: 'World {0}-{1}',
    next_level: 'World {0}-{1} — Let’s go!',
    win_easy: '🎉 Sacred Super Grass! {0}',
    win_hard: '🌶️ So spicy! {0}',
    lost_jump: '🐐 Missed jump! ↩',
    fell: '🐐 Bela fell!',
    remaining: '{0} left',
    game_over: '💀 Game over! Tap to restart the level.',
    restart_btn: '↻ Restart Level',
    rock_moved: '⚠️ A rock just moved!',
    rolling_rock: '🪨 Rolling rock!',
    wolf_caught: '🐺 The Hungry Wolf caught Bela! Game over.',
    chaotic: '🌪️ Chaotic level! Watch the gravity!',
    paywall_title: 'Full Game',
    paywall_desc: 'You played the 3 free levels! Unlock the whole game: 5 biomes, endless levels, the Wild Goat mode and the surprise chaotic levels.',
    paywall_unlock: 'Unlock — {0}',
    paywall_restore: 'Restore purchase',
    paywall_back: 'Back',
    paywall_buying: 'Processing…',
    paywall_thanks: '🎉 Thanks! Full game unlocked.',
    paywall_restored: '✅ Purchase restored!',
    paywall_none: 'No purchase found to restore.',
    paywall_error: 'Could not complete. Please try again.',
  },
};

/**
 * Traduz uma chave, substituindo placeholders {0}, {1}... pelos argumentos.
 * Cai para o inglês, e depois para a própria chave, se algo faltar.
 */
function t(key, ...args) {
  const dict = I18N[LANG] || I18N.en;
  let s = dict[key] != null ? dict[key] : (I18N.en[key] != null ? I18N.en[key] : key);
  return String(s).replace(/\{(\d+)\}/g, (m, i) => (args[i] !== undefined ? args[i] : m));
}

/** Preenche o texto de todo elemento marcado com data-i18n. */
function applyStaticI18n() {
  document.querySelectorAll('[data-i18n]').forEach(el => {
    el.textContent = t(el.getAttribute('data-i18n'));
  });
}

// DOM já está pronto (script no fim do body): traduz a interface estática agora.
applyStaticI18n();
