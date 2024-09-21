// backend/server.test.js
import request from 'supertest';
import app from './server'; // Adjust export in server.js

describe('POST /apply-command', () => {
  it('should apply dummy operations when OPENAI_API_KEY is not set', async () => {
    const response = await request(app)
      .post('/apply-command')
      .send({
        command: 'Change headings and emphasize text',
        documentContent: '# Introduction\nThis is important.',
      });
    expect(response.statusCode).toBe(200);
    expect(response.body.modifiedContent).toContain('## Introduction');
    expect(response.body.modifiedContent).toContain('This is **important**.');
  });
});
