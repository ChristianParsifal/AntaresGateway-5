/* 完全在浏览器执行的交互示例，不发起网络请求。 */
function labView() {
  return `<div class="columns"><section class="panel"><div class="panel-head"><div><h2>路由与故障回退</h2><p>选择主模型状态，观察模拟路由决策。</p></div></div><form id="routeLab" style="display:grid;gap:12px"><label>主模型状态<select name="status"><option value="ok">可用</option><option value="down">模拟故障</option></select></label><button class="btn primary">运行路由模拟</button></form><p id="routeResult" role="status" class="muted">等待运行。</p></section><section class="panel"><div class="panel-head"><div><h2>成本估算</h2><p>使用示例单价进行本地算术计算。</p></div></div><form id="costLab" style="display:grid;gap:12px"><label>输入 token 数<input type="number" name="input" value="10000" min="0" max="100000000" required></label><label>输出 token 数<input type="number" name="output" value="2000" min="0" max="100000000" required></label><button class="btn primary">计算估算费用</button></form><p id="costResult" role="status" class="muted">示例单价：输入 $2.50 / 百万，输出 $10 / 百万。</p></section></div><section class="panel"><div class="panel-head"><div><h2>上下文清理示例</h2><p>仅合并多余空白并去除重复行，用于说明压缩前后对比，不代表正式压缩引擎。</p></div></div><form id="compressionLab" style="display:grid;gap:12px"><label>示例文本<textarea name="text" rows="5" maxlength="10000" style="display:block;width:100%">请分析这段文本。\n请分析这段文本。\n    生成一份简洁摘要。</textarea></label><button class="btn primary" style="justify-self:start">运行清理示例</button></form><p id="compressionSummary" role="status" class="muted">等待运行。</p><pre id="compressionResult" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></section>`;
}
function initLab() {
  document.addEventListener("submit", event => {
    const form = event.target;
    if (!["routeLab", "costLab", "compressionLab"].includes(form.id)) return;
    event.preventDefault();
    const fields = new FormData(form);
    if (form.id === "routeLab") {
      document.querySelector("#routeResult").textContent = fields.get("status") === "ok" ? "模拟结果：主模型 gpt-4o 可用，请求发往主模型。" : "模拟结果：主模型故障，已选择备用模型 claude-sonnet。";
    } else if (form.id === "costLab") {
      const input = Number(fields.get("input")), output = Number(fields.get("output"));
      if (!Number.isFinite(input) || !Number.isFinite(output) || input < 0 || output < 0 || input > 100000000 || output > 100000000) { document.querySelector("#costResult").textContent = "请输入 0 至 100,000,000 之间的 token 数。"; return; }
      document.querySelector("#costResult").textContent = `模拟估算：$${((input * 2.5 + output * 10) / 1000000).toFixed(6)}（示例价格，非实时账单）。`;
    } else {
      const original = String(fields.get("text"));
      const lines = original.split(/\r?\n/).map(line => line.trim().replace(/\s+/g, " ")).filter(Boolean);
      const cleaned = [...new Set(lines)].join("\n");
      document.querySelector("#compressionSummary").textContent = `示例字符数：${original.length} → ${cleaned.length}；去除 ${lines.length - new Set(lines).size} 行重复内容。`;
      document.querySelector("#compressionResult").textContent = cleaned;
    }
  });
}
