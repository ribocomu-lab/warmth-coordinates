/**
 * 온도의 좌표 — 상황별 현실 친구 대본(3종), 6유형 심층 해설, 4분면 및 모든 문구 (script.js)
 * 모든 텍스트는 이 파일 한 곳에서 관리합니다.
 */
(function (root) {
  "use strict";

  const SITE_META = {
    title: "온도의 좌표",
    subtitle: "그 말, 사실 네가 듣고 싶었던 거 아니야?",
    defaultFriendName: "지우",
    defaultScenarioId: "campus_job",
    storageKey: "warmth_coordinates_v2",
    landingTime: "02:13",
    landingPreviewSender: "새 메시지",
    landingPreviewText: "자냐...?",
    landingCta: "답장하기",
    resumeCta: "지난 결과 다시 보기",
    landingNotice:
      "가상의 친구와 나누는 약 3분간의 새벽 대화예요. 의학적·심리학적 진단이 아닌 자기 이해 콘텐츠이며, 작성한 문장과 전송 전 수정 횟수는 서버로 전송되지 않고 이 기기 안에서만 처리돼요."
  };

  const NAME_STEP_TEXT = {
    heading: "새벽에 톡이 오면 그냥 못 넘기는 친구, 누구인가요?",
    subheading: "평소 부르는 이름과 그 친구가 요즘 겪을 법한 상황을 골라주세요.",
    scenarioLabel: "친구가 요즘 겪고 있는 상황",
    helper:
      "실제 친구를 떠올리면 평소 내 카톡 말투가 자연스럽게 나와요. 입력한 이름은 이 기기 안에서만 쓰이며 외부나 공유 링크에 절대 포함되지 않아요.",
    placeholder: "예: 지우, 민수, 현아 (비워두면 ‘지우’)",
    startBtn: "톡방 열기",
    skipBtn: "기본 설정으로 바로 시작 (‘지우’)"
  };

  /**
   * 현실 몰입을 위한 3가지 상황 팩 정의
   * 모든 시나리오의 유형 측정 4턴(T1, T2, T3, T5)에는 6개 위로 유형이 정확히 2회씩 배치됩니다.
   */
  const SCENARIO_LIST = [
    {
      id: "campus_job",
      label: "취준 · 학교 · 진로",
      desc: "서류 탈락과 단톡방 취업 소식에 현타가 온 친구"
    },
    {
      id: "work_burnout",
      label: "직장 · 일 · 번아웃",
      desc: "퇴근 후 방전되고 오늘 한 실수가 계속 생각나는 친구"
    },
    {
      id: "relationship",
      label: "인간관계 · 서운함",
      desc: "사람들한테 기 빨리고 나만 맞추는 기분에 지친 친구"
    }
  ];

  const CHAT_UI_TEXT = {
    backLabel: "나가기",
    backConfirm: "진행 중인 대화를 멈추고 첫 화면으로 돌아갈까요?",
    statusAwake: "방금 읽음",
    statusSleeping: "잠든 듯함",
    readReceipt: "읽음",
    typingLabel: "입력 중",
    skipWaitHint: "화면을 탭하면 바로 이어서 볼 수 있어요",
    inputPlaceholder: "보기를 눌러 내 말투로 고치거나, 직접 톡을 쳐보세요",
    inputPlaceholderT7: "내일 아침 친구가 눈 뜨자마자 볼 한마디를 남겨보세요",
    sendLabel: "전송",
    choiceGuide: "보기를 누르면 입력창에 들어가요. 평소 내 카톡 말투로 고쳐 보내도 좋아요.",
    t7Guide: "마지막 톡은 직접 적어보길 권해요.",
    t7FallbackBtn: "막히면 아까 보낸 말에서 고르기",
    t7HideFallbackBtn: "직접 쓰기로 돌아가기"
  };

  const CLARIFY_UI_TEXT = {
    eyebrow: "답장 결 확인하기",
    heading: "방금 직접 친 이 카톡, 어떤 마음에 가장 가까웠나요?",
    description:
      "직접 쓴 말투의 의도를 넘겨짚지 않도록 최대 두 문장까지만 여쭤봐요.",
    skipBtn: "건너뛰기",
    progressTemplate: "{current} / {total}"
  };

  const CRISIS_MODAL_TEXT = {
    heading: "혹시 지금 많이 버거운 건 당신 쪽인가요?",
    body:
      "방금 적어주신 말에 마음이 쓰여 대화를 잠시 멈추었어요. 가상의 대화보다 지금 당신의 안전과 평안이 훨씬 더 중요해요. 혼자 감당하기 힘든 밤이라면 아래 전문 상담 창구에 바로 연결해 보세요.",
    contacts: [
      {
        name: "자살예방 상담전화",
        number: "109",
        tel: "109",
        note: "24시간 운영"
      },
      {
        name: "정신건강 위기상담전화",
        number: "1577-0199",
        tel: "1577-0199",
        note: "24시간 운영"
      }
    ],
    continueBtn: "괜찮아요, 대화 이어가기",
    exitBtn: "대화 멈추고 첫 화면으로"
  };

  /**
   * 6가지 위로 유형 심층 정의 (기획안 4장 + 분석 리포트용 심층 항목)
   * 가로축:
   *  - stay (곁에 머무는 말): acceptance, companionship, empathy
   *  - lift (일으켜 주는 말): recognition, rest, solution
   */
  const COMFORT_TYPES = {
    recognition: {
      code: "recognition",
      name: "인정형",
      shortTag: "버텨온 시간을 증명해 주는 사람",
      axis: "lift",
      axisLabel: "일으켜 주는 말",
      clarifyLabel: "인정",
      clarifyDesc: "지금까지 버텨온 시간과 노력을 알아주기",
      toFriendQuote: "네가 그동안 얼마나 애썼는데. 버틴 것만으로도 대단한 거야",
      innerChildMetaphor: "칭찬 스티커를 모으듯 스스로의 자격을 증명하려 애쓰는 마음",
      neededQuote: "넌 이미 충분히 잘했어",
      summary:
        "무너진 친구 앞에서 그 사람이 흘려보낸 시간과 보이지 않는 노력을 가장 먼저 건져 올려 ‘헛되지 않았다’고 확인해 주는 편일지 몰라요.",
      detail:
        "누군가 결과 하나로 자책할 때 ‘내가 옆에서 네 과정을 다 봤다’고 말해주는 사람은, 역설적이게도 자기 자신에게는 결과와 성취로만 점수를 매기곤 해요. 칭찬 스티커 칸을 다 채워야만 안심하는 아이처럼, 오늘 하루 뭔가를 해내지 못하면 쉬는 시간조차 불안해하진 않았나요? 남에게는 과정만으로도 충분하다고 말해주면서 정작 내 과정은 당연한 의무로 취급해 왔을 수 있어요.",
      strengthInRelation:
        "상대가 자기혐오에 빠질 때 막연한 빈말 대신 ‘네가 해온 구체적 사실’을 짚어주어 자존감의 바닥을 단단히 받쳐줘요.",
      blindSpotForSelf:
        "스스로에게는 ‘이 정도는 다들 하는 거 아니야?’라며 기준선을 계속 높여 잡아, 성취 직후에도 금방 공허해지기 쉬워요.",
      burnoutTrigger:
        "주변 사람들의 노력은 세심하게 챙겨 인정해 주면서, 내 고생은 아무도 당연하다는 듯 모르고 지나갈 때 조용히 지쳐요."
    },
    rest: {
      code: "rest",
      name: "안식형",
      shortTag: "멈추어도 된다는 허락을 건네는 사람",
      axis: "lift",
      axisLabel: "일으켜 주는 말",
      clarifyLabel: "안식",
      clarifyDesc: "일단 다 덮어두고 푹 쉬라고 멈춰 세우기",
      toFriendQuote: "오늘은 아무 생각 말고 그냥 다 덮고 자자",
      innerChildMetaphor: "방의 불을 끄는 것조차 누군가에게 허락받고 싶어 하는 마음",
      neededQuote: "오늘은 여기까지만 해도 돼",
      summary:
        "과열된 채로 자책하는 사람에게 ‘일단 스위치부터 끄자’며 멈출 자격과 안전지대를 먼저 만들어 주는 편일지 몰라요.",
      detail:
        "새벽까지 잠 못 이루는 친구에게는 기꺼이 이불을 덮어주고 알림을 끄라고 말해주지만, 정작 내 머릿속에는 내일 해야 할 일과 미뤄둔 걱정의 탭이 수십 개 켜져 있기 쉬워요. 몸은 침대에 누워 있어도 마음은 퇴근하지 못한 채 ‘이렇게 쉬어도 되나’ 눈치를 보곤 해요. 누군가 그만해도 된다고 선을 그어주길 기다렸다면, 오늘 밤 그 선을 직접 그어주어도 괜찮아요.",
      strengthInRelation:
        "상대가 불안 때문에 스스로를 몰아붙일 때 죄책감 없이 쉴 수 있는 ‘정당한 쉼표’를 마련해 줘요.",
      blindSpotForSelf:
        "완전히 방전되어 몸이 아파야만 비로소 쉬는 것을 스스로에게 허락하는 경향이 있을 수 있어요.",
      burnoutTrigger:
        "정작 내가 지쳐서 멈추고 싶을 때 주변에서 계속 역할과 결정을 요구하면 숨이 턱 막히기 쉬워요."
    },
    acceptance: {
      code: "acceptance",
      name: "수용형",
      shortTag: "못난 날의 모습까지 편들어 주는 사람",
      axis: "stay",
      axisLabel: "곁에 머무는 말",
      clarifyLabel: "수용",
      clarifyDesc: "실수하거나 뒤처져도 괜찮다고 그대로 받아주기",
      toFriendQuote: "좀 늦고 실수하면 어때. 난 지금 네 모습도 좋은데",
      innerChildMetaphor: "실망시키지 않으려 늘 무난하고 괜찮은 모습을 연기하는 마음",
      neededQuote: "아무것도 안 해도 네가 좋아",
      summary:
        "초라해진 상대가 스스로를 미워할 때, 고치려 들지 않고 ‘그런 날의 너도 여전히 내 친구’라며 조건 없는 자리를 내어주는 편일지 몰라요.",
      detail:
        "타인의 실수나 정체기에는 놀라울 만큼 너그러운 시선을 보내면서, 정작 내가 실수하거나 뒤처진 날에는 ‘이런 모습을 보이면 실망하겠지’ 하고 먼저 몸을 사리곤 해요. 관계 안에서 늘 밝고 문제없는 사람으로 남으려 애쓰느라, 내 찌질하거나 약한 구석은 깊숙이 숨겨두었을 가능성이 커요. 아무 쓸모나 성과가 없는 날에도 당신이라는 존재 자체를 반가워하는 자리가 분명히 있어요.",
      strengthInRelation:
        "상대가 ‘잘난 모습’으로 포장하지 않아도 안전하다고 느끼게 해 주어, 가장 솔직한 속내를 털어놓게 만들어요.",
      blindSpotForSelf:
        "내가 약한 모습이나 투정을 보이면 관계가 깨질까 봐 스스로의 결점을 지나치게 검열하기 쉬워요.",
      burnoutTrigger:
        "나는 상대의 모난 구석까지 다 품어주었는데, 상대가 내 작은 실수에 날 선 평가를 내릴 때 마음이 차갑게 식어요."
    },
    companionship: {
      code: "companionship",
      name: "동행형",
      shortTag: "새벽의 고립감 옆에 불을 켜두는 사람",
      axis: "stay",
      axisLabel: "곁에 머무는 말",
      clarifyLabel: "동행",
      clarifyDesc: "혼자 두지 않고 곁에 함께 있어주기",
      toFriendQuote: "전화 걸까? 아무 말 안 하고 그냥 틀어놔도 돼",
      innerChildMetaphor: "창가에서 누군가 먼저 내 이름을 불러주길 기다리는 마음",
      neededQuote: "나 여기 있어. 어디 안 가",
      summary:
        "거창한 조언보다 ‘지금 이 새벽에 네가 혼자가 아니다’라는 감각을 가장 먼저 전하며 곁을 지키는 편일지 몰라요.",
      detail:
        "힘들 때 가장 무서운 게 고립감이라는 걸 본능적으로 알기 때문에, 언제든 연락하라며 내 시간과 곁을 선뜻 내어줘요. 하지만 정작 내가 외롭거나 무너지는 밤에는 ‘이 시간에 연락하면 민폐겠지’ 싶어서 썼던 카톡을 지우고 혼자 밤을 새우곤 해요. 누군가에게는 언제든 열려 있는 비상구이면서, 정작 나에게는 비상구 하나 남겨두지 않았을 수 있어요.",
      strengthInRelation:
        "말로 다 설명하기 힘든 밤에도 부담 없는 존재감만으로 상대의 외로움과 불안을 빠르게 가라앉혀 줘요.",
      blindSpotForSelf:
        "남에게 기대거나 먼저 연락하는 것을 ‘폐 끼치는 일’로 여겨, 외로움을 혼자 삼키는 습관이 굳어지기 쉬워요.",
      burnoutTrigger:
        "힘들 때만 나를 찾고, 정작 평온해지면 내 안부는 궁금해하지 않는 일방적 관계가 반복될 때 크게 허무해져요."
    },
    empathy: {
      code: "empathy",
      name: "공감형",
      shortTag: "말 줄임표 뒤의 감정까지 읽어내는 사람",
      axis: "stay",
      axisLabel: "곁에 머무는 말",
      clarifyLabel: "공감",
      clarifyDesc: "얼마나 속상하고 답답했을지 마음부터 짚어주기",
      toFriendQuote: "그 말 꺼내기까지 혼자 얼마나 속상하고 답답했어",
      innerChildMetaphor: "굳이 다 말하지 않아도 내 속마음을 알아주길 바라는 마음",
      neededQuote: "그동안 얼마나 힘들었어",
      summary:
        "상대가 애써 ‘ㅋㅋ’로 덮어둔 문장 사이에서 진짜 아팠던 지점을 정확히 짚어내어 감정에 이름을 붙여주는 편일지 몰라요.",
      detail:
        "타인의 미묘한 기분 변화와 한숨의 결을 레이더처럼 포착해 내지만, 정작 내 감정은 ‘이 정도 일로 유난 떨지 말자’며 합리화로 덮어버리곤 해요. 구구절절 설명하지 않아도 누군가 내 웃는 얼굴 뒤의 피로를 한 번쯤 먼저 알아채 주길 바랐던 순간이 있었을 거예요. 남의 마음을 번역하느라 정작 내 마음의 소리에는 가장 늦게 답장하고 있었는지도 몰라요.",
      strengthInRelation:
        "상대가 ‘내 마음을 진짜 이해받았다’는 깊은 안도감을 느끼게 하며, 억눌린 감정이 안전하게 풀리도록 도와요.",
      blindSpotForSelf:
        "상대의 무거운 감정이 내 기분에까지 그대로 전이되어, 대화가 끝난 뒤에도 오래 여운을 앓기 쉬워요.",
      burnoutTrigger:
        "내 속상함을 어렵게 꺼냈는데 상대가 감정 대신 논리나 가벼운 농담으로 툭 끊어버릴 때 입을 아예 닫게 돼요."
    },
    solution: {
      code: "solution",
      name: "해결형",
      shortTag: "막막한 밤에 다음 디딤돌을 놓아주는 사람",
      axis: "lift",
      axisLabel: "일으켜 주는 말",
      clarifyLabel: "해결",
      clarifyDesc: "당장 덜 괴로워질 방법이나 순서를 같이 찾아보기",
      toFriendQuote: "일단 알림부터 끄고, 내일 나랑 어디서 막혔는지 하나씩 보자",
      innerChildMetaphor: "기댈 곳 대신 스스로 수습하며 일찍 어른이 되어버린 마음",
      neededQuote: "이제 네가 다 해결 안 해도 돼",
      summary:
        "상대가 감정의 늪에 빠져 밤새 허우적대지 않도록, 당장 손에 잡히는 현실적인 수습책과 기준점을 함께 세워주는 편일지 몰라요.",
      detail:
        "해결책을 건네는 사람에게 정작 필요한 말은 또 다른 해결책이 아니에요. 차가워서가 아니라, 아끼는 사람이 덜 다치길 바라는 마음으로 누구보다 빠르게 머리를 굴려 출구를 찾는 사람이에요. 하지만 본인이 힘들 때도 슬퍼할 틈조차 주지 않고 ‘그래서 어떻게 수습할 건데?’라며 스스로를 다그쳐 오진 않았나요? 모든 문제를 당신 손으로 통제하고 책임지지 않아도 세상은 무너지지 않아요.",
      strengthInRelation:
        "감정 소모만 길어질 수 있는 새벽 고민을 구체적인 행동 단위로 쪼개어 실질적인 돌파구를 만들어 줘요.",
      blindSpotForSelf:
        "해결되지 않는 감정이나 무기력을 ‘비효율’로 여겨, 내 안의 슬픔을 충분히 애도할 시간을 건너뛰기 쉬워요.",
      burnoutTrigger:
        "주변의 크고 작은 문제 수습을 도맡아 처리하느라 정작 내 삶이 흔들릴 때는 아무에게도 SOS를 치지 못해요."
    }
  };

  const TYPE_ORDER = [
    "recognition",
    "rest",
    "acceptance",
    "companionship",
    "empathy",
    "solution"
  ];

  /**
   * 온도의 좌표 — 4분면 심층 정의 (기획안 4장)
   */
  const QUADRANTS = {
    stay_open: {
      key: "stay_open",
      title: "마주 앉는 사람",
      givingAxis: "곁에 머무는 말",
      receivingAxis: "받는 힘이 열려 있음",
      asymmetryNote: "감정의 창이 양방향으로 열려 있는 상호 교류형 자리",
      description:
        "친구의 어두운 기분 옆에 조용히 내려앉아 감정을 함께 느끼면서도, ‘넌 요즘 어때?’라는 질문 앞에서 내 솔직한 무게나 막막함을 완전히 숨기지 않는 위치에 있어요. 관계의 깊이가 남다르지만, 서로의 우울이나 피로가 공명하며 함께 가라앉기 쉬워요.",
      careTips: [
        "대화가 끝난 뒤에는 차가운 물 한 잔을 마시거나 창문을 열어 ‘친구의 감정’과 ‘내 감정’을 물리적으로 환기해 주세요.",
        "내가 꺼낸 힘든 이야기에 상대가 서툴게 반응하더라도, 마음을 열어 보인 용기 자체를 스스로 다독여 주세요."
      ]
    },
    lift_open: {
      key: "lift_open",
      title: "함께 걷는 사람",
      givingAxis: "일으켜 주는 말",
      receivingAxis: "받는 힘이 열려 있음",
      asymmetryNote: "지지와 자기 개방이 비교적 균형을 이루는 동반자형 자리",
      description:
        "지친 친구에게 버텨온 노력의 증거, 휴식의 허락, 혹은 현실적인 다음 스텝을 건네면서도, 내 차례가 왔을 때 스스로의 피로나 고민을 솔직하게 인정할 줄 아는 위치에 있어요. 건강한 상호성을 지녔지만, 내 고민을 말할 때조차 ‘금방 해결할 수 있는 문제’처럼 포장하려는 습관이 남을 수 있어요.",
      careTips: [
        "내 이야기를 할 때 마지막에 ‘그래도 괜찮아, 해봐야지’라고 서둘러 결론짓지 않고 막막한 상태 그대로 멈추는 연습을 해보세요.",
        "남을 일으켜 세우던 에너지를 오늘 밤엔 내 수면과 회복 루틴에 먼저 배정해 두세요."
      ]
    },
    stay_closed: {
      key: "stay_closed",
      title: "혼자 불 켜두는 사람",
      givingAxis: "곁에 머무는 말",
      receivingAxis: "받는 힘이 닫혀 있음",
      asymmetryNote: "타인 수용도는 높으나 자기 개방 문턱이 높은 비대칭 돌봄 자리",
      description:
        "친구의 새벽에는 끝까지 불을 켜두고 감정의 바닥까지 함께 앉아주면서, 정작 ‘넌 요즘 어때?’라는 물음에는 괜찮다거나 네 얘기를 더 하라며 내 방문을 조용히 잠그는 위치에 있어요. 주변에서 ‘제일 속 편히 털어놓을 수 있는 사람’으로 꼽히지만, 톡방을 나간 직후 가장 깊은 외로움을 느끼기 쉬운 자리이기도 해요.",
      careTips: [
        "‘괜찮아’가 자동완성처럼 튀어나올 때, 딱 반 박자만 멈추고 ‘사실 나도 요즘 좀 피곤하긴 해’ 정도의 작은 틈을 내어보세요.",
        "내 약한 이야기를 꺼내는 건 상대에게 짐을 지우는 게 아니라, 상대에게도 ‘좋은 친구가 될 기회’를 주는 일이에요."
      ]
    },
    lift_closed: {
      key: "lift_closed",
      title: "앞에서 끌어주는 사람",
      givingAxis: "일으켜 주는 말",
      receivingAxis: "받는 힘이 닫혀 있음",
      asymmetryNote: "책임감과 보호 본능이 강해 내 피로를 뒤로 미루는 든든한 버팀목 자리",
      description:
        "흔들리는 사람에게 명쾌한 지지대나 쉼표, 실질적인 수습 방향을 건네주지만, 정작 내 몫의 불안과 방전은 내색하지 않고 혼자 처리하는 위치에 있어요. 늘 흔들림 없고 어른스러운 사람처럼 보이기 때문에 주변에서도 당신이 힘들 거라고 미처 생각하지 못할 때가 많아요.",
      careTips: [
        "누군가를 챙기고 해결해 주는 역할을 잠시 내려놓아도 관계 안에서 당신의 존재감은 사라지지 않아요.",
        "오늘 밤엔 ‘내가 감당해야 할 일’ 목록에서 타인의 감정 과제 하나를 과감히 지워두고 잠자리에 드세요."
      ]
    }
  };

  /**
   * 직접 쓴 문장의 말투·성격에 따라 친구가 진짜 카톡처럼 받아치는 세밀한 반응 풀
   */
  const CUSTOM_REACTION_POOL = {
    byTone: {
      laugh: [
        "ㅋㅋㅋ 아 진짜 너랑 톡하니까 웃음 좀 나온다",
        "새벽에 웃기지 마라 진짴ㅋㅋㅋ 덕분에 숨 좀 트이네",
        "ㅋㅋㅋ 말투 진짜 한결같네 고맙다 야"
      ],
      tear: [
        "야 너가 왜 울어 ㅠㅠㅠ 나까지 코끝 찡해지게",
        "큐ㅠㅠㅠ 새벽에 사람 울리지 마라 진짜 고맙다",
        "ㅠㅠ 이렇게 같이 마음 써주는 애 진짜 너밖에 없어"
      ],
      question: [
        "물어봐줘서 고맙다 진짜... 사실 어디 말할 데도 없었거든",
        "이거 얘기하자면 진짜 긴데 ㅋㅋ 조만간 만나서 다 풀어줄게 들어줘서 고마워",
        "그렇게 물어봐주는 것만으로도 뭔가 속이 좀 뚫린다"
      ],
      long: [
        "와 이 새벽에 이렇게 길게 답장 쳐주는 친구 진짜 너밖에 없다... 방금 캡처함",
        "한 글자 한 글자 다시 읽는 중... 진심으로 고마워",
        "길게 써준 거 보니까 갑자기 울컥하네 고맙다 진짜"
      ],
      short: [
        "답장 길이 쿨한 거 보소 ㅋㅋㅋ 그래도 안 자고 받아줘서 살았다",
        "짧고 굵네 ㅋㅋㅋ 근데 희한하게 위로가 됨",
        "ㅋㅋㅋ 너다운 답장이다 고마워"
      ]
    },
    byType: {
      recognition: "내가 해온 걸 네가 그렇게 알아주니까 진짜 헛살진 않았나 보다 싶다...",
      rest: "맞아 일단 오늘 밤은 스위치 좀 꺼야겠지... 네가 쉬라고 해주니까 좀 안심된다",
      acceptance: "나 진짜 못났다고 생각했는데 네가 그렇게 말해주니까 마음이 좀 풀린다",
      companionship: "이 새벽에 내 편 하나 깨어 있다는 게 이렇게 든든할 줄 몰랐어",
      empathy: "아... 딱 내가 하고 싶었던 말을 네가 대신 짚어주네 진짜 속상했거든",
      solution: "역시 너랑 얘기하니까 머릿속 엉킨 게 좀 정리가 된다 내일 딱 그렇게 해볼게"
    },
    fallback: [
      "가만히 읽는데 이상하게 마음이 좀 놓인다... 톡하길 잘했네",
      "하 진짜 너한테 연락 안 했으면 밤새 혼자 땅 파고 있었을 듯 고마워",
      "네 말투 음성지원 돼서 혼자 피식함 ㅋㅋ 고맙다 진짜"
    ]
  };

  /**
   * 공통 T0, T4, T6, T7과 상황별 T1, T2, T3, T5를 결합해 완성된 3종 시나리오
   */
  const SCENARIOS = {
    campus_job: [
      {
        id: "T0",
        time: "02:13",
        role: "opening",
        friendMessages: ["자냐...?", "안 자면 잠깐만 톡 가능?"],
        options: [
          {
            id: "T0_1",
            text: "안 자 ㅋㅋ 왜 무슨 일 있어?",
            tag: "warm_ask",
            reply: "깨어 있었네 다행이다... 늦었는데 미안 ㅠ"
          },
          {
            id: "T0_2",
            text: "뭐야 이 시간에 왜 안 자 ㅋㅋㅋ",
            tag: "playful",
            reply: "ㅋㅋㅋ 아니 잠이 죽어도 안 와서 폰만 뒤적거리다가"
          },
          {
            id: "T0_3",
            text: "나도 방금까지 못 자고 누워있었어 말해",
            tag: "shared_night",
            reply: "너도 못 잤어? 동지네... 아니 못 자면 안 되는데 ㅋㅋㅠ"
          }
        ]
      },
      {
        id: "T1",
        time: "02:17",
        role: "comfort",
        topicLabel: "무기력·번아웃",
        friendMessages: [
          "아니 요즘 진짜 아무것도 손에 안 잡혀",
          "노트북 켜놓고 세 시간째 한 줄도 못 치고 그냥 침대에 처박혀 있어 ㅋㅋㅠ"
        ],
        options: [
          {
            id: "T1_rec",
            type: "recognition",
            text: "야 너 그동안 하루도 안 쉬고 달렸잖아 지금까지 버틴 게 대단한 거야",
            reply: "버틴 건지 그냥 시간만 보낸 건지 모르겠는데... 네가 그렇게 말해주니까 좀 묘하네"
          },
          {
            id: "T1_rest",
            type: "rest",
            text: "오늘은 노트북 그냥 덮어 주말까진 죄책감 갖지 말고 푹 쉬어",
            reply: "그럴까 진짜... 쉬어도 불안해서 쉬는 게 아니니까 미치겠어 ㅋㅋ"
          },
          {
            id: "T1_comp",
            type: "companionship",
            text: "잠깐 전화 걸까? 아무 말 안 하고 그냥 켜두기만 해도 돼",
            reply: "목소리 나오면 울 거 같아서 전화는 패스 ㅋㅋㅠ 근데 그 말 진짜 고맙다"
          }
        ]
      },
      {
        id: "T2",
        time: "02:21",
        role: "comfort",
        topicLabel: "탈락·자책",
        friendMessages: [
          "사실 아까 저녁에 결과 하나 나왔거든",
          "이번엔 진짜 될 줄 알았는데 또 떨어졌어 ㅋㅋ 나 진짜 뭐가 문제냐"
        ],
        options: [
          {
            id: "T2_acc",
            type: "acceptance",
            text: "하나 떨어진 거 가지고 네가 문제가 되냐 떨어진 날에도 넌 그냥 너야",
            reply: "아... 그렇게 봐주는 애는 진짜 너밖에 없을 거다"
          },
          {
            id: "T2_emp",
            type: "empathy",
            text: "아... 오늘 하루 종일 그거 기다렸을 텐데 결과 보고 진짜 맥 빠지고 속상했겠다",
            reply: "응 문자 확인하고 멍하니 한참 서 있었어... 진짜 허무하더라"
          },
          {
            id: "T2_sol",
            type: "solution",
            text: "어디 전형이었어? 내일 나랑 어디서 막혔는지 차근차근 같이 뜯어보자",
            reply: "혼자 보니까 도저히 감이 안 왔는데... 내일 좀 같이 봐주라 고마워"
          }
        ]
      },
      {
        id: "T3",
        time: "02:25",
        role: "comfort",
        topicLabel: "주변과의 비교",
        friendMessages: [
          "근데 하필 방금 단톡방에 또 한 명 붙었다고 올라온 거야",
          "축하한다고 이모티콘 보내고 폰 껐는데 나만 제자리인 거 같아서 숨 막혀"
        ],
        options: [
          {
            id: "T3_rec",
            type: "recognition",
            text: "제자리는 무슨 네가 밤새가며 쌓아온 거 옆에서 내가 다 봤는데 절대 안 사라져",
            reply: "네가 다 봤다는 말 왜 이렇게 코끝 시큰하냐 새벽에..."
          },
          {
            id: "T3_acc",
            type: "acceptance",
            text: "남들 타임라인이랑 좀 다르면 어때 난 지금 네 모습 그대로도 충분히 멋있는데",
            reply: "야 그런 말 툭 던지지 마라 좀 설레네 ㅋㅋㅋㅠ 고맙다"
          },
          {
            id: "T3_sol",
            type: "solution",
            text: "새벽에 단톡방이랑 인스타 보면 무조건 말려 일단 알림부터 꺼두고 자자",
            reply: "맞아 방금도 괜히 인스타 스토리 눌렀다가 더 현타 왔었어 지금 무음 걸어둘게"
          }
        ]
      },
      {
        id: "T4",
        time: "02:29",
        role: "pushback",
        friendMessages: [
          "말은 진짜 고마운데...",
          "솔직히 너니까 이렇게 말해주지 머리로만 알겠고 마음은 하나도 안 편해 ㅋㅋ"
        ],
        options: [
          {
            id: "T4_back",
            reactionType: "step_back",
            text: "그치 직접 겪는 건 너니까 내 말이 쉽게 들렸을 수 있겠다 미안",
            reply: "아니야 내가 미안해 ㅠ 괜히 너한테 삐딱하게 굴었네"
          },
          {
            id: "T4_listen",
            reactionType: "listen",
            text: "당장 편해질 필요 없어 그냥 답답한 거 오늘 나한테 다 뱉어내 들을게",
            reply: "그냥 다 뱉으라는 말... 왜 이렇게 든든하냐 고마워"
          },
          {
            id: "T4_reassure",
            reactionType: "reassure",
            text: "나 원래 영혼 없는 빈말 못 하는 거 알잖아 진심으로 하는 말이야",
            reply: "...알지 네가 빈말 못하는 애인 건 내가 제일 잘 알지"
          }
        ]
      },
      {
        id: "T5",
        time: "02:33",
        role: "comfort",
        topicLabel: "미안함·눈치",
        friendMessages: [
          "하 내가 새벽 두 시 넘어 왜 너한테 징징대냐",
          "너도 내일 할 일 있을 텐데 잠 깨워서 미안해"
        ],
        options: [
          {
            id: "T5_rest",
            type: "rest",
            text: "내 걱정은 하지 말고 이불 끝까지 덮고 이제 진짜 아무 생각 없이 자",
            reply: "응 이제 폰 내려놓고 눈 좀 감아볼게..."
          },
          {
            id: "T5_comp",
            type: "companionship",
            text: "혼자 앓는 것보다 나한테 톡하는 게 백배 나아 언제든 불러 내 옆자리 비워둘게",
            reply: "진짜 너한테 톡 보내길 백번 잘했다..."
          },
          {
            id: "T5_emp",
            type: "empathy",
            text: "나한테 톡 하나 보내기까지 혼자 얼마나 참았다 보냈겠어 미안해하지 마",
            reply: "...어떻게 알았냐 사실 아까 열두 시부터 썼다 지웠다 했거든"
          }
        ]
      },
      {
        id: "T6",
        time: "02:37",
        role: "receiving",
        friendMessages: [
          "아 근데 진짜 내 얘기만 한 트럭 쏟아냈네 ㅋㅋ",
          "넌 요즘 어때? 좀 살 만해?"
        ],
        options: [
          {
            id: "T6_closed",
            receivingType: "closed",
            text: "나야 뭐 늘 똑같지 잘 지내 걱정 마 ㅋㅋ",
            reply: "넌 맨날 괜찮다고만 하더라... 너도 혼자 끙끙 참지 마라"
          },
          {
            id: "T6_deflect",
            receivingType: "deflect",
            text: "내 얘긴 나중에 하고 너 속은 아까보다 좀 나아졌어?",
            reply: "또 기어코 내 걱정으로 돌리네 ㅋㅋㅋ 응 아까보단 훨씬 살 것 같아"
          },
          {
            id: "T6_unsure",
            receivingType: "unsure",
            text: "글쎄... 나도 요즘 잘 가고 있는 건지 솔직히 잘 모르겠어",
            reply: "그치... 다들 겉으론 멀쩡해 보여도 속은 다 비슷한가 보다"
          }
        ],
        customReplies: {
          open: "헐 그랬구나... 너도 요즘 진짜 만만치 않았네 말 안 했으면 몰랐을 뻔했어 말해줘서 고마워",
          closed: "다행이긴 한데... 너 원래 힘든 티 잘 안 내잖아 너무 무리하진 마",
          deflect: "끝까지 내 얘기만 챙기네 진짜 ㅋㅋㅋ 알았어 다음엔 네 얘기 들어줄 거야",
          unsure: "맞아 요즘은 괜찮다 안 괜찮다 딱 잘라 말하기 애매한 밤이 많지..."
        }
      },
      {
        id: "T7",
        time: "02:41",
        role: "closing",
        friendMessages: [
          "나 이제 진짜 자볼게 오늘 안 자고 받아줘서 너무 고맙다",
          "내일 아침에 일어나서 읽게 마지막으로 한마디만 남겨주라 ㅋㅋ"
        ],
        options: [],
        defaultFallbackOptions: [
          {
            id: "T7_fb_rec",
            type: "recognition",
            text: "오늘 하루도 버티느라 진짜 고생 많았어 푹 자"
          },
          {
            id: "T7_fb_rest",
            type: "rest",
            text: "내일 걱정은 내일의 우리한테 맡기고 오늘은 기절하듯 푹 자자"
          },
          {
            id: "T7_fb_comp",
            type: "companionship",
            text: "언제든 답답하면 또 톡해 내가 항상 옆에 있을게 잘 자!"
          }
        ],
        closingReply: "응 고마워 진짜 든든하다... 너도 폰 끄고 꼭 푹 자! 잘 자"
      }
    ],

    work_burnout: [
      {
        id: "T0",
        time: "02:13",
        role: "opening",
        friendMessages: ["자냐...?", "평일 새벽에 미안 안 자면 잠깐만"],
        options: [
          {
            id: "T0_1",
            text: "안 자 ㅋㅋ 왜 무슨 일 생겼어?",
            tag: "warm_ask",
            reply: "휴 깨어 있었네... 출근해야 되는데 잠이 도저히 안 와서"
          },
          {
            id: "T0_2",
            text: "야 내일 출근 안 하냐 이 시간에 ㅋㅋㅋ",
            tag: "playful",
            reply: "ㅋㅋㅋ 출근해야 되는데 눈이 말똥말똥해서 망했어"
          },
          {
            id: "T0_3",
            text: "나도 오늘 잠 안 와서 뒤척이는 중이었어 왜 그래",
            tag: "shared_night",
            reply: "너도 못 자고 있었구나... 톡할 사람 있어서 다행이다 진짜"
          }
        ]
      },
      {
        id: "T1",
        time: "02:17",
        role: "comfort",
        topicLabel: "퇴근 후 방전",
        friendMessages: [
          "퇴근하고 집 들어오자마자 씻지도 못하고 침대에 그대로 박혀 있었어",
          "요즘 회사만 다녀오면 배터리 0퍼센트 돼서 아무것도 못 하겠어 ㅋㅋㅠ"
        ],
        options: [
          {
            id: "T1_rec",
            type: "recognition",
            text: "야 그 전쟁터에서 오늘 하루 버티고 퇴근한 것만으로도 진짜 고생 많았어",
            reply: "전쟁터 맞지 진짜... 그렇게 알아주는 사람이 너밖에 없다"
          },
          {
            id: "T1_rest",
            type: "rest",
            text: "집에서까지 애쓰지 마 이번 주엔 퇴근하면 아무것도 하지 말고 그냥 뻗어 쉬어",
            reply: "집에 와서도 자꾸 일 생각나서 못 쉬겠어 ㅋㅋㅠ 진짜 스위치 끄고 싶다"
          },
          {
            id: "T1_comp",
            type: "companionship",
            text: "잠깐 통화 켜둘까? 피곤하면 말 안 하고 숨소리만 내도 돼",
            reply: "목소리 들으면 더 잠 달아날까 봐 통화는 참을게 ㅋㅋ 근데 말이라도 진짜 고맙다"
          }
        ]
      },
      {
        id: "T2",
        time: "02:21",
        role: "comfort",
        topicLabel: "업무 실수·자책",
        friendMessages: [
          "아까 오후에 내가 자료 숫자 하나 잘못 넘겨서 분위기 싸해졌었거든",
          "누워 있는데 그 순간 표정들이 머릿속에서 안 떠나 나 왜 맨날 이 모양이지"
        ],
        options: [
          {
            id: "T2_acc",
            type: "acceptance",
            text: "사람이 일하다 보면 실수할 수도 있지 그거 하나 틀렸다고 네 가치가 깎이냐",
            reply: "회사에선 큰일 난 것처럼 구니까 내가 죄인 된 기분이었거든... 고맙다"
          },
          {
            id: "T2_emp",
            type: "empathy",
            text: "아 그거 진짜 피 말리지... 퇴근하고 지금까지 혼자 계속 곱씹느라 마음 안 좋았겠다",
            reply: "응 밥 먹는데도 체할 것 같고 계속 심장 쿵쾅거렸어 ㅠ"
          },
          {
            id: "T2_sol",
            type: "solution",
            text: "이미 넘어간 건 어쩔 수 없지 내일 아침 출근해서 수습할 멘트만 딱 정리해보자",
            reply: "맞아 차라리 내일 어떻게 말할지 한 줄 적어두는 게 덜 불안하겠다"
          }
        ]
      },
      {
        id: "T3",
        time: "02:25",
        role: "comfort",
        topicLabel: "커리어 정체감",
        friendMessages: [
          "딴 애들은 다 일도 척척 해내고 자리 잡아가는 거 같은데",
          "나만 연차 차도 맨날 똑같은 데서 헤매고 제자리인 기분이야"
        ],
        options: [
          {
            id: "T3_rec",
            type: "recognition",
            text: "네가 처음 들어갔을 때랑 지금이랑 얼마나 달라졌는데 해온 걸 왜 네가 깎아내려",
            reply: "나 스스로는 맨날 부족한 것만 보였는데... 네가 그렇게 말해주니까 찡하네"
          },
          {
            id: "T3_acc",
            type: "acceptance",
            text: "꼭 완벽한 일잘러여야만 돼? 난 허둥대도 성실하게 버티는 지금의 너도 좋은데",
            reply: "아... 새벽에 그런 말 들으니까 갑자기 눈물 날라 그래 ㅋㅋㅠ"
          },
          {
            id: "T3_sol",
            type: "solution",
            text: "밤에 남들이랑 비교 시작하면 답 없어 일단 메신저 알림 끄고 주말에 뭐 할지만 생각하자",
            reply: "맞아 회사 단톡방 알림부터 일단 무음 걸어놔야겠다 휴"
          }
        ]
      },
      {
        id: "T4",
        time: "02:29",
        role: "pushback",
        friendMessages: [
          "위로해줘서 진짜 고마운데...",
          "솔직히 내일 아침 눈 뜨면 똑같이 출근해야 되니까 답이 안 보이긴 해 ㅋㅋ"
        ],
        options: [
          {
            id: "T4_back",
            reactionType: "step_back",
            text: "그치 당장 내일 출근하는 건 너니까 내 말이 뜬구름 같았겠다 미안",
            reply: "아니야 내가 괜히 찬물 끼얹듯 말했네 미안해 ㅠ"
          },
          {
            id: "T4_listen",
            reactionType: "listen",
            text: "답 안 내도 돼 그냥 회사 욕이든 뭐든 속 풀릴 때까지 더 해 다 들어줄게",
            reply: "그냥 욕이나 더 하라는 말 왜 이렇게 속 시원하냐 ㅋㅋ 고마워"
          },
          {
            id: "T4_reassure",
            reactionType: "reassure",
            text: "출근을 대신 해줄 순 없어도 네 편 들어주는 이 말만큼은 진짜 진심이야",
            reply: "...알지 네가 내 편인 거 아니까 이 시간에 톡했지"
          }
        ]
      },
      {
        id: "T5",
        time: "02:33",
        role: "comfort",
        topicLabel: "미안함·눈치",
        friendMessages: [
          "아니다 시계 보니까 벌써 두 시 반 넘었네",
          "너도 내일 피곤할 텐데 내가 붙잡고 늘어져서 미안해"
        ],
        options: [
          {
            id: "T5_rest",
            type: "rest",
            text: "미안해하지 말고 얼른 알람 맞춰놓고 눈 감아 오늘은 진짜 푹 자야 돼",
            reply: "응 이제 진짜 충전기 꽂아놓고 눈 감아볼게..."
          },
          {
            id: "T5_comp",
            type: "companionship",
            text: "피곤하긴 뭐가 피곤해 회사 땜에 숨 막히면 언제든 톡해 내가 옆에 있잖아",
            reply: "진짜 너 있어서 버틴다 내가... 고마워"
          },
          {
            id: "T5_emp",
            type: "empathy",
            text: "오늘 얼마나 서럽고 답답했으면 이 시간까지 못 자고 연락했겠어 미안해하지 마",
            reply: "...딱 들켰네 사실 이불 뒤집어쓰고 한참 고민하다 보낸 거야"
          }
        ]
      },
      {
        id: "T6",
        time: "02:37",
        role: "receiving",
        friendMessages: [
          "근데 진짜 내 회사 한탄만 잔뜩 했네 ㅋㅋ",
          "넌 요즘 어때? 일이나 일상은 좀 괜찮아?"
        ],
        options: [
          {
            id: "T6_closed",
            receivingType: "closed",
            text: "나야 뭐 별일 없이 똑같이 잘 굴러가지 ㅋㅋ",
            reply: "너 맨날 별일 없다고만 하더라... 속으로 삭이지 좀 마"
          },
          {
            id: "T6_deflect",
            receivingType: "deflect",
            text: "내 얘긴 됐고 너 내일 몇 시 기상이야 속은 좀 가라앉았어?",
            reply: "또 내 컨디션부터 챙기네 ㅋㅋㅋ 응 아까보단 한결 가벼워졌어"
          },
          {
            id: "T6_unsure",
            receivingType: "unsure",
            text: "글쎄... 나도 요즘 그냥 정신없이 보내서 괜찮은 건지 잘 모르겠어",
            reply: "맞아 하루하루 쳐내다 보면 내 기분이 뭔지도 모르고 지나가지..."
          }
        ],
        customReplies: {
          open: "헐 너도 요즘 그렇게 치이고 있었구나... 말 안 했으면 전혀 몰랐어 털어놔줘서 고마워",
          closed: "무소식이 희소식이긴 한데... 너도 지치면 꼭 티 내라 혼자 참지 말고",
          deflect: "아니 왜 맨날 네 얘기는 패스하냐고 ㅋㅋㅋ 다음엔 네 한탄 내가 다 들어줄 거야",
          unsure: "그치 요즘은 잘 지내는 건지 버티는 건지 경계가 참 모호한 거 같아..."
        }
      },
      {
        id: "T7",
        time: "02:41",
        role: "closing",
        friendMessages: [
          "이제 진짜 자야지 내일 지각 면하려면 ㅋㅋ 오늘 받아줘서 고마워",
          "출근길 지하철에서 보고 힘내게 한마디만 남겨주라!"
        ],
        options: [],
        defaultFallbackOptions: [
          {
            id: "T7_fb_rec",
            type: "recognition",
            text: "오늘도 몫 다 해내느라 정말 애썼어 내일도 무사히만 다녀와 잘 자!"
          },
          {
            id: "T7_fb_rest",
            type: "rest",
            text: "회사 생각은 현관 밖에 버려두고 지금부터는 무조건 푹 자자"
          },
          {
            id: "T7_fb_comp",
            type: "companionship",
            text: "내일 힘들면 점심시간에 또 톡해 내가 대기하고 있을게 잘 자!"
          }
        ],
        closingReply: "응 내일 출근길에 이거 보고 버틸게 ㅋㅋ 고마워 너도 꼭 푹 자!"
      }
    ],

    relationship: [
      {
        id: "T0",
        time: "02:13",
        role: "opening",
        friendMessages: ["자냐...?", "안 자면 잠깐만 나 좀 말려주라"],
        options: [
          {
            id: "T0_1",
            text: "안 자 ㅋㅋ 왜 누구랑 무슨 일 있었어?",
            tag: "warm_ask",
            reply: "깨어 있었구나 다행이다... 집 와서 누웠는데 머리가 복잡해서"
          },
          {
            id: "T0_2",
            text: "뭔데 새벽 두 시에 뭘 말려 ㅋㅋㅋ",
            tag: "playful",
            reply: "ㅋㅋㅋ 아니 생각 꼬리에 꼬리를 물어서 잠이 안 와"
          },
          {
            id: "T0_3",
            text: "나도 안 자고 있었어 천천히 말해봐",
            tag: "shared_night",
            reply: "안 자고 있었다니 다행이다... 혼자 생각하니까 답이 안 나와서"
          }
        ]
      },
      {
        id: "T1",
        time: "02:17",
        role: "comfort",
        topicLabel: "관계 피로·허무함",
        friendMessages: [
          "오늘 저녁에 애들 만나고 들어왔는데 현관문 닫자마자 기 다 빨려서 주저앉았어",
          "분명 웃으면서 놀다 왔는데 집 오니까 왜 이렇게 허무하고 지치냐 ㅋㅋㅠ"
        ],
        options: [
          {
            id: "T1_rec",
            type: "recognition",
            text: "네가 자리 안 어색하게 하려고 오늘도 옆에서 엄청 신경 쓰고 배려했겠지 애썼어 진짜",
            reply: "헐 안 그래도 오늘 내내 분위기 맞추느라 진 다 뺐거든... 어떻게 알았냐"
          },
          {
            id: "T1_rest",
            type: "rest",
            text: "사람 기 빨린 날엔 아무 생각 하지 마 당분간 약속 잡지 말고 혼자 편하게 쉬어",
            reply: "진짜 이번 달은 약속 다 무르고 방콕만 하고 싶다 ㅠ"
          },
          {
            id: "T1_comp",
            type: "companionship",
            text: "기 빨릴 땐 안 꾸며도 되는 사람이랑 있어야지 심심하면 전화 걸어 말 안 해도 돼",
            reply: "너랑은 기 안 빨려서 이 시간에 톡했지 ㅋㅋ 고맙다 진짜"
          }
        ]
      },
      {
        id: "T2",
        time: "02:21",
        role: "comfort",
        topicLabel: "말실수·후회",
        friendMessages: [
          "게다가 아까 분위기 띄우려다 내가 선 넘은 농담 한 거 같아서 계속 찝찝해",
          "서운한 티도 못 내면서 이상한 데서 오바하고 나 왜 맨날 인간관계가 이 모양이지"
        ],
        options: [
          {
            id: "T2_acc",
            type: "acceptance",
            text: "말 좀 어색하게 나왔으면 어때 어설프면 어설픈 대로 난 네가 좋은 사람인 거 다 알아",
            reply: "집 와서 이불킥 백 번 했는데... 그렇게 말해주니까 좀 살겠다"
          },
          {
            id: "T2_emp",
            type: "empathy",
            text: "분위기 챙기려다 그런 건데 집 오는 내내 혼자 신경 쓰여서 마음 엄청 무거웠겠다",
            reply: "응 지하철 타서부터 지금까지 그 장면만 무한 재생 중이었어 ㅠ"
          },
          {
            id: "T2_sol",
            type: "solution",
            text: "너무 혼자 넘겨짚지 말고 내일 가볍게 잘 들어갔냐고 카톡 하나 보내서 분위기 확인해보자",
            reply: "맞아 혼자 소설 쓰는 것보단 내일 낮에 짧게 톡 하나 해보는 게 낫겠지?"
          }
        ]
      },
      {
        id: "T3",
        time: "02:25",
        role: "comfort",
        topicLabel: "관계의 비대칭",
        friendMessages: [
          "딴 애들은 다들 계산 안 하고도 편하게 지내는 단짝들이 있는 거 같은데",
          "왜 나만 늘 먼저 연락하고 눈치 보면서 관계를 붙잡고 있는 기분일까"
        ],
        options: [
          {
            id: "T3_rec",
            type: "recognition",
            text: "그게 네가 그만큼 사람을 소중히 대하고 마음을 깊게 쓸 줄 아는 사람이라는 증거야",
            reply: "맨날 나만 호구 같다고 생각했는데... 그렇게 말해줘서 진짜 고맙다"
          },
          {
            id: "T3_acc",
            type: "acceptance",
            text: "적어도 나한테는 눈치 안 보고 먼저 안 챙겨도 돼 난 그냥 지금 그대로의 네가 편해",
            reply: "아 진심 그 말 반칙이다... 새벽에 울컥하네 ㅋㅋㅠ"
          },
          {
            id: "T3_sol",
            type: "solution",
            text: "너만 일방적으로 애쓰는 관계면 이번엔 네가 먼저 연락하지 말고 한 템포 거리를 둬보자",
            reply: "맞아 나만 계속 안달복달할 필요 없는데... 이번엔 좀 가만히 있어볼까 봐"
          }
        ]
      },
      {
        id: "T4",
        time: "02:29",
        role: "pushback",
        friendMessages: [
          "고마운데...",
          "솔직히 나도 머리로는 알면서 막상 사람 앞에 가면 똑같이 눈치 볼 거 같아서 답답해 ㅋㅋ"
        ],
        options: [
          {
            id: "T4_back",
            reactionType: "step_back",
            text: "그치 오랜 습관이 말 한마디로 안 바뀌지 내가 너무 쉽게 말했네 미안",
            reply: "아니야 내가 답답해서 괜히 투정 부렸어 미안해 ㅠ"
          },
          {
            id: "T4_listen",
            reactionType: "listen",
            text: "당장 안 바뀌어도 괜찮아 그냥 오늘 서운했던 거 나한테 다 풀고 자 더 말해봐",
            reply: "그냥 다 풀고 자라는 말이 제일 위로 된다 고마워..."
          },
          {
            id: "T4_reassure",
            reactionType: "reassure",
            text: "밖에서 눈치 백 번 봐도 나랑 있을 때만 편하면 돼 난 진심으로 네 편이야",
            reply: "...응 네가 내 편인 건 진짜 의심 안 해 고맙다"
          }
        ]
      },
      {
        id: "T5",
        time: "02:33",
        role: "comfort",
        topicLabel: "미안함·눈치",
        friendMessages: [
          "하 봐봐 나 지금 너한테도 미안해서 또 눈치 보잖아 ㅋㅋ",
          "새벽에 감정 쓰레기통 만든 거 같아서 미안해 피곤하지"
        ],
        options: [
          {
            id: "T5_rest",
            type: "rest",
            text: "쓰레기통은 무슨 ㅋㅋ 내 눈치까지 보지 말고 오늘은 폰 엎어두고 푹 자",
            reply: "ㅋㅋㅋ 알았어 오늘만큼은 눈치 끄고 그냥 자볼게"
          },
          {
            id: "T5_comp",
            type: "companionship",
            text: "우리가 남이냐 난 네가 속앓이 안 하고 나 찾아주는 게 제일 좋아 언제든 톡해",
            reply: "진짜 내 인생에 너 하나 있는 걸로 다 보상받는 기분이다..."
          },
          {
            id: "T5_emp",
            type: "empathy",
            text: "사람한테 치여서 온 날 나한테 말 꺼내기까지도 얼마나 망설였겠어 전혀 안 미안해도 돼",
            reply: "...맞아 사실 너한테도 부담 줄까 봐 채팅방 열었다 닫았다 했어"
          }
        ]
      },
      {
        id: "T6",
        time: "02:37",
        role: "receiving",
        friendMessages: [
          "근데 진짜 내 인간관계 하소연만 한 시간 했네 ㅋㅋ",
          "넌 요즘 어때? 주변 사람들이나 마음은 좀 괜찮아?"
        ],
        options: [
          {
            id: "T6_closed",
            receivingType: "closed",
            text: "나야 뭐 무난하게 잘 지내지 신경 안 써도 돼 ㅋㅋ",
            reply: "넌 진짜 힘든 내색을 안 하더라... 내 앞에서는 안 참아도 되는데"
          },
          {
            id: "T6_deflect",
            receivingType: "deflect",
            text: "나는 괜찮고 너 아까 찝찝했다던 마음은 좀 가라앉았어?",
            reply: "또 기어이 내 기분부터 확인하네 ㅋㅋ 응 너랑 떠들고 나니까 많이 풀렸어"
          },
          {
            id: "T6_unsure",
            receivingType: "unsure",
            text: "글쎄... 나도 요즘 사람 대하는 게 맞나 싶고 잘 모르겠어",
            reply: "그치... 나이 들수록 관계가 쉬워지는 게 아니라 더 어려운 거 같아"
          }
        ],
        customReplies: {
          open: "그랬구나... 너도 요즘 사람이나 마음 땜에 쉽지 않았네 나한테 말해줘서 고마워",
          closed: "잘 지낸다니 다행이긴 한데... 너도 서운하거나 지칠 때 혼자 삼키지 마",
          deflect: "맨날 내 얘기만 방패 삼아서 넘기지 ㅋㅋ 다음엔 내가 네 얘기 끝까지 들을 거야",
          unsure: "맞아 괜찮다고 하기엔 어딘가 걸리고 힘들다고 하기엔 애매한 밤이 많지..."
        }
      },
      {
        id: "T7",
        time: "02:41",
        role: "closing",
        friendMessages: [
          "이제 진짜 눈 감아볼게 오늘 끝까지 들어줘서 너무 고맙다",
          "자기 전에 마음 놓이게 한마디만 해줄래? ㅋㅋ"
        ],
        options: [],
        defaultFallbackOptions: [
          {
            id: "T7_fb_rec",
            type: "recognition",
            text: "오늘도 사람들 사이에서 애쓰느라 고생 많았어 내 눈엔 네가 제일 괜찮은 사람이야 잘 자"
          },
          {
            id: "T7_fb_rest",
            type: "rest",
            text: "오늘 밤엔 누구 눈치도 보지 말고 네 방에서 제일 편하게 푹 자자"
          },
          {
            id: "T7_fb_comp",
            type: "companionship",
            text: "혼자라고 느껴질 때 언제든 불러 내가 늘 여기 있을게 잘 자!"
          }
        ],
        closingReply: "응 오늘 진짜 따뜻하게 잔다 고마워... 너도 꼭 좋은 꿈 꿔! 잘 자"
      }
    ]
  };

  // 하위 호환용 기본 TURNS 참조 (campus_job)
  const TURNS = SCENARIOS[SITE_META.defaultScenarioId];

  const RESULT_UI_TEXT = {
    bridgeTemplate:
      "{friendTopic} 이제 잠들었어요. 그런데 오늘 새벽 건넨 말들을 가만히 들여다보면, 정작 당신이 오래 미뤄둔 마음의 단서가 남아 있어요.",
    sharedBannerText:
      "공유 링크로 열람 중인 유형 안내예요. 직접 새벽 카톡 대화를 나누면 내 답장 패턴과 문장으로 정밀 분석을 받아볼 수 있어요.",
    sharedStartBtn: "나도 새벽 카톡 답장해 보기",
    returnedEyebrow: "01 · 오늘 내가 건넨 말에서 돌아온 문장",
    readAloudPrompt: "오늘 밤엔 이 문장을 남이 아닌 스스로에게 소리 내어 읽어주세요.",
    returnedSourceCustom: "내가 직접 쳐서 보낸 카톡",
    returnedSourceEdited: "보기를 내 말투로 고쳐 보낸 카톡",
    returnedSourceChoice: "대화 중 내가 골라 건넨 카톡",

    typeEyebrow: "02 · 주된 위로 기제와 숨은 욕구 분석",
    neededHeadlineLabel: "오늘 당신에게도 필요했을지 모를 말",
    metaphorLabel: "비유로 본 내면의 결",
    strengthLabel: "관계 속에서 빛나는 강점",
    blindSpotLabel: "나 자신에게 작동하는 맹점",
    burnoutLabel: "에너지가 쉽게 새어나가는 순간",

    spectrumEyebrow: "03 · 6가지 위로 스펙트럼 분포 & 조합 분석",
    spectrumSubcopy:
      "대화 전반에서 감지된 6가지 위로 언어의 상대적 비중과 주·부 유형의 결합 방식이에요.",

    turnAnalysisEyebrow: "04 · 대화 국면별 4단계 심리·반응 해부",
    turnAnalysisSubcopy:
      "첫 알림을 열었을 때부터 ‘넌 요즘 어때?’라는 되물음까지, 결정적 네 장면에서 드러난 대화 패턴이에요.",

    metricsEyebrow: "05 · 카톡 언어·행동 정밀 데이터",
    metricsSubcopy:
      "답장 길이, 전송 전 수정 흔적, 직접 입력 비율, 감정 완충 표지로 살펴본 나의 새벽 대화 습관이에요.",

    feedbackHeading: "이 분석과 문장이 오늘 내 마음에 닿나요?",
    feedbackYesBtn: "꽤 정확한 것 같아요",
    feedbackOtherBtn: "다른 문장이 더 와닿아요",
    feedbackThanksYes:
      "응답을 기록했어요. 오늘 밤엔 남에게 주던 온도를 내 몫으로 남겨두세요.",
    feedbackPickerGuide:
      "지금 내 마음에 가장 필요한 문장을 직접 골라보세요. 선택한 유형에 맞춰 상단 심층 해설도 함께 전환돼요.",
    feedbackChangedNotice: "내가 직접 선택한 문장 기준으로 해설을 다시 맞췄어요.",

    quadrantEyebrow: "06 · 온도의 좌표 (건넴과 받음의 비대칭 분석)",
    quadrantSubcopy:
      "위로를 건네는 방향(가로축)과 내 이야기를 꺼내는 개방성(세로축)이 만나는 관계적 위치예요. (근거 없는 온도 수치는 표시하지 않아요)",
    axisTop: "받는 힘이 열림 (자기 개방 · 머무름)",
    axisBottom: "받는 힘이 닫힘 (괜찮음 방어 · 화제 전환)",
    axisLeft: "곁에 머무는 말",
    axisRight: "일으켜 주는 말",
    careTipsHeading: "오늘 밤 균형을 회복하는 작은 연습",

    myMessagesSummary: "내가 보낸 새벽 카톡 원문 전체 보기",
    shareLinkBtn: "분석 유형 링크 복사",
    shareLinkCopied: "유형 코드만 담긴 링크를 복사했어요 (대화 원문·친구 이름 미포함)",
    restartBtn: "다른 상황으로 다시 대화하기",
    eraseBtn: "내 대화 기록 지우기",
    eraseConfirm: "이 기기에 저장된 대화 기록과 분석 결과를 모두 지울까요?",
    erasedNotice: "이 기기에 저장된 대화 기록을 모두 지웠어요.",
    disclaimerTitle: "안내 및 도움받을 곳",
    disclaimerItems: [
      "‘남에게 건네는 위로가 내가 듣고 싶은 말’이라는 관점은 확정된 의학적 진단이 아닌 자기 성찰용 심리 가설입니다. 친구의 상황에 맞춰 그 말을 골랐을 수도 있습니다.",
      "이 사이트는 임상 진단 도구가 아니며, 입력한 대화 원문과 수정 횟수는 외부 서버로 전송되지 않고 브라우저 안에서만 분석됩니다.",
      "마음이 오래 무겁거나 혼자 감당하기 버거운 밤이라면 전문가와 이야기해 보세요. 자살예방 상담전화 109 · 정신건강 위기상담 1577-0199 (24시간)"
    ]
  };

  const exported = {
    SITE_META: SITE_META,
    NAME_STEP_TEXT: NAME_STEP_TEXT,
    SCENARIO_LIST: SCENARIO_LIST,
    SCENARIOS: SCENARIOS,
    CHAT_UI_TEXT: CHAT_UI_TEXT,
    CLARIFY_UI_TEXT: CLARIFY_UI_TEXT,
    CRISIS_MODAL_TEXT: CRISIS_MODAL_TEXT,
    COMFORT_TYPES: COMFORT_TYPES,
    TYPE_ORDER: TYPE_ORDER,
    QUADRANTS: QUADRANTS,
    CUSTOM_REACTION_POOL: CUSTOM_REACTION_POOL,
    TURNS: TURNS,
    RESULT_UI_TEXT: RESULT_UI_TEXT
  };

  root.WC_SCRIPT = exported;

  if (typeof module !== "undefined" && module.exports) {
    module.exports = exported;
  }
})(typeof window !== "undefined" ? window : globalThis);
