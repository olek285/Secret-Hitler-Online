/**
 * Every piece of UI text, in Polish, in one place.
 *
 * Wording rules:
 * - Players have no gender, and Polish past tense and participles are
 *   gendered. Use present/future tense ("X nominuje"), impersonal forms
 *   ("Stracono cię", "Sprawdzono") or "label: name" forms instead.
 * - Role names use the generic masculine, as on the cards (Liberał, Faszysta).
 * - Ja!/Nein! stay German, as in the original game.
 * - Only display text lives here. Never translate wire values, enum values,
 *   CSS classes or the "Replaced" close-reason check (see CLAUDE.md).
 * - Phone budgets: the fascist power hint is one line of about 340px at 12px,
 *   the status bar is two lines at 14px, END TERM has a 62px-wide button,
 *   and login errors get two lines at 360px (about 80 characters).
 */
import { FASCIST, HITLER, LIBERAL } from "./constants";

/** Display name of a role or party value from the server ("LIBERAL", ...). */
export const roleName = (role?: string): string => {
  switch (role) {
    case LIBERAL:
      return "Liberał";
    case FASCIST:
      return "Faszysta";
    case HITLER:
      return "Hitler";
    default:
      return role || "";
  }
};

/** "liberalna" / "faszystowska" (agrees with "ustawa"). */
export const policyAdjective = (policy?: string): string =>
  policy === LIBERAL ? "liberalna" : "faszystowska";

export const common = {
  title: "SECRET HITLER",
  ok: "OK",
  confirm: "POTWIERDŹ",
};

export const login = {
  question: "JAK MASZ NA IMIĘ?",
  nameLabel: "Twoje imię",
  join: "DOŁĄCZ",
  qrCaption: "Znajomi: zeskanujcie, żeby dołączyć",
  credits:
    "Na podstawie gry planszowej Secret Hitler autorstwa Goat, Wolf & Cabbage " +
    "oraz Secret Hitler Online autorstwa ShrimpCryptid. Licencja CC BY-NC-SA 4.0.",
  connecting: "Łączenie…",
  nameTaken: (name: string) => `Imię „${name}” jest już zajęte. Wybierz inne.`,
  gameInProgress:
    "Trwa gra. Dołącz po jej końcu albo wpisz imię, którym już grasz.",
  gameFull: "Gra jest pełna (maks. 10 graczy).",
  unreachable: "Nie udało się połączyć z serwerem gry. Spróbuj ponownie.",
  unreachableWifi:
    "Brak połączenia z serwerem gry. Sprawdź, czy jesteś w tej samej sieci Wi-Fi.",
  openedElsewhere: "Gra jest otwarta w innej karcie lub oknie.",
  lostGame: "Utracono połączenie z grą. Stuknij DOŁĄCZ, żeby wrócić.",
  retrying: "Utracono połączenie z serwerem: łączę ponownie…",
  sendFailed:
    "Brak połączenia z serwerem. Jeśli to się powtórzy, odśwież stronę.",
};

export const qr = {
  defaultCaption: "Zeskanuj, żeby dołączyć",
  enlargeLabel: (caption: string) => `${caption}. Pokaż kod w powiększeniu.`,
  tapToEnlarge: "Stuknij kod, żeby go powiększyć",
  tapToClose: "Stuknij gdziekolwiek, żeby zamknąć",
};

export const lobby = {
  players: (count: number) => `Gracze (${count}/10)`,
  changeLook: "ZMIEŃ WYGLĄD",
  hostFewPlayers: "Mniej niż 5 graczy? Puste miejsca zajmą boty.",
  hostReady: "Wszyscy są? Zacznij, kiedy zechcesz.",
  waitingForHost: (host: string) => `Czekamy, aż ${host} (host) rozpocznie grę.`,
  start: "ZACZYNAMY",
  leave: "WYJDŹ",
  qrCaption: "Zaproś więcej graczy: zeskanuj, żeby dołączyć",
  hideCounts: "Ukryj liczbę kart",
  hostOnly: "ustawia host",
  customRules: "Domyślnie: zasady klasyczne. Zmień przed startem gry.",
};

