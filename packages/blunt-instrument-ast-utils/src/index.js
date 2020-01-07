import * as types from '@babel/types';

/**
 * Retrieves the blunt-instrument node ID from a babel node, if one has been set.
 * @param {Node} node
 * @return {string} the node ID, or null if there is none
 */
export function getNodeId(node) {
  if (!node.extra) {
    return null;
  }

  if (typeof node.extra.biNodeId !== 'string') {
    return null;
  }

  return node.extra.biNodeId;
}

/**
 * Sets the blunt-instrument node ID on a babel node,
 * which is used for correlating traced events to AST nodes.
 * Currently this is stored in node.extra.biNodeId
 * @param {Node} node
 * @param {string} id
 */
export function setNodeId(node, id) {
  // TODO: I really have no idea whether this sort of thing is
  // what 'extra' is for
  if (!node.extra) {
    node.extra = {};
  }

  node.extra.biNodeId = id;
}

/**
 * Copy the node ID from one AST node to another.
 * @param {Node} from 
 * @param {Node} to 
 */
export function copyNodeId(from, to) {
  setNodeId(to, getNodeId(from));
}

/**
 * Copies all node IDs from one AST to another. This should be called with
 * two ASTs that have exactly the same shape.
 * @param {Node} from 
 * @param {Node} to
 * @throws error if the two trees do not have the same number and types of nodes
 */
export function copyNodeIds(from, to) {
  const fromNodes = [];
  const toNodes = [];
  types.traverseFast(from, node => fromNodes.push(node));
  types.traverseFast(to, node => toNodes.push(node));

  if (fromNodes.length !== toNodes.length) {
    throw new Error(`Source tree has ${fromNodes.length} nodes but destination tree has ${toNodes.length}`);
  }

  for (let i = 0; i < fromNodes.length; i++) {
    if (fromNodes[i].type !== toNodes[i].type) {
      throw new Error('Source and destination tree nodes do not match');
    }
    copyNodeId(fromNodes[i], toNodes[i]);
  }
}

/**
 * Traverse an AST and attach sequential identifiers to each node.
 * Nodes which already have an ID will not be altered.
 * @param {Node} ast - the parent which will be annotated along with its descendants
 * @param {string} prefix - a string to be prepended to all sequential identifiers generated
 */
export function annotateWithNodeIds(ast, prefix) {
  let nextId = 1;
  types.traverseFast(ast, (node) => {
    if (!getNodeId(node)) {
      const nodeId = prefix + nextId;
      nextId += 1;
      setNodeId(node, nodeId);
    }
  });
}

/**
 * Attach a field `extra.code` to each node in an AST, containing the snippet of source
 * code to which the node corresponds. Requires the node to have integer `start` and
 * `end` fields indicating the section of code to which it corresponds.
 * @param {Node} ast - the parent which will be annotated along with its descendants
 * @param {string} code - full source code corresponding to the AST
 */
export function annotateWithCode(ast, code) {
  types.traverseFast(ast, (node) => {
    if (Number.isInteger(node.start) && Number.isInteger(node.end)) {
      if (node.start < 0 || node.end > code.length) {
        throw new Error(`Node start [${node.start}] or end [${node.end}] is out of range`);
      }

      if (!node.extra) {
        node.extra = {};
      }

      node.extra.code = code.slice(node.start, node.end);
    }
  });
}

/**
 * Wraps a babel AST to enable more convenient or efficient lookups.
 * Every node should have a field `extra.biNodeId` to uniquely identify it.
 */
export class ASTQuerier {
  /**
   * @param {Node} ast - root node of the babel AST
   */
  constructor(ast) {
    this.ast = ast;

    const nodesById = new Map();
    types.traverseFast(ast, (node) => {
      if (!node.type) {
        return;
      }
      if (!getNodeId(node)) {
        throw new Error(`Node is missing node ID: ${JSON.stringify(node)}`);
      }

      nodesById.set(node.extra.biNodeId, node);
    });

    this.nodesById = nodesById;
  }
}