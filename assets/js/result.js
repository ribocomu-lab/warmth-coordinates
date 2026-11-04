/**
 * 온도의 좌표 — 텍스트 결과 렌더링, 문장 재선택, 로컬 저장·삭제 모듈 (result.js)
 */
(function (root) {
  "use strict";

  const {
    SITE_META,
    COMFORT_TYPES,
    TYPE_ORDER,
    TURNS,
    RESULT_UI_TEXT
  } = root.WC_SCRIPT;

  const { withKoreanParticle, scoreConversation } = root.WC_SCORING;

  function safeLoadStorage() {
    try {
      const raw = root.localStorage.getItem(SITE_META.storageKey);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (!parsed || typeof parsed !== "object") return null;
      return parsed;
    } catch (_err) {
      return null;
    }
  }

  function safeSaveStorage(payload) {
    try {
      root.localStorage.setItem(SITE_META.storageKey, JSON.stringify(payload));
      return true;
    } catch (_err) {
      return false;
    }
  }

  function safeClearStorage() {
    try {
      root.localStorage.removeItem(SITE_META.storageKey);
      return true;
    } catch (_err) {
      return false;
    }
  }

  function buildShareUrl(typeCode) {
    const validType = COMFORT_TYPES[typeCode] ? typeCode : "companionship";
    const url = new URL(root.location.href);
    url.search = "";
    url.hash = "";
    url.searchParams.set("t", validType);
    return url.toString();
  }

  async function copyShareLink(typeCode) {
    const shareUrl = buildShareUrl(typeCode);
    if (root.navigator && root.navigator.share) {
      try {
        await root.navigator.share({
          title: SITE_META.title,
          text: SITE_META.subtitle,
          url: shareUrl
        });
        return { shared: true, url: shareUrl };
      } catch (err) {
        if (err && err.name === "AbortError") {
          return { aborted: true, url: shareUrl };
        }
      }
    }

    if (root.navigator && root.navigator.clipboard && root.navigator.clipboard.writeText) {
      try {
        await root.navigator.clipboard.writeText(shareUrl);
        return { copied: true, url: shareUrl };
      } catch (_clipErr) {
        // fallback below
      }
    }

    const tempInput = document.createElement("textarea");
    tempInput.value = shareUrl;
    tempInput.setAttribute("readonly", "");
    tempInput.style.position = "fixed";
    tempInput.style.opacity = "0";
    document.body.appendChild(tempInput);
    tempInput.select();
    let ok = false;
    try {
      ok = document.execCommand("copy");
    } catch (_execErr) {
      ok = false;
    }
    document.body.removeChild(tempInput);
    return { copied: ok, url: shareUrl };
  }

  function createResultController(callbacks) {
    const onRestart = callbacks.onRestart || function () {};
    const onErased = callbacks.onErased || function () {};

    const els = {
      sharedBanner: document.getElementById("shared-mode-banner"),
      sharedBannerText: document.getElementById("shared-banner-text"),
      btnSharedTry: document.getElementById("btn-shared-try"),

      bridgeWrap: document.getElementById("result-bridge-wrap"),
      bridgeText: document.getElementById("result-bridge-text"),

      sectionReturned: document.getElementById("section-returned-sentence"),
      returnedEyebrow: document.getElementById("returned-eyebrow"),
      returnedSourceBadge: document.getElementById("returned-source-badge"),
      returnedQuote: document.getElementById("returned-quote"),
      readAloudPrompt: document.getElementById("read-aloud-prompt"),

      typeEyebrow: document.getElementById("type-eyebrow"),
      mainHeading: document.getElementById("result-main-heading"),
      axisTag: document.getElementById("result-axis-tag"),
      neededQuoteLabel: document.getElementById("needed-quote-label"),
      neededQuote: document.getElementById("result-needed-quote"),
      typeSummary: document.getElementById("result-type-summary"),
      metaphorLabel: document.getElementById("metaphor-label"),
      typeMetaphor: document.getElementById("result-type-metaphor"),
      typeDetail: document.getElementById("result-type-detail"),
      secondaryNote: document.getElementById("result-secondary-note"),

      sectionFeedback: document.getElementById("section-feedback"),
      feedbackHeading: document.getElementById("feedback-heading"),
      btnFeedbackYes: document.getElementById("btn-feedback-yes"),
      btnFeedbackOther: document.getElementById("btn-feedback-other"),
      feedbackStatus: document.getElementById("feedback-status"),
      quoteReselector: document.getElementById("quote-reselector"),
      feedbackPickerGuide: document.getElementById("feedback-picker-guide"),
      reselectList: document.getElementById("reselect-list"),

      sectionQuadrant: document.getElementById("section-quadrant"),
      quadrantEyebrow: document.getElementById("quadrant-eyebrow"),
      quadrantHeading: document.getElementById("quadrant-heading"),
      quadrantSubcopy: document.getElementById("quadrant-subcopy"),
      axisTopLabel: document.getElementById("axis-top-label"),
      axisBottomLabel: document.getElementById("axis-bottom-label"),
      axisLeftLabel: document.getElementById("axis-left-label"),
      axisRightLabel: document.getElementById("axis-right-label"),
      coordGrid: document.getElementById("coord-grid"),
      coordDot: document.getElementById("coord-dot"),
      quadrantDesc: document.getElementById("quadrant-desc"),

      sectionHabits: document.getElementById("section-habits"),
      habitsHeading: document.getElementById("habits-heading"),
      habitList: document.getElementById("habit-list"),
      sentLogDetails: document.getElementById("sent-log-details"),
      sentLogSummary: document.getElementById("sent-log-summary"),
      sentLogList: document.getElementById("sent-log-list"),

      btnCopyLink: document.getElementById("btn-copy-link"),
      btnRestart: document.getElementById("btn-restart"),
      btnEraseData: document.getElementById("btn-erase-data"),
      actionToast: document.getElementById("action-toast"),

      disclaimerTitle: document.getElementById("disclaimer-title"),
      disclaimerList: document.getElementById("disclaimer-list")
    };

    let currentSession = null;
    let currentScored = null;
    let activeDisplayType = "companionship";
    let toastTimer = null;

    function showToast(message) {
      if (!els.actionToast) return;
      els.actionToast.textContent = message;
      els.actionToast.hidden = false;
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        els.actionToast.hidden = true;
      }, 3600);
    }

    function initStaticLabels() {
      els.sharedBannerText.textContent = RESULT_UI_TEXT.sharedBannerText;
      els.btnSharedTry.textContent = RESULT_UI_TEXT.sharedStartBtn;
      els.returnedEyebrow.textContent = RESULT_UI_TEXT.returnedEyebrow;
      els.readAloudPrompt.textContent = RESULT_UI_TEXT.readAloudPrompt;
      els.typeEyebrow.textContent = RESULT_UI_TEXT.typeEyebrow;
      els.neededQuoteLabel.textContent = RESULT_UI_TEXT.neededHeadlineLabel;
      els.metaphorLabel.textContent = RESULT_UI_TEXT.metaphorLabel;
      els.feedbackHeading.textContent = RESULT_UI_TEXT.feedbackHeading;
      els.btnFeedbackYes.textContent = RESULT_UI_TEXT.feedbackYesBtn;
      els.btnFeedbackOther.textContent = RESULT_UI_TEXT.feedbackOtherBtn;
      els.feedbackPickerGuide.textContent = RESULT_UI_TEXT.feedbackPickerGuide;
      els.quadrantEyebrow.textContent = RESULT_UI_TEXT.quadrantEyebrow;
      els.quadrantSubcopy.textContent = RESULT_UI_TEXT.quadrantSubcopy;
      els.axisTopLabel.textContent = RESULT_UI_TEXT.axisTop;
      els.axisBottomLabel.textContent = RESULT_UI_TEXT.axisBottom;
      els.axisLeftLabel.textContent = RESULT_UI_TEXT.axisLeft;
      els.axisRightLabel.textContent = RESULT_UI_TEXT.axisRight;
      els.habitsHeading.textContent = RESULT_UI_TEXT.habitsEyebrow;
      els.sentLogSummary.textContent = RESULT_UI_TEXT.myMessagesSummary;
      els.btnCopyLink.textContent = RESULT_UI_TEXT.shareLinkBtn;
      els.btnRestart.textContent = RESULT_UI_TEXT.restartBtn;
      els.btnEraseData.textContent = RESULT_UI_TEXT.eraseBtn;
      els.disclaimerTitle.textContent = RESULT_UI_TEXT.disclaimerTitle;

      els.disclaimerList.innerHTML = "";
      RESULT_UI_TEXT.disclaimerItems.forEach(function (item) {
        const li = document.createElement("li");
        li.textContent = item;
        els.disclaimerList.appendChild(li);
      });
    }

    function renderTypeBlock(typeCode, secondaryCode) {
      const typeDef = COMFORT_TYPES[typeCode] || COMFORT_TYPES.companionship;
      activeDisplayType = typeDef.code;

      els.mainHeading.textContent = typeDef.name;
      els.axisTag.textContent = typeDef.axisLabel;
      els.neededQuote.textContent = "“" + typeDef.neededQuote + "”";
      els.typeSummary.textContent = typeDef.summary;
      els.typeMetaphor.textContent = typeDef.innerChildMetaphor;
      els.typeDetail.textContent = typeDef.detail;

      if (secondaryCode && secondaryCode !== typeDef.code && COMFORT_TYPES[secondaryCode]) {
        const secDef = COMFORT_TYPES[secondaryCode];
        els.secondaryNote.textContent = RESULT_UI_TEXT.secondaryTypeTemplate
          .replace("{secondaryName}", secDef.name)
          .replace("{secondaryQuote}", secDef.neededQuote);
        els.secondaryNote.hidden = false;
      } else {
        els.secondaryNote.hidden = true;
      }

      // 재선택 버튼 활성 표시 동기화
      const buttons = els.reselectList.querySelectorAll(".reselect-btn");
      buttons.forEach(function (btn) {
        const isCurrent = btn.getAttribute("data-type") === typeDef.code;
        btn.classList.toggle("is-active", isCurrent);
        btn.setAttribute("aria-pressed", isCurrent ? "true" : "false");
      });
    }

    function buildReselectorButtons() {
      els.reselectList.innerHTML = "";
      TYPE_ORDER.forEach(function (code) {
        const def = COMFORT_TYPES[code];
        const btn = document.createElement("button");
        btn.type = "button";
        btn.className = "reselect-btn";
        btn.setAttribute("data-type", code);
        btn.setAttribute("aria-pressed", "false");

        const quoteSpan = document.createElement("span");
        quoteSpan.className = "reselect-quote";
        quoteSpan.textContent = "“" + def.neededQuote + "”";

        const metaSpan = document.createElement("span");
        metaSpan.className = "reselect-type";
        metaSpan.textContent = def.name + " · " + def.clarifyDesc;

        btn.appendChild(quoteSpan);
        btn.appendChild(metaSpan);

        btn.addEventListener("click", function () {
          const secondary = currentScored ? currentScored.secondaryType : null;
          renderTypeBlock(code, secondary);
          els.feedbackStatus.textContent = RESULT_UI_TEXT.feedbackChangedNotice;
          els.feedbackStatus.hidden = false;

          if (currentSession) {
            currentSession.overriddenType = code;
            currentSession.feedback = "reselected";
            safeSaveStorage(currentSession);
          }
        });

        els.reselectList.appendChild(btn);
      });
    }

    function renderFullSession(session) {
      currentSession = session;
      currentScored = scoreConversation(session.turnRecords || [], session.meta || {});

      // 공유 배너 숨기고 개인 결과 영역 모두 표시
      els.sharedBanner.hidden = true;
      els.bridgeWrap.hidden = false;
      els.sectionReturned.hidden = false;
      els.sectionFeedback.hidden = false;
      els.sectionQuadrant.hidden = false;
      els.sectionHabits.hidden = false;
      els.btnEraseData.hidden = false;
      els.actionToast.hidden = true;

      // 0. 도입 브릿지 텍스트
      const friendName = session.friendName || SITE_META.defaultFriendName;
      const friendTopic = withKoreanParticle(friendName, ["은", "는"]);
      els.bridgeText.textContent = RESULT_UI_TEXT.bridgeTemplate.replace(
        "{friendTopic}",
        friendTopic
      );

      // 1. 나에게 돌아온 문장
      const returned = currentScored.returnedSentence;
      els.returnedQuote.textContent = "“" + returned.text + "”";
      if (returned.mode === "custom") {
        els.returnedSourceBadge.textContent = RESULT_UI_TEXT.returnedSourceCustom;
      } else if (returned.mode === "edited") {
        els.returnedSourceBadge.textContent = RESULT_UI_TEXT.returnedSourceEdited;
      } else {
        els.returnedSourceBadge.textContent = RESULT_UI_TEXT.returnedSourceChoice;
      }

      // 2. 위로 유형 해설 (사용자가 다시 고른 유형이 있으면 우선 반영)
      buildReselectorButtons();
      const displayType =
        session.overriddenType && COMFORT_TYPES[session.overriddenType]
          ? session.overriddenType
          : currentScored.primaryType;
      renderTypeBlock(displayType, currentScored.secondaryType);

      // 3. 피드백 상태 복원
      if (session.feedback === "yes") {
        els.feedbackStatus.textContent = RESULT_UI_TEXT.feedbackThanksYes;
        els.feedbackStatus.hidden = false;
        els.quoteReselector.hidden = true;
      } else if (session.feedback === "reselected") {
        els.feedbackStatus.textContent = RESULT_UI_TEXT.feedbackChangedNotice;
        els.feedbackStatus.hidden = false;
        els.quoteReselector.hidden = false;
      } else {
        els.feedbackStatus.hidden = true;
        els.quoteReselector.hidden = true;
      }

      // 4. 온도의 좌표 (4분면)
      els.quadrantHeading.textContent = currentScored.quadrant.title;
      els.quadrantDesc.textContent = currentScored.quadrant.description;

      const cells = els.coordGrid.querySelectorAll(".coord-cell");
      cells.forEach(function (cell) {
        const isMatch =
          cell.getAttribute("data-quadrant") === currentScored.quadrantKey;
        cell.classList.toggle("is-active", isMatch);
      });

      els.coordDot.style.left = currentScored.coordinates.xPercent + "%";
      els.coordDot.style.top = currentScored.coordinates.yPercent + "%";

      // 5. 대화 습관 3줄 + 내가 보낸 답장 로그
      els.habitList.innerHTML = "";
      currentScored.habits.lines.forEach(function (line) {
        const li = document.createElement("li");
        li.textContent = line;
        els.habitList.appendChild(li);
      });

      els.sentLogDetails.open = false;
      els.sentLogList.innerHTML = "";
      (session.turnRecords || []).forEach(function (rec) {
        const turnMeta = TURNS.find(function (t) {
          return t.id === rec.turnId;
        });
        const li = document.createElement("li");
        const timeSpan = document.createElement("span");
        timeSpan.className = "sent-log-time";
        timeSpan.textContent = turnMeta ? "[" + turnMeta.time + "]" : "";
        const textNode = document.createTextNode(rec.text);
        li.appendChild(timeSpan);
        li.appendChild(textNode);
        els.sentLogList.appendChild(li);
      });
    }

    function renderSharedPreview(typeCode) {
      currentSession = null;
      currentScored = null;
      const validCode = COMFORT_TYPES[typeCode] ? typeCode : "companionship";

      els.sharedBanner.hidden = false;
      els.bridgeWrap.hidden = true;
      els.sectionReturned.hidden = true;
      els.sectionFeedback.hidden = true;
      els.sectionQuadrant.hidden = true;
      els.sectionHabits.hidden = true;
      els.btnEraseData.hidden = true;
      els.actionToast.hidden = true;

      buildReselectorButtons();
      renderTypeBlock(validCode, null);
    }

    // 이벤트 바인딩
    els.btnFeedbackYes.addEventListener("click", function () {
      els.quoteReselector.hidden = true;
      els.feedbackStatus.textContent = RESULT_UI_TEXT.feedbackThanksYes;
      els.feedbackStatus.hidden = false;
      if (currentSession) {
        currentSession.overriddenType = null;
        currentSession.feedback = "yes";
        renderTypeBlock(currentScored.primaryType, currentScored.secondaryType);
        safeSaveStorage(currentSession);
      }
    });

    els.btnFeedbackOther.addEventListener("click", function () {
      els.quoteReselector.hidden = false;
      els.feedbackStatus.hidden = true;
    });

    els.btnCopyLink.addEventListener("click", async function () {
      const result = await copyShareLink(activeDisplayType);
      if (result.aborted) return;
      showToast(RESULT_UI_TEXT.shareLinkCopied);
    });

    els.btnRestart.addEventListener("click", function () {
      onRestart();
    });

    els.btnSharedTry.addEventListener("click", function () {
      onRestart();
    });

    els.btnEraseData.addEventListener("click", function () {
      if (root.confirm(RESULT_UI_TEXT.eraseConfirm)) {
        safeClearStorage();
        currentSession = null;
        currentScored = null;
        onErased();
      }
    });

    initStaticLabels();

    return {
      renderFullSession: renderFullSession,
      renderSharedPreview: renderSharedPreview
    };
  }

  root.WC_RESULT = {
    safeLoadStorage: safeLoadStorage,
    safeSaveStorage: safeSaveStorage,
    safeClearStorage: safeClearStorage,
    buildShareUrl: buildShareUrl,
    createResultController: createResultController
  };
})(typeof window !== "undefined" ? window : globalThis);