export const game = {
  // Event bar (one line, as long as the English at most).
  eventNomination: "NOMINACJA KANCLERZA",
  eventVoting: "GŁOSOWANIE",
  eventLegislative: "SESJA LEGISLACYJNA",
  eventPower: "WŁADZA PREZYDENTA",

  // Status bar (two lines on phones).
  statusInitial: "---",
  statusNomination: "Czekamy, aż prezydent nominuje kanclerza.",
  statusVoting: "Czekamy na głosy wszystkich graczy.",
  statusPresidentDiscard: "Czekamy, aż prezydent odrzuci jedną ustawę.",
  statusChancellorEnact: "Czekamy, aż kanclerz uchwali jedną ustawę.",
  statusVetoRequested: "Kanclerz proponuje weto. Czekamy na decyzję prezydenta.",
  statusPeek: "Podgląd: prezydent ogląda 3 kolejne ustawy.",
  statusSpecialElection:
    "Wybory specjalne: prezydent wskazuje następnego prezydenta.",
  statusExecution: "Egzekucja: prezydent wybiera, kto zginie.",
  statusInvestigation:
    "Sprawdzenie lojalności: prezydent wybiera, kogo sprawdzić.",
  statusEndTerm: "Czekamy, aż prezydent zakończy turę.",
  statusTallying: "Liczenie głosów…",
  voteResult: (yes: number, no: number, passed: boolean) =>
    `${yes} - ${no}: ${passed ? "rząd wybrany" : "rząd odrzucony"}`,

  endTerm: "KONIEC TURY",

  // Seat and tile labels (PlayerDisplay filters return these; "" = enabled).
  president: "PREZYDENT",
  chancellor: "KANCLERZ",
  executed: "NIE ŻYJE",
  investigated: "SPRAWDZONO",
  termLimited: "LIMIT KADENCJI",
  you: "ty",

  // PlayerPolicyStatus (long = desktop, short = phone).
  rolesLong: "Role graczy:",
  rolesShort: "Role",
  policiesLeftLong: "Pozostałe ustawy:",
  policiesLeftShort: "Zostało",
};

/** Lowercase, as it follows "Następna ustawa faszystowska:" / "Dalej:". */
export const fascistPower = {
  NONE: "brak mocy",
  INVESTIGATE: "sprawdzenie lojalności",
  ELECTION: "wybory specjalne",
  PEEK: "podgląd ustaw",
  EXECUTION: "egzekucja",
  VICTORY: "wygrana",
};

export const powerHint = {
  next: (power: string) => `Następna ustawa faszystowska: ${power}`,
  nextHitler: (power: string) => `Dalej: ${power} · Hitler kanclerzem wygrywa`,
  nextHitlerVeto: (power: string) =>
    `Dalej: ${power} · weto · Hitler kanclerzem wygrywa`,
};

