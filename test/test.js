var assert = require('assert'),
    Partitioner = require('../index.js');

function changeCount(a, b) {
  var count = 0;
  for(var i = 0; i < a.length; i++) {
    if(a[i] != b[i]) {
      count++;
    }
  }
  return count;
}

function distinctCount(a) {
  var items = {};
  a.forEach(function(k) {
    items[k] = true;
  });
  return Object.keys(items).length;
};

exports['given a partitioner'] = {

  'adding nodes changes the metadata table': function() {
    var p = new Partitioner(),
        old = JSON.parse(JSON.stringify(p.vnodesToNodes));

    for(var i = 1; i < 12; i++) {
      p.addNode({ id: i, host: 'localhost', port: i });
//      console.log(old);
//      console.log(p.vnodesToNodes);
//      console.log(p.getNodeList('foo', 2));
//      console.log('changed', changeCount(old, p.vnodesToNodes));
      if(i > 1) {
        assert.ok(changeCount(old, p.vnodesToNodes) > 0);
      }
      assert.equal(distinctCount(p.vnodesToNodes),  i);
      old = JSON.parse(JSON.stringify(p.vnodesToNodes));
    }
  },

  'removing nodes removes the ID from the metadata table': function() {
    var p = new Partitioner();
    p.addNode({ id: 100, host: 'localhost', port: 1 });
    p.addNode({ id: 101, host: 'localhost', port: 2 });
    p.addNode({ id: 102, host: 'localhost', port: 3 });
    assert.equal(distinctCount(p.vnodesToNodes), 3);

    p.removeNode(100);
    assert.equal(distinctCount(p.vnodesToNodes), 2);

    p.removeNode(101);
    assert.equal(distinctCount(p.vnodesToNodes), 1);
  },

  'fetching metadata or keys from a empty table returns a falsey value': function() {
    var p = new Partitioner();
    assert.ok(!p.getMeta(100));
    assert.ok(!p.getNodeList('test', 1));
    p.addNode({ id: 100, host: 'localhost', port: 1 });
    p.removeNode(100);
    assert.ok(!p.getMeta(100));
    assert.ok(!p.getNodeList('test', 1));
  },

  'can store and fetch metadata associated with the primary': function() {
    var p = new Partitioner();
    p.addNode({ id: 200, host: 'localhost', port: 123 });
    p.addNode({ id: 201, host: 'localhost', port: 246 });
    assert.equal(p.getMeta(200).port, 123);
    assert.equal(p.getMeta(201).port, 246);
  }

};

// if this module is the script being run, then run the tests:
if (module == require.main) {
  var mocha = require('child_process').spawn('mocha', [ '--colors', '--ui', 'exports', '--reporter', 'spec', __filename ]);
  mocha.stdout.pipe(process.stdout);
  mocha.stderr.pipe(process.stderr);
}

