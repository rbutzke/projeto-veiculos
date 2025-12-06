// pg.provider.spec.ts
import { Test, TestingModule } from '@nestjs/testing';
import { Pg } from '../pg.provider';

describe('Pg', () => {
  let provider: Pg;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [Pg],
    }).compile();

    provider = module.get<Pg>(Pg);
  });

  it('deve ser definido', () => {
    expect(provider).toBeDefined();
  });

  it('deve ser uma instância do Pg', () => {
    expect(provider).toBeInstanceOf(Pg);
  });

  it('deve ser injetável', () => {
    // Verifica se o provider pode ser injetado corretamente
    expect(provider).toHaveProperty('constructor');
  });
});