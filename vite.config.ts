import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

type GenerateRomPayload = {
  documentNumber: string;
  riskStatus: string;
  missingRequired: string[];
  completion: { total: number; done: number; percent: number };
  project: Record<string, string>;
};

const SYSTEM_PROMPT =
  'You are a Morgan Sound estimating writer. Create a concise ROM narrative summary. If any input is missing, explicitly state assumptions for missing information. Return clean plain text with section headings and short bullet points suitable for direct PDF export.';

function installRomApiMiddleware(middlewares: any, openAiApiKey: string) {
  middlewares.use('/api/generate-rom', async (req: any, res: any) => {
    if (req.method !== 'POST') {
      res.statusCode = 405;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Method not allowed' }));
      return;
    }

    if (!openAiApiKey) {
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Missing OPENAI_API_KEY on server.' }));
      return;
    }

    try {
      let body = '';
      for await (const chunk of req) {
        body += chunk;
      }

      const payload = JSON.parse(body) as GenerateRomPayload;

      const response = await fetch('https://api.openai.com/v1/responses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openAiApiKey}`,
        },
        body: JSON.stringify({
          model: 'gpt-4.1-mini',
          temperature: 0.2,
          input: [
            {
              role: 'system',
              content: [{ type: 'input_text', text: SYSTEM_PROMPT }],
            },
            {
              role: 'user',
              content: [{ type: 'input_text', text: JSON.stringify(payload, null, 2) }],
            },
          ],
        }),
      });

      if (!response.ok) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: `OpenAI request failed (${response.status}).` }));
        return;
      }

      const data = (await response.json()) as { output_text?: string };
      const output = data.output_text?.trim();

      if (!output) {
        res.statusCode = 502;
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({ error: 'No output text returned from model.' }));
        return;
      }

      res.statusCode = 200;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ output }));
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unexpected server error.';
      res.statusCode = 500;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    }
  });
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const openAiApiKey = env.OPENAI_API_KEY || process.env.OPENAI_API_KEY || '';

  return {
    plugins: [
      react(),
      {
        name: 'morgan-rom-api',
        configureServer(server) {
          installRomApiMiddleware(server.middlewares, openAiApiKey);
        },
        configurePreviewServer(server) {
          installRomApiMiddleware(server.middlewares, openAiApiKey);
        },
      },
    ],
    server: {
      port: 5173,
      host: true,
    },
  };
});
