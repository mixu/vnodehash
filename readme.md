# vnodehash

Consistent hashing using virtual nodes.

## Features

- Keys are hashed onto a 32-bit hash ring.
- The key space is partitioned into a fixed number of vnodes.
- The vnodes never change, but their owners do.
- Each node owns one or more vnodes.

## Quick intro to hashing strategies

Naive hashing:

    var servers = ['a', 'b', 'c'],
        key = 'foo',
        server = servers[hash('foo') % servers.length];

The problem with this is that if the number of servers changes, the modulus (servers.length) changes, so all the hash indices changes and the data gets reallocated accross the cluster.

Consistent hashing without vnodes (random token assignment):

    var servers = ['a', 'b', 'c'],
        key = 'foo',
        ring = servers.map(hash);

        function findFromRing(i) {
          return // the server that is closest to the int i
        }

        server = servers[findFromRing(hash('foo'))];

There are two issues:

- First, the random assignment of servers onto the ring may result to non-uniform data distribution since the sizes of the ranges vary.
- Second, all servers are treated equally, when in reality they may have varying capacities.
- Third, when a server is added or removed, it only gets nodes from it's neighbors. Ideally, the nodes would be distributed more equally amongst the new ring. You can imagine a pathological case where servers leave from one side of the ring, causing their neighbors to take on increasing load.

Consistent hashing using vnodes (fixed partition assignment):

    var servers = ['a', 'b', 'c'],
        key = 'foo',
        vnodes = [0, 1, 2, 0, 1, 2]; // each server is assigned several vnodes

        server = servers[vnodes[hash(key) % vnodes.length]];

By using vnodes, the placement of partitions is decoupled from the partitioning scheme:

- Adding and removing a node can be implemented as a manipulation of the vnode table. Changes in assignment can be spread across multiple nodes (rather than just the nearest neighboring servers).
- The number of vnodes a server is responsible for can represent its capacity, so more capable nodes can be assigned more vnodes.
- The key-to-vnode mapping is constant, meaning that the data for each vnode can be kept in a separate file. This means that during a replication, the data for a vnode can be relocated as a unit (rather than requiring random accesses).

Notes: you need to make sure the metadata is replicated (but this is the case anyway since you need to know which servers are active). You cannot have more nodes than vnodes, so the initial number of vnodes determines the maximum number (unless you rebalance the whole cluster).

## API

- `new VNodeHash(vnodeCount)`: creates a new vnode hash with vnodeCount virtual nodes.
- `.addNode(metadata)`: add a new node associated with the given metadata. The metadata object must have a `id` key.
- `.getNodeList(key, [count])`: get the metadata for the node(s) corresponding to the key. Set `count` to more than 1 if you want adjacent nodes as well.
- `.removeNode(id)`: remove a node by id
- `.getMeta(id)`: returns the metadata for a node by id

TODO: better API; also, add "replaceNode".

TODO: the remapping algorithm is terrible right now, it needs to remap the minimum number of nodes possible.

## Pluggable strategies

TODO. Basically you need to implement a addNode and removeNode function.
