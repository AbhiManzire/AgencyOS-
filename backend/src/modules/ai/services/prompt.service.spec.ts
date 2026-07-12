import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '../../prisma/prisma.service';
import { PromptService } from './prompt.service';

describe('PromptService', () => {
  let service: PromptService;

  const prisma = {
    aiPromptTemplate: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      updateMany: jest.fn(),
      create: jest.fn(),
    },
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [PromptService, { provide: PrismaService, useValue: prisma }],
    }).compile();

    service = module.get(PromptService);
  });

  describe('renderTemplate', () => {
    it('replaces {{name}} placeholders with variable values', () => {
      const result = service.renderTemplate('Hello {{name}}, welcome to {{place}}!', {
        name: 'Alice',
        place: 'AgencyOS',
      });

      expect(result).toBe('Hello Alice, welcome to AgencyOS!');
    });

    it('leaves unknown placeholders unchanged', () => {
      const result = service.renderTemplate('Hello {{name}}, your id is {{id}}.', {
        name: 'Bob',
      });

      expect(result).toBe('Hello Bob, your id is {{id}}.');
    });

    it('replaces multiple occurrences of the same placeholder', () => {
      const result = service.renderTemplate('{{name}} and {{name}} again.', { name: 'Carol' });

      expect(result).toBe('Carol and Carol again.');
    });
  });

  describe('renderPromptTemplate', () => {
    it('renders both system and user prompt templates', () => {
      const result = service.renderPromptTemplate(
        'You are {{role}}.',
        'Help {{name}} with {{task}}.',
        { role: 'assistant', name: 'Dan', task: 'onboarding' },
      );

      expect(result).toEqual({
        systemPrompt: 'You are assistant.',
        userPrompt: 'Help Dan with onboarding.',
      });
    });
  });
});
