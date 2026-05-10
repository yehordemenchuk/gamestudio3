import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  createComment,
  createRating,
  createScore,
  DEFAULT_SCORE_PLAYER,
  loadAllUsers,
  loadAverageRating,
  loadComments,
  loadTopScores,
  loadUserByEmail,
  setAuthProblemHandler
} from "./api";
import {
  getAccessToken,
  getEmailFromAccessToken,
  getRefreshToken,
  isLoggedIn,
  loginUser,
  logoutUser,
  registerUser,
  tryRefreshTokens
} from "./auth";
import LoginModal from "./LoginModal.jsx";
import {
  EDGE_BLOCKED,
  EDGE_EMPTY,
  EDGE_LINE,
  PUZZLE_LEVELS,
  checkSolved,
  computeSubmittedScore,
  countCellEdges,
  countLoopEdges,
  createEdgeState,
  generatePuzzleFromLevel,
  INITIAL_PUZZLES,
  validateProgress
} from "./game";

const HIT_DISTANCE = 14;
const TEXT = {
  en: {
    navHome: "Home",
    navGame: "Game",
    navReviews: "Ratings",
    navAdmin: "Users (admin)",
    signIn: "Sign in",
    signOut: "Log out",
    sessionExpiredTitle: "Session expired",
    signInTitle: "Sign in",
    authLead: "The game API requires an account. Sign in or create one.",
    tabLogin: "Login",
    tabRegister: "Register",
    email: "Email",
    password: "Password",
    username: "Username",
    register: "Create account",
    backToLogin: "Back to login",
    cancel: "Cancel",
    adminUsersTitle: "Registered users",
    adminColId: "ID",
    adminColUsername: "Username",
    adminColEmail: "Email",
    adminColRole: "Role",
    adminLoadError: "Failed to load users.",
    adminDenied: "You do not have access to this page.",
    intro: "Click an edge: empty -> line -> blocked.",
    puzzleLoaded: (name) => `Puzzle "${name}" loaded.`,
    progressOk: "Keep going: create one single closed loop.",
    progressBad: "Clue conflict: one of the cells has too many lines.",
    puzzleReset: "Current puzzle reset.",
    scoreSaveError: "Puzzle solved, but failed to save score to API.",
    scoreRecorded: (pts) => `Score ${pts} saved to the server.`,
    playerRequired: "Enter player name before submitting review.",
    ratingRange: "Rating must be between 0 and 5.",
    commentRequired: "Comment must not be empty.",
    homeTitle: "Slitherlink Green Edition",
    homeLead:
      "Slitherlink is a logic puzzle on a rectangular dot grid. You draw a loop along the grid lines. This edition uses the classic rules below.",
    rulesTitle: "Rules",
    rulesIntro: "Your goal is a single closed loop that uses only horizontal and vertical segments between neighbouring dots.",
    rulesBullets: [
      "Each number in a cell (0–3) tells you exactly how many of that cell’s four sides are part of the loop.",
      "Cells without a number impose no constraint: any number of their sides (0–3) may be used.",
      "The loop must be one continuous closed path: it has no loose ends.",
      "At every dot touched by the loop, exactly two segments meet. That means no branches (three or four lines at one dot) and no dead ends (only one line at a dot).",
      "The loop must not cross itself. In Slitherlink you only draw on the grid edges, so lines never run diagonally through the middle of a cell.",
      "There cannot be two or more separate small loops: when finished, all loop edges belong to exactly one cycle."
    ],
    uiHintsTitle: "How to play here",
    uiHintsBullets: [
      "Click an edge between two dots to cycle: empty → line (part of the loop) → cross (definitely not used) → empty.",
      "Use crosses to mark impossible edges; they help you avoid breaking the number clues.",
      "Check verifies both the clues and the loop shape. Reset clears the current puzzle; Next puzzle switches the built-in grid."
    ],
    playNow: "Play now",
    puzzleTitle: (name) => `${name} puzzle`,
    check: "Check",
    reset: "Reset",
    nextPuzzle: "Next puzzle",
    reviewsTitle: "Ratings & scores",
    commentsSidebarTitle: "Comments",
    avg: "Average rating:",
    ratingLabel: "Rating (0-5)",
    commentLabel: "Comment",
    commentPlaceholder: "Your feedback about the game",
    submitComment: "Post comment",
    submitRating: "Submit rating",
    commentSaved: "Comment posted.",
    commentError: "Failed to post comment.",
    ratingSaved: "Rating saved.",
    ratingError: "Failed to save rating.",
    topScores: "Top Scores",
    scoreColRank: "#",
    scoreColPlayer: "Player",
    scoreColPoints: "Points",
    comments: "Comments",
    loading: "Loading...",
    noScores: "No scores yet.",
    noComments: "No comments yet.",
    reasons: {
      numbersMismatch: "Not all clue numbers are satisfied.",
      loopMissing: "No loop has been drawn yet.",
      branchOrDeadEnd: "The loop has a branch or a dead end.",
      multipleLoops: "Multiple disconnected loops detected.",
      solved: "Great! One single closed loop is completed."
    }
  },
  sk: {
    navHome: "Domov",
    navGame: "Hra",
    navReviews: "Hodnotenia",
    navAdmin: "Uzivatelia (admin)",
    signIn: "Prihlasit sa",
    signOut: "Odhlasit",
    sessionExpiredTitle: "Relacia vyprsala",
    signInTitle: "Prihlasenie",
    authLead: "API vyzaduje ucet. Prihlaste sa alebo sa zaregistrujte.",
    tabLogin: "Prihlasenie",
    tabRegister: "Registracia",
    email: "E-mail",
    password: "Heslo",
    username: "Pouzivatelske meno",
    register: "Vytvorit ucet",
    backToLogin: "Spat na prihlasenie",
    cancel: "Zrusit",
    adminUsersTitle: "Registrovani uzivatelia",
    adminColId: "ID",
    adminColUsername: "Meno",
    adminColEmail: "E-mail",
    adminColRole: "Rola",
    adminLoadError: "Nepodarilo sa nacitat uzivatelov.",
    adminDenied: "K tejto stranke nemate pristup.",
    intro: "Klikni na hranu: prazdna -> ciara -> blokovana.",
    puzzleLoaded: (name) => `Nacitane zadanie "${name}".`,
    progressOk: "Pokracuj: vytvor jednu uzavretu slucku.",
    progressBad: "Konflikt s cislami: niekde je prilis vela ciar.",
    puzzleReset: "Aktualne zadanie bolo resetovane.",
    scoreSaveError: "Hlavolam je vyrieseny, ale score sa nepodarilo ulozit do API.",
    scoreRecorded: (pts) => `Skore ${pts} bolo ulozene na server.`,
    playerRequired: "Pred odoslanim recenzie zadaj meno hraca.",
    ratingRange: "Hodnotenie musi byt medzi 0 a 5.",
    commentRequired: "Komentar nesmie byt prazdny.",
    homeTitle: "Slitherlink Green Edition",
    homeLead:
      "Slitherlink je logicka hadanka na obdlznikovej mriezke bodov. Kreslis slucku po hranach mriezky. Tato verzia pouziva klasicke pravidla nizsie.",
    rulesTitle: "Pravidla",
    rulesIntro:
      "Cielom je jedna uzavreta slucka, ktora pouziva iba vodorovne a zvisle usecky medzi susediacimi bodmi.",
    rulesBullets: [
      "Kazde cislo v bunke (0–3) hovori, presne kolko zo styroch stran tejto bunky patri do slucky.",
      "Bunky bez cisla nemaju obmedzenie: moze byt pouzitych 0 až 3 ich stran.",
      "Slucka musi byt jedna suvisla uzavreta cesta: nema volne konce.",
      "V kazdom bode, ktorym slucka prechadza, sa stretnu presne dva useky. To vylucuje rozvetvenie (tri alebo styri ciary v jednom bode) aj slepe konce (iba jedna ciara v bode).",
      "Slucka sa nesmie krizit. V Slitherlink sa kresli len na hranach mriezky, nikdy nie uhlopriečne cez stred bunky.",
      "Nemozu existovat dve alebo viac mensich oddelenych sluciek: po dokonceni tvoria vsetky ciary slucky presne jeden cyklus."
    ],
    uiHintsTitle: "Ovladanie v tejto hre",
    uiHintsBullets: [
      "Klikni na hranu medzi dvoma bodmi: prazdna → ciara (cast slucky) → krizik (urcite sa nepouzije) → prazdna.",
      "Kriziky oznacuju nemozne hrany; pomahaju dodrziavat cisla.",
      "Skontrolovat overi cisla aj tvar slucky. Reset vymaze aktualne zadanie; Dalsi hlavolam prepne vstavanu mriezku."
    ],
    playNow: "Hrat",
    puzzleTitle: (name) => `${name} hlavolam`,
    check: "Skontrolovat",
    reset: "Reset",
    nextPuzzle: "Dalsi hlavolam",
    reviewsTitle: "Hodnotenia a skore",
    commentsSidebarTitle: "Komentare",
    avg: "Priemerne hodnotenie:",
    ratingLabel: "Hodnotenie (0-5)",
    commentLabel: "Komentar",
    commentPlaceholder: "Tvoja spatna vazba o hre",
    submitComment: "Odoslat komentar",
    submitRating: "Odoslat hodnotenie",
    commentSaved: "Komentar bol odoslany.",
    commentError: "Komentar sa nepodarilo odoslat.",
    ratingSaved: "Hodnotenie bolo ulozene.",
    ratingError: "Hodnotenie sa nepodarilo ulozit.",
    topScores: "Top skore",
    scoreColRank: "#",
    scoreColPlayer: "Hrac",
    scoreColPoints: "Body",
    comments: "Komentare",
    loading: "Nacitavam...",
    noScores: "Zatial ziadne skore.",
    noComments: "Zatial ziadne komentare.",
    reasons: {
      numbersMismatch: "Nie vsetky cisla v bunkach su splnene.",
      loopMissing: "Slucka este nie je nakreslena.",
      branchOrDeadEnd: "Slucka obsahuje vetvenie alebo slepu cestu.",
      multipleLoops: "Naslo sa viac oddelenych sluciek.",
      solved: "Skvele! Je vytvorena jedna uzavreta slucka."
    }
  }
};

