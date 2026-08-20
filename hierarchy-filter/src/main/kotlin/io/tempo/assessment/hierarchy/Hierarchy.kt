package io.tempo.assessment.hierarchy

/**
 * A `Hierarchy` stores an arbitrary forest (an ordered collection of ordered trees)
 * as an array of node IDs in the order of DFS traversal, combined with a parallel array of node depths.
 *
 * Parent-child relationships are identified by the position in the array and the associated depth.
 * Each tree root has depth 0, its children have depth 1 and follow it in the array, their children have depth 2 and follow them, etc.
 *
 * Invariants on the depths array:
 *  * Depth of the first element is 0.
 *  * If the depth of a node is `D`, the depth of the next node in the array can be:
 *      * `D + 1` if the next node is a child of this node;
 *      * `D` if the next node is a sibling of this node;
 *      * `d < D` - in this case the next node is not related to this node.
 */
interface Hierarchy {
  /** The number of nodes in the hierarchy. */
  val size: Int

  /**
   * Returns the unique ID of the node identified by the hierarchy index. The depth for this node will be `depth(index)`.
   * @param index must be non-negative and less than [size]
   */
  fun nodeId(index: Int): Int

  /**
   * Returns the depth of the node identified by the hierarchy index. The unique ID for this node will be `nodeId(index)`.
   * @param index must be non-negative and less than [size]
   */
  fun depth(index: Int): Int

  fun formatString(): String {
    return (0 until size).joinToString(
      separator = ", ",
      prefix = "[",
      postfix = "]"
    ) { i -> "${nodeId(i)}:${depth(i)}" }
  }
}

/**
 * A node is present in the filtered hierarchy iff its node ID passes the predicate
 * and all of its ancestors pass it as well.
 *
 * Kept nodes retain their original depths (the forest layout is not re-indented).
 */
fun Hierarchy.filter(nodeIdPredicate: (Int) -> Boolean): Hierarchy {
  if (size == 0) {
    return ArrayBasedHierarchy(IntArray(0), IntArray(0))
  }

  val outIds = ArrayList<Int>(size)
  val outDepths = ArrayList<Int>(size)

  // When a node fails the predicate, skip its entire subtree:
  // subsequent nodes with depth > skipBelowDepth are descendants.
  var skipBelowDepth = -1

  for (i in 0 until size) {
    val d = depth(i)

    if (skipBelowDepth >= 0) {
      if (d > skipBelowDepth) {
        continue
      }
      skipBelowDepth = -1
    }

    if (nodeIdPredicate(nodeId(i))) {
      outIds.add(nodeId(i))
      outDepths.add(d)
    } else {
      skipBelowDepth = d
    }
  }

  return ArrayBasedHierarchy(outIds.toIntArray(), outDepths.toIntArray())
}

class ArrayBasedHierarchy(
  private val myNodeIds: IntArray,
  private val myDepths: IntArray,
) : Hierarchy {
  init {
    require(myNodeIds.size == myDepths.size) {
      "nodeIds and depths must have the same length"
    }
  }

  override val size: Int = myDepths.size

  override fun nodeId(index: Int): Int = myNodeIds[index]

  override fun depth(index: Int): Int = myDepths[index]
}
