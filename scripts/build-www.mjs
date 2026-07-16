/**
 * build-www.mjs — prepara a pasta www/ que o Capacitor empacota no app iOS.
 *
 * Por que existe: o jogo mora na RAIZ do repositório porque é assim que o
 * GitHub Pages o publica (o link de teste no iPhone). O Capacitor, por sua vez,
 * exige uma `webDir` isolada — apontá-la para a raiz copiaria node_modules/,
 * ios/ e o .git inteiro para dentro do app.
 *
 * Então: a raiz continua sendo a fonte da verdade, e este script espelha apenas
 * os arquivos do jogo em www/ (que é gerada e está no .gitignore).
 *
 * Uso:  npm run build        (só copia)
 *       npm run sync         (copia + cap sync ios)
 *       npm run ios          (copia + sync + abre o Xcode)
 */
import { cp, rm, mkdir, stat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const raiz = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const destino = join(raiz, 'www');

// Somente o que o jogo precisa em runtime. Nada de node_modules, ios/, scripts/.
const ITENS = ['index.html', '.nojekyll', 'css', 'js', 'music'];

const existe = async (p) => !!(await stat(p).catch(() => null));

await rm(destino, { recursive: true, force: true });
await mkdir(destino, { recursive: true });

const copiados = [];
for (const item of ITENS) {
  const origem = join(raiz, item);
  if (!(await existe(origem))) {
    console.warn(`aviso: "${item}" não encontrado — pulando`);
    continue;
  }
  await cp(origem, join(destino, item), { recursive: true });
  copiados.push(item);
}

console.log(`www/ pronto -> ${copiados.join(', ')}`);