/** Backend uses `ROLE_USER` / `ROLE_ADMIN`; show short labels in the admin table. */
function formatUserRole(role) {
  if (role == null || role === "") return "—";
  const s = String(role);
  return s.startsWith("ROLE_") ? s.slice(5) : s;
}

function App() {
  const [lang, setLang] = useState("en");
  const t = TEXT[lang];
  const [page, setPage] = useState("home");
  const [puzzleState, setPuzzleState] = useState(() => ({
    index: 0,
    list: INITIAL_PUZZLES
  }));
  const puzzle = puzzleState.list[puzzleState.index];
  const [edges, setEdges] = useState(() => createEdgeState(INITIAL_PUZZLES[0].grid));
  /** Only puzzle / canvas feedback (shown next to the board). */
  const [boardMessage, setBoardMessage] = useState(TEXT.en.intro);
  const [commentFeedback, setCommentFeedback] = useState("");
  const [ratingFeedback, setRatingFeedback] = useState("");
  const [topScores, setTopScores] = useState([]);
  const [comments, setComments] = useState([]);
  const [commentInput, setCommentInput] = useState("");
  const [ratingInput, setRatingInput] = useState(0);
  const [averageRating, setAverageRating] = useState(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [authEpoch, setAuthEpoch] = useState(0);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authModalReason, setAuthModalReason] = useState("required");
  const [authMode, setAuthMode] = useState("login");
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [regUsername, setRegUsername] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminUsers, setAdminUsers] = useState([]);
  const [adminLoading, setAdminLoading] = useState(false);
  const [adminError, setAdminError] = useState("");
  const canvasRef = useRef(null);

  const puzzleKey = useMemo(
    () => `${puzzleState.index}:${JSON.stringify(puzzle.grid)}`,
    [puzzleState.index, puzzle.grid]
  );
  const puzzleStartRef = useRef(Date.now());
  const scoreRecordedRef = useRef(false);

  useEffect(() => {
    puzzleStartRef.current = Date.now();
    scoreRecordedRef.current = false;
  }, [puzzleKey]);

  const dims = useMemo(() => {
    const rows = puzzle.grid.length;
    const cols = puzzle.grid[0].length;
    const size = 560;
    const padding = 50;
    const cell = Math.min((size - padding * 2) / cols, (size - padding * 2) / rows);
    return { rows, cols, size, padding, cell };
  }, [puzzle]);

  useEffect(() => {
    setEdges(createEdgeState(puzzle.grid));
    setBoardMessage(TEXT[lang].puzzleLoaded(puzzle.name));
  }, [puzzle, lang]);

  useEffect(() => {
    if (page !== "game") setCommentFeedback("");
  }, [page]);

  useEffect(() => {
    if (page !== "reviews") setRatingFeedback("");
  }, [page]);

  useLayoutEffect(() => {
    if (page !== "game") return;
    drawBoard();
  }, [page, edges, puzzle, dims]);

  const refreshAdminState = useCallback(async () => {
    if (!isLoggedIn()) {
      setIsAdmin(false);
      setAdminUsers([]);
      return;
    }
    try {
      const list = await loadAllUsers();
      if (list === null) {
        setIsAdmin(false);
        setAdminUsers([]);
      } else {
        setIsAdmin(true);
        setAdminUsers(list);
      }
    } catch {
      setIsAdmin(false);
      setAdminUsers([]);
    }
  }, []);

  const loadMeta = useCallback(async () => {
    if (!isLoggedIn()) {
      setTopScores([]);
      setComments([]);
      setAverageRating(null);
      return;
    }
    setLoadingMeta(true);
    try {
      const [scores, gameComments, avg] = await Promise.all([
        loadTopScores().catch(() => []),
        loadComments().catch(() => []),
        loadAverageRating().catch(() => null)
      ]);
      setTopScores(scores ?? []);
      setComments(gameComments ?? []);
      setAverageRating(avg?.averageRating ?? null);
    } finally {
      setLoadingMeta(false);
    }
  }, []);

  /** Loads `username` from GET /api/v1/users/{email} (email = JWT sub). Fallback: local part of email. */
  const refreshPlayerFromApi = useCallback(async () => {
    if (!isLoggedIn()) return "";
    const email = getEmailFromAccessToken();
    if (!email) return "";
    let resolved = email.split("@")[0] || DEFAULT_SCORE_PLAYER;
    try {
      const u = await loadUserByEmail(email);
      if (u && typeof u.username === "string" && u.username.trim()) {
        resolved = u.username.trim();
      }
    } catch {
      /* keep fallback */
    }
    return resolved;
  }, []);

  useEffect(() => {
    setAuthProblemHandler(({ reason }) => {
      setIsAdmin(false);
      setAdminUsers([]);
      setAuthModalReason(reason);
      setAuthMode("login");
      setAuthModalOpen(true);
      setAuthEpoch((n) => n + 1);
    });
    return () => setAuthProblemHandler(null);
  }, []);

  useEffect(() => {
    const boot = async () => {
      if (!isLoggedIn()) return;
      if (getRefreshToken()) await tryRefreshTokens();
      if (!getAccessToken()) {
        setAuthModalReason("expired");
        setAuthModalOpen(true);
        return;
      }
      await loadMeta();
      await refreshAdminState();
      await refreshPlayerFromApi();
      setAuthEpoch((n) => n + 1);
    };
    boot();
  }, [loadMeta, refreshAdminState, refreshPlayerFromApi]);

  useEffect(() => {
    if (page !== "reviews" && page !== "game") return;
    if (!isLoggedIn()) return;
    let cancelled = false;
    const run = async () => {
      try {
        if (page === "reviews") {
          const [scores, avg] = await Promise.all([
            loadTopScores().catch(() => []),
            loadAverageRating().catch(() => null)
          ]);
          if (!cancelled) {
            setTopScores(scores ?? []);
            setAverageRating(avg?.averageRating ?? null);
          }
        }
        if (page === "game") {
          const list = await loadComments().catch(() => []);
          if (!cancelled) setComments(list ?? []);
        }
      } catch {
        /* ignore */
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [page, authEpoch]);

  useEffect(() => {
    if (page !== "admin" || !isAdmin) return;
    let cancelled = false;
    (async () => {
      setAdminLoading(true);
      setAdminError("");
      try {
        const list = await loadAllUsers();
        if (cancelled) return;
        if (list === null) {
          setIsAdmin(false);
          setAdminError(TEXT[lang].adminDenied);
        } else setAdminUsers(list);
      } catch {
        if (!cancelled) setAdminError(TEXT[lang].adminLoadError);
      } finally {
        if (!cancelled) setAdminLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [page, isAdmin, lang]);

  useEffect(() => {
    if (page !== "game") return;

    const result = checkSolved(puzzle.grid, edges.hEdges, edges.vEdges);
    if (!result.ok) {
      scoreRecordedRef.current = false;
      return;
    }
    if (scoreRecordedRef.current) return;

    scoreRecordedRef.current = true;

    let cancelled = false;
    const rows = puzzle.grid.length;
    const cols = puzzle.grid[0].length;
    const { hEdges, vEdges } = edges;

    (async () => {
      if (!isLoggedIn()) {
        scoreRecordedRef.current = false;
        return;
      }
      const elapsed = Date.now() - puzzleStartRef.current;
      const loopEdges = countLoopEdges(hEdges, vEdges);
      const points = computeSubmittedScore(puzzleState.index, rows, cols, loopEdges, elapsed);
      const playerName = (await refreshPlayerFromApi()).trim() || DEFAULT_SCORE_PLAYER;
      try {
        await createScore({ player: playerName, points });
        if (cancelled) return;
        const scores = await loadTopScores();
        if (cancelled) return;
        setTopScores(scores ?? []);
        setBoardMessage(TEXT[lang].reasons.solved);
      } catch {
        if (!cancelled) {
          scoreRecordedRef.current = false;
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [page, edges, puzzle.grid, puzzleState.index, lang, refreshPlayerFromApi]);

  const cycleEdge = (value) => {
    if (value === EDGE_EMPTY) return EDGE_LINE;
    if (value === EDGE_LINE) return EDGE_BLOCKED;
    return EDGE_EMPTY;
  };

  const drawBoard = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const { rows, cols, size, padding, cell } = dims;
    const { hEdges, vEdges } = edges;
    canvas.width = size;
    canvas.height = size;

    ctx.clearRect(0, 0, size, size);
    ctx.fillStyle = "#efffed";
    ctx.fillRect(0, 0, size, size);

    ctx.lineWidth = 1;
    ctx.strokeStyle = "#2e7d32";

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x1 = padding + c * cell;
        const y = padding + r * cell;
        const x2 = x1 + cell;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
        drawEdgeState(ctx, hEdges[r][c], x1, y, x2, y);
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x = padding + c * cell;
        const y1 = padding + r * cell;
        const y2 = y1 + cell;
        ctx.beginPath();
        ctx.moveTo(x, y1);
        ctx.lineTo(x, y2);
        ctx.stroke();
        drawEdgeState(ctx, vEdges[r][c], x, y1, x, y2);
      }
    }

    ctx.fillStyle = "#163516";
    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c <= cols; c++) {
        ctx.beginPath();
        ctx.arc(padding + c * cell, padding + r * cell, 4, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `bold ${Math.floor(cell * 0.36)}px Segoe UI`;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const clue = puzzle.grid[r][c];
        if (clue === null) continue;
        const wrong = countCellEdges(hEdges, vEdges, r, c) > clue;
        ctx.fillStyle = wrong ? "#b00020" : "#1b5e20";
        ctx.fillText(clue, padding + c * cell + cell / 2, padding + r * cell + cell / 2);
      }
    }
  };

  const drawEdgeState = (ctx, state, x1, y1, x2, y2) => {
    if (state === EDGE_LINE) {
      ctx.strokeStyle = "#2e7d32";
      ctx.lineWidth = 6;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    } else if (state === EDGE_BLOCKED) {
      const mx = (x1 + x2) / 2;
      const my = (y1 + y2) / 2;
      ctx.strokeStyle = "#81c784";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(mx - 8, my - 8);
      ctx.lineTo(mx + 8, my + 8);
      ctx.moveTo(mx + 8, my - 8);
      ctx.lineTo(mx - 8, my + 8);
      ctx.stroke();
    }
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#2e7d32";
  };

  const distanceToSegment = (px, py, x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const dot = (px - x1) * dx + (py - y1) * dy;
    const lenSq = dx * dx + dy * dy;
    const t = lenSq === 0 ? 0 : Math.max(0, Math.min(1, dot / lenSq));
    const cx = x1 + t * dx;
    const cy = y1 + t * dy;
    return Math.hypot(px - cx, py - cy);
  };

  const handleCanvasClick = (event) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const x = (event.clientX - rect.left) * scaleX;
    const y = (event.clientY - rect.top) * scaleY;
    const { rows, cols, padding, cell } = dims;

    let best = null;
    let bestDistance = Number.POSITIVE_INFINITY;

    for (let r = 0; r <= rows; r++) {
      for (let c = 0; c < cols; c++) {
        const x1 = padding + c * cell;
        const y1 = padding + r * cell;
        const x2 = x1 + cell;
        const d = distanceToSegment(x, y, x1, y1, x2, y1);
        if (d < bestDistance) {
          bestDistance = d;
          best = { type: "h", r, c };
        }
      }
    }

    for (let r = 0; r < rows; r++) {
      for (let c = 0; c <= cols; c++) {
        const x1 = padding + c * cell;
        const y1 = padding + r * cell;
        const y2 = y1 + cell;
        const d = distanceToSegment(x, y, x1, y1, x1, y2);
        if (d < bestDistance) {
          bestDistance = d;
          best = { type: "v", r, c };
        }
      }
    }

    if (!best || bestDistance > HIT_DISTANCE) return;

    setEdges((prev) => {
      const next = {
        hEdges: prev.hEdges.map((row) => [...row]),
        vEdges: prev.vEdges.map((row) => [...row])
      };
      if (best.type === "h") next.hEdges[best.r][best.c] = cycleEdge(next.hEdges[best.r][best.c]);
      else next.vEdges[best.r][best.c] = cycleEdge(next.vEdges[best.r][best.c]);
      if (!validateProgress(puzzle.grid, next.hEdges, next.vEdges)) {
        setBoardMessage(TEXT[lang].progressBad);
      } else {
        setBoardMessage(TEXT[lang].progressOk);
      }
      return next;
    });
  };

  const resetCurrentPuzzle = () => {
    setEdges(createEdgeState(puzzle.grid));
    setBoardMessage(TEXT[lang].puzzleReset);
  };

  const nextPuzzle = () => {
    setPuzzleState((s) => {
      const nextIdx = (s.index + 1) % PUZZLE_LEVELS.length;
      const list = [...s.list];
      list[nextIdx] = generatePuzzleFromLevel(PUZZLE_LEVELS[nextIdx]);
      return { index: nextIdx, list };
    });
  };

  const checkCurrentSolution = () => {
    const result = checkSolved(puzzle.grid, edges.hEdges, edges.vEdges);
    setBoardMessage(TEXT[lang].reasons[result.reasonKey]);
  };

  const submitComment = async () => {
    const name = (await refreshPlayerFromApi()).trim();
    if (!name) {
      setCommentFeedback(TEXT[lang].playerRequired);
      return;
    }
    if (!commentInput.trim()) {
      setCommentFeedback(TEXT[lang].commentRequired);
      return;
    }
    try {
      await createComment({ player: name, comment: commentInput.trim() });
      const newComments = await loadComments();
      setComments(newComments ?? []);
      setCommentInput("");
      setCommentFeedback(TEXT[lang].commentSaved);
    } catch {
      setCommentFeedback(TEXT[lang].commentError);
    }
  };

  const submitRating = async () => {
    const name = (await refreshPlayerFromApi()).trim();
    if (!name) {
      setRatingFeedback(TEXT[lang].playerRequired);
      return;
    }
    const r = Number(ratingInput);
    if (Number.isNaN(r) || r < 0 || r > 5) {
      setRatingFeedback(TEXT[lang].ratingRange);
      return;
    }
    try {
      await createRating({ player: name, rating: r });
      const avg = await loadAverageRating();
      setAverageRating(avg?.averageRating ?? null);
      setRatingFeedback(TEXT[lang].ratingSaved);
    } catch {
      setRatingFeedback(TEXT[lang].ratingError);
    }
  };

  const authed = isLoggedIn();

  const afterAuthSuccess = async () => {
    setAuthModalOpen(false);
    setAuthError("");
    setLoginPassword("");
    setRegPassword("");
    await loadMeta();
    await refreshAdminState();
    await refreshPlayerFromApi();
    setAuthEpoch((n) => n + 1);
  };

  const handleSubmitLogin = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const email = loginEmail.trim();
      await loginUser(email, loginPassword);
      await afterAuthSuccess();
    } catch (e) {
      setAuthError(String(e?.message || e));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleSubmitRegister = async () => {
    setAuthLoading(true);
    setAuthError("");
    try {
      await registerUser({
        username: regUsername.trim(),
        email: regEmail.trim(),
        password: regPassword
      });
      await loginUser(regEmail.trim(), regPassword);
      await afterAuthSuccess();
    } catch (e) {
      setAuthError(String(e?.message || e));
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = async () => {
    await logoutUser();
    setIsAdmin(false);
    setAdminUsers([]);
    setTopScores([]);
    setComments([]);
    setAverageRating(null);
    setAuthEpoch((n) => n + 1);
    if (page === "admin") setPage("home");
  };

  const openSignIn = () => {
    setAuthModalReason("required");
    setAuthMode("login");
    setAuthError("");
    setAuthModalOpen(true);
  };

  return (
    <div className="app">
      <LoginModal
        open={authModalOpen}
        reason={authModalReason}
        mode={authMode}
        onModeChange={setAuthMode}
        loginEmail={loginEmail}
        onLoginEmail={setLoginEmail}
        loginPassword={loginPassword}
        onLoginPassword={setLoginPassword}
        regUsername={regUsername}
        onRegUsername={setRegUsername}
        regEmail={regEmail}
        onRegEmail={setRegEmail}
        regPassword={regPassword}
        onRegPassword={setRegPassword}
        onSubmitLogin={handleSubmitLogin}
        onSubmitRegister={handleSubmitRegister}
        loading={authLoading}
        error={authError}
        onClose={() => setAuthModalOpen(false)}
        strings={{
          sessionExpiredTitle: t.sessionExpiredTitle,
          signInTitle: t.signInTitle,
          authLead: t.authLead,
          tabLogin: t.tabLogin,
          tabRegister: t.tabRegister,
          email: t.email,
          password: t.password,
          username: t.username,
          register: t.register,
          backToLogin: t.backToLogin,
          cancel: t.cancel,
          signIn: t.signIn
        }}
      />

      <header>
        <div className="container navbar">
          <div className="logo">Slitherlink</div>
          <div className="nav-links">
            <button className={page === "home" ? "active" : ""} onClick={() => setPage("home")}>
              {t.navHome}
            </button>
            <button className={page === "game" ? "active" : ""} onClick={() => setPage("game")}>
              {t.navGame}
            </button>
            <button className={page === "reviews" ? "active" : ""} onClick={() => setPage("reviews")}>
              {t.navReviews}
            </button>
            {isAdmin ? (
              <button className={page === "admin" ? "active" : ""} onClick={() => setPage("admin")}>
                {t.navAdmin}
              </button>
            ) : null}
          </div>
          {authed ? (
            <button className="btn btn-nav" type="button" onClick={handleLogout}>
              {t.signOut}
            </button>
          ) : (
            <button className="btn btn-nav" type="button" onClick={openSignIn}>
              {t.signIn}
            </button>
          )}
          <button className="lang-btn" onClick={() => setLang((prev) => (prev === "en" ? "sk" : "en"))}>
            {lang === "en" ? "SK" : "EN"}
          </button>
        </div>
      </header>

      <main className="container">
        {page === "home" && (
          <section className="card hero home-page">
            <h1>{t.homeTitle}</h1>
            <p className="home-lead">{t.homeLead}</p>
            <div className="home-rules">
              <h2>{t.rulesTitle}</h2>
              <p className="home-rules-intro">{t.rulesIntro}</p>
              <ul className="rule-list">
                {t.rulesBullets.map((item, i) => (
                  <li key={`r-${i}`}>{item}</li>
                ))}
              </ul>
              <h2>{t.uiHintsTitle}</h2>
              <ul className="rule-list">
                {t.uiHintsBullets.map((item, i) => (
                  <li key={`u-${i}`}>{item}</li>
                ))}
              </ul>
            </div>
            <button className="btn home-play" type="button" onClick={() => setPage("game")}>
              {t.playNow}
            </button>
          </section>
        )}

        {page === "game" && (
          <section className="card game-layout">
            <div className="game-top">
              <h2>{t.puzzleTitle(puzzle.name)}</h2>
              <div className="status-box">{boardMessage}</div>
            </div>
            <div className="game-main-row">
              <aside className="comments-sidebar">
                <h3 className="comments-sidebar-title">{t.commentsSidebarTitle}</h3>
                <ul className="meta-list comments-scroll">
                  {!loadingMeta && comments.length === 0 && <li>{t.noComments}</li>}
                  {comments.map((c) => (
                    <li key={c.id}>
                      <strong>{c.player}</strong>: {c.comment}
                    </li>
                  ))}
                </ul>
                <div className="comment-form-inline">
                  <label>{t.commentLabel}</label>
                  <textarea
                    value={commentInput}
                    onChange={(e) => setCommentInput(e.target.value)}
                    placeholder={t.commentPlaceholder}
                    rows={4}
                  />
                  <button className="btn" type="button" onClick={submitComment}>
                    {t.submitComment}
                  </button>
                  {commentFeedback ? <p className="form-feedback">{commentFeedback}</p> : null}
                </div>
              </aside>
              <div className="game-board-col">
                <div className="canvas-wrapper">
                  <canvas ref={canvasRef} onClick={handleCanvasClick} />
                </div>
                <div className="controls">
                  <button className="btn" onClick={checkCurrentSolution}>
                    {t.check}
                  </button>
                  <button className="btn" onClick={resetCurrentPuzzle}>
                    {t.reset}
                  </button>
                  <button className="btn" onClick={nextPuzzle}>
                    {t.nextPuzzle}
                  </button>
                </div>
              </div>
            </div>
          </section>
        )}

        {page === "reviews" && (
          <section className="card">
            <h2>{t.reviewsTitle}</h2>
            <p>
              {t.avg}{" "}
              <strong>{averageRating === null ? "n/a" : Number(averageRating).toFixed(2)}</strong>
            </p>

            <div className="review-form">
              <label>{t.ratingLabel}</label>
              <input
                type="number"
                min="0"
                max="5"
                value={ratingInput}
                onChange={(e) => setRatingInput(e.target.value)}
              />
              <button className="btn" type="button" onClick={submitRating}>
                {t.submitRating}
              </button>
            </div>
            {ratingFeedback ? <p className="form-feedback">{ratingFeedback}</p> : null}

            <h3>{t.topScores}</h3>
            {loadingMeta ? (
              <p className="scores-table-status">{t.loading}</p>
            ) : topScores.length === 0 ? (
              <p className="scores-table-status">{t.noScores}</p>
            ) : (
              <div className="table-wrap">
                <table className="scores-table">
                  <thead>
                    <tr>
                      <th className="scores-col-rank">{t.scoreColRank}</th>
                      <th>{t.scoreColPlayer}</th>
                      <th className="scores-col-points">{t.scoreColPoints}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topScores.map((s, i) => (
                      <tr key={s.id ?? `${s.player}-${i}`}>
                        <td className="scores-col-rank">{i + 1}</td>
                        <td>{s.player}</td>
                        <td className="scores-col-points">{s.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}

        {page === "admin" && (
          <section className="card">
            <h2>{t.adminUsersTitle}</h2>
            {!isAdmin ? (
              <p>{t.adminDenied}</p>
            ) : adminError ? (
              <p className="auth-error">{adminError}</p>
            ) : adminLoading ? (
              <p>{t.loading}</p>
            ) : (
              <div className="table-wrap">
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>{t.adminColId}</th>
                      <th>{t.adminColUsername}</th>
                      <th>{t.adminColEmail}</th>
                      <th>{t.adminColRole}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {adminUsers.map((u) => (
                      <tr key={u.id ?? u.email}>
                        <td>{u.id}</td>
                        <td>{u.username}</td>
                        <td>{u.email}</td>
                        <td>{formatUserRole(u.userRole)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

export default App;
