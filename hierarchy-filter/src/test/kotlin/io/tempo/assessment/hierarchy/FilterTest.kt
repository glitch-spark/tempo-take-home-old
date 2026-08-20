package io.tempo.assessment.hierarchy

import kotlin.test.Test
import kotlin.test.assertEquals

class FilterTest {
  @Test
  fun testFilter() {
    val unfiltered: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11),
      intArrayOf(0, 1, 2, 3, 1, 0, 1, 0, 1, 1, 2)
    )
    val filteredActual: Hierarchy = unfiltered.filter { nodeId -> nodeId % 3 != 0 }
    val filteredExpected: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 5, 8, 10, 11),
      intArrayOf(0, 1, 1, 0, 1, 2)
    )
    assertEquals(filteredExpected.formatString(), filteredActual.formatString())
  }

  @Test
  fun emptyHierarchy() {
    val empty: Hierarchy = ArrayBasedHierarchy(IntArray(0), IntArray(0))
    assertEquals("[]", empty.filter { true }.formatString())
  }

  @Test
  fun allPass() {
    val h: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3),
      intArrayOf(0, 1, 1)
    )
    assertEquals(h.formatString(), h.filter { true }.formatString())
  }

  @Test
  fun nonePass() {
    val h: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3),
      intArrayOf(0, 1, 1)
    )
    assertEquals("[]", h.filter { false }.formatString())
  }

  @Test
  fun dropRootRemovesWholeTree() {
    // Two trees: 1→2→3 and 10→11. Drop root 1 → only second tree remains.
    val h: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3, 10, 11),
      intArrayOf(0, 1, 2, 0, 1)
    )
    val actual = h.filter { it != 1 }
    assertEquals("[10:0, 11:1]", actual.formatString())
  }

  @Test
  fun dropMiddleNodeRemovesDescendantsKeepsSiblings() {
    // 1 → 2 → 3, 1 → 4. Drop 2 → 3 goes with it; 4 stays.
    val h: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3, 4),
      intArrayOf(0, 1, 2, 1)
    )
    val actual = h.filter { it != 2 }
    assertEquals("[1:0, 4:1]", actual.formatString())
  }

  @Test
  fun dropLeafOnly() {
    val h: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3),
      intArrayOf(0, 1, 2)
    )
    val actual = h.filter { it != 3 }
    assertEquals("[1:0, 2:1]", actual.formatString())
  }

  @Test
  fun singleNode() {
    val h: Hierarchy = ArrayBasedHierarchy(intArrayOf(42), intArrayOf(0))
    assertEquals("[42:0]", h.filter { true }.formatString())
    assertEquals("[]", h.filter { false }.formatString())
  }

  @Test
  fun deepChainDropMiddle() {
    val h: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3, 4),
      intArrayOf(0, 1, 2, 3)
    )
    val actual = h.filter { it != 3 }
    assertEquals("[1:0, 2:1]", actual.formatString())
  }

  @Test
  fun severalRootsOnlyOneSurvives() {
    val h: Hierarchy = ArrayBasedHierarchy(
      intArrayOf(1, 2, 3, 4, 5, 6),
      intArrayOf(0, 1, 0, 1, 0, 1)
    )
    // Keep only the middle tree rooted at 3.
    val actual = h.filter { it == 3 || it == 4 }
    assertEquals("[3:0, 4:1]", actual.formatString())
  }
}
