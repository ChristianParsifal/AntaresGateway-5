/* 模块专属操作：全部在浏览器内进行，结果均为虚构。 */
function moduleExercise(id) {
  let mode = null;
  if (/^(mcp|audit-mcp|a2a|audit-a2a|acp-agents|agent-skills|skills)$/.test(id)) mode = 'protocol';
  else if (/^(batch|batch-files)$/.test(id)) mode = 'batch';
  else if (/^(logs|logs-proxy|logs-console|logs-timeline|audit|activity|traffic-inspector)$/.test(id)) mode = 'log';
  else if (/^(health|runtime|resilience-connections|resilience-cooldowns)$/.test(id)) mode = 'health';
  else if (/^(webhooks|log-export)$/.test(id)) mode = 'delivery';
  else if (/^(memory|search-tools|analytics-search)$/.test(id)) mode = 'search';
  else if (/^(quota|costs-quota-share|costs-free-tiers)$/.test(id)) mode = 'quota';
  else if (/^(translator)$/.test(id)) mode = 'translate';
  if (!mode) return '';
  const definitions = {
    protocol: ['协议调用模拟', '选择一个示例工具并输入参数，返回预设结果。', '<label>示例工具<select name="choice"><option value="search">搜索知识库</option><option value="summarize">总结文本</option></select></label><label>参数<input name="value" maxlength="120" value="项目计划" required></label>', '模拟工具调用'],
    batch: ['批处理模拟', '每行代表一条虚构请求，输出预设处理结果。', '<label>示例请求（每行一条，最多 20 条）<textarea name="value" rows="4" maxlength="2000" required>总结需求\n生成标题\n检查格式</textarea></label>', '运行模拟批处理'],
    log: ['请求记录检索', '在内置的三条虚构请求记录中筛选。', '<label>关键字<input name="value" maxlength="100" value="gpt" placeholder="模型、状态或路径"></label>', '检索模拟记录'],
    health: ['健康检查模拟', '切换示例上游状态，观察诊断结果。', '<label>模拟状态<select name="choice"><option value="ok">正常</option><option value="timeout">超时</option><option value="rate">限流</option></select></label>', '运行模拟检查'],
    delivery: ['事件投递模拟', '选择示例事件，生成本地投递记录，不发出请求。', '<label>事件<select name="choice"><option value="request.completed">请求完成</option><option value="budget.warning">预算提醒</option></select></label>', '模拟投递'],
    search: ['知识检索模拟', '搜索内置的虚构知识片段。', '<label>关键字<input name="value" maxlength="100" value="预算" required></label>', '检索示例知识'],
    quota: ['配额计算模拟', '输入上限及已使用量，计算本地示例剩余额度。', '<label>额度上限<input name="limit" type="number" min="0" max="1000000" value="1000" required></label><label>已使用<input name="used" type="number" min="0" max="1000000" value="320" required></label>', '计算剩余额度'],
    translate: ['消息格式示例', '把输入文本包装为两种示例 JSON 格式；不调用真实转换器。', '<label>示例文本<textarea name="value" rows="3" maxlength="1000" required>你好，演示网关</textarea></label><label>格式<select name="choice"><option value="chat">Chat 消息</option><option value="text">文本内容块</option></select></label>', '生成格式示例']
  };
  const [title, description, controls, button] = definitions[mode];
  return `<section class="panel"><h2>${title}</h2><p class="muted">${description}</p><form id="moduleExercise" data-mode="${mode}" style="display:grid;gap:12px;max-width:620px">${controls}<button class="btn primary" style="justify-self:start">${button}</button></form><pre id="exerciseResult" role="status" style="white-space:pre-wrap;overflow-wrap:anywhere"></pre></section>`;
}
function initModuleExercise() {
  document.addEventListener('submit', event => {
    if (event.target.id !== 'moduleExercise') return;
    event.preventDefault();
    const form = event.target, fields = new FormData(form), mode = form.dataset.mode;
    const value = String(fields.get('value') || '').trim();
    let output = '';
    if (mode === 'protocol') {
      if (!value) { output = '请输入参数。'; }
      else if (fields.get('choice') === 'search') { output = `模拟调用 search_docs\n参数：${value}\n结果：找到 2 条相关示例片段。`; }
      else { output = `模拟调用 summarize\n输入：${value}\n结果：这是一条预设摘要，未调用模型。`; }
    } else if (mode === 'batch') {
      const lines = value.split(/\r?\n/).map(x => x.trim()).filter(Boolean);
      if (!lines.length || lines.length > 20) output = '请输入 1 至 20 条示例请求。';
      else output = `模拟完成 ${lines.length} 条请求：\n` + lines.map((line, i) => `${i + 1}. ${line} → 示例结果：成功`).join('\n');
    } else if (mode === 'log') {
      const records = ['10:42 POST /v1/chat/completions · gpt-4o · 200', '10:41 POST /v1/embeddings · embedding-demo · 200', '10:40 POST /v1/chat/completions · gemini-flash · 429'];
      const hits = records.filter(x => x.toLowerCase().includes(value.toLowerCase()));
      output = hits.length ? `找到 ${hits.length} 条模拟记录：\n${hits.join('\n')}` : '未找到匹配的模拟记录。';
    } else if (mode === 'health') {
      output = ({ok:'模拟检查：服务正常 · 延迟 12ms · 断路器关闭。',timeout:'模拟检查：上游超时 · 可尝试备用连接。',rate:'模拟检查：上游限流 · 连接进入模拟冷却。'})[fields.get('choice')];
    } else if (mode === 'delivery') {
      output = `模拟事件：${fields.get('choice')}\n目标：example.invalid\n模拟结果：已生成投递记录；没有发送网络请求。`;
    } else if (mode === 'search') {
      const docs = ['预算：研发团队每月示例预算为 $250。', '路由：高可用组合按优先级选择模型。', '项目：演示系统使用虚构数据。'];
      const hits = value ? docs.filter(x => x.toLowerCase().includes(value.toLowerCase())) : [];
      output = hits.length ? `模拟命中 ${hits.length} 条：\n${hits.join('\n')}` : '未找到匹配的示例片段。';
    } else if (mode === 'quota') {
      const limit = Number(fields.get('limit')), used = Number(fields.get('used'));
      if (!Number.isFinite(limit) || !Number.isFinite(used) || limit < 0 || used < 0 || limit > 1000000 || used > 1000000) output = '请输入 0 至 1,000,000 之间的数值。';
      else output = `示例上限 ${limit}，已使用 ${used}，剩余 ${Math.max(0, limit-used)}。${used > limit ? ' 已超出示例额度。' : ''}`;
    } else if (mode === 'translate') {
      const result = fields.get('choice') === 'chat' ? {messages:[{role:'user',content:value}]} : {content:[{type:'text',text:value}]};
      output = JSON.stringify(result, null, 2);
    }
    document.querySelector('#exerciseResult').textContent = output;
  });
}
