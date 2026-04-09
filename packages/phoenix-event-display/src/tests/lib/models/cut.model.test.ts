import { Cut } from '../../../lib/models/cut.model';

describe('Cut', () => {
  let model: Cut;

  beforeEach(() => {
    model = new Cut('test', 0, 1, 1);
  });

  afterEach(() => {
    model = undefined;
  });

  it('should create an instance of Cut model', () => {
    expect(model).toBeTruthy();
  });

  it('should reset the values', () => {
    model.minValue = 10;
    model.maxValue = 20;

    model.reset();

    expect(model.minValue).toBe(0);
    expect(model.maxValue).toBe(1);
  });

  describe('clone', () => {
    it('should return a Cut instance with the same properties', () => {
      const original = new Cut('pT', 0, 50000, 0.1, true, false);
      const cloned = original.clone();

      expect(cloned).toBeInstanceOf(Cut);
      expect(cloned).not.toBe(original);
      expect(cloned.field).toBe('pT');
      expect(cloned.minValue).toBe(0);
      expect(cloned.maxValue).toBe(50000);
      expect(cloned.step).toBe(0.1);
      expect(cloned.minCutActive).toBe(true);
      expect(cloned.maxCutActive).toBe(false);
    });

    it('should produce an independent copy that does not share state', () => {
      const original = new Cut('eta', -4, 4, 0.1);
      const cloned = original.clone();

      cloned.minValue = -2;
      cloned.maxValue = 2;

      expect(original.minValue).toBe(-4);
      expect(original.maxValue).toBe(4);
    });

    it('should preserve cutPassed behaviour on the clone', () => {
      const original = new Cut('phi', -3.14, 3.14, 0.01);
      const cloned = original.clone();

      expect(cloned.cutPassed(0)).toBe(true);
      expect(cloned.cutPassed(99)).toBe(false);
    });
  });
});
