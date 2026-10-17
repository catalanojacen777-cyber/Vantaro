// Local stand-ins for the AI provider, Stripe and Resend, used only by the
// integration test. They let the real "live" code paths run end to end
// without credentials or network access.
import http from 'node:http';

function sampleFromJsonSchema(schema, path = '') {
  switch (schema.type) {
    case 'string':
      if (schema.enum) return schema.enum[0];
      return `Mock ${path || 'text'}`.slice(0, schema.maxLength ?? 200);
    case 'number':
    case 'integer':
      return schema.minimum ?? 1;
    case 'boolean':
      return true;
    case 'array': {
      const n = Math.max(schema.minItems ?? 1, Math.min(schema.maxItems ?? 3, 3));
      return Array.from({ length: n }, (_, i) => sampleFromJsonSchema(schema.items, `${path}[${i}]`));
    }
    case 'object':
      return Object.fromEntries(Object.entries(schema.properties ?? {}).map(([k, v]) => [k, sampleFromJsonSchema(v, k)]));
    default:
      return null;
  }
}

export function startMocks({ aiPort = 4243, stripePort = 4242, resendPort = 4244 } = {}) {
  const calls = { ai: [], stripe: [], resend: [] };
  let aiCount = 0;

  const ai = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      const json = JSON.parse(body || '{}');
      calls.ai.push({ headers: req.headers, body: json });
      if (req.headers['x-api-key'] !== 'test-key') {
        res.writeHead(401, { 'content-type': 'application/json' });
        return res.end(JSON.stringify({ type: 'error', error: { type: 'authentication_error' } }));
      }
      aiCount++;
      const tool = json.tools[0];
      let input = sampleFromJsonSchema(tool.input_schema);
      // Every 7th first-round call returns an invalid shape to exercise the repair loop.
      const isRepairRound = json.messages.length > 1;
      if (aiCount % 7 === 0 && !isRepairRound) input = { wrong: true };
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: `msg_${aiCount}`, type: 'message', role: 'assistant', stop_reason: 'tool_use', content: [{ type: 'tool_use', id: `tu_${aiCount}`, name: tool.name, input }] }));
    });
  });

  const stripe = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      calls.stripe.push({ url: req.url, headers: req.headers, body: Object.fromEntries(new URLSearchParams(body)) });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: `cs_test_${calls.stripe.length}`, url: `https://checkout.stripe.com/c/pay/cs_test_${calls.stripe.length}` }));
    });
  });

  const resend = http.createServer((req, res) => {
    let body = '';
    req.on('data', (c) => (body += c));
    req.on('end', () => {
      calls.resend.push({ headers: req.headers, body: JSON.parse(body || '{}') });
      res.writeHead(200, { 'content-type': 'application/json' });
      res.end(JSON.stringify({ id: `email_${calls.resend.length}` }));
    });
  });

  ai.listen(aiPort, '127.0.0.1');
  stripe.listen(stripePort, '127.0.0.1');
  resend.listen(resendPort, '127.0.0.1');
  return { calls, close: () => Promise.all([ai, stripe, resend].map((s) => new Promise((r) => s.close(r)))) };
}
