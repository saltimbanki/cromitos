# Cromos · Álbum EDB / U.D. Barbadás

App web **local** para controlar o álbum de cromos: o que tes, o que che falta e os repetidos.
Sen servidor, sen contas, sen nube. Todo queda no navegador do dispositivo.

---

## Que hai dentro

```
index.html                  Shell da app + porta de acceso
manifest.webmanifest        PWA (instalable)
sw.js                       Service worker (funciona offline)
robots.txt                  Pide aos buscadores que non indexen
assets/
  styles.css                Estilos (mobile-first, temas clara/escura)
  app.js                    Toda a lóxica
  icons/                    Iconas PWA
data/
  catalog.js                Catálogo xerado ← o que carga a app
  catalog.json              O mesmo, en JSON lexible
  seed.js                   Estado inicial. No build público é `null`
tools/
  generate_catalog.py       Excel → catálogo (+ copia persoal con --with-seed)
  gate.py                   Cambia a frase de acceso
.githooks/pre-commit        Impide subir datos persoais a GitHub
```

**O Excel e a copia persoal non forman parte do repositorio.** Viven só no teu
ordenador (`data/control-coleccion-cromos-v2.xlsx` e `private/`), e están no
`.gitignore`. A app publicada non leva ningún dato dos nenos.

---

## Como se executa

**Recomendado: servir por HTTP.** En local:

```bash
python -m http.server 8123
# abrir http://localhost:8123
```

Para publicala: calquera hosting estático (GitHub Pages, Netlify, Cloudflare Pages,
unha carpeta nun servidor). Non hai build, non hai dependencias, non hai instalación.

> Abrir `index.html` a dobre clic amosa a app, pero **non o uses para datos reais**:
> algúns navegadores bloquean ou comparten o `localStorage` en `file://`, e o service
> worker non se rexistra. Serve sempre por HTTP/HTTPS.

---

## O catálogo

**O Excel é a fonte de verdade.** A app nunca o le nin o escribe: consómese un
catálogo xerado a partir del.

```bash
python tools/generate_catalog.py            # build público (sen datos persoais)
python tools/generate_catalog.py --with-seed # + copia persoal para importar
```

O script:

1. Le `data/control-coleccion-cromos-v2.xlsx` (a folla "Control de Colección").
2. Valida que a identidade de cada cromo (`categoría + páxina + nome`) é única.
3. Escribe `data/catalog.json` e `data/catalog.js` (isto si vai a GitHub: é o
   catálogo do club, non a colección de ninguén).
4. Le as columnas `Estado` e `Repetidos` **só se lle pasas `--with-seed`**:
   - escribe `data/seed.js` co estado real (datos persoais),
   - e xera `private/cromos-thiago.json`, a copia que se importa na app.
5. Sen `--with-seed` escribe `data/seed.js` con `window.__SEED__ = null;` — é o
   build que se publica.
6. **Non toca o Excel.**

Cando o club cambie o Excel (novo cromo, nome corrixido), substitúe o ficheiro en
`data/` e volve executar o script.

### Por que non hai numeración

O álbum físico non numera páxinas nin cromos. Ubícase cada cromo por
**equipo + páxina + nome**, e a app fai exactamente o mesmo: non mostra ningún número.

A columna `Nº` do Excel gárdase no catálogo só como referencia interna e nunca se
amosa na interface.

---

## Publicar en GitHub Pages (sen datos)

O repositorio é **público** (o plan gratuíto non permite Pages privadas), así que
a regra é simple: **no repo só vai o build baleiro**.

1. `python tools/generate_catalog.py` → deixa `data/seed.js` en `null`.
2. Activa o hook unha vez por clon:
   ```bash
   git config core.hooksPath .githooks
   ```
3. Commit e push a `main`.
4. Settings → Pages → *Deploy from a branch* → `main` → `/ (root)`.

O hook `.githooks/pre-commit` **rexeita o commit** se ve:

- calquera folla de cálculo (`.xlsx`, `.csv`, …),
- calquera ficheiro en `private/` ou `cromos-*.json`,
- un `data/seed.js` que conteña `"counts":{` (é dicir, a colección real).

### Porta de acceso (filtro, non seguridade)

A app pide unha frase antes de amosar nada:

```bash
python tools/gate.py "a miña frase"   # cambia a frase
python tools/gate.py --off            # quita a porta
```

**Isto non é seguridade.** O repo é público: o código e o hash son visibles. Serve
para que non entre calquera que teña o link e, xunto con `robots.txt` e o
`noindex`, para que os buscadores non o indexen. Os datos non están no servidor:
viven no `localStorage` de cada dispositivo.

---

## Modelo de datos (localStorage)

Clave: `cromos.v1`

```json
{
  "schema": 1,
  "catalog": "390|18|2026-11-17",
  "theme": "light",
  "seed": "390|18|2026-11-17",
  "collectors": [
    { "id": "c_xxx", "name": "Thiago", "color": "#0f7b5f" },
    { "id": "c_yyy", "name": "Enzo", "color": "#0d9488" }
  ],
  "activeId": "c_xxx",
  "collections": {
    "c_xxx": { "xuvenil-b|p2|lucas-rial": 3 }
  }
}
```

