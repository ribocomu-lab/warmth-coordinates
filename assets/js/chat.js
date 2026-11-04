/**
 * 온도의 좌표 — 대화 진행, 입력·수정 추적, 대기 연출, 위기 안내 제어 (chat.js)
 */
(function (root) {
  "use strict";

  const {
    SITE_META,
    NAME_STEP_TEXT,
    CHAT_UI_TEXT,
    CLARIFY_UI_TEXT,
    CRISIS_MODAL_TEXT,
    COMFORT_TYPES,
    TYPE_ORDER,
    TURNS
  } = root.WC_SCRIPT;

  const {
    normalizeText,
    detectCrisisSignal,
    evaluateTurnInput,
    getClarificationTargets,
    classifyT6Response,
    createRevisionTracker
  } = root.WC_SCORING;

  const {
    safeLoadStorage,
    safeSaveStorage,
    createResultController
  } = root.WC_RESULT;

  const views = {
    landing: document.getElementById("view-landing"),
    name: document.getElementById("view-name"),
    chat: document.getElementById("view-chat"),
    clarify: document.getElementById("view-clarify"),
    result: document.getElementById("view-result")
  };

  const dom = {
    // 랜딩
    landingClock: document.getElementById("landing-clock"),
    landingSender: document.getElementById("landing-sender"),
    landingPreview: document.getElementById("landing-preview"),
    landingNotice: document.getElementById("landing-notice"),
    btnStartLanding: document.getElementById("btn-start-landing"),
    btnResumeResult: document.getElementById("btn-resume-result"),

    // 이름 정하기
    nameHeading: document.getElementById("name-heading"),
    nameSubheading: document.getElementById("name-subheading"),
    nameHelper: document.getElementById("name-helper"),
    formFriendName: document.getElementById("form-friend-name"),
    inputFriendName: document.getElementById("input-friend-name"),
    btnConfirmName: document.getElementById("btn-confirm-name"),
    btnSkipName: document.getElementById("btn-skip-name"),

    // 대화 화면
    btnChatBack: document.getElementById("btn-chat-back"),
    chatBackText: document.getElementById("chat-back-text"),
    chatFriendName: document.getElementById("chat-friend-name"),
    chatPeerStatus: document.getElementById("chat-peer-status"),
    chatClock: document.getElementById("chat-clock"),
    chatStream: document.getElementById("chat-stream"),
    skipWaitBar: document.getElementById("skip-wait-bar"),
    btnSkipWait: document.getElementById("btn-skip-wait"),
    choicePanel: document.getElementById("choice-panel"),
    choiceGuide: document.getElementById("choice-guide"),
    btnT7Fallback: document.getElementById("btn-t7-fallback"),
    choiceList: document.getElementById("choice-list"),
    formChatSend: document.getElementById("form-chat-send"),
    chatInput: document.getElementById("chat-input"),
    btnChatSend: document.getElementById("btn-chat-send"),

    // 애매한 문장 확인
    clarifyEyebrow: document.getElementById("clarify-eyebrow"),
    clarifyProgress: document.getElementById("clarify-progress"),
    clarifyHeading: document.getElementById("clarify-heading"),
    clarifyDesc: document.getElementById("clarify-desc"),
    clarifyQuote: document.getElementById("clarify-quote"),
    clarifyOptions: document.getElementById("clarify-options"),
    btnClarifySkip: document.getElementById("btn-clarify-skip"),

    // 위기 모달
    modalCrisis: document.getElementById("modal-crisis"),
    crisisHeading: document.getElementById("crisis-heading"),
    crisisBody: document.getElementById("crisis-body"),
    crisisContacts: document.getElementById("crisis-contacts"),
    btnCrisisContinue: document.getElementById("btn-crisis-continue"),
    btnCrisisExit: document.getElementById("btn-crisis-exit")
  };

  const state = {
    friendName: SITE_META.defaultFriendName,
    turnIndex: 0,
    turnRecords: [],
    revisionTracker: createRevisionTracker(),
    selectedOption: null,
    t7ShowFallback: false,
    isWaitingPeer: false,
    waitTasks: [],
    activeTimer: null,
    typingRowEl: null,
    pendingCrisisSubmission: null,
    clarifyTargets: [],
    clarifyIndex: 0
  };

  const resultController = createResultController({
    onRestart: function () {
      clearUrlQuery();
      openNameStep();
    },
    onErased: function () {
      clearUrlQuery();
      refreshLandingResumeButton();
      switchView("landing");
    }
  });

  function isReducedMotion() {
    return Boolean(
      root.matchMedia &&
        root.matchMedia("(prefers-reduced-motion: reduce)").matches
    );
  }

  function clearUrlQuery() {
    if (root.history && root.history.replaceState && root.location.search) {
      root.history.replaceState({}, "", root.location.pathname);
    }
  }

  function switchView(targetKey) {
    Object.keys(views).forEach(function (key) {
      views[key].hidden = key !== targetKey;
    });
    document.body.setAttribute(
      "data-scene",
      targetKey === "result" ? "result" : "night"
    );
    root.scrollTo(0, 0);
  }

  function refreshLandingResumeButton() {
    const saved = safeLoadStorage();
    dom.btnResumeResult.hidden = !(
      saved &&
      Array.isArray(saved.turnRecords) &&
      saved.turnRecords.length > 0
    );
  }

  function initStaticCopy() {
    // 랜딩
    dom.landingClock.textContent = SITE_META.landingTime;
    dom.landingSender.textContent = SITE_META.landingPreviewSender;
    dom.landingPreview.textContent = SITE_META.landingPreviewText;
    dom.btnStartLanding.textContent = SITE_META.landingCta;
    dom.btnResumeResult.textContent = SITE_META.resumeCta;
    dom.landingNotice.textContent = SITE_META.landingNotice;

    // 이름 단계
    dom.nameHeading.textContent = NAME_STEP_TEXT.heading;
    dom.nameSubheading.textContent = NAME_STEP_TEXT.subheading;
    dom.nameHelper.textContent = NAME_STEP_TEXT.helper;
    dom.inputFriendName.placeholder = NAME_STEP_TEXT.placeholder;
    dom.btnConfirmName.textContent = NAME_STEP_TEXT.startBtn;
    dom.btnSkipName.textContent = NAME_STEP_TEXT.skipBtn;

    // 대화 상단·하단
    dom.chatBackText.textContent = CHAT_UI_TEXT.backLabel;
    dom.btnSkipWait.textContent = CHAT_UI_TEXT.skipWaitHint;

    // 문장 확인 단계
    dom.clarifyEyebrow.textContent = CLARIFY_UI_TEXT.eyebrow;
    dom.clarifyHeading.textContent = CLARIFY_UI_TEXT.heading;
    dom.clarifyDesc.textContent = CLARIFY_UI_TEXT.description;
    dom.btnClarifySkip.textContent = CLARIFY_UI_TEXT.skipBtn;

    // 위기 안내 모달
    dom.crisisHeading.textContent = CRISIS_MODAL_TEXT.heading;
    dom.crisisBody.textContent = CRISIS_MODAL_TEXT.body;
    dom.btnCrisisContinue.textContent = CRISIS_MODAL_TEXT.continueBtn;
    dom.btnCrisisExit.textContent = CRISIS_MODAL_TEXT.exitBtn;

    dom.crisisContacts.innerHTML = "";
    CRISIS_MODAL_TEXT.contacts.forEach(function (c) {
      const link = document.createElement("a");
      link.className = "crisis-contact-link";
      link.href = "tel:" + c.tel;

      const labelSpan = document.createElement("span");
      labelSpan.textContent = c.name + " (" + c.note + ")";
      const numStrong = document.createElement("strong");
      numStrong.textContent = c.number;

      link.appendChild(labelSpan);
      link.appendChild(numStrong);
      dom.crisisContacts.appendChild(link);
    });
  }

  function scrollToChatBottom() {
    dom.chatStream.scrollTop = dom.chatStream.scrollHeight;
  }

  function resizeComposer() {
    dom.chatInput.style.height = "auto";
    const nextHeight = Math.min(dom.chatInput.scrollHeight, 112);
    dom.chatInput.style.height = nextHeight + "px";
  }

  function syncSendButtonState() {
    const hasText = normalizeText(dom.chatInput.value).length > 0;
    dom.btnChatSend.disabled = !hasText || state.isWaitingPeer;
  }

  function removeTypingIndicator() {
    if (state.typingRowEl && state.typingRowEl.parentNode) {
      state.typingRowEl.parentNode.removeChild(state.typingRowEl);
    }
    state.typingRowEl = null;
  }

  function showTypingIndicator() {
    removeTypingIndicator();
    const row = document.createElement("div");
    row.className = "msg-row msg-row--peer";
    row.setAttribute("aria-label", state.friendName + " " + CHAT_UI_TEXT.typingLabel);

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";

    const dots = document.createElement("div");
    dots.className = "typing-dots";
    dots.setAttribute("aria-hidden", "true");
    dots.innerHTML = "<span></span><span></span><span></span>";

    bubble.appendChild(dots);
    row.appendChild(bubble);
    dom.chatStream.appendChild(row);
    state.typingRowEl = row;
    scrollToChatBottom();
  }

  function appendPeerBubble(text, showSenderLabel) {
    removeTypingIndicator();
    const row = document.createElement("div");
    row.className = "msg-row msg-row--peer";

    if (showSenderLabel) {
      const sender = document.createElement("span");
      sender.className = "msg-sender-label";
      sender.textContent = state.friendName;
      row.appendChild(sender);
    }

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;

    row.appendChild(bubble);
    dom.chatStream.appendChild(row);
    scrollToChatBottom();
  }

  function appendMyBubble(text, timeStr) {
    const row = document.createElement("div");
    row.className = "msg-row msg-row--me";

    const line = document.createElement("div");
    line.className = "msg-bubble-line";

    const meta = document.createElement("div");
    meta.className = "msg-meta";

    const readSpan = document.createElement("span");
    readSpan.className = "msg-read";
    readSpan.textContent = CHAT_UI_TEXT.readReceipt;

    const timeSpan = document.createElement("span");
    timeSpan.textContent = timeStr;

    meta.appendChild(readSpan);
    meta.appendChild(timeSpan);

    const bubble = document.createElement("div");
    bubble.className = "msg-bubble";
    bubble.textContent = text;

    line.appendChild(meta);
    line.appendChild(bubble);
    row.appendChild(line);
    dom.chatStream.appendChild(row);
    scrollToChatBottom();
  }

  /**
   * 비동기 대기 큐 실행기 (합계 대기 시간 최대 1.5초 이내, 화면 탭 시 즉시 완료)
   */
  function runWaitSequence(steps, onComplete) {
    clearPendingWait();

    if (isReducedMotion() || steps.length === 0) {
      steps.forEach(function (step) {
        step.run();
      });
      onComplete();
      return;
    }

    state.isWaitingPeer = true;
    state.waitTasks = steps.slice();
    state.onWaitComplete = onComplete;
    dom.choicePanel.hidden = true;
    dom.chatInput.disabled = true;
    dom.skipWaitBar.hidden = false;
    syncSendButtonState();

    scheduleNextWaitTask();
  }

  function scheduleNextWaitTask() {
    if (state.waitTasks.length === 0) {
      finishWaitSequence();
      return;
    }

    const nextTask = state.waitTasks.shift();
    if (nextTask.showTyping) {
      showTypingIndicator();
    }

    state.activeTimer = setTimeout(function () {
      state.activeTimer = null;
      nextTask.run();
      scheduleNextWaitTask();
    }, nextTask.delayMs);
  }

  function flushWaitSequence() {
    if (!state.isWaitingPeer) return;
    if (state.activeTimer) {
      clearTimeout(state.activeTimer);
      state.activeTimer = null;
    }
    removeTypingIndicator();
    while (state.waitTasks.length > 0) {
      const task = state.waitTasks.shift();
      task.run();
    }
    finishWaitSequence();
  }

  function finishWaitSequence() {
    removeTypingIndicator();
    state.isWaitingPeer = false;
    dom.skipWaitBar.hidden = true;
    const done = state.onWaitComplete;
    state.onWaitComplete = null;
    if (typeof done === "function") {
      done();
    }
  }

  function clearPendingWait() {
    if (state.activeTimer) {
      clearTimeout(state.activeTimer);
      state.activeTimer = null;
    }
    removeTypingIndicator();
    state.waitTasks = [];
    state.onWaitComplete = null;
    state.isWaitingPeer = false;
    dom.skipWaitBar.hidden = true;
  }

  /**
   * T7 "막히면 대신 고르기"용 선택지 생성 (앞서 보낸 내 위로 문장 우선)
   */
  function buildT7FallbackOptions() {
    const earlierComfort = state.turnRecords.filter(function (rec) {
      return (
        ["T1", "T2", "T3", "T5"].includes(rec.turnId) &&
        normalizeText(rec.text).length >= 2 &&
        !detectCrisisSignal(rec.text).detected
      );
    });

    if (earlierComfort.length > 0) {
      return earlierComfort.map(function (rec, idx) {
        return {
          id: "T7_prev_" + idx,
          type: rec.clarifiedType || rec.resolvedType || rec.optionType || null,
          text: rec.text
        };
      });
    }

    return TURNS[7].defaultFallbackOptions.slice();
  }

  function renderTurnControls() {
    const turn = TURNS[state.turnIndex];
    if (!turn) return;

    dom.chatClock.textContent = turn.time;
    dom.choicePanel.hidden = false;
    dom.chatInput.disabled = false;
    dom.chatInput.value = "";
    resizeComposer();

    state.selectedOption = null;
    state.revisionTracker.resetTurn();

    dom.choiceList.innerHTML = "";

    if (turn.role === "closing") {
      dom.chatInput.placeholder = CHAT_UI_TEXT.inputPlaceholderT7;
      dom.choiceGuide.textContent = CHAT_UI_TEXT.t7Guide;
      dom.btnT7Fallback.hidden = false;
      dom.btnT7Fallback.textContent = state.t7ShowFallback
        ? CHAT_UI_TEXT.t7HideFallbackBtn
        : CHAT_UI_TEXT.t7FallbackBtn;

      if (state.t7ShowFallback) {
        const fallbackOpts = buildT7FallbackOptions();
        renderOptionChips(fallbackOpts);
      }
    } else {
      dom.chatInput.placeholder = CHAT_UI_TEXT.inputPlaceholder;
      dom.choiceGuide.textContent = CHAT_UI_TEXT.choiceGuide;
      dom.btnT7Fallback.hidden = true;
      renderOptionChips(turn.options || []);
    }

    syncSendButtonState();
  }

  function renderOptionChips(options) {
    dom.choiceList.innerHTML = "";
    options.forEach(function (opt) {
      const chip = document.createElement("button");
      chip.type = "button";
      chip.className = "choice-chip";
      chip.textContent = opt.text;

      chip.addEventListener("click", function () {
        const prevTrimmed = normalizeText(dom.chatInput.value);
        const hadDiffText =
          prevTrimmed.length > 0 && prevTrimmed !== normalizeText(opt.text);

        state.revisionTracker.onOptionFill(opt.text, hadDiffText);
        state.selectedOption = opt;

        dom.chatInput.value = opt.text;
        resizeComposer();
        syncSendButtonState();

        const allChips = dom.choiceList.querySelectorAll(".choice-chip");
        allChips.forEach(function (el) {
          el.classList.toggle("is-selected", el === chip);
        });

        dom.chatInput.focus();
        const len = dom.chatInput.value.length;
        dom.chatInput.setSelectionRange(len, len);
      });

      dom.choiceList.appendChild(chip);
    });
  }

  function openNameStep() {
    dom.inputFriendName.value = "";
    switchView("name");
    setTimeout(function () {
      dom.inputFriendName.focus();
    }, 30);
  }

  function startConversation(rawFriendName) {
    const cleanName = normalizeText(rawFriendName);
    state.friendName = cleanName || SITE_META.defaultFriendName;
    state.turnIndex = 0;
    state.turnRecords = [];
    state.revisionTracker = createRevisionTracker();
    state.selectedOption = null;
    state.t7ShowFallback = false;
    state.pendingCrisisSubmission = null;
    state.clarifyTargets = [];
    state.clarifyIndex = 0;

    dom.chatFriendName.textContent = state.friendName;
    dom.chatPeerStatus.textContent = CHAT_UI_TEXT.statusAwake;
    dom.chatClock.textContent = TURNS[0].time;
    dom.chatStream.innerHTML = "";

    switchView("chat");

    const firstTurn = TURNS[0];
    const steps = firstTurn.friendMessages.map(function (msg, idx) {
      return {
        delayMs: idx === 0 ? 380 : 420,
        showTyping: true,
        run: function () {
          appendPeerBubble(msg, idx === 0);
        }
      };
    });

    runWaitSequence(steps, function () {
      renderTurnControls();
    });
  }

  function pickFriendReaction(turn, record, selectedOption) {
    if (turn.role === "closing") {
      return turn.closingReply;
    }

    if (turn.role === "receiving") {
      if (
        (record.mode === "choice" || record.mode === "edited") &&
        selectedOption &&
        selectedOption.reply
      ) {
        return selectedOption.reply;
      }
      const receivingCat = classifyT6Response(record);
      return (
        (turn.customReplies && turn.customReplies[receivingCat]) ||
        turn.customReplies.closed
      );
    }

    if (
      (record.mode === "choice" || record.mode === "edited") &&
      selectedOption &&
      selectedOption.reply
    ) {
      return selectedOption.reply;
    }

    if (Array.isArray(turn.customReplies) && turn.customReplies.length > 0) {
      const pickIdx = state.turnIndex % turn.customReplies.length;
      return turn.customReplies[pickIdx];
    }

    return null;
  }

  function handleTurnSubmit(bypassCrisisCheck) {
    if (state.isWaitingPeer) return;
    const rawText = dom.chatInput.value;
    const cleanText = normalizeText(rawText);
    if (!cleanText) return;

    // 위기 표현 감지 (기획안 7장)
    if (!bypassCrisisCheck && detectCrisisSignal(cleanText).detected) {
      state.pendingCrisisSubmission = cleanText;
      dom.modalCrisis.hidden = false;
      dom.btnCrisisContinue.focus();
      return;
    }

    const currentTurn = TURNS[state.turnIndex];
    const selectedOpt = state.selectedOption;

    appendMyBubble(cleanText, currentTurn.time);

    const evaluated = evaluateTurnInput({
      turnId: currentTurn.id,
      text: cleanText,
      selectedOption: selectedOpt
    });
    state.turnRecords.push(evaluated);

    const reactionText = pickFriendReaction(currentTurn, evaluated, selectedOpt);
    const isLastTurn = state.turnIndex >= TURNS.length - 1;

    // 입력창 비활성화 후 친구 반응 및 다음 턴 메시지 전달 (합산 최대 대기 1.35초 이내)
    dom.chatInput.value = "";
    resizeComposer();
    state.selectedOption = null;

    if (isLastTurn) {
      const closingSteps = [];
      if (reactionText) {
        closingSteps.push({
          delayMs: 550,
          showTyping: true,
          run: function () {
            appendPeerBubble(reactionText, true);
            dom.chatPeerStatus.textContent = CHAT_UI_TEXT.statusSleeping;
          }
        });
        closingSteps.push({
          delayMs: 600,
          showTyping: false,
          run: function () {}
        });
      }

      runWaitSequence(closingSteps, function () {
        proceedAfterConversation();
      });
      return;
    }

    state.turnIndex += 1;
    state.t7ShowFallback = false;
    const nextTurn = TURNS[state.turnIndex];
    const sequence = [];

    if (reactionText) {
      sequence.push({
        delayMs: 500,
        showTyping: true,
        run: function () {
          appendPeerBubble(reactionText, true);
        }
      });
    }

    const nextMsgs = nextTurn.friendMessages || [];
    const perMsgDelay = nextMsgs.length > 1 ? 400 : 520;

    nextMsgs.forEach(function (msg, idx) {
      sequence.push({
        delayMs: perMsgDelay,
        showTyping: true,
        run: function () {
          if (idx === 0) {
            dom.chatClock.textContent = nextTurn.time;
          }
          appendPeerBubble(msg, idx === 0 && !reactionText);
        }
      });
    });

    runWaitSequence(sequence, function () {
      renderTurnControls();
    });
  }

  /**
   * 대화 종료 후 애매한 직접 입력 문장 확인(최대 2문장) 또는 바로 결과 화면 진입
   */
  function proceedAfterConversation() {
    const targets = getClarificationTargets(state.turnRecords, 2);
    if (targets.length === 0) {
      finalizeToResult();
      return;
    }
    state.clarifyTargets = targets;
    state.clarifyIndex = 0;
    renderClarifyStep();
    switchView("clarify");
  }

  function renderClarifyStep() {
    const target = state.clarifyTargets[state.clarifyIndex];
    if (!target) {
      finalizeToResult();
      return;
    }

    dom.clarifyProgress.textContent = CLARIFY_UI_TEXT.progressTemplate
      .replace("{current}", String(state.clarifyIndex + 1))
      .replace("{total}", String(state.clarifyTargets.length));
    dom.clarifyQuote.textContent = "“" + target.text + "”";

    dom.clarifyOptions.innerHTML = "";
    TYPE_ORDER.forEach(function (code) {
      const def = COMFORT_TYPES[code];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "clarify-option-btn";

      const titleSpan = document.createElement("span");
      titleSpan.className = "clarify-option-title";
      titleSpan.textContent = def.clarifyLabel;

      const descSpan = document.createElement("span");
      descSpan.className = "clarify-option-desc";
      descSpan.textContent = def.clarifyDesc;

      btn.appendChild(titleSpan);
      btn.appendChild(descSpan);

      btn.addEventListener("click", function () {
        target.clarifiedType = code;
        advanceClarifyStep();
      });

      dom.clarifyOptions.appendChild(btn);
    });
  }

  function advanceClarifyStep() {
    state.clarifyIndex += 1;
    if (state.clarifyIndex >= state.clarifyTargets.length) {
      finalizeToResult();
    } else {
      renderClarifyStep();
    }
  }

  function finalizeToResult() {
    const sessionPayload = {
      version: 1,
      savedAt: Date.now(),
      friendName: state.friendName,
      turnRecords: state.turnRecords,
      meta: {
        revisionCount: state.revisionTracker.getCount()
      },
      overriddenType: null,
      feedback: null
    };

    safeSaveStorage(sessionPayload);
    refreshLandingResumeButton();
    resultController.renderFullSession(sessionPayload);
    switchView("result");
  }

  function bindEvents() {
    // 1. 랜딩
    dom.btnStartLanding.addEventListener("click", function () {
      openNameStep();
    });

    dom.btnResumeResult.addEventListener("click", function () {
      const saved = safeLoadStorage();
      if (saved && Array.isArray(saved.turnRecords)) {
        resultController.renderFullSession(saved);
        switchView("result");
      }
    });

    // 2. 친구 이름 정하기
    dom.formFriendName.addEventListener("submit", function (e) {
      e.preventDefault();
      startConversation(dom.inputFriendName.value);
    });

    dom.btnSkipName.addEventListener("click", function () {
      startConversation(SITE_META.defaultFriendName);
    });

    // 3. 대화 화면 제어
    dom.btnChatBack.addEventListener("click", function () {
      if (
        state.turnRecords.length === 0 ||
        root.confirm(CHAT_UI_TEXT.backConfirm)
      ) {
        clearPendingWait();
        refreshLandingResumeButton();
        switchView("landing");
      }
    });

    dom.chatStream.addEventListener("click", function () {
      flushWaitSequence();
    });

    dom.btnSkipWait.addEventListener("click", function () {
      flushWaitSequence();
    });

    dom.btnT7Fallback.addEventListener("click", function () {
      state.t7ShowFallback = !state.t7ShowFallback;
      dom.btnT7Fallback.textContent = state.t7ShowFallback
        ? CHAT_UI_TEXT.t7HideFallbackBtn
        : CHAT_UI_TEXT.t7FallbackBtn;

      if (state.t7ShowFallback) {
        renderOptionChips(buildT7FallbackOptions());
      } else {
        dom.choiceList.innerHTML = "";
      }
    });

    dom.chatInput.addEventListener("input", function () {
      state.revisionTracker.onInputChange(dom.chatInput.value);
      if (normalizeText(dom.chatInput.value).length === 0) {
        state.selectedOption = null;
        const chips = dom.choiceList.querySelectorAll(".choice-chip");
        chips.forEach(function (c) {
          c.classList.remove("is-selected");
        });
      }
      resizeComposer();
      syncSendButtonState();
    });

    // 한국어 IME 조합 중(isComposing) Enter 오작동 방지 + Shift+Enter 줄바꿈 지원
    dom.chatInput.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        if (e.isComposing || e.keyCode === 229) {
          return;
        }
        e.preventDefault();
        if (!dom.btnChatSend.disabled) {
          handleTurnSubmit(false);
        }
      }
    });

    dom.formChatSend.addEventListener("submit", function (e) {
      e.preventDefault();
      handleTurnSubmit(false);
    });

    // 4. 문장 확인 건너뛰기
    dom.btnClarifySkip.addEventListener("click", function () {
      advanceClarifyStep();
    });

    // 5. 위기 신호 모달
    dom.btnCrisisContinue.addEventListener("click", function () {
      dom.modalCrisis.hidden = true;
      if (state.pendingCrisisSubmission !== null) {
        state.pendingCrisisSubmission = null;
        handleTurnSubmit(true);
      }
    });

    dom.btnCrisisExit.addEventListener("click", function () {
      dom.modalCrisis.hidden = true;
      state.pendingCrisisSubmission = null;
      clearPendingWait();
      dom.chatInput.value = "";
      refreshLandingResumeButton();
      switchView("landing");
    });
  }

  function boot() {
    initStaticCopy();
    bindEvents();
    refreshLandingResumeButton();

    // URL 공유 쿼리(?t=rest 등)로 접근한 경우 유형 안내 표시
    const params = new URLSearchParams(root.location.search);
    const sharedType = params.get("t");
    if (sharedType && COMFORT_TYPES[sharedType]) {
      resultController.renderSharedPreview(sharedType);
      switchView("result");
      return;
    }

    switchView("landing");
  }

  boot();
})(typeof window !== "undefined" ? window : globalThis);
