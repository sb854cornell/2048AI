# 2048 AI

AI for the game [2048](https://github.com/gabrielecirulli/2048).

Developed by:
Shiwani Bisht (sb854)
Ajay Gandhi (aag255)
David Vakili (dv227)

See it in action [here](http://sb854cornell.github.io/2048AI/).

We developed this game based on the source code for [2048](https://github.com/gabrielecirulli/2048) and adapted existing [AI framework](https://github.com/ov3y/2048-AI) to develop our own artificial intelligence agents that could interact with the game. These agents use a board evaluation function that we developed to evaluate the desirability of a certain board configuration.

You can try to run two random agents, an agent that uses DFS, Minimax (with alpha-beta pruning), or Expectiminimax.

We found that Expectimax works the best!

Note: there's an animation delay of 100ms to show the tiles moving. This causes a bit
of lag when running the search algorithms. DFS and expectimax take a while to run due to the large
branching factor.
