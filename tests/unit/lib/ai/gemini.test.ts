import { describe, it, expect } from 'vitest';
import { parseResume, generateCVContent } from '@/lib/ai/gemini';
import { server } from '../../../mocks/server';
import { http, HttpResponse } from 'msw';

describe('Gemini AI Client', () => {
  describe('parseResume', () => {
    it('should successfully parse and clean valid markdown JSON from the AI', async () => {
      // Setup MSW to return valid JSON wrapped in markdown
      server.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: "```json\n{\"personalInfo\":{\"fullName\":\"John Doe\"},\"skills\":[\"React\"]}\n```"
                    }
                  ]
                }
              }
            ]
          });
        })
      );

      const result = await parseResume('Raw resume text...');
      
      expect(result).toBeDefined();
      expect(result.personalInfo?.fullName).toBe('John Doe');
      expect(result.skills).toContain('React');
    });

    it('should throw an error gracefully when the AI returns malformed JSON', async () => {
      // Setup MSW to return broken JSON
      server.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: "Here is the resume: { \"personalInfo\": missing quotes }"
                    }
                  ]
                }
              }
            ]
          });
        })
      );

      await expect(parseResume('Broken resume text')).rejects.toThrow('AI could not parse the resume');
    });
  });

  describe('generateCVContent', () => {
    it('should return plain text content from the AI', async () => {
      server.use(
        http.post('https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent', () => {
          return HttpResponse.json({
            candidates: [
              {
                content: {
                  parts: [
                    {
                      text: "Developed scalable web applications using Next.js."
                    }
                  ]
                }
              }
            ]
          });
        })
      );

      const result = await generateCVContent('Experience', {
        jobTitle: 'Software Engineer',
        skills: ['Next.js']
      });

      expect(result).toBe('Developed scalable web applications using Next.js.');
    });
  });
});
