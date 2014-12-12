# 2048 AI

AI for the game [2048](https://github.com/gabrielecirulli/2048).


See it in action [here](http://sb854cornell.github.io/2048AI/). (Hit the auto-run button to let the AI attempt to solve it by itself)

You can try to run two random agents, an agent that uses DFS, Minimax (with alpha-beta pruning), and Expectiminimax.

We found that Expectimax works the best!

Note: there's an animation delay of 100ms to show the tiles moving. This causes a bit
of lag when running the search algorithms. DFS and expectimax take a while to run due to the large
branching factor.
