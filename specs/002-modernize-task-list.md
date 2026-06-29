---
type: feature
issue: 12
axe: 1
---

# Moderniser `task-list` vers Angular 22 (épic #12 — Axe 1, vidéo 1)

## Description

Premier axe de l'épic de modernisation [#12](https://github.com/AngularKit/aak-demo-project/issues/12) :
amener le composant legacy `task-list` aux idiomes **Angular 22**. Surface bornée
à `src/app/tasks/task-list/**` + son câblage dans `src/app/app.module.ts` et son
usage dans `src/app/app.component.html`. Les axes 2 (`task.service` → signals) et
3 (`store/` → Signal Store) sont **hors scope** ici.

### Comportement attendu (inchangé fonctionnellement)

Le composant reçoit une liste de tâches, affiche un champ de recherche qui filtre
par titre/assigné, et émet la tâche sélectionnée au clic. Aucun changement de
comportement visible utilisateur — c'est une modernisation interne. Le filtre de
recherche doit rester fonctionnel ; la sélection doit rester fonctionnelle.

### Cibles de modernisation (issue #12, Axe 1)

- `standalone: true` (retiré des `declarations` d'`AppModule`, ajouté à ses `imports`).
- `ChangeDetectionStrategy.OnPush`.
- `inject()` au lieu de l'injection par constructeur.
- `@if` / `@for` + `track` au lieu de `*ngIf` / `*ngFor`.
- `input()` / `output()` au lieu de `@Input() set` + `@Output() EventEmitter`.
- `signal()` / `computed()` pour l'état de recherche et le filtrage (au lieu du
  `get filteredTasks()` recalculé à chaque CD).