- Un **collector** é un álbum (un fillo/a), co seu nome e a súa **cor**.
- `collections[collectorId][stickerId] = cantidade total de copias`.
- **Sparse**: se non está, vale 0. Un álbum baleiro non ocupa nada.
- `cantidade` → `0` falta · `1` pegado · `2+` pegado + (cantidade − 1) repetidos.
  É a mesma semántica do Excel (`Estado` + `Repetidos`), normalizada nun só número.
- `theme` → `"light"` ou `"dark"`. Nunca depende do sistema por si só: escóllese
  en **Axustes → Aparencia** e gárdase aquí.
- `seed` → sinatura do seed do Excel xa aplicado. Nunca borra datos: só indica
  que ese estado xa pasou por unha importación.

`stickerId` = `categoria|pN|nome-en-slug` (ex.: `xuvenil-b|p2|lucas-rial`).

A clave `cromos.tone` só garda a cor activa para pintar a barra antes de cargar o
JS (evita o flash).

---

## Primeira vez

No build público **non hai seed**: a app arranca sen álbums e ofrece dúas opcións:

- **Empezar** → creas o primeiro álbum co nome que queiras.
- **Xa teño unha copia (.json)** → importas unha copia (ver abaixo).

No build local con `--with-seed`, arranca cos dous álbums da casa xa creados
(*Thiago* co estado do Excel e *Enzo* baleiro).

---

## Aparencia e cor por álbum

- **Dous temas explícitos**: *Clara* e *Escura* (Axustes → Aparencia). Non se
  cambian sos cando o móbil cambia de tema.
- Cada álbum ten **unha cor** (12 opcións). A cor pinta a barra superior, os
  progresos, os pasos +/− e tinguen o fondo da app.
- Na barra superior os álbums son **chips**. Se son tantos (ou con nomes tan
  longos) que non collen de ancho, a fila de chips convértese automaticamente
  nun **despregable**, para que nunca haxa nomes cortados.

---

## Interacción

| Xesto | Que fai |
|---|---|
| Tocar un cromo | Marca **Pegado** / quita a marca |
| Botón **+** | Engade unha copia (créase un repetido) |
| Botón **−** | Quita unha copia (a 0, desmárquese) |
| Icona **↺** na barra | Desfai o último cambio |
| Lupa | Busca por nome (sen acentos, busca parcial) |
| Chip do álbum | Cambia de fillo/a ao instante |
| Engrenaxe | Aparencia, álbums, cor, copia de seguridade, baleirar |

---

## Copia de seguridade e intercambio

Os datos viven **só** no navegador deste dispositivo. Iso significa:

- Se borras os datos do navegador, pérdese o álbum.
- **iOS/Safari** pode limpar o almacenamento se pasan ~7 días sen abrir a web
  (protección anti-tracking). Instalando a app na pantalla de inicio iso mitígase,
  pero a protección real é a copia.

Fluxo recomendado:

1. Instala a app: *Compartir → Engadir á pantalla de inicio*.
2. De cando en vez: **Axustes → Gardar copia (.json)** e mándaa ao teu chat persoal.
3. Para recuperar ou xuntar datos: **Axustes → Mesturar unha copia**.

### Como funciona a mestura

Importar **nunca substitúe nin borra**. Por cada cromo queda a **cantidade maior**
entre o que xa tes e o que vén na copia. Os álbums xúntanse **polo nome**
(sen distinguir maiúsculas): se a copia trae un álbum que non tes, créase.

Antes de aplicar nada a app amosa unha **vista previa**:

```
Thiago     70 → 74    +4
Sabela      0 → 12    novo
Enzo       18 → 18    sen cambios
```

Así podes intercambiar copias por WhatsApp sen medo: se un dos dous ten unha copia
vella, o peor que pasa é que non aporta nada — nunca perde o que xa marcou.

> Os repetidos tamén se mesturan coa cantidade maior. Se Thiago ten 3 copias dun
> cromo e a copia trae 1, queda con 3.

---

## Cambios no catálogo e coleccións gardadas

Se un nome cambia no Excel, o `stickerId` cambia e a colección desa persoa queda
"orfa". A app **non borra nada automaticamente**: avisa na pantalla principal
(*"N cromos do catálogo anterior xa non existen"*) e ofrece limpialo.

Na mestura, os cromos que xa non existen no catálogo actual ignóranse (non entran,
pero tampouco rompen nada).

Antes de actualizar o catálogo: **fai unha copia de seguridade**. Sempre.

---

## Limites coñecidos (por deseño)

- **Sen multiusuario**: cada dispositivo ten os seus datos. Non hai "quen ten repetidos".
  Para iso existe o botón *Compartir repetidos*, que xera un texto para WhatsApp.
- **Sen sincronización automática**: non hai conta nin nube. O intercambio é
  manual: un `.json` por WhatsApp cando queirades.
- **A porta de acceso é un filtro**, non autenticación real (o repo é público).
- **Sen edición do catálogo na app**: para cambiar cromos, edítase o Excel e regenérase.

---

## Proba rápida

1. Abre a app cunha ventá privada → pide a frase; con `barbadas-2026` entra.
2. Arranca **baleira**: *Empezar* → escribe un nome → xa tes un álbum.
3. Entra nunha categoría → toca un cromo (vólvese verde, coa cor do álbum).
4. Pulsa **+** dúas veces → aparece `3` (2 repetidos).
5. **Axustes → Gardar copia** → descarga un `.json`.
6. **Axustes → Mesturar unha copia** → escolle ese mesmo ficheiro: a vista previa
   debe dicir *sen cambios* e non tocar nada.
