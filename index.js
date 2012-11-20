var crypto = require('crypto');

function Partitioner() {
  // the number Q, e.g. the maximum number of nodes
  // (e.g. the number of pieces the hash table output is split into)
  this.maxNodes = 12;
  // the number S, e.g. the determines the current ratio of vnodes to nodes
  this.currentNodes = 0;

  // array, size is the maxNodes, values are node ID numbers
  this.vnodesToNodes = [];
  for(var i = 0; i < this.maxNodes; i++) {
    this.vnodesToNodes[i] = 0;
  }
  this.metadata = {};
}

Partitioner.prototype.addNode = function(metadata) {
  // Change the table to i % currentNodes for each value.
  // Note that this reassigns almost all the nodes since the whole sequence changes
  // A better strategy would aim to reassign a minimum of nodes
  this.metadata[ metadata.id ] = metadata;
  // since we initialize the table to zero, the first node doesn't
  // need to recalculate
  this.currentNodes = Object.keys(this.metadata).length;
  if(this.currentNodes == 0) return;
  for(var i = 0; i < this.maxNodes; i++) {
    this.vnodesToNodes[i] = i % this.currentNodes;
  }
};

// returns the node, and count nodes after it
Partitioner.prototype.getNodeList = function(key, count) {
  if(this.currentNodes == 0) return false;
  // 32bits from md5
  var num = parseInt(crypto.createHash('md5').update(key).digest('hex').substr(0, 8), 16),
      vnode = num % this.maxNodes,
      result = [],
      self = this;
  for(var i = 0; i < count; i++) {
    result.push(this.vnodesToNodes[ (vnode + i) % this.maxNodes ]);
  }
  // now fetch the corresponding metadata nodes
  var sortedMeta = Object.keys(this.metadata).sort();
  return result.map(function(node) {
    return self.getMeta(sortedMeta[node]);
  });
};

// Must make sure that when the nodes are removed,
// the vnodes are allocated back in a way that divides them
// equally among the remaining nodes
Partitioner.prototype.removeNode = function(id) {
  delete this.metadata[id];
  this.currentNodes = Object.keys(this.metadata).length;
  // if there are no nodes, no point in recalculating
  if(this.currentNodes == 0) return;
  for(var i = 0; i < this.maxNodes; i++) {
    this.vnodesToNodes[i] = i % this.currentNodes;
  }
};

Partitioner.prototype.getMeta = function(index) {
  return this.metadata[index];
};

module.exports = Partitioner;