- `viewChild()` au lieu de `@ViewChild`.
- Suppression de l'abonnement manuel `loading$` + `Subscription` + `ngOnDestroy`
  (état `loading` mort, cf. [#2](https://github.com/AngularKit/aak-demo-project/issues/2) /
  F003) et du `console.log` du setter ([#4](https://github.com/AngularKit/aak-demo-project/issues/4) / F005).
- Renommer le fichier `task-list.component.ts` → `task-list.ts` (suffixe redondant).

### Contraintes de gate

- `pnpm lint` doit passer **au vert pour la surface `task-list`** : les erreurs
  `prefer-standalone`, `prefer-inject`, `prefer-control-flow`, `no-output-native`
  (renommer l'output `select` qui collait un nom d'événement DOM natif) et les
  deux erreurs d'accessibilité (`click` sans clavier / focusable) doivent
  disparaître pour ces fichiers.
- `pnpm build` vert ; l'app rend toujours la liste + le filtre + la sélection.

### Issues couvertes

- #12 Axe 1 (principal), et au passage #2 (loading mort) et #4 (`console.log`).

## Plan technique

### Architecture

Modernisation **interne** d'un composant présentationnel, surface strictement
bornée. Trois couches touchées, aucun changement de contrat de données :

1. **Composant** `task-list` — passe aux idiomes v22 (standalone, OnPush,
   `inject()`, `input()`/`output()`, signals/`computed()`, `viewChild()`,
   control flow). Renommé `task-list.component.ts` → `task-list.ts`.
2. **Câblage module** `AppModule` — le composant quitte `declarations` pour
   `imports` (standalone).
3. **Usage** `app.component.html` — le binding de l'output renommé est mis à jour.

Flux de données inchangé : `AppComponent` (conteneur, branché au store NgRx)
pousse `filteredTasks$ | async` dans `[tasks]`, et reçoit la tâche cliquée via
l'output. Le composant reste **purement présentationnel** : il ne connaît ni le
store ni `TaskService` après modernisation (cf. *Décisions* ci-dessous).

```
AppComponent (store NgRx)              task-list (présentationnel, OnPush)
   filteredTasks$ ─[tasks]──────────▶  tasks = input<Task[]>()
                                         │
                                         ├─ searchTerm = signal('')   ◀── (input) du champ
                                         └─ filteredTasks = computed() ── @for ──▶ <button>
   onSelect($event) ◀──(selected)──────  selected = output<Task>()  ◀── click
```

Pas d'enjeu de landmarks a11y ici : le composant ne rend ni `<header>`/`<footer>`
ni `role` de landmark (un `<div class="task-list">` interne au `<main>` du shell).

### Fichiers à créer / modifier / supprimer

| Action | Chemin | Rôle |
| --- | --- | --- |
| **Renommer + réécrire** | `src/app/tasks/task-list/task-list.component.ts` → `task-list.ts` | Composant standalone OnPush ; classe `TaskList` (sans suffixe `Component`, naming v22). |
| **Renommer + réécrire** | `src/app/tasks/task-list/task-list.component.html` → `task-list.html` | Template : control flow `@if`/`@for` + `track`, `<button>` cliquable a11y, retrait du bloc `loading`. |
| **Modifier** | `src/app/app.module.ts` | `TaskList` retiré de `declarations`, ajouté à `imports`. |
| **Modifier** | `src/app/app.component.html` | Binding `(select)` → `(selected)` sur `<app-task-list>`. |

Le `templateUrl` de la classe doit pointer vers `./task-list.html`. Le `selector`
`app-task-list` est **inchangé** (préfixe `app` conforme profil, et il sert le
binding existant). Aucun fichier `.scss`/`styleUrl` (styles 100 % globaux, profil).

> **Renommage de fichier** : utiliser `git mv` pour préserver l'historique
> (`task-list.component.ts` → `task-list.ts`, idem `.html`). C'est de la
> tuyauterie d'implémentation (phase angular-expert), pas un `Write` ex nihilo.

### Modèles de données

Aucun nouveau modèle. Le composant consomme `Task` (`interface`, profil) importé
de `../task.model`. Pas de validation aux frontières (profil : aucune lib ; donnée
mockée typée en mémoire). `TaskStatus`/`StatusFilter` **non touchés** par cet axe.

### Réactivité (signals d'abord)

- **`tasks`** : `input<Task[]>()` avec valeur par défaut `[]` →
  `input<Task[]>([])`. Remplace le couple `@Input() set tasks` + champ privé
  `_tasks` + copie défensive + `console.log`. La copie défensive et le
  `console.log` (F005) **disparaissent** : un `input()` est en lecture seule côté
  composant, la logique du setter n'a plus lieu d'être.
- **`searchTerm`** : `signal('')` — état UI strictement interne (saisie), donc
  signal local (profil : signals locaux réservés à l'UI interne d'un composant).
- **`filteredTasks`** : `computed(() => …)` dérivant `tasks()` + `searchTerm()`.
  Remplace le `get filteredTasks()` recalculé à chaque CD. Logique de filtre
  **identique** (titre OU assigné, `trim().toLowerCase()`, terme vide ⇒ liste
  brute) — c'est une translation, pas un changement de comportement.
- **`selected`** : `output<Task>()`. Remplace `@Output() select = new
  EventEmitter<Task>()`. **Renommé** `select` → `selected` (cf. *Décisions*).
- **`viewChild`** : `viewChild<ElementRef<HTMLInputElement>>('search')` (signal
  query). Remplace `@ViewChild('search', { static: false })`.

> **Point d'attention `onSearch()`** : aujourd'hui le handler lit la valeur
> *impérativement* depuis le DOM via le ViewChild
> (`searchInput.nativeElement.value`). Deux options pour l'implémenteur, à
> trancher en phase GREEN sans changer le comportement observable :
> 1. **Conserver l'approche ViewChild** (translation minimale) :
>    `onSearch()` lit `this.searchInput()?.nativeElement.value ?? ''` et fait
>    `this.searchTerm.set(value)`. Le `viewChild()` reste **justifié** par la
>    spec (cible explicite de l'axe).
> 2. Passer l'event en argument (`onSearch(event: Event)`), ce qui rendrait le
>    `viewChild()` inutile.
>
> **La spec impose `viewChild()` comme cible de modernisation** (issue #12, Axe 1) :
> retenir l'**option 1**. Le `viewChild()` est conservé et alimente `searchTerm`.
> Ne pas introduire `[(ngModel)]` (`@angular/forms` est en cours de retrait, F007,
> et non importé).

### État partagé & coordination

**Signals locaux uniquement.** Le composant ne possède aucun état partagé :
`searchTerm` est de l'UI interne, `tasks` vient du parent par `input()`,
`filteredTasks` est dérivé. Aucun store, aucune facade. Conforme au seuil du
profil (« signals locaux réservés à l'UI strictement interne d'un composant »).

### Décisions

1. **Nom de classe : `TaskList`** (et non `TaskListComponent`). Naming v22 du
   profil : suppression du suffixe redondant côté fichier *et* côté symbole. Le
   `selector` `app-task-list` reste inchangé (c'est le contrat de template).

2. **Retrait total de `TaskService` du composant.** Le seul usage réel était
   l'abonnement `loading$` (`ngOnInit`), et cet état est **mort** (F003 : le
   `BehaviorSubject(false)` ne bascule jamais, `loadTasks()` n'étant jamais
   appelé). En supprimant l'état `loading`, il ne reste **aucune** raison
   d'injecter `TaskService`. Donc :
   - Suppression de l'injection (`constructor(private taskService)` → rien).
   - Suppression de `loading`, de l'abonnement, de `Subscription`,
     d'`OnInit`/`OnDestroy` et de leurs imports.
   - Le composant n'importe plus `TaskService` ni `rxjs`.

   > **Important** : ne **pas** retirer le `providers: [TaskService]` ni l'import
   > de `TaskService` dans `AppModule` au titre de cet axe. Le sort de
   > `TaskService` (couche d'état fantôme, F002) est un **arbitrage d'architecture
   > hors scope** (axes 2/3) — cf. `### Avis F002` ci-dessous. Cet axe se contente
   > de **délier `task-list` du service** ; il ne tranche pas l'existence du service.

3. **Output `select` → `selected`.** `select` déclenche `no-output-native`
   (collision avec l'événement DOM natif `select`). Renommage en `selected`
   (participe passé, convention idiomatique pour un output de notification).
   - **Impact binding** : `app.component.html` ligne 23,
     `(select)="onSelect($event)"` → `(selected)="onSelect($event)"`. Le handler
     `AppComponent.onSelect(task)` est **inchangé** (signature et dispatch store
     identiques). Aucun autre consommateur du sélecteur (grep : seul usage).

4. **A11y du `<li>` cliquable : remplacer par `<button>`.** Le `<li (click)>`
   actuel déclenche les deux erreurs a11y (`click` sans handler clavier +
   élément non focusable). Approche retenue : chaque item devient un
   `<li><button type="button" (click)="onSelect(task)">…</button></li>`. Un
   `<button>` est **nativement** focusable, opérable au clavier (Entrée/Espace)
   et porte la sémantique de contrôle — il neutralise les deux règles sans
   `tabindex`/`role`/`(keydown)` manuels (anti-pattern « div cliquable
   re-rôlée »). Le `[class.done]` migre sur le `<li>` ou le `<button>` (l'item
   reste stylé identiquement ; styles globaux, à vérifier par la revue visuelle
   que le sélecteur CSS existant cible toujours l'élément attendu).

   > **Note styling** : le CSS global cible aujourd'hui `.task-list li`. Insérer
   > un `<button>` interne change l'arbre DOM (texte désormais dans le bouton).
   > L'implémenteur doit vérifier que les `<span>` (title/status/assignee) restent
   > rendus et stylés ; au besoin ajuster le sélecteur global dans `styles.css`
   > (reset de bouton : `background`, `border`, `font`, `text-align`, `width`).
   > Tout ajustement chiffré (tailles, contrastes) relève de la revue visuelle —
   > non chiffré ici.

5. **Control flow.** `*ngIf`/`*ngFor` → `@if`/`@for`. Le `@for` **exige** un
   `track` : `track task.id` (`Task.id` est un identifiant stable, profil). Le
   bloc `loading` (`<p *ngIf="loading">`) est **supprimé** (état mort, F003). Le
   `<p>No tasks match.</p>` migre en bloc `@empty` du `@for` (idiome v22), ou
   `@if (filteredTasks().length === 0)` — l'`@empty` est préféré (plus direct,
   pas de re-test du `.length`).

### Cross-platform

Sans objet (profil : `aucun`).

### Choix de bibliothèques

Aucun ajout. Tout est natif Angular 22 (`input`, `output`, `signal`, `computed`,
`viewChild`, `@if`/`@for`, `inject` non requis ici puisque plus aucune
dépendance injectée). Suppression de la dépendance `rxjs` **dans ce fichier**.

### Risques & inconnues

- **Styling du `<li>`→`<button>`** : l'insertion d'un bouton change l'arbre DOM
  et peut casser le rendu visuel (reset de bouton à prévoir dans `styles.css`).
  À valider en revue visuelle / runtime (`code-reviewer` verify), pas couvert par
  les specs unitaires.
- **Sélection au clavier** : nouvelle capacité (le `<button>` rend l'item
  opérable Entrée/Espace) — `qa` peut/doit l'asserter en plus du clic, mais
  c'est un **gain** a11y, pas une régression de comportement.
- **`viewChild` + `onSearch` impératif** : le test du filtre doit piloter la
  saisie de façon à ce que `searchTerm` se mette à jour (dispatch d'un `input`
  event sur le champ, puis lecture du DOM). Voir notes phase test ci-dessous.

### Notes pour la phase test (`qa`) et l'implémentation (`angular-expert`)

- **Surface testable** : composant présentationnel pur ⇒ test sociable du
  composant seul, `[tasks]` fourni en input, pas de store ni `TaskService` à
  monter (le composant n'en dépend plus — point fort de la Décision 2).
- **Cas à couvrir** (comportement, inchangé) : (a) rend une `<li>`/`<button>`
  par tâche fournie ; (b) le filtre par titre **et** par assigné (`trim`,
  insensible à la casse, terme vide ⇒ liste complète) ; (c) clic sur un item
  émet `selected` avec la bonne `Task` ; (d) liste filtrée vide ⇒ bloc `@empty`
  (« No tasks match. ») ; (e) **bonus a11y** : item opérable au clavier.
- **Pilotage du champ de recherche** : `onSearch()` lit la valeur via le
  `viewChild`. Le test doit donc écrire dans `searchInput.nativeElement.value`
  **puis** dispatcher un `input` event (`dispatchEvent(new Event('input'))`),
  pas seulement appeler `onSearch()` — sinon le DOM et le signal divergent.
- **Régime asynchrone** : aucun timer dans ce composant (le `delay(300)` vit
  dans `TaskService`/effect, hors scope). Pas de `fakeAsync` nécessaire ; un
  `fixture.detectChanges()` après mutation suffit. (zone.js présent, profil.)
- **Naming des specs** : `task-list.spec.ts` (à côté de `task-list.ts`, sans
  suffixe `.component.`).
- **Gate lint** : après migration, `prefer-standalone`, `prefer-inject`
  (devenu sans objet — plus d'injection), `prefer-control-flow`,
  `no-output-native` et les deux règles a11y doivent être **vertes** sur la
  surface `task-list`. Le reste du repo reste rouge (hors scope, attendu).

### Avis F002 (pour axes 2/3, hors scope de cette PR)

> Recommandation d'architecture pour éclairer l'arbitrage utilisateur **avant**
> les axes 2 (`task.service` → signals) et 3 (`store/` → Signal Store).
> **Aucune implémentation ici.**

**Constat.** Le repo porte deux systèmes d'état parallèles (audit F002) : le
store NgRx pilote réellement l'app (`AppComponent` dispatche, `TaskEffects`
charge `MOCK_TASKS` **en dur**), tandis que `TaskService` est une couche RxJS
**quasi-morte** — seul `loading$` était consommé, et cet axe vient de l'en
délier. Après cette PR, `TaskService` n'est plus injecté **nulle part** ;
`AppModule` le `provide` encore, mais plus aucun consommateur runtime ne
l'utilise.

**Recommandation : faire de `TaskService` le *gateway de données* du store, pas
le supprimer.** Argumentaire :

1. **Le besoin d'un gateway est réel et va se matérialiser.** L'effect
   `loadTasks$` charge aujourd'hui `MOCK_TASKS` **en dur** dans la couche store
   — c'est précisément le smell que la cible « after » corrige. Un gateway
   (`TaskService.fetchTasks()` → `of(MOCK_TASKS).pipe(delay(300))`, déjà écrit)
   est l'abstraction d'I/O naturelle : l'effect (puis le Signal Store en axe 3)
   appelle le gateway au lieu de connaître la donnée. Le profil qualifie
   d'ailleurs ces adapters in-memory d'**implémentation runtime** (pas un fake
   test-only) : ils ont vocation à rester comme frontière de données.

2. **Supprimer perdrait l'unique frontière d'I/O testable.** `fetchTasks()` est
   le seul point où injecter un vrai `HttpClient` le jour où un backend arrive.
   Le supprimer enterre `MOCK_TASKS` dans l'effect/le store et **soude** la
   couche d'état à la donnée — l'inverse de la cible.

3. **Mais : ne garder que le rôle gateway, pas la couche d'état dupliquée.**
   `TaskService` doit **maigrir** drastiquement. À **retirer** (logique dupliquée
   du store) : `tasksSubject`/`tasks$`, `filterSubject`/`filter$`/`setFilter`,
   `filteredTasks$` (le filtre par statut existe déjà en doublon dans
   `selectFilteredTasks` — duplication F002), `loadingSubject`/`loading$` (le
   `loading` réel vient du store), `getById`. À **conserver** : `fetchTasks()`,
   exposé en **public** (la seule API légitime du gateway). En axe 2, ce
   `fetchTasks` se module en `resource()`/`httpResource()` côté Signal Store, ou
   reste un appel renvoyant un flux consommé par l'effect.

4. **Découplage préalable obligatoire (F004).** Quel que soit le sort, déplacer
   `StatusFilter` de `task.service.ts` vers `task.model.ts` **avant** de toucher
   au service : le store en dépend en types (`reducer`, `actions`,
   `app.component`), et le modèle est le lieu naturel du domaine (zéro dépendance
   entrante). Ce déplacement est un prérequis propre des axes 2/3, pas de cet axe.

5. **Sur le naming en axe 3.** Quand `store/` collapse en `signalStore`
   (`@ngrx/signals`), le conteneur d'état devient le `Store` ; `TaskService`
   réduit à `fetchTasks` reste un **gateway** (frontière d'I/O), **pas** un store
   et **pas** une facade — il *possède* l'accès à la donnée, il ne coordonne ni
   ne ré-expose des slices. Le Signal Store l'appelle.

**Synthèse de l'arbitrage à valider par l'utilisateur** : *recâbler* (gateway
maigri = `fetchTasks` seul, appelé par l'effect/le futur Signal Store)
**plutôt que** *supprimer*. La suppression simplifie à très court terme mais
soude la donnée à la couche d'état et détruit la seule frontière HTTP future —
contraire à l'intention « after » des vidéos 2/3. Décision finale = utilisateur.

## Plan de test

Fichiers :

- `src/app/tasks/task-list/task-list.spec.ts` — suite de comportement du composant
  modernisé (sociable, composant seul via `TestBed`, `[tasks]` en `input()`,
  aucun store ni `TaskService` monté — le composant n'en dépend plus).
- `src/app/tasks/task.builder.ts` — builder `aTask(overrides?)` (défauts valides au
  regard de `Task` : `id` séquentiel, `status: 'todo'`, `assignee: 'Alice'`).

> **Stack de test** : `@testing-library/angular` et `@testing-library/jest-dom`
> **ne sont pas installés** dans le repo (vérifié). Pour ne pas introduire de
> dépendance hors mandat RED, la suite utilise `TestBed` natif + requêtes DOM
> directes + matchers Vitest. L'input signal `tasks` est piloté par
> `fixture.componentRef.setInput('tasks', …)` ; le champ de recherche est piloté
> par écriture de `input.value` **puis** dispatch d'un `Event('input')` (le
> `viewChild`/`onSearch` lit le DOM, cf. plan), pas par appel direct du handler.
> Régime zone.js (profil) ; aucun timer dans le composant ⇒ pas de `fakeAsync`,
> `detectChanges()` après mutation suffit.

| Test | Scénario | Assertions clés |
| --- | --- | --- |
| `rendering › renders a clickable button per task` | 3 tâches en input | 3 `li button` rendus, textes dans l'ordre |
| `rendering › renders title, status and assignee` | 1 tâche | le `button` contient titre, statut, assigné |
| `rendering › renders an empty list when no tasks` | input `[]` | 0 `li button` |
| `filtering › by title (case-insensitive)` | terme `DESIGN` | 1 item, le bon titre |
| `filtering › by assignee (case-insensitive)` | terme `bob` | 1 item, la tâche de Bob |
| `filtering › trims whitespace` | terme `   carol   ` | 1 item, la tâche de Carol |
| `filtering › restores full list when cleared` | filtre puis terme vide | 1 item → 3 items |
| `filtering › empty message when nothing matches` | terme `nonexistent` | 0 item + texte « No tasks match. » (bloc `@empty`) |
| `selecting › emits selected with clicked task` | clic sur le 2ᵉ item | `selected` émet `tasks[1]` |
| `selecting › emits matching task after filtering` | filtre `bob` puis clic | `selected` émet la tâche de Bob |
| `a11y › item is a native keyboard-operable button` | 1 tâche | host item est `<button type="button">` (focusable/clavier natif) |

**Scaffold dû au GREEN** : le symbole `TaskList` du module
`src/app/tasks/task-list/task-list.ts` est référencé par anticipation — fichier
cible explicitement acté au `## Plan technique` (table « Fichiers », classe
`TaskList`). Son absence fait échouer le bundle avant exécution des tests : c'est
du code applicatif hors mandat RED, à produire en phase GREEN. Aucune escalade.

**RED confirmé** via la commande test du profil (`pnpm exec ng test
--watch=false`) le 2026-06-29 16:24. Le bundle de build échoue sur
`Could not resolve "./task-list"` / `TS2307: Cannot find module './task-list'`
(le composant `TaskList`/`task-list.ts` n'existe pas encore). Aucun compteur
`X failed / Y total` n'est produit car la compilation s'arrête avant l'exécution
des specs — état RED intrinsèque attendu quand le module sous test est encore
absent. L'échec est un défaut de **module applicatif manquant** (scaffold GREEN),
**pas** une erreur de harnais (zone/DI/setup) ni un faux vert : la suite
n'exerce que des assertions comportementales neuves, qui ne pourront passer
qu'une fois `TaskList` implémenté conformément au plan.