export const prompts = {
  // Role
  yourRole: (role?: string) => `TWOJA ROLA: ${roleName(role).toUpperCase()}`,
  liberalText: [
    "Wygrywasz, jeśli plansza zapełni się liberalnymi ustawami albo jeśli Hitler zostanie stracony.",
    "Przegrywasz, jeśli plansza zapełni się faszystowskimi ustawami albo jeśli Hitler zostanie wybrany na kanclerza po uchwaleniu 3 faszystowskich ustaw.",
    "Miej oczy szeroko otwarte i wypatruj podejrzanych ruchów. Wytrop Hitlera i pamiętaj, że każdy może kłamać!",
  ],
  fascistText: [
    "Wygrywasz, jeśli Hitler zostanie wybrany na kanclerza, gdy na planszy są już 3 faszystowskie ustawy, albo jeśli plansza zapełni się faszystowskimi ustawami.",
    "Przegrywasz, jeśli plansza zapełni się liberalnymi ustawami albo jeśli Hitler zostanie stracony.",
    "Odwracaj podejrzenia od Hitlera i szukaj okazji, żeby wprowadzić zamęt.",
  ],
  hitlerText: [
    "Wygrywasz, jeśli wybiorą cię na kanclerza, gdy na planszy są już 3 faszystowskie ustawy, albo jeśli plansza zapełni się faszystowskimi ustawami.",
    "Przegrywasz, jeśli plansza zapełni się liberalnymi ustawami albo jeśli zginiesz w egzekucji.",
    "Zdobywaj zaufanie i licz na to, że pozostali faszyści otworzą ci drogę.",
  ],

  // Player look
  lookLabel: "TWÓJ WYGLĄD",
  lookHelp: "Wybierz wygląd i stuknij POTWIERDŹ.",

  // Nomination and voting
  nominationLabel: "NOMINACJA",
  nominationHelp: "Nominuj kogoś na następnego kanclerza.",
  nominationHitlerWarning:
    "Faszyści wygrają, jeśli Hitler zostanie nominowany i wybrany na kanclerza!",
  votingLabel: "GŁOSOWANIE",
  votingNominated: (president: string, chancellor: string) =>
    `${president} nominuje na kanclerza: ${chancellor}.`,
  votingHelp:
    "Zagłosuj, czy ten rząd ma objąć władzę. Głosowanie przechodzi, jeśli ponad 50% głosów to „Ja!”.",
  votingHitlerWarning:
    "Faszyści wygrają, jeśli Hitler zostanie wybrany na kanclerza!",
  votingTrackerWarning:
    "Jeśli to głosowanie przepadnie, kolejna ustawa z talii zostanie od razu uchwalona.",

  // Election tracker
  trackerLabel: "NIE UCHWALONO USTAWY",
  trackerHelp:
    "Licznik wyborów przesuwa się o 1 za każdym razem, gdy rząd nie uchwali ustawy (lub odmówi jej uchwalenia), i zeruje się, gdy jakaś ustawa zostanie uchwalona.",
  trackerWarning:
    "Gdy licznik dojdzie do 3, wierzchnia ustawa z talii zostaje od razu uchwalona. Władza prezydenta się nie uruchamia, a limity kadencji się zerują.",

  // Legislative session
  legislativeLabel: "SESJA LEGISLACYJNA",
  presidentDiscardHelp:
    "Wybierz ustawę do odrzucenia. Pozostałe trafią do kanclerza.",
  discard: "ODRZUĆ",
  chancellorEnactHelp:
    "Wybierz ustawę do uchwalenia. Druga zostanie odrzucona.",
  vetoUnlocked:
    "Weto odblokowane: jeśli zgłosisz weto, a prezydent je przyjmie, obie ustawy zostaną odrzucone.",
  vetoLocked: "Weto odblokowuje się przy 5 faszystowskich ustawach.",
  veto: "WETO",
  enact: "UCHWAL",
  policyEnacted: "UCHWALONO USTAWĘ",

  // Veto (president)
  vetoLabel: "WETO",
  vetoRequested: "Kanclerz zgłasza weto wobec tych ustaw.",
  vetoTrackerWarning:
    "Jeśli weto zostanie przyjęte, wierzchnia ustawa z talii zostanie automatycznie uchwalona.",
  vetoTrackerAdvance:
    "Jeśli weto zostanie przyjęte, pozostałe ustawy zostaną odrzucone, a licznik wyborów przesunie się o 1.",
  vetoOtherwise: "W przeciwnym razie kanclerz musi uchwalić ustawę jak zwykle.",
  vetoQuestion: "Przyjąć weto?",
  reject: "ODRZUĆ",
  accept: "PRZYJMIJ",

  // Presidential powers
  peekLabel: "PODGLĄD",
  peekHelp: "To trzy kolejne ustawy w talii.",
  investigateLabel: "SPRAWDŹ LOJALNOŚĆ",
  investigateHelp:
    "Wybierz osobę i sprawdź jej przynależność partyjną. Dowiesz się, czy należy do faszystów czy liberałów, ale nie poznasz konkretnej roli (np. Hitler).",
  investigateOnce: "Nikogo nie można sprawdzić dwa razy.",
  investigateLie: "(Pamiętaj, że o wyniku możesz skłamać!)",
  specialElectionLabel: "WYBORY SPECJALNE",
  specialElectionHelp:
    "Wybierz dowolną osobę na następnego prezydenta. Po jej turze kolejność wraca do normy.",
  executionLabel: "EGZEKUCJA",
  executionHelp:
    "Wybierz, kto zginie. Ta osoba nie będzie już mogła mówić, głosować ani kandydować.",
  executionHitlerWarning:
    "Jeśli zginie Hitler, gra się kończy i wygrywają liberałowie.",

  // Results shown to everyone else
  executedYouLabel: "STRACONO CIĘ",
  executedYouHelp:
    "Po egzekucji nie możesz już mówić, głosować ani kandydować. Nie zdradzaj innym swojej roli.",
  executionResultsLabel: "WYNIK EGZEKUCJI",
  executedOther: (name: string) =>
    `${name} nie żyje. Nie może już mówić, głosować ani kandydować.`,
  specialElectionResult: (president: string, target: string) =>
    `Następnym prezydentem będzie ${target} (wybór: ${president}). Potem kolejność prezydentów wraca do normy.`,
  investigationResultsLabel: "WYNIK SPRAWDZENIA",
  investigatedYou: (president: string) =>
    `Sprawdzono twoją lojalność. Prezydent ${president} zna teraz twoją partię.`,
  investigatedOther: (target: string, president: string) =>
    `Sprawdzona osoba: ${target}. Prezydent ${president} zna teraz jej partię.`,
  partyMember: (target: string, party: string) =>
    `${target} należy do partii ${
      party === LIBERAL ? "liberalnej" : "faszystowskiej"
    }.`,

  // Victory
  fascistsPassedPolicies: "Faszyści uchwalili sześć ustaw!",
  fascistsElectedHitler: "Faszyści wybrali Hitlera na kanclerza!",
  liberalsPassedPolicies: "Liberałowie uchwalili pięć ustaw!",
  liberalsExecutedHitler: "Liberałowie stracili Hitlera!",
  returnToLobby: "WRÓĆ DO LOBBY",
};

