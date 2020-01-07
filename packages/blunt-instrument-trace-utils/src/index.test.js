import { addNodeIdsToAST, ASTQuerier, attachCodeSlicesToAST, getNodeId } from 'blunt-instrument-ast-utils';
import { parseSync } from '@babel/core';

import { TraceQuerier } from './';

describe('TraceQuerier', () => {
  let astQuerier;

  beforeEach(() => {
    const code = `
      let num = 1;
      function increaseNum(by) {
        num = num + by;
        return num;
      }
      increaseNum(3);
      increaseNum(3);
    `;
    const ast = parseSync(code);
    addNodeIdsToAST(ast, 'test-');
    attachCodeSlicesToAST(ast, code);
    astQuerier = new ASTQuerier(ast);
  });

  it('makes the astQuerier available', () => {
    expect(new TraceQuerier(astQuerier, []).astQuerier).toBe(astQuerier);
  });

  describe('query', () => {
    let trevs;
    let traceQuerier;

    beforeEach(() => {
      trevs = [];
      trevs.push({ id: 1, nodeId: getNodeId(astQuerier.getNodesByCodeSlice('1')[0]), type: 'expr', value: 1 });
      trevs.push({ id: 2, nodeId: getNodeId(astQuerier.getNodesByCodeSlice('num + by')[0]), type: 'expr', value: 4 });
      trevs.push({ id: 3, nodeId: getNodeId(astQuerier.getNodesByCodeSlice('num + by')[0]), type: 'expr', value: 7 });
      trevs.push({ id: 4, nodeId: getNodeId(astQuerier.getNodesByCodeSlice('increaseNum(3)')[0]), type: 'expr', value: 4 });
      trevs.push({ id: 5, nodeId: getNodeId(astQuerier.getNodesByCodeSlice('increaseNum(3)')[1]), type: 'expr', value: 7 });
      traceQuerier = new TraceQuerier(astQuerier, trevs);
    });

    it('returns all trevs', () => {
      const result = traceQuerier.query();
      expect(result.map(trev => trev.id)).toEqual([1, 2, 3, 4, 5]);
    });

    it('returns correct details', () => {
      const result = traceQuerier.query();
      expect(result[2]).toEqual({
        id: 3, node: astQuerier.getNodesByCodeSlice('num + by')[0], type: 'expr', value: 7 });
    });

    describe('onlyNodeIds', () => {
      it('does not filter nodes if none are truthy', () => {
        const result = traceQuerier.query({ filters: { onlyNodeIds: { [trevs[1].nodeId]: false } } });
        expect(result.map(trev => trev.id)).toEqual([1, 2, 3, 4, 5]);
      });

      it('filters to truthy nodes', () => {
        const result = traceQuerier.query({ filters: { onlyNodeIds: {
          [trevs[1].nodeId]: true,
          [trevs[3].nodeId]: false,
          [trevs[4].nodeId]: true,
         } } });
         expect(result.map(trev => trev.id)).toEqual([2, 3, 5]);
      });
    });

    describe('excludeNodeTypes', () => {
      it('excludes truthy node types', () => {
        const result1 = traceQuerier.query({ filters: { excludeNodeTypes: {
          BinaryExpression: true,
          CallExpression: false,
        } } });
        expect(result1.map(trev => trev.id)).toEqual([1, 4, 5]);

        const result2 = traceQuerier.query({ filters: { excludeNodeTypes: {
          BinaryExpression: false,
          CallExpression: true,
        }}});
        expect(result2.map(trev => trev.id)).toEqual([1, 2, 3]);
      });
    });
  });
});
