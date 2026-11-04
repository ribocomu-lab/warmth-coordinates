/**
 * 온도의 좌표 — 심층 채점, 스펙트럼·국면별 분석, 키워드 분류, 말투 반응 분기 모듈 (scoring.js)
 * 브라우저(window.WC_SCORING)와 Node 테스트(CommonJS) 모두에서 동작합니다.
 */
(function (root) {
  "use strict";

  const scriptModule =
    typeof module !== "undefined" && module.exports
      ? require("./script.js")
      : root.WC_SCRIPT;

  const {
    COMFORT_TYPES,
    TYPE_ORDER,
    QUADRANTS,
    CUSTOM_REACTION_POOL
  } = scriptModule;

  const COMFORT_TURN_IDS = ["T1", "T2", "T3", "T5"];
  const SCORED_TURN_IDS = ["T1", "T2", "T3", "T5", "T7"];

  /**
   * 6개 위로 유형 키워드 사전 (일상 카톡 구어·축약 표현 확장)
   */
  const KEYWORD_DICTIONARY = {
    recognition: [
      "잘했",
      "잘하고",
      "잘해왔",
      "잘해냈",
      "대단",
      "버텼",
      "버티고",
      "버틴",
      "버티느라",
      "고생했",
      "고생 많",
      "고생많",
      "수고했",
      "수고 많",
      "수고많",
      "멋지",
      "멋져",
      "멋있",
      "장하다",
      "장해",
      "자랑스",
      "해온 거",
      "해온게",
      "충분히 잘",
      "최선을 다",
      "애썼",
      "애 많이",
      "열심히 살",
      "열심히 했"
    ],
    rest: [
      "쉬어",
      "쉬자",
      "푹 쉬",
      "쉬어도",
      "그냥 자",
      "얼른 자",
      "푹 자",
      "자자",
      "자라",
      "디비 자",
      "기절하듯",
      "잠부터",
      "눈 좀 붙",
      "눈 감아",
      "그만해",
      "내려놓",
      "내려놔",
      "천천히",
      "멈춰도",
      "멈추고",
      "아무것도 하지",
      "아무 생각 말",
      "생각하지 마",
      "내일 생각",
      "미뤄두",
      "폰 엎어",
      "덮고 자",
      "덮어두"
    ],
    acceptance: [
      "괜찮아",
      "그래도 너",
      "그래도 넌",
      "있는 그대로",
      "어때서",
      "좀 어때",
      "하면 어때",
      "면 어때",
      "지금의 너",
      "지금 네 모습",
      "네가 좋아",
      "너도 좋",
      "완벽하지 않",
      "모자라도",
      "실수해도",
      "실수할 수도",
      "떨어질 수도",
      "그럴 수 있",
      "그럴수도",
      "그럴 수도",
      "문제 아냐",
      "가치가 깎"
    ],
    companionship: [
      "옆에",
      "곁에",
      "내 옆자리",
      "같이 있",
      "함께 있",
      "함께해",
      "전화할까",
      "전화 걸까",
      "전화해",
      "통화",
      "보이스톡",
      "언제든",
      "연락해",
      "톡해",
      "불러줘",
      "불러",
      "달려갈",
      "어디 안 가",
      "여기 있",
      "네 편",
      "내 편",
      "혼자 아니",
      "혼자가 아니",
      "보러 갈",
      "만나자"
    ],
    empathy: [
      "힘들었",
      "힘들겠",
      "속상했",
      "속상하",
      "그랬구나",
      "마음이 안 좋",
      "마음이 아",
      "마음 고생",
      "마음고생",
      "마음이 무거",
      "마음 무거",
      "맥 빠지",
      "피 말리",
      "아팠겠",
      "지쳤겠",
      "서러웠",
      "서럽",
      "외로웠",
      "답답했",
      "답답하",
      "참았겠",
      "많이 참았",
      "얼마나 힘",
      "얼마나 답답",
      "울고 싶",
      "맴찢"
    ],
    solution: [
      "해보자",
      "해 보자",
      "뜯어보자",
      "확인해보자",
      "방법",
      "먼저",
      "정리해",
      "정리부터",
      "왜 그런지",
      "원인",
      "수습",
      "찾아보",
      "찾아보자",
      "계획",
      "하나씩",
      "인스타부터",
      "알림부터",
      "알림 끄",
      "무음",
      "거리를 둬",
      "거리 둬",
      "줄여보",
      "바꿔보",
      "적어보",
      "같이 생각",
      "같이 보자"
    ]
  };

  const CRISIS_PATTERNS = [
    "죽고싶",
    "자살",
    "자해",
    "사라지고싶",
    "살기싫",
    "죽어버리",
    "세상떠나고싶",
    "목숨을끊"
  ];

  const T6_PATTERNS = {
    open: [
      "힘들",
      "지치",
      "지쳐",
      "피곤",
      "우울",
      "불안",
      "외로",
      "외롭",
      "막막",
      "속상",
      "버겁",
      "버거",
      "어렵",
      "어려워",
      "슬프",
      "슬퍼",
      "고민",
      "스트레스",
      "울고",
      "아프",
      "아파",
      "안 좋",
      "안좋",
      "쉽지 않",
      "쉽지않",
      "나도 요즘",
      "사실 나도",
      "나도 비슷",
      "나도 똑같",
      "잠이 안",
      "못 자",
      "번아웃",
      "복잡",
      "싱숭생숭",
      "무기력",
      "답답",
      "현타",
      "죽겠"
    ],
    deflect: [
      "내 얘긴",
      "내 얘기는",
      "내얘긴",
      "내얘기는",
      "됐고",
      "넌 더",
      "너나",
      "나보단",
      "나보다",
      "네 얘기",
      "너 얘기",
      "너 속은",
      "나중에 하고",
      "다음에 하자"
    ],
    unsure: [
      "모르겠",
      "모르겠다",
      "글쎄",
      "그냥 그래",
      "그저 그래",
      "애매하",
      "애매해",
      "멍하",
      "멍해"
    ],
    closed: [
      "괜찮지",
      "괜찮아",
      "잘 지내",
      "잘지내",
      "잘 굴러",
      "별일 없",
      "별일없",
      "문제없",
      "무난",
      "멀쩡",
      "아무렇지",
      "걱정 마",
      "걱정마",
      "똑같지"
    ]
  };

  function normalizeText(text) {
    if (typeof text !== "string") return "";
    return text.trim().replace(/\s+/g, " ");
  }

  function stripSpaces(text) {
    return normalizeText(text).replace(/\s+/g, "");
  }

  function withKoreanParticle(word, particles) {
    const clean = normalizeText(word);
    if (!clean) return "";
    const lastChar = clean.charCodeAt(clean.length - 1);
    if (lastChar < 0xac00 || lastChar > 0xd7a3) {
      return clean + particles[1];
    }
    const hasBatchim = (lastChar - 0xac00) % 28 !== 0;
    return clean + (hasBatchim ? particles[0] : particles[1]);
  }

  function detectCrisisSignal(text) {
    const compact = stripSpaces(text);
    if (!compact) {
      return { detected: false, matchedKeyword: null };
    }
    for (let i = 0; i < CRISIS_PATTERNS.length; i += 1) {
      const pattern = CRISIS_PATTERNS[i];
      if (compact.includes(pattern)) {
        return { detected: true, matchedKeyword: pattern };
      }
    }
    return { detected: false, matchedKeyword: null };
  }

  /**
   * 직접 쓴 문장 비중복 스팬 키워드 분류
   */
  function classifyComfortText(text) {
    const normalized = normalizeText(text);
    const compact = stripSpaces(text);
    const scores = {};
    TYPE_ORDER.forEach(function (typeCode) {
      scores[typeCode] = 0;
    });

    if (!normalized) {
      return {
        status: "unclassified",
        type: null,
        candidates: [],
        scores: scores
      };
    }

    TYPE_ORDER.forEach(function (typeCode) {
      const keywords = (KEYWORD_DICTIONARY[typeCode] || [])
        .map(function (kw) {
          return kw.replace(/\s+/g, "");
        })
        .filter(Boolean)
        .sort(function (a, b) {
          return b.length - a.length;
        });

      const matchedSpans = [];
      keywords.forEach(function (kwCompact) {
        const start = compact.indexOf(kwCompact);
        if (start === -1) return;
        const end = start + kwCompact.length;
        const overlaps = matchedSpans.some(function (span) {
          return !(end <= span[0] || start >= span[1]);
        });
        if (!overlaps) {
          matchedSpans.push([start, end]);
          scores[typeCode] += 1;
        }
      });
    });

    let maxScore = 0;
    TYPE_ORDER.forEach(function (typeCode) {
      if (scores[typeCode] > maxScore) {
        maxScore = scores[typeCode];
      }
    });

    if (maxScore === 0) {
      return {
        status: "unclassified",
        type: null,
        candidates: [],
        scores: scores
      };
    }

    const topTypes = TYPE_ORDER.filter(function (typeCode) {
      return scores[typeCode] === maxScore;
    });

    if (topTypes.length === 1) {
      return {
        status: "matched",
        type: topTypes[0],
        candidates: topTypes,
        scores: scores
      };
    }

    return {
      status: "ambiguous",
      type: null,
      candidates: topTypes,
      scores: scores
    };
  }

  function computeBigramOverlap(baseText, targetText) {
    const a = stripSpaces(baseText);
    const b = stripSpaces(targetText);
    if (!a || !b) return 0;
    if (a === b) return 1;
    if (b.includes(a) || a.includes(b)) {
      const shorter = Math.min(a.length, b.length);
      const longer = Math.max(a.length, b.length);
      if (shorter / longer >= 0.45) return 0.8;
    }
    if (a.length < 2 || b.length < 2) return a === b ? 1 : 0;

    const aGrams = new Set();
    for (let i = 0; i < a.length - 1; i += 1) {
      aGrams.add(a.slice(i, i + 2));
    }
    let matches = 0;
    for (let j = 0; j < b.length - 1; j += 1) {
      if (aGrams.has(b.slice(j, j + 2))) {
        matches += 1;
      }
    }
    return matches / Math.max(1, aGrams.size);
  }

  function evaluateTurnInput(params) {
    const turnId = params.turnId;
    const cleanText = normalizeText(params.text);
    const selectedOption = params.selectedOption || null;
    const isScoredTurn = SCORED_TURN_IDS.includes(turnId);
    const classification = classifyComfortText(cleanText);

    if (selectedOption && normalizeText(selectedOption.text) === cleanText) {
      const choiceType = selectedOption.type || null;
      return {
        turnId: turnId,
        text: cleanText,
        mode: "choice",
        editedFromChoice: false,
        selectedOptionId: selectedOption.id || null,
        openingTag: selectedOption.tag || null,
        optionType: choiceType,
        reactionType: selectedOption.reactionType || null,
        receivingType: selectedOption.receivingType || null,
        classification: classification,
        resolvedType: choiceType,
        clarifiedType: null,
        needsClarification: false
      };
    }

    if (selectedOption) {
      const overlap = computeBigramOverlap(selectedOption.text, cleanText);
      if (overlap >= 0.3) {
        let resolvedType = selectedOption.type || null;
        if (classification.status === "matched") {
          resolvedType = classification.type;
        }
        return {
          turnId: turnId,
          text: cleanText,
          mode: "edited",
          editedFromChoice: true,
          selectedOptionId: selectedOption.id || null,
          openingTag: selectedOption.tag || null,
          optionType: selectedOption.type || null,
          reactionType: selectedOption.reactionType || null,
          receivingType: selectedOption.receivingType || null,
          classification: classification,
          resolvedType: resolvedType,
          clarifiedType: null,
          needsClarification: Boolean(isScoredTurn && !resolvedType)
        };
      }
    }

    const matchedType =
      classification.status === "matched" ? classification.type : null;

    return {
      turnId: turnId,
      text: cleanText,
      mode: "custom",
      editedFromChoice: Boolean(selectedOption),
      selectedOptionId: selectedOption ? selectedOption.id || null : null,
      openingTag: null,
      optionType: null,
      reactionType: null,
      receivingType: null,
      classification: classification,
      resolvedType: isScoredTurn ? matchedType : null,
      clarifiedType: null,
      needsClarification: Boolean(isScoredTurn && !matchedType)
    };
  }

  function getClarificationTargets(turnRecords, maxCount) {
    const limit = typeof maxCount === "number" ? maxCount : 2;
    if (!Array.isArray(turnRecords) || limit <= 0) return [];

    const unresolved = turnRecords.filter(function (rec) {
      return (
        rec &&
        SCORED_TURN_IDS.includes(rec.turnId) &&
        !rec.resolvedType &&
        !rec.clarifiedType &&
        normalizeText(rec.text).length > 0
      );
    });

    unresolved.sort(function (a, b) {
      if (a.turnId === "T7" && b.turnId !== "T7") return -1;
      if (b.turnId === "T7" && a.turnId !== "T7") return 1;
      return SCORED_TURN_IDS.indexOf(a.turnId) - SCORED_TURN_IDS.indexOf(b.turnId);
    });

    return unresolved.slice(0, limit);
  }

  function classifyT6Response(turnRecord) {
    if (!turnRecord) return "closed";
    const text = normalizeText(turnRecord.text);
    const compact = stripSpaces(text);

    if (
      (turnRecord.mode === "choice" || turnRecord.mode === "edited") &&
      turnRecord.receivingType
    ) {
      if (turnRecord.mode === "edited") {
        const hasOpenSignal = T6_PATTERNS.open.some(function (kw) {
          return text.includes(kw) || compact.includes(kw.replace(/\s+/g, ""));
        });
        if (hasOpenSignal) return "open";
      }
      return turnRecord.receivingType;
    }

    const matchesCategory = function (cat) {
      return T6_PATTERNS[cat].some(function (kw) {
        return text.includes(kw) || compact.includes(kw.replace(/\s+/g, ""));
      });
    };

    if (matchesCategory("open")) return "open";
    if (matchesCategory("deflect")) return "deflect";
    if (matchesCategory("unsure")) return "unsure";
    if (matchesCategory("closed")) return "closed";

    if (compact.length >= 8) {
      return "open";
    }
    return "closed";
  }

  function classifyT4Reaction(turnRecord) {
    if (!turnRecord) return "listen";
    if (turnRecord.reactionType) return turnRecord.reactionType;

    const text = normalizeText(turnRecord.text);
    if (/미안|쉽지|그치|맞아/.test(text)) return "step_back";
    if (/말해|들을게|들어줄|더 얘|더 해|뱉어|털어/.test(text)) return "listen";
    if (/진심|정말|진짜로|빈말/.test(text)) return "reassure";
    return "custom";
  }

  function hasQuestionSignal(text) {
    const clean = normalizeText(text);
    if (!clean) return false;
    if (clean.includes("?")) return true;
    return /(왜\s|어떻게|어떤\s|무슨\s|뭐야|누구|할까|줄래|있었어|어땠어|어때|어디)/.test(
      clean
    );
  }

  /**
   * 내가 보낸 카톡의 말투·길이·키워드에 맞춰 친구의 자연스러운 리액션 선택
   */
  function selectFriendReaction(params) {
    const turn = params.turn;
    const record = params.record;
    const selectedOption = params.selectedOption || null;
    const turnIndex = typeof params.turnIndex === "number" ? params.turnIndex : 0;

    if (!turn || !record) return null;

    if (turn.role === "closing") {
      return turn.closingReply;
    }

    if (turn.role === "receiving") {
      const receivingCat = classifyT6Response(record);
      if (
        record.mode === "choice" &&
        selectedOption &&
        selectedOption.reply
      ) {
        return selectedOption.reply;
      }
      if (
        record.mode === "edited" &&
        receivingCat === record.receivingType &&
        selectedOption &&
        selectedOption.reply
      ) {
        return selectedOption.reply;
      }
      return (
        (turn.customReplies && turn.customReplies[receivingCat]) ||
        (turn.customReplies && turn.customReplies.closed) ||
        null
      );
    }

    if (
      (record.mode === "choice" || record.mode === "edited") &&
      selectedOption &&
      selectedOption.reply
    ) {
      return selectedOption.reply;
    }

    const text = normalizeText(record.text);
    const pool = CUSTOM_REACTION_POOL || {};
    const byTone = pool.byTone || {};
    const byType = pool.byType || {};
    const pickFrom = function (arr) {
      if (!Array.isArray(arr) || arr.length === 0) return null;
      return arr[turnIndex % arr.length];
    };

    // 오프닝(T0) 전용 자연스러운 첫 반응 분기
    if (turn.role === "opening") {
      if (/[ㅋㅎ]{2,}/.test(text)) {
        return "ㅋㅋㅋ 아니 잠이 죽어도 안 와서 생각만 많아지길래 톡해봤어";
      }
      if (/[ㅠㅜ]{1,}/.test(text)) {
        return "늦었는데 깨운 건 아니지 ㅠㅠ 혼자 누워 있다가 답답해서";
      }
      if (hasQuestionSignal(text)) {
        return "깨어 있었네 다행이다... 오늘 좀 현타 와서 잠이 안 와";
      }
      return "안 자고 있었구나 다행이다... 늦은 시간에 미안";
    }

    // 1. 35자 이상 길고 정성스럽게 직접 써준 경우
    if (text.length >= 35 && byTone.long) {
      return pickFrom(byTone.long);
    }
    // 2. 위로 측정 턴에서 특정 위로 유형 키워드가 선명히 감지된 경우
    if (
      COMFORT_TURN_IDS.includes(turn.id) &&
      record.resolvedType &&
      byType[record.resolvedType]
    ) {
      return byType[record.resolvedType];
    }
    // 3. 눈물/공감 표지(ㅠㅠ/ㅜㅜ)
    if (/[ㅠㅜ]{2,}/.test(text) && byTone.tear) {
      return pickFrom(byTone.tear);
    }
    // 4. 웃음/장난기 완충(ㅋㅋ/ㅎㅎ)
    if (/[ㅋㅎ]{2,}/.test(text) && byTone.laugh) {
      return pickFrom(byTone.laugh);
    }
    // 5. 질문/되묻기
    if (hasQuestionSignal(text) && byTone.question) {
      return pickFrom(byTone.question);
    }
    // 6. 6자 이하 짧은 단답
    if (text.length <= 6 && byTone.short) {
      return pickFrom(byTone.short);
    }
    // 7. 시나리오 기본 또는 공통 자연스러운 반응
    if (Array.isArray(turn.customReplies) && turn.customReplies.length > 0) {
      return pickFrom(turn.customReplies);
    }
    return pickFrom(pool.fallback);
  }

  function createRevisionTracker() {
    let count = 0;
    let prevLength = 0;
    let inDeleteStreak = false;

    return {
      onInputChange: function (currentValue) {
        const len = typeof currentValue === "string" ? currentValue.length : 0;
        if (len < prevLength && !inDeleteStreak) {
          count += 1;
          inDeleteStreak = true;
        } else if (len > prevLength) {
          inDeleteStreak = false;
        }
        prevLength = len;
        return count;
      },
      onOptionFill: function (newValue, hadPreviousDiffText) {
        if (hadPreviousDiffText) {
          count += 1;
        }
        prevLength = typeof newValue === "string" ? newValue.length : 0;
        inDeleteStreak = false;
        return count;
      },
      resetTurn: function () {
        prevLength = 0;
        inDeleteStreak = false;
      },
      getCount: function () {
        return count;
      }
    };
  }

  function selectReturnedSentence(turnRecords, primaryType) {
    const validTurns = (turnRecords || []).filter(function (rec) {
      if (!rec || !SCORED_TURN_IDS.includes(rec.turnId)) return false;
      const clean = normalizeText(rec.text);
      if (clean.length < 2) return false;
      if (detectCrisisSignal(clean).detected) return false;
      return true;
    });

    const getEffectiveType = function (rec) {
      return rec.clarifiedType || rec.resolvedType || null;
    };

    const byRecency = validTurns.slice().reverse();

    const t7Custom = validTurns.find(function (r) {
      return r.turnId === "T7" && r.mode === "custom";
    });
    if (t7Custom) {
      return { text: t7Custom.text, turnId: "T7", mode: "custom" };
    }

    const primaryCustom = byRecency.find(function (r) {
      return r.mode === "custom" && getEffectiveType(r) === primaryType;
    });
    if (primaryCustom) {
      return {
        text: primaryCustom.text,
        turnId: primaryCustom.turnId,
        mode: "custom"
      };
    }

    const anyCustom = byRecency.find(function (r) {
      return r.mode === "custom";
    });
    if (anyCustom) {
      return {
        text: anyCustom.text,
        turnId: anyCustom.turnId,
        mode: "custom"
      };
    }

    const editedTurn =
      validTurns.find(function (r) {
        return r.turnId === "T7" && r.mode === "edited";
      }) ||
      byRecency.find(function (r) {
        return r.mode === "edited";
      });
    if (editedTurn) {
      return {
        text: editedTurn.text,
        turnId: editedTurn.turnId,
        mode: "edited"
      };
    }

    const t7Choice = validTurns.find(function (r) {
      return r.turnId === "T7";
    });
    if (t7Choice) {
      return { text: t7Choice.text, turnId: "T7", mode: "choice" };
    }

    const primaryChoice = byRecency.find(function (r) {
      return getEffectiveType(r) === primaryType;
    });
    if (primaryChoice) {
      return {
        text: primaryChoice.text,
        turnId: primaryChoice.turnId,
        mode: primaryChoice.mode || "choice"
      };
    }

    const fallbackQuote = COMFORT_TYPES[primaryType]
      ? COMFORT_TYPES[primaryType].toFriendQuote
      : COMFORT_TYPES.companionship.toFriendQuote;

    return { text: fallbackQuote, turnId: null, mode: "choice" };
  }

  /**
   * 주 유형 × 부 유형 시너지 분석 생성
   */
  function buildCombinationInsight(primaryCode, secondaryCode, scores) {
    const p = COMFORT_TYPES[primaryCode];
    const s = COMFORT_TYPES[secondaryCode];
    const secScore = scores[secondaryCode] || 0;
    const priScore = scores[primaryCode] || 0;

    if (!s || priScore === 0) {
      return {
        badge: p.name + " 중심",
        description:
          "특정 공식에 얽매이지 않고 그때그때 내 말투로 반응했지만, 기저에는 ‘" +
          p.name +
          "’의 정서가 깔려 있어요."
      };
    }

    if (secScore === 0) {
      return {
        badge: p.name + " 단일 집중",
        description:
          "대화 내내 흔들림 없이 오직 ‘" +
          p.name +
          "’ 한 방향으로 에너지를 모아 건넸어요. 그만큼 지금 당신 안에서도 “" +
          p.neededQuote +
          "”라는 한마디가 가장 선명하게 필요한 상태일 수 있어요."
      };
    }

    const sameAxis = p.axis === s.axis;
    const pairTitle = p.name + " × " + s.name;

    if (sameAxis && p.axis === "stay") {
      return {
        badge: pairTitle + " (깊은 정서 체류형)",
        description:
          "주된 ‘" +
          p.name +
          "’에 보조적인 ‘" +
          s.name +
          "’이 더해져, 섣불리 해결하려 들지 않고 상대의 감정 온도에 끝까지 머물러 주는 조합이에요. 상대에게는 최고의 정서적 피난처가 되지만, 정작 본인은 타인의 우울을 고스란히 흡수해 감정 피로가 누적되기 쉬워요."
      };
    }

    if (sameAxis && p.axis === "lift") {
      return {
        badge: pairTitle + " (회복 동력 제공형)",
        description:
          "주된 ‘" +
          p.name +
          "’에 ‘" +
          s.name +
          "’이 결합되어, 무너진 상대가 자기혐오에 잠기지 않도록 자존감과 회복의 발판을 동시에 세워주는 조합이에요. 든든한 보호자 역할을 해내지만, 스스로에게는 ‘약해지면 안 된다’는 무언의 압박을 가하고 있을 가능성이 높아요."
      };
    }

    return {
      badge: pairTitle + " (감정 수용 · 회복 조율형)",
      description:
        "‘" +
        p.axisLabel +
        "(" +
        p.name +
        ")’과 ‘" +
        s.axisLabel +
        "(" +
        s.name +
        ")’을 함께 구사하는 입체적인 조합이에요. 상대의 마음을 어루만지는 동시에 현실에서 무너지지 않게 잡아주는 균형감이 뛰어나요. 다만 상대의 감정과 현실 문제를 둘 다 챙기느라 대화 한 번에 쓰는 에너지 소모량이 남들보다 훨씬 클 수 있어요."
    };
  }

  /**
   * 6유형 스펙트럼 분포 산출
   */
  function buildSpectrumAnalysis(scores) {
    const total = TYPE_ORDER.reduce(function (acc, code) {
      return acc + (scores[code] || 0);
    }, 0);

    let maxScore = 0;
    TYPE_ORDER.forEach(function (code) {
      if (scores[code] > maxScore) maxScore = scores[code];
    });

    const items = TYPE_ORDER.map(function (code) {
      const def = COMFORT_TYPES[code];
      const raw = scores[code] || 0;
      const percent = total > 0 ? Math.round((raw / total) * 100) : 0;
      const barWidth = maxScore > 0 ? Math.round((raw / maxScore) * 100) : 0;
      return {
        code: code,
        name: def.name,
        axis: def.axis,
        axisLabel: def.axisLabel,
        score: raw,
        percent: percent,
        barWidth: barWidth
      };
    }).sort(function (a, b) {
      return b.score - a.score;
    });

    const stayRaw =
      (scores.acceptance || 0) +
      (scores.companionship || 0) +
      (scores.empathy || 0);
    const liftRaw =
      (scores.recognition || 0) + (scores.rest || 0) + (scores.solution || 0);

    const stayPercent = total > 0 ? Math.round((stayRaw / total) * 100) : 50;
    const liftPercent = total > 0 ? 100 - stayPercent : 50;

    let balanceSummary = "";
    if (total === 0) {
      balanceSummary =
        "정형화된 위로 키워드 대신 일상적인 대화체로 자유롭게 답장을 건넸어요.";
    } else if (stayPercent >= 70) {
      balanceSummary =
        "위로 에너지의 " +
        stayPercent +
        "%가 ‘곁에 머무는 말(수용·동행·공감)’에 집중되어 있어요. 조언이나 처방보다 상대가 외롭지 않게 감정의 바닥을 함께 견뎌주는 데 특화된 결이에요.";
    } else if (liftPercent >= 70) {
      balanceSummary =
        "위로 에너지의 " +
        liftPercent +
        "%가 ‘일으켜 주는 말(인정·안식·해결)’에 모였어요. 상대가 자책의 늪에 오래 빠져 있지 않도록 기준점과 휴식, 돌파구를 쥐여주는 데 강한 결이에요.";
    } else {
      balanceSummary =
        "‘곁에 머무는 말(" +
        stayPercent +
        "%)’과 ‘일으켜 주는 말(" +
        liftPercent +
        "%)’을 유연하게 오갔어요. 고민의 무게에 맞춰 공감과 현실적 지지를 번갈아 꺼내는 균형 잡힌 패턴이에요.";
    }

    return {
      totalScore: total,
      items: items,
      stayPercent: stayPercent,
      liftPercent: liftPercent,
      balanceSummary: balanceSummary
    };
  }

  /**
   * 대화 국면별 4단계 미시 행동·심리 해부
   */
  function buildTurnBreakdown(records, t4Reaction, t6Receiving) {
    const findRec = function (id) {
      return (records || []).find(function (r) {
        return r && r.turnId === id;
      });
    };

    // 1. T0 오프닝 반응
    const t0 = findRec("T0");
    let openingAnalysis =
      "새벽 두 시가 넘은 갑작스러운 연락에도 밀어내지 않고 대화의 문을 열어주었어요.";
    if (t0) {
      if (t0.openingTag === "warm_ask") {
        openingAnalysis =
          "새벽 첫 톡(‘자냐...?’)을 보자마자 ‘무슨 일 있냐’며 상대의 안위부터 즉각 확인했어요. 지인의 작은 이상 신호에 빠르게 깨어나는 보호 본능이 읽혀요.";
      } else if (t0.openingTag === "playful") {
        openingAnalysis =
          "새벽 연락의 무거운 긴장감을 ‘이 시간에 왜 안 자냐 ㅋㅋ’ 같은 가벼운 농담으로 먼저 풀어주었어요. 상대가 미안해하지 않고 말을 꺼내게 만드는 세심한 완충 방식이에요.";
      } else if (t0.openingTag === "shared_night") {
        openingAnalysis =
          "‘나도 안 자고 있었다’며 같은 시간에 깨어 있는 동질감을 먼저 깔아주었어요. 연락한 친구가 민폐라고 느끼지 않도록 배려하는 다정한 거리 조절이에요.";
      } else if (t0.mode === "custom") {
        openingAnalysis =
          "첫 마디부터 주어진 보기를 쓰지 않고 평소 내 말투(“" +
          t0.text +
          "”)로 직접 문을 열어 상대의 경계를 자연스럽게 낮추었어요.";
      }
    }

    // 2. T1, T2, T3, T5 고민 대응 패턴
    const comfortTurns = COMFORT_TURN_IDS.map(findRec).filter(Boolean);
    const usedTypes = [];
    comfortTurns.forEach(function (r) {
      const eff = r.clarifiedType || r.resolvedType;
      if (eff && COMFORT_TYPES[eff] && !usedTypes.includes(eff)) {
        usedTypes.push(eff);
      }
    });

    let comfortAnalysis = "";
    if (usedTypes.length === 1) {
      const onlyName = COMFORT_TYPES[usedTypes[0]].name;
      comfortAnalysis =
        "네 번의 고민 토로 내내 흔들림 없이 ‘" +
        onlyName +
        "’ 관점을 일관되게 유지했어요. 상황이 바뀌어도 내가 가장 진심으로 믿는 위로의 원칙이 뚜렷한 사람이에요.";
    } else if (usedTypes.length >= 3) {
      const typeNames = usedTypes
        .map(function (c) {
          return COMFORT_TYPES[c].clarifyLabel;
        })
        .join(" → ");
      comfortAnalysis =
        "방전·자책·비교·미안함으로 이어지는 친구의 감정 변화에 따라 ‘" +
        typeNames +
        "’ 순으로 위로의 결을 세밀하게 바꾸어 대응했어요. 한 가지 말만 반복하지 않고 상대의 맥락을 읽는 민감도가 높아요.";
    } else if (usedTypes.length === 2) {
      comfortAnalysis =
        "대화의 흐름 속에서 ‘" +
        COMFORT_TYPES[usedTypes[0]].clarifyLabel +
        "’과 ‘" +
        COMFORT_TYPES[usedTypes[1]].clarifyLabel +
        "’ 두 가지 축을 번갈아 건네며 안정감 있게 대화를 지탱했어요.";
    } else {
      comfortAnalysis =
        "정해진 틀보다 내 고유한 일상 어휘로 친구의 고민을 자연스럽게 받아냈어요.";
    }

    // 3. T4 위로가 튕겨 나왔을 때(저항 국면)
    const t4Map = {
      step_back: {
        tag: "수용적 물러남",
        text: "친구가 ‘솔직히 잘 와닿지 않는다’고 밀어냈을 때, 내 말을 방어하기보다 ‘내 말이 쉽게 들렸겠다’며 한발 물러서서 사과했어요. 타인의 감정을 다치게 할까 봐 내 탓으로 먼저 돌리는 섬세함과 자기검열이 함께 엿보여요."
      },
      listen: {
        tag: "비판단적 경청 확장",
        text: "위로가 먹히지 않는 순간에도 조급해하지 않고 ‘다 뱉어내라, 듣겠다’며 대화의 그릇을 더 넓혔어요. 해결보다 감정 배설 자체가 필요하다는 걸 직감적으로 아는 태도예요."
      },
      reassure: {
        tag: "진심 재확인",
        text: "상대가 회의적인 반응을 보였을 때 흔들리지 않고 ‘빈말이 아니라 진심’이라고 단단하게 쐐기를 박아주었어요. 관계의 신뢰를 말의 무게로 지켜내는 스타일이에요."
      },
      custom: {
        tag: "주도적 감정 조율",
        text: "위로가 튕겨 나온 까다로운 순간에 선택지에 의존하지 않고 직접 고른 문장으로 어색해진 공기를 유연하게 수습했어요."
      }
    };
    const t4Info = t4Map[t4Reaction] || t4Map.listen;

    // 4. T6 화살표가 나에게 왔을 때("넌 요즘 어때?")
    const t6Map = {
      open: {
        tag: "솔직한 자기 개방 (열림)",
        text: "보기에 없던 ‘내 힘든 이야기’를 직접 타이핑해 꺼내 보였어요. 일방적인 감정 돌봄에 갇히지 않고 내 무게도 나눌 줄 아는 건강한 용기가 작동했어요."
      },
      unsure: {
        tag: "판단 유보와 머무름 (모름)",
        text: "억지로 괜찮은 척 포장하지 않고 ‘잘 모르겠다’며 모호한 내 상태를 그대로 인정했어요. 솔직한 털어놓음으로 가기 직전의 조심스러운 정직함이 담겨 있어요."
      },
      closed: {
        tag: "괜찮음 방어막 (닫힘)",
        text: "일곱 턴 동안 친구의 무너짐은 정성껏 받아주면서, 정작 내 안부를 묻는 한 문장에는 ‘늘 똑같지, 괜찮아’라며 셔터를 내렸어요. 힘든 친구에게 내 짐까지 얹지 않으려는 배려이자 가장 흔한 고립 습관이에요."
      },
      deflect: {
        tag: "타인 중심 화제 전환 (돌림)",
        text: "내 차례가 오자마자 ‘내 얘긴 됐고 너 속은 좀 나아졌어?’라며 스포트라이트를 즉시 친구 쪽으로 되돌렸어요. 돌보는 역할에 익숙해져 정작 내 자리는 비워두는 전형적인 비대칭 신호예요."
      }
    };
    const t6Info = t6Map[t6Receiving] || t6Map.closed;

    return [
      {
        step: "T0 · 새벽 첫 기척",
        badge: "경계 해제 방식",
        body: openingAnalysis
      },
      {
        step: "T1~T5 · 본 대화 4턴",
        badge: "위로 전개 전략",
        body: comfortAnalysis
      },
      {
        step: "T4 · 위로가 튕겨 나왔을 때",
        badge: t4Info.tag,
        body: t4Info.text
      },
      {
        step: "T6 · “넌 요즘 어때?”",
        badge: t6Info.tag,
        body: t6Info.text
      }
    ];
  }

  /**
   * 대화 언어·행동 계량 데이터 및 해설 산출
   */
  function analyzeHabits(turnRecords, meta) {
    const records = Array.isArray(turnRecords) ? turnRecords : [];
    const revisionCount =
      meta && typeof meta.revisionCount === "number" ? meta.revisionCount : 0;

    let customCount = 0;
    let editedChoiceCount = 0;
    let questionCount = 0;
    let laughCount = 0;
    let tearCount = 0;
    let ellipsisCount = 0;
    let totalChars = 0;
    let longestLength = 0;
    let longestTurnId = null;

    records.forEach(function (rec) {
      if (!rec) return;
      const text = normalizeText(rec.text);
      totalChars += text.length;
      if (text.length > longestLength) {
        longestLength = text.length;
        longestTurnId = rec.turnId;
      }
      if (rec.mode === "custom") customCount += 1;
      if (rec.editedFromChoice) editedChoiceCount += 1;
      if (hasQuestionSignal(text)) questionCount += 1;
      if (/[ㅋㅎ]{2,}/.test(text)) laughCount += 1;
      if (/[ㅠㅜ]{1,}/.test(text)) tearCount += 1;
      if (/\.{2,}|…/.test(text)) ellipsisCount += 1;
    });

    const turnCount = records.length || 1;
    const avgLength =
      records.length > 0 ? Math.round(totalChars / records.length) : 0;
    const customRate =
      records.length > 0 ? Math.round((customCount / turnCount) * 100) : 0;

    const t4Record = records.find(function (r) {
      return r && r.turnId === "T4";
    });
    const t6Record = records.find(function (r) {
      return r && r.turnId === "T6";
    });

    const t4Reaction = classifyT4Reaction(t4Record);
    const t6Receiving = classifyT6Response(t6Record);

    // 신중도 라벨
    let cautionLabel = "직관 즉답형";
    if (revisionCount + editedChoiceCount >= 4) {
      cautionLabel = "세밀한 단어 조율형";
    } else if (revisionCount + editedChoiceCount >= 1) {
      cautionLabel = "자연스러운 다듬기형";
    }

    // 분석 코멘터리 문장 구성
    const lines = [];

    if (revisionCount > 0 || editedChoiceCount > 0) {
      lines.push(
        "전송 버튼을 누르기 전 입력을 " +
          revisionCount +
          "번 고쳤고, 선택지 중 " +
          editedChoiceCount +
          "번을 내 말투로 손질했어요. 같은 위로라도 내 말처럼 들리게 다듬거나 행여 상처가 될 단어를 골라내는 ‘" +
          cautionLabel +
          "’ 습관이 드러나요."
      );
    } else {
      lines.push(
        "지우거나 되돌리는 망설임 없이 8턴 모두 첫 직관 그대로 전송했어요. 계산된 문장보다 즉각적인 반응 속도로 상대의 불안을 덜어주는 ‘" +
          cautionLabel +
          "’ 스타일이에요."
      );
    }

    if (customCount > 0) {
      lines.push(
        "전체 답장의 " +
          customRate +
          "%(" +
          customCount +
          "턴)를 직접 타이핑해 채웠고, 평균 답장 길이는 " +
          avgLength +
          "자(최장 " +
          (longestTurnId || "T7") +
          " " +
          longestLength +
          "자)였어요."
      );
    } else {
      lines.push(
        "평균 " +
          avgLength +
          "자 호흡의 답장을 선택하며, 되묻기 표현이 " +
          questionCount +
          "번 포함되었어요."
      );
    }

    const toneParts = [];
    if (laughCount > 0) {
      toneParts.push("무거운 공기를 덜어주는 웃음 표지(ㅋㅋ·ㅎㅎ) " + laughCount + "회");
    }
    if (tearCount > 0) {
      toneParts.push("속상함에 동조하는 눈물 표지(ㅠㅠ) " + tearCount + "회");
    }
    if (ellipsisCount > 0) {
      toneParts.push("여운을 남기는 말줄임표 " + ellipsisCount + "회");
    }
    if (questionCount > 0) {
      toneParts.push("상대 사정을 묻는 질문형 표현 " + questionCount + "회");
    }

    if (toneParts.length > 0) {
      lines.push(
        "말투 표지에서는 " +
          toneParts.join(", ") +
          "가 포착되어 새벽 대화 특유의 거리감과 온도를 세심하게 조절했어요."
      );
    } else {
      lines.push(
        "초성이나 과한 감탄사 없이 담백한 평서문 위주로 차분하고 묵직하게 대화를 지탱했어요."
      );
    }

    return {
      revisionCount: revisionCount,
      editedChoiceCount: editedChoiceCount,
      cautionLabel: cautionLabel,
      customCount: customCount,
      customRate: customRate,
      questionCount: questionCount,
      laughCount: laughCount,
      tearCount: tearCount,
      ellipsisCount: ellipsisCount,
      totalChars: totalChars,
      avgLength: avgLength,
      longestTurnId: longestTurnId,
      longestLength: longestLength,
      t4Reaction: t4Reaction,
      t6Receiving: t6Receiving,
      lines: lines
    };
  }

  /**
   * 전체 대화 채점 및 다층 분석 리포트 생성
   */
  function scoreConversation(turnRecords, meta) {
    const records = Array.isArray(turnRecords) ? turnRecords : [];
    const scores = {};
    TYPE_ORDER.forEach(function (typeCode) {
      scores[typeCode] = 0;
    });

    let t7Type = null;
    const customTypeHistory = [];
    const chosenTypeHistory = [];

    records.forEach(function (rec) {
      if (!rec) return;
      const effectiveType = rec.clarifiedType || rec.resolvedType || null;
      if (!effectiveType || !COMFORT_TYPES[effectiveType]) return;

      if (COMFORT_TURN_IDS.includes(rec.turnId)) {
        const delta = rec.mode === "custom" ? 1.5 : 1;
        scores[effectiveType] += delta;
        if (rec.mode === "custom") {
          customTypeHistory.push(effectiveType);
        } else {
          chosenTypeHistory.push(effectiveType);
        }
      } else if (rec.turnId === "T7") {
        scores[effectiveType] += 2;
        t7Type = effectiveType;
        if (rec.mode === "custom") {
          customTypeHistory.push(effectiveType);
        } else {
          chosenTypeHistory.push(effectiveType);
        }
      }
    });

    const totalPoints = TYPE_ORDER.reduce(function (acc, code) {
      return acc + scores[code];
    }, 0);

    const compareTypes = function (a, b) {
      if (scores[b] !== scores[a]) {
        return scores[b] - scores[a];
      }
      if (t7Type) {
        if (a === t7Type && b !== t7Type) return -1;
        if (b === t7Type && a !== t7Type) return 1;
      }
      const aCustomIdx = customTypeHistory.lastIndexOf(a);
      const bCustomIdx = customTypeHistory.lastIndexOf(b);
      if (aCustomIdx !== bCustomIdx) {
        return bCustomIdx - aCustomIdx;
      }
      const aChosenIdx = chosenTypeHistory.lastIndexOf(a);
      const bChosenIdx = chosenTypeHistory.lastIndexOf(b);
      if (aChosenIdx !== bChosenIdx) {
        return bChosenIdx - aChosenIdx;
      }
      if (totalPoints === 0) {
        if (a === "companionship" && b !== "companionship") return -1;
        if (b === "companionship" && a !== "companionship") return 1;
      }
      return TYPE_ORDER.indexOf(a) - TYPE_ORDER.indexOf(b);
    };

    const rankedTypes = TYPE_ORDER.slice().sort(compareTypes);
    const primaryType = rankedTypes[0];
    const secondaryType = rankedTypes[1];

    const primaryDef = COMFORT_TYPES[primaryType];
    const givingAxis = primaryDef.axis;

    const habits = analyzeHabits(records, meta);
    const t6Receiving = habits.t6Receiving;
    const isReceivingOpen =
      t6Receiving === "open" || t6Receiving === "unsure";

    const quadrantKey =
      givingAxis + "_" + (isReceivingOpen ? "open" : "closed");
    const quadrant = QUADRANTS[quadrantKey];

    const stayScore =
      scores.acceptance + scores.companionship + scores.empathy;
    const liftScore = scores.recognition + scores.rest + scores.solution;
    const sumAxis = stayScore + liftScore;
    let ratio = sumAxis > 0 ? Math.abs(liftScore - stayScore) / sumAxis : 0.35;
    ratio = Math.max(0.22, Math.min(0.78, ratio));

    const xPercent =
      givingAxis === "stay"
        ? Math.round(50 - ratio * 38)
        : Math.round(50 + ratio * 38);

    const yPercentMap = {
      open: 22,
      unsure: 36,
      closed: 66,
      deflect: 80
    };
    const yPercent = yPercentMap[t6Receiving] || 66;

    const returnedSentence = selectReturnedSentence(records, primaryType);
    const spectrum = buildSpectrumAnalysis(scores);
    const combinationInsight = buildCombinationInsight(
      primaryType,
      secondaryType,
      scores
    );
    const turnBreakdown = buildTurnBreakdown(
      records,
      habits.t4Reaction,
      t6Receiving
    );

    return {
      scores: scores,
      rankedTypes: rankedTypes,
      primaryType: primaryType,
      secondaryType: secondaryType,
      isAllZeroFallback: totalPoints === 0,
      quadrantKey: quadrantKey,
      quadrant: quadrant,
      coordinates: {
        xPercent: xPercent,
        yPercent: yPercent,
        givingAxis: givingAxis,
        receivingType: t6Receiving,
        isReceivingOpen: isReceivingOpen
      },
      returnedSentence: returnedSentence,
      spectrum: spectrum,
      combinationInsight: combinationInsight,
      turnBreakdown: turnBreakdown,
      habits: habits
    };
  }

  const exported = {
    COMFORT_TURN_IDS: COMFORT_TURN_IDS,
    SCORED_TURN_IDS: SCORED_TURN_IDS,
    KEYWORD_DICTIONARY: KEYWORD_DICTIONARY,
    normalizeText: normalizeText,
    withKoreanParticle: withKoreanParticle,
    detectCrisisSignal: detectCrisisSignal,
    classifyComfortText: classifyComfortText,
    computeBigramOverlap: computeBigramOverlap,
    evaluateTurnInput: evaluateTurnInput,
    getClarificationTargets: getClarificationTargets,
    classifyT6Response: classifyT6Response,
    classifyT4Reaction: classifyT4Reaction,
    hasQuestionSignal: hasQuestionSignal,
    selectFriendReaction: selectFriendReaction,
    createRevisionTracker: createRevisionTracker,
    selectReturnedSentence: selectReturnedSentence,
    buildCombinationInsight: buildCombinationInsight,
    buildSpectrumAnalysis: buildSpectrumAnalysis,
    buildTurnBreakdown: buildTurnBreakdown,
    analyzeHabits: analyzeHabits,
    scoreConversation: scoreConversation
  };

  root.WC_SCORING = exported;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof window !== "undefined" ? window : globalThis);
