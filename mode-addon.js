/* Office Animal Test: self / leader prediction mode add-on */
(function () {
  "use strict";

  const SELF_MODE = "self";
  const LEADER_MODE = "leader_prediction";
  window.testMode = new URLSearchParams(window.location.search).get("mode") || SELF_MODE;

  const originalStartTest = window.startTest;
  const originalRenderResult = window.renderResult;
  const originalSaveShareCard = window.saveShareCard;

  function predictionLabel() {
    return window.participantName
      ? window.participantName + "님의 예측 결과"
      : "리더 유형 예측 결과";
  }

  function installButtons() {
    const start = document.getElementById("start");
    if (!start || document.getElementById("testModeButtons")) return;

    const oldButton = Array.from(start.querySelectorAll("button")).find(function (button) {
      return button.textContent.includes("테스트 시작하기");
    });
    if (!oldButton) return;

    const holder = document.createElement("div");
    holder.id = "testModeButtons";
    holder.style.cssText = "display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;max-width:560px;margin:0 auto";

    const selfButton = document.createElement("button");
    selfButton.type = "button";
    selfButton.className = "btn primary";
    selfButton.style.width = "100%";
    selfButton.textContent = "나의 유형 알아보기";
    selfButton.onclick = function () { window.startTest(SELF_MODE); };

    const leaderButton = document.createElement("button");
    leaderButton.type = "button";
    leaderButton.className = "btn ghost";
    leaderButton.style.width = "100%";
    leaderButton.textContent = "리더 유형 예측하기";
    leaderButton.onclick = function () { window.startTest(LEADER_MODE); };

    holder.append(selfButton, leaderButton);
    oldButton.replaceWith(holder);

    const style = document.createElement("style");
    style.textContent = "@media(max-width:560px){#testModeButtons{grid-template-columns:1fr!important}}";
    document.head.appendChild(style);
  }

  window.startTest = function (mode) {
  window.testMode = mode || SELF_MODE;

  let enteredName = "";

  if (window.testMode === LEADER_MODE) {
    enteredName = window.prompt(
      "업무 성향을 예측해보고 싶은 리더의 성함을 입력해주세요.\n\n" +
      "※ 재미로 참여하는 예측 콘텐츠입니다. 익명 절대 보장!!\n" +
      "※ 참여 결과는 추후 '직원들이 예측한 리더 성향' 게시물로 공유될 수 있습니다.",
      ""
    );
  } else {
    enteredName = window.prompt(
      "결과에 표시될 이름을 입력해주세요.\n\n" +
      "(닉네임 가능)\n" +
      "※ 🎁 결과 공유 이벤트 참여 시 실명 입력 권장",
      ""
    );
  }

  /*
    취소 버튼을 누른 경우 테스트를 시작하지 않습니다.
  */
  if (enteredName === null) {
    return;
  }

  enteredName = enteredName.trim();

  /*
    입력값이 비어 있으면 테스트를 시작하지 않습니다.
  */
  if (!enteredName) {
    alert(
      window.testMode === LEADER_MODE
        ? "예측할 리더의 성함을 입력해주세요."
        : "결과에 표시할 이름을 입력해주세요."
    );

    return;
  }

  /*
    입력한 이름을 결과, 공유 링크,
    PNG 카드 및 Supabase 저장에 사용합니다.
  */
  window.participantName =
    enteredName.slice(0, 20);

  /*
    테스트 상태를 초기화합니다.
  */
  idx = 0;
  answers = [];
  resultSaved = false;

  /*
    이전 결과 주소를 제거합니다.
  */
  window.history.replaceState(
    {},
    "",
    window.location.origin +
      window.location.pathname
  );

  /*
    두 번째 팝업 없이 바로 퀴즈를 시작합니다.
  */
  show("quiz");
  renderQ();
};
  window.renderResult = function (type, scores, sharedResult) {
    originalRenderResult(type, scores, sharedResult);

    if (window.testMode === LEADER_MODE) {
      const owner = document.querySelector("#resultBody .result-owner");
      if (owner) owner.textContent = predictionLabel();
    }
  };

  window.finish = function () {
    const scores = { E:0, I:0, N:0, S:0, T:0, F:0, J:0, P:0 };
    DATA.questions.forEach(function (q, i) {
      scores[answers[i] === "a" ? q.av : q.bv]++;
    });

    const tie = {
      EI: answers[3] === "a" ? "E" : "I",
      NS: answers[7] === "a" ? "N" : "S",
      TF: answers[11] === "a" ? "F" : "T",
      JP: answers[15] === "a" ? "P" : "J"
    };

    function pick(a, b, axis) {
      return scores[a] === scores[b] ? tie[axis] : (scores[a] > scores[b] ? a : b);
    }

    const type =
      pick("E", "I", "EI") +
      pick("N", "S", "NS") +
      pick("T", "F", "TF") +
      pick("J", "P", "JP");

    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("type", type);
    url.searchParams.set("mode", window.testMode);
    if (window.participantName) {
      url.searchParams.set("name", window.participantName);
    }
    window.history.replaceState({}, "", url.toString());

    window.renderResult(type, scores, false);
    show("result");
    saveResultWithMode(type);
  };

  async function saveResultWithMode(type) {
    if (resultSaved) return;
    const result = DATA.results[type];
    if (!result) return;

    const payload = {
      name: window.participantName || null,
      mbti: type,
      animal: result.name,
      test_mode: window.testMode
    };

    try {
      const response = await fetch(SUPABASE_URL + "/rest/v1/responses", {
        method: "POST",
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: "Bearer " + SUPABASE_KEY,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(await response.text());
      resultSaved = true;
      console.log("유형과 테스트 모드가 저장되었습니다:", payload);
    } catch (error) {
      console.error("결과 저장 중 오류:", error);
    }
  }

  window.shareResult = async function (type) {
    const url = new URL(window.location.origin + window.location.pathname);
    url.searchParams.set("type", type);
    url.searchParams.set("mode", window.testMode);
    if (window.participantName) {
      url.searchParams.set("name", window.participantName);
    }

    try {
      await navigator.clipboard.writeText(url.toString());
      alert("결과 공유 링크를 복사했어요!");
    } catch (error) {
      prompt("아래 결과 링크를 복사하세요.", url.toString());
    }
  };

  window.saveShareCard = async function (type) {
    const observer = new MutationObserver(function () {
      if (window.testMode !== LEADER_MODE) return;
      const owner = document.querySelector("#shareCardStage .share-card-owner");
      if (owner) owner.textContent = predictionLabel();
    });

    observer.observe(document.body, { childList:true, subtree:true });
    try {
      await originalSaveShareCard(type);
    } finally {
      observer.disconnect();
    }
  };

  function applySharedMode() {
    const params = new URLSearchParams(window.location.search);
    window.testMode = params.get("mode") || SELF_MODE;

    /* result-sharing.js가 먼저 URL의 name을 읽어 window.participantName에 저장합니다. */
    if (window.testMode === LEADER_MODE) {
      const owner = document.querySelector("#resultBody .result-owner");
      if (owner) owner.textContent = predictionLabel();
    }
  }

  installButtons();
  applySharedMode();
})();
