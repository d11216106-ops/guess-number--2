/**
 * 猜數字遊戲 - Game Logic
 * Features:
 *   - Random number 1-100
 *   - Feedback: 太大了 / 太小了 / 恭喜通過
 *   - Guess counter & history
 *   - Input validation (1-100)
 *   - Enter key submission
 *   - LocalStorage for progress tracking (total games, best score)
 */

(function () {
  'use strict';

  // ── DOM refs ──────────────────────────────────────────────────────────────
  const guessInput   = document.getElementById('guess-input');
  const submitBtn    = document.getElementById('submit-btn');
  const resetBtn     = document.getElementById('reset-btn');
  const feedbackEl   = document.getElementById('feedback');
  const guessCountEl = document.getElementById('guess-count');
  const inputError   = document.getElementById('input-error');
  const historyList  = document.getElementById('history-list');
  const historyCard  = document.getElementById('history-card');
  const totalGamesEl = document.getElementById('total-games');
  const bestScoreEl  = document.getElementById('best-score');

  // ── State ─────────────────────────────────────────────────────────────────
  let secretNumber = 0;
  let guessCount   = 0;
  let gameOver     = false;

  // ── LocalStorage helpers ──────────────────────────────────────────────────
  const STORAGE_KEY = 'guessNumberProgress';

  function loadProgress() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY)) || { totalGames: 0, bestScore: null };
    } catch {
      return { totalGames: 0, bestScore: null };
    }
  }

  function saveProgress(data) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch {
      // localStorage unavailable – silently ignore
    }
  }

  function updateStatsDisplay() {
    const progress = loadProgress();
    totalGamesEl.textContent = progress.totalGames;
    bestScoreEl.textContent  = progress.bestScore !== null ? progress.bestScore : '-';
  }

  function recordWin(attempts) {
    const progress = loadProgress();
    progress.totalGames += 1;
    if (progress.bestScore === null || attempts < progress.bestScore) {
      progress.bestScore = attempts;
    }
    saveProgress(progress);
    updateStatsDisplay();
  }

  // ── Game control ──────────────────────────────────────────────────────────
  function generateSecret() {
    const arr = new Uint32Array(1);
    crypto.getRandomValues(arr);
    return (arr[0] % 100) + 1;
  }

  function startGame() {
    secretNumber = generateSecret();
    guessCount   = 0;
    gameOver     = false;

    feedbackEl.textContent = '';
    feedbackEl.className   = 'feedback';
    guessCountEl.textContent = '0';
    inputError.textContent   = '';
    historyList.innerHTML    = '';
    historyCard.classList.remove('visible');

    guessInput.value    = '';
    guessInput.disabled = false;
    submitBtn.disabled  = false;
    guessInput.focus();
  }

  // ── Guess handling ────────────────────────────────────────────────────────
  function submitGuess() {
    if (gameOver) return;

    const raw   = guessInput.value.trim();
    const value = Number(raw);

    // Validation
    if (raw === '' || !Number.isInteger(value) || value < 1 || value > 100) {
      inputError.textContent = '⚠️ 請輸入 1 到 100 之間的整數';
      guessInput.select();
      return;
    }
    inputError.textContent = '';

    guessCount += 1;
    guessCountEl.textContent = guessCount;

    let resultText  = '';
    let resultClass = '';
    let listClass   = '';

    if (value > secretNumber) {
      resultText  = '太大了！';
      resultClass = 'too-big';
      listClass   = 'result-too-big';
    } else if (value < secretNumber) {
      resultText  = '太小了！';
      resultClass = 'too-small';
      listClass   = 'result-too-small';
    } else {
      resultText  = `恭喜通過！答案就是 ${secretNumber}，你共猜了 ${guessCount} 次！`;
      resultClass = 'correct';
      listClass   = 'result-correct';
      gameOver    = true;
      guessInput.disabled = true;
      submitBtn.disabled  = true;
      recordWin(guessCount);
    }

    // Feedback display (re-trigger animation by cloning className)
    feedbackEl.className = 'feedback';
    // Force reflow to restart animation
    void feedbackEl.offsetWidth;
    feedbackEl.textContent = resultText;
    feedbackEl.className   = `feedback ${resultClass}`;

    // History entry
    addHistoryEntry(value, resultText, listClass);

    guessInput.value = '';
    if (!gameOver) guessInput.focus();
  }

  function addHistoryEntry(number, result, cssClass) {
    const li = document.createElement('li');
    li.className = cssClass;

    const numSpan = document.createElement('span');
    numSpan.className   = 'guess-num';
    numSpan.textContent = number;

    const resSpan = document.createElement('span');
    resSpan.className   = 'guess-result';
    resSpan.textContent = result;

    li.appendChild(numSpan);
    li.appendChild(resSpan);
    historyList.prepend(li);          // newest on top

    historyCard.classList.add('visible');
  }

  // ── Event listeners ───────────────────────────────────────────────────────
  submitBtn.addEventListener('click', submitGuess);

  guessInput.addEventListener('keydown', function (e) {
    if (e.key === 'Enter') submitGuess();
  });

  resetBtn.addEventListener('click', startGame);

  // ── Init ──────────────────────────────────────────────────────────────────
  updateStatsDisplay();
  startGame();
}());
