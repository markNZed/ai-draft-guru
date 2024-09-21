// backend/tests/applyCommand.test.mjs
import request from 'supertest';
import app from '../server.mjs'; // Ensure server exports the app

describe('POST /apply-command', () => {
  it('should apply dummy operations when OPENAI_API_KEY is not set', async () => {
    const response = await request(app)
      .post('/apply-command')
      .send({
        command: 'Change headings and emphasize text',
        documentContent: '# Introduction\nThis is important.',
      });
    
    expect(response.statusCode).toBe(200);
    expect(response.body.modifiedContent).toContain('## Overview');
    expect(response.body.modifiedContent).toContain('This is important.'); // Adjust based on dummy response
  });
});
