/* 独立演示流程：所有结果均为模拟，数据保存在演示存储中。 */
const SCENARIO_STEPS = ["选择提供商", "配置路由", "创建密钥", "设置预算", "模拟请求"];
function scenarioState() {
  if (!data._scenario || typeof data._scenario !== "object") {
    data._scenario = { step: 0, provider: "OpenAI", model: "gpt-4o", route: "智能默认路由", keyName: "演示应用", budget: "100", calls: 0 };
  }
  return data._scenario;
}
function scenarioView() {
  const s = scenarioState();
  const fields = [
    `<label>示例提供商<select name="provider"><option ${s.provider === "OpenAI" ? "selected" : ""}>OpenAI</option><option ${s.provider === "Anthropic" ? "selected" : ""}>Anthropic</option><option ${s.provider === "Gemini" ? "selected" : ""}>Gemini</option></select></label><label>示例模型<select name="model"><option ${s.model === "gpt-4o" ? "selected" : ""}>gpt-4o</option><option ${s.model === "claude-sonnet" ? "selected" : ""}>claude-sonnet</option><option ${s.model === "gemini-flash" ? "selected" : ""}>gemini-flash</option></select></label>`,
    `<label>组合名称<input name="route" maxlength="80" required value="${esc(s.route)}"></label><label>路由策略<select name="strategy"><option>优先级回退</option><option>轮询</option><option>成本优先</option></select></label>`,
    `<label>密钥名称<input name="keyName" maxlength="80" required value="${esc(s.keyName)}"></label><p class="muted">系统将生成不可使用的示例标识，不会生成真实密钥。</p>`,
    `<label>每月预算（美元）<input name="budget" type="number" min="1" max="100000" required value="${esc(s.budget)}"></label><p class="muted">仅用于演示预算显示，不产生费用。</p>`,
    `<p>模拟一次通过 <strong>${esc(s.route)}</strong> 到 <strong>${esc(s.provider)} / ${esc(s.model)}</strong> 的请求。</p><p class="muted">示例标识：sk-demo-••••••48 · 预算：$${esc(s.budget)}/月</p>${s.calls ? `<div class="feature"><strong>模拟结果：成功</strong><p>状态 200 · 耗时 1.24 秒 · 1,024 tokens · $0.006</p><p>这是预设结果，未发送网络请求。已运行 ${s.calls} 次。</p></div>` : ""}`
  ];
  const steps = SCENARIO_STEPS.map((name, i) => `<span class="badge ${i === s.step ? "" : "warn"}">${i + 1}. ${name}${i < s.step ? " ✓" : ""}</span>`).join(" ");
  return `<section class="panel"><div class="panel-head"><div><h2>从配置到请求</h2><p>五步体验典型流程；每一步均为本地模拟。</p></div></div><div class="actions">${steps}</div><form id="scenarioForm" style="max-width:540px;margin-top:24px;display:grid;gap:16px">${fields[s.step]}<div class="actions">${s.step ? '<button type="button" class="btn" id="scenarioBack">上一步</button>' : ''}<button class="btn primary">${s.step === 4 ? "运行模拟请求" : "保存并继续"}</button></div></form></section><section class="panel"><h2>当前模拟配置</h2><p class="muted">提供商：${esc(s.provider)} · 模型：${esc(s.model)} · 路由：${esc(s.route)} · 每月预算：$${esc(s.budget)}</p><p class="muted">保存后的示例可在对应的分类列表中查看；各项统计数字是独立预设值。</p></section>`;
}
function initScenario() {
  document.addEventListener("click", (event) => {
    if (event.target.closest("#scenarioBack")) {
      const s = scenarioState(); s.step = Math.max(0, s.step - 1); save(); render();
    }
  });
  document.addEventListener("submit", (event) => {
    if (event.target.id !== "scenarioForm") return;
    event.preventDefault();
    const s = scenarioState(); const fields = new FormData(event.target);
    const addOrUpdate = (section, marker, row) => {
      if (!Array.isArray(data[section])) {
        const id = section.startsWith('module:') ? section.slice(7) : null;
        data[section] = structuredClone(id ? (window.DEMO_FIXTURES[id] || []) : (initial[section] || []));
      }
      data[section] = data[section].filter(item => !item[1].includes(marker));
      data[section].push(row);
    };
    if (s.step === 0) {
      const provider = String(fields.get("provider")); const model = String(fields.get("model"));
      if ({ OpenAI: "gpt-4o", Anthropic: "claude-sonnet", Gemini: "gemini-flash" }[provider] !== model) { notice("请选择对应提供商的示例模型"); return; }
      s.provider = provider; s.model = model;
      addOrUpdate("providers", "流程示例连接", [s.provider + " · 流程示例", "流程示例连接 · 模型 " + s.model, "正常"]);
      addOrUpdate("module:providers", "流程示例连接", [s.provider + " · 流程示例", "流程示例连接 · 模型 " + s.model, "正常"]);
    } else if (s.step === 1) {
      s.route = String(fields.get("route")).trim(); if (!s.route) return;
      addOrUpdate("combos", "流程示例路由", [s.route, "流程示例路由 · " + String(fields.get("strategy")) + " · " + s.model, "正常"]);
      addOrUpdate("module:combos", "流程示例路由", [s.route, "流程示例路由 · " + String(fields.get("strategy")) + " · " + s.model, "正常"]);
    } else if (s.step === 2) {
      s.keyName = String(fields.get("keyName")).trim(); if (!s.keyName) return;
      addOrUpdate("endpoints", "流程示例密钥", [s.keyName, "流程示例密钥 · sk-demo-••••••48", "正常"]);
      addOrUpdate("module:api-manager", "流程示例密钥", [s.keyName, "流程示例密钥 · sk-demo-••••••48", "正常"]);
    } else if (s.step === 3) {
      const budget = Number(fields.get("budget")); if (!Number.isFinite(budget) || budget < 1 || budget > 100000) return;
      s.budget = String(budget); addOrUpdate("costs", "流程示例预算", [s.keyName, "流程示例预算 · $0.00 / $" + s.budget, "正常"]);
      addOrUpdate("module:costs-budget", "流程示例预算", [s.keyName, "流程示例预算 · $0.00 / $" + s.budget, "正常"]);
    } else {
      s.calls += 1;
      data.logs.unshift(["模拟请求 · " + s.calls, s.model + " · 1,024 tokens · $0.006 · 演示流程", "成功"]);
      if (!Array.isArray(data['module:logs'])) data['module:logs'] = structuredClone(window.DEMO_FIXTURES.logs);
      data['module:logs'].unshift(["模拟请求 · " + s.calls, s.model + " · 1,024 tokens · $0.006 · 演示流程", "成功"]);
    }
    if (s.step < 4) s.step += 1;
    save(); render(); notice(s.step === 4 && s.calls ? "模拟请求已完成" : "模拟配置已保存");
  });
}
