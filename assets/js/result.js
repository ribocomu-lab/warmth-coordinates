/**
 * 온도의 좌표 — 다층 정밀 분석 결과 렌더링, 문장 재선택, 로컬 저장·삭제 모듈 (result.js)
 */
(function (root) {
  "use strict";

  const {
    SITE_META,
    SCENARIO_LIST,
    SCENARIOS,
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

      // 01. 돌아온 문장
      sectionReturned: document.getElementById("section-returned-sentence"),
      returnedEyebrow: document.getElementById("returned-eyebrow"),
      returnedSourceBadge: document.getElementById("returned-source-badge"),
      returnedQuote: document.getElementById("returned-quote"),
      readAloudPrompt: document.getElementById("read-aloud-prompt"),

      // 02. 주 유형 심층 분석
      typeEyebrow: document.getElementById("type-eyebrow"),
      mainHeading: document.getElementById("result-main-heading"),
      axisTag: document.getElementById("result-axis-tag"),
      shortTag: document.getElementById("result-short-tag"),
      neededQuoteLabel: document.getElementById("needed-quote-label"),
      neededQuote: document.getElementById("result-needed-quote"),
      typeSummary: document.getElementById("result-type-summary"),
      metaphorLabel: document.getElementById("metaphor-label"),
      typeMetaphor: document.getElementById("result-type-metaphor"),
      typeDetail: document.getElementById("result-type-detail"),
      labelStrength: document.getElementById("label-strength"),
      typeStrength: document.getElementById("result-type-strength"),
      labelBlindspot: document.getElementById("label-blindspot"),
      typeBlindspot: document.getElementById("result-type-blindspot"),
      labelBurnout: document.getElementById("label-burnout"),
      typeBurnout: document.getElementById("result-type-burnout"),

      // 피드백
      sectionFeedback: document.getElementById("section-feedback"),
      feedbackHeading: document.getElementById("feedback-heading"),
      btnFeedbackYes: document.getElementById("btn-feedback-yes"),
      btnFeedbackOther: document.getElementById("btn-feedback-other"),
      feedbackStatus: document.getElementById("feedback-status"),
      quoteReselector: document.getElementById("quote-reselector"),
      feedbackPickerGuide: document.getElementById("feedback-picker-guide"),
      reselectList: document.getElementById("reselect-list"),

      // 03. 6유형 스펙트럼 & 조합
      sectionSpectrum: document.getElementById("section-spectrum"),
      spectrumEyebrow: document.getElementById("spectrum-eyebrow"),
      spectrumSubcopy: document.getElementById("spectrum-subcopy"),
      balanceStayLabel: document.getElementById("balance-stay-label"),
      balanceLiftLabel: document.getElementById("balance-lift-label"),
      balanceStayBar: document.getElementById("balance-stay-bar"),
      balanceLiftBar: document.getElementById("balance-lift-bar"),
      spectrumBalanceSummary: document.getElementById("spectrum-balance-summary"),
      spectrumBars: document.getElementById("spectrum-bars"),
      combinationBadge: document.getElementById("combination-badge"),
      combinationDesc: document.getElementById("combination-desc"),

      // 04. 국면별 4단계 해부
      sectionTurnBreakdown: document.getElementById("section-turn-breakdown"),
      turnAnalysisEyebrow: document.getElementById("turn-analysis-eyebrow"),
      turnAnalysisSubcopy: document.getElementById("turn-analysis-subcopy"),
      turnBreakdownList: document.getElementById("turn-breakdown-list"),

      // 05. 카톡 언어·행동 정밀 데이터
      sectionHabits: document.getElementById("section-habits"),
      metricsEyebrow: document.getElementById("metrics-eyebrow"),
      metricsSubcopy: document.getElementById("metrics-subcopy"),
      metricCards: document.getElementById("metric-cards"),
      habitList: document.getElementById("habit-list"),
      sentLogDetails: document.getElementById("sent-log-details"),
      sentLogSummary: document.getElementById("sent-log-summary"),
      sentLogList: document.getElementById("sent-log-list"),

      // 06. 온도의 좌표 4분면 + 회복 연습
      sectionQuadrant: document.getElementById("section-quadrant"),
      quadrantEyebrow: document.getElementById("quadrant-eyebrow"),
      quadrantHeading: document.getElementById("quadrant-heading"),
      quadrantAsymmetry: document.getElementById("quadrant-asymmetry"),
      quadrantSubcopy: document.getElementById("quadrant-subcopy"),
      axisTopLabel: document.getElementById("axis-top-label"),
      axisBottomLabel: document.getElementById("axis-bottom-label"),
      axisLeftLabel: document.getElementById("axis-left-label"),
      axisRightLabel: document.getElementById("axis-right-label"),
      coordGrid: document.getElementById("coord-grid"),
      coordDot: document.getElementById("coord-dot"),
      quadrantDesc: document.getElementById("quadrant-desc"),
      careTipsHeading: document.getElementById("care-tips-heading"),
      careTipsList: document.getElementById("care-tips-list"),

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
      els.labelStrength.textContent = RESULT_UI_TEXT.strengthLabel;
      els.labelBlindspot.textContent = RESULT_UI_TEXT.blindSpotLabel;
      els.labelBurnout.textContent = RESULT_UI_TEXT.burnoutLabel;

      els.feedbackHeading.textContent = RESULT_UI_TEXT.feedbackHeading;
      els.btnFeedbackYes.textContent = RESULT_UI_TEXT.feedbackYesBtn;
      els.btnFeedbackOther.textContent = RESULT_UI_TEXT.feedbackOtherBtn;
      els.feedbackPickerGuide.textContent = RESULT_UI_TEXT.feedbackPickerGuide;

      els.spectrumEyebrow.textContent = RESULT_UI_TEXT.spectrumEyebrow;
      els.spectrumSubcopy.textContent = RESULT_UI_TEXT.spectrumSubcopy;

      els.turnAnalysisEyebrow.textContent = RESULT_UI_TEXT.turnAnalysisEyebrow;
      els.turnAnalysisSubcopy.textContent = RESULT_UI_TEXT.turnAnalysisSubcopy;

      els.metricsEyebrow.textContent = RESULT_UI_TEXT.metricsEyebrow;
      els.metricsSubcopy.textContent = RESULT_UI_TEXT.metricsSubcopy;
      els.sentLogSummary.textContent = RESULT_UI_TEXT.myMessagesSummary;

      els.quadrantEyebrow.textContent = RESULT_UI_TEXT.quadrantEyebrow;
      els.quadrantSubcopy.textContent = RESULT_UI_TEXT.quadrantSubcopy;
      els.axisTopLabel.textContent = RESULT_UI_TEXT.axisTop;
      els.axisBottomLabel.textContent = RESULT_UI_TEXT.axisBottom;
      els.axisLeftLabel.textContent = RESULT_UI_TEXT.axisLeft;
      els.axisRightLabel.textContent = RESULT_UI_TEXT.axisRight;
      els.careTipsHeading.textContent = RESULT_UI_TEXT.careTipsHeading;

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

    function renderTypeBlock(typeCode) {
      const typeDef = COMFORT_TYPES[typeCode] || COMFORT_TYPES.companionship;
      activeDisplayType = typeDef.code;

      els.mainHeading.textContent = typeDef.name;
      els.axisTag.textContent = typeDef.axisLabel;
      els.shortTag.textContent = typeDef.shortTag || "";
      els.neededQuote.textContent = "“" + typeDef.neededQuote + "”";
      els.typeSummary.textContent = typeDef.summary;
      els.typeMetaphor.textContent = typeDef.innerChildMetaphor;
      els.typeDetail.textContent = typeDef.detail;
      els.typeStrength.textContent = typeDef.strengthInRelation || "";
      els.typeBlindspot.textContent = typeDef.blindSpotForSelf || "";
      els.typeBurnout.textContent = typeDef.burnoutTrigger || "";

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
          renderTypeBlock(code);
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

    function renderSpectrumSection(scored) {
      const spec = scored.spectrum;
      els.balanceStayLabel.textContent = "곁에 머무는 말 " + spec.stayPercent + "%";
      els.balanceLiftLabel.textContent = "일으켜 주는 말 " + spec.liftPercent + "%";
      els.balanceStayBar.style.width = spec.stayPercent + "%";
      els.balanceLiftBar.style.width = spec.liftPercent + "%";
      els.spectrumBalanceSummary.textContent = spec.balanceSummary;

      els.spectrumBars.innerHTML = "";
      spec.items.forEach(function (item, idx) {
        const row = document.createElement("div");
        row.className = "spectrum-row" + (idx < 2 && item.score > 0 ? " is-top" : "");
        row.setAttribute("data-axis", item.axis);

        const nameSpan = document.createElement("span");
        nameSpan.className = "spectrum-name";
        nameSpan.textContent = item.name;

        const track = document.createElement("div");
        track.className = "spectrum-track";
        const fill = document.createElement("div");
        fill.className = "spectrum-fill";
        fill.style.width = (item.score > 0 ? Math.max(10, item.barWidth) : 3) + "%";
        track.appendChild(fill);

        const pctSpan = document.createElement("span");
        pctSpan.className = "spectrum-pct";
        pctSpan.textContent = item.percent + "%";

        row.appendChild(nameSpan);
        row.appendChild(track);
        row.appendChild(pctSpan);
        els.spectrumBars.appendChild(row);
      });

      els.combinationBadge.textContent = scored.combinationInsight.badge;
      els.combinationDesc.textContent = scored.combinationInsight.description;
    }

    function renderTurnBreakdownSection(scored) {
      els.turnBreakdownList.innerHTML = "";
      (scored.turnBreakdown || []).forEach(function (entry) {
        const card = document.createElement("div");
        card.className = "breakdown-item";

        const head = document.createElement("div");
        head.className = "breakdown-head";

        const stepSpan = document.createElement("span");
        stepSpan.className = "breakdown-step";
        stepSpan.textContent = entry.step;

        const badgeSpan = document.createElement("span");
        badgeSpan.className = "breakdown-badge";
        badgeSpan.textContent = entry.badge;

        head.appendChild(stepSpan);
        head.appendChild(badgeSpan);

        const bodyP = document.createElement("p");
        bodyP.className = "breakdown-body";
        bodyP.textContent = entry.body;

        card.appendChild(head);
        card.appendChild(bodyP);
        els.turnBreakdownList.appendChild(card);
      });
    }

    function renderMetricsSection(scored, session) {
      const h = scored.habits;
      const kpis = [
        {
          label: "표현 조율 스타일",
          value: h.cautionLabel,
          sub: "수정 " + h.revisionCount + "회 · 보기 손질 " + h.editedChoiceCount + "회"
        },
        {
          label: "자기 언어 주도성",
          value: h.customRate + "%",
          sub: (session.turnRecords || []).length + "턴 중 " + h.customCount + "턴 직접 타이핑"
        },
        {
          label: "평균 답장 호흡",
          value: h.avgLength + "자",
          sub: "총 " + h.totalChars + "자 (최장 " + h.longestLength + "자)"
        },
        {
          label: "상호작용 표지",
          value: "질문 " + h.questionCount + "회",
          sub: "ㅋ/ㅎ " + h.laughCount + "회 · ㅠ/ㅜ " + h.tearCount + "회"
        }
      ];

      els.metricCards.innerHTML = "";
      kpis.forEach(function (kpi) {
        const card = document.createElement("div");
        card.className = "metric-card";

        const l = document.createElement("span");
        l.className = "metric-label";
        l.textContent = kpi.label;

        const v = document.createElement("strong");
        v.className = "metric-value";
        v.textContent = kpi.value;

        const s = document.createElement("span");
        s.className = "metric-sub";
        s.textContent = kpi.sub;

        card.appendChild(l);
        card.appendChild(v);
        card.appendChild(s);
        els.metricCards.appendChild(card);
      });

      els.habitList.innerHTML = "";
      h.lines.forEach(function (line) {
        const li = document.createElement("li");
        li.textContent = line;
        els.habitList.appendChild(li);
      });

      const scenarioId = session.scenarioId || SITE_META.defaultScenarioId;
      const scenarioTurns = SCENARIOS[scenarioId] || TURNS;
      const scenarioMeta = SCENARIO_LIST.find(function (s) {
        return s.id === scenarioId;
      });

      els.sentLogSummary.textContent =
        RESULT_UI_TEXT.myMessagesSummary +
        (scenarioMeta ? " (" + scenarioMeta.label + ")" : "");

      els.sentLogDetails.open = false;
      els.sentLogList.innerHTML = "";
      (session.turnRecords || []).forEach(function (rec) {
        const turnMeta = scenarioTurns.find(function (t) {
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

    function renderFullSession(session) {
      currentSession = session;
      currentScored = scoreConversation(session.turnRecords || [], session.meta || {});

      els.sharedBanner.hidden = true;
      els.bridgeWrap.hidden = false;
      els.sectionReturned.hidden = false;
      els.sectionFeedback.hidden = false;
      els.sectionSpectrum.hidden = false;
      els.sectionTurnBreakdown.hidden = false;
      els.sectionHabits.hidden = false;
      els.sectionQuadrant.hidden = false;
      els.btnEraseData.hidden = false;
      els.actionToast.hidden = true;

      // 도입 브릿지
      const friendName = session.friendName || SITE_META.defaultFriendName;
      const friendTopic = withKoreanParticle(friendName, ["은", "는"]);
      els.bridgeText.textContent = RESULT_UI_TEXT.bridgeTemplate.replace(
        "{friendTopic}",
        friendTopic
      );

      // 01. 나에게 돌아온 문장
      const returned = currentScored.returnedSentence;
      els.returnedQuote.textContent = "“" + returned.text + "”";
      if (returned.mode === "custom") {
        els.returnedSourceBadge.textContent = RESULT_UI_TEXT.returnedSourceCustom;
      } else if (returned.mode === "edited") {
        els.returnedSourceBadge.textContent = RESULT_UI_TEXT.returnedSourceEdited;
      } else {
        els.returnedSourceBadge.textContent = RESULT_UI_TEXT.returnedSourceChoice;
      }

      // 02. 주 유형 심층 분석
      buildReselectorButtons();
      const displayType =
        session.overriddenType && COMFORT_TYPES[session.overriddenType]
          ? session.overriddenType
          : currentScored.primaryType;
      renderTypeBlock(displayType);

      // 피드백 복원
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

      // 03. 스펙트럼 & 조합
      renderSpectrumSection(currentScored);

      // 04. 대화 국면별 4단계 해부
      renderTurnBreakdownSection(currentScored);

      // 05. 계량 지표 & 습관
      renderMetricsSection(currentScored, session);

      // 06. 온도의 좌표 (4분면 + 회복 연습)
      els.quadrantHeading.textContent = currentScored.quadrant.title;
      els.quadrantAsymmetry.textContent = currentScored.quadrant.asymmetryNote || "";
      els.quadrantDesc.textContent = currentScored.quadrant.description;

      const cells = els.coordGrid.querySelectorAll(".coord-cell");
      cells.forEach(function (cell) {
        const isMatch =
          cell.getAttribute("data-quadrant") === currentScored.quadrantKey;
        cell.classList.toggle("is-active", isMatch);
      });

      els.coordDot.style.left = currentScored.coordinates.xPercent + "%";
      els.coordDot.style.top = currentScored.coordinates.yPercent + "%";

      els.careTipsList.innerHTML = "";
      (currentScored.quadrant.careTips || []).forEach(function (tip) {
        const li = document.createElement("li");
        li.textContent = tip;
        els.careTipsList.appendChild(li);
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
      els.sectionSpectrum.hidden = true;
      els.sectionTurnBreakdown.hidden = true;
      els.sectionHabits.hidden = true;
      els.sectionQuadrant.hidden = true;
      els.btnEraseData.hidden = true;
      els.actionToast.hidden = true;

      buildReselectorButtons();
      renderTypeBlock(validCode);
    }

    els.btnFeedbackYes.addEventListener("click", function () {
      els.quoteReselector.hidden = true;
      els.feedbackStatus.textContent = RESULT_UI_TEXT.feedbackThanksYes;
      els.feedbackStatus.hidden = false;
      if (currentSession) {
        currentSession.overriddenType = null;
        currentSession.feedback = "yes";
        renderTypeBlock(currentScored.primaryType);
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