/** Image alt texts (screen readers, and shown if an image fails to load). */
export const alt = {
  liberalRoleCards: [
    "Twoja tajna rola to LIBERAŁ. Na karcie mężczyzna w okularach, z fajką, zerka z ukosa.",
    "Twoja tajna rola to LIBERAŁ. Na karcie elegancka kobieta z kręconymi włosami i perłami.",
    "Twoja tajna rola to LIBERAŁ. Na karcie mężczyzna z okrągłym podbródkiem, w kapeluszu jak u pielgrzyma, patrzy pytająco w obiektyw.",
    "Twoja tajna rola to LIBERAŁ. Na karcie elegancki mężczyzna w fedorze, z równo przyciętym wąsem.",
    "Twoja tajna rola to LIBERAŁ. Na karcie starsza pani w komicznie dużych okularach trzyma chihuahua.",
    "Twoja tajna rola to LIBERAŁ. Na karcie kobieta w dużym kapeluszu, z fryzurą na boba, uśmiecha się złośliwie.",
  ],
  hitlerRoleCards: [
    "Twoja tajna rola to HITLER. Na karcie krokodyl w garniturze i niemieckiej czapce wojskowej patrzy groźnie w obiektyw.",
  ],
  fascistRoleCards: [
    "Twoja tajna rola to FASZYSTA. Na karcie wąż wyłania się z munduru obwieszonego medalami.",
    "Twoja tajna rola to FASZYSTA. Na karcie legwan w niemieckiej czapce wojskowej i garniturze szczerzy kły.",
    "Twoja tajna rola to FASZYSTA. Na karcie legwan w niemieckiej czapce wojskowej i garniturze szczerzy kły.",
  ],
  fascistVictory: "Zwycięstwo faszystów: czerwony napis z czaszką.",
  liberalVictory: "Zwycięstwo liberałów: niebieski napis z gołębiem.",
  policy: (policy: string, selectable: boolean) =>
    `Ustawa ${policyAdjective(policy)}.` +
    (selectable ? " Stuknij, żeby wybrać." : ""),
  policyEnacted: (policy: string) =>
    policy === LIBERAL
      ? "Uchwalona ustawa liberalna: niebieski druk z gołębiem."
      : "Uchwalona ustawa faszystowska: czerwony druk z czaszką.",
  newPolicyFolder: "Teczka z napisem „Nowa ustawa”.",
  voteYes: "Ja! (Tak)",
  voteNo: "Nein! (Nie)",
  liberalBoard: (count: number) => `Uchwalone ustawy liberalne: ${count}.`,
  fascistBoard: (count: number) => `Uchwalone ustawy faszystowskie: ${count}.`,
  trackerPosition: (position: number) => `Licznik wyborów: pole ${position} z 3.`,
  trackerBoard:
    "Plansza licznika wyborów: niebieska plansza z czterema polami, po których przesuwa się znacznik.",
  deckCard: (deckType: string) =>
    deckType === "DRAW" ? "Ustawa w talii." : "Ustawa wśród odrzuconych.",
  deck: (deckType: string, count?: number) =>
    count === undefined
      ? deckType === "DRAW"
        ? "Talia."
        : "Odrzucone ustawy."
      : deckType === "DRAW"
      ? `Talia (ustaw: ${count}).`
      : `Odrzucone ustawy (${count}).`,
  playerWithRole: (name: string, role: string) => `${name} (${roleName(role)})`,
};
