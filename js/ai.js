function AI(grid) {
  this.grid = grid;
}

// static evaluation function
AI.prototype.eval = function() {
  // take into account the number of empty cells
  var emptyCells = Math.max(1, this.grid.availableCells().length);
  // take into account the maximum value on the board
  // that would result from this move. The log
  // is computed before the value is returned
  // Also returns the sum, scaled by using log base 10.
  var maxSum = this.grid.maxAndSum();
  // take into account the similarity of the tiles on
  // the board
  var boardSim = Math.max(1, this.grid.boardSimilarityScore());
  // take into account the monotonicity of the
  // board
  var monotoneScore = Math.max(1, this.grid.monotoneBoardScore());
  
  return emptyCells*maxSum[0]*
    maxSum[1]*boardSim*monotoneScore;
};

AI.prototype.random = function(){}

//
// Expectiminimax algorithm
//
AI.prototype.expectiminimax = function (depth) {
  if (this.grid.playerTurn) {
    this.grid.playerTurn = false;

    // It's the AI's turn to play (max)
    if (depth == 0) {
      // Don't go any deeper, just run the heuristic
      return {
        score: HEURISTIC_FUNCTION(this.grid);
      }
    } else {
      var score = 0;
      var move = -1;
      // Loop through the allowed moves (up, down, left right)
      for (var direction in [0, 1, 2, 3]) {
        // Clone the grid and make the move on it
        var newGrid = this.grid.clone();
        if (newGrid.move(direction).moved) {
          // Move was successful
          // Check if the value of this new board is greater than the cached
          // value stored in score

          // Check the value of the board by makinga new AI with that board and
          // then running the expectiminimax algo on it
          var newAI = new AI(newGrid);
          var newScore = newAI.expectiminimax(depth - 1).score;

          // If the new score is greater than the previous one, update the
          // score and direction required to get that score
          if (newScore > score) {
            score = newScore;
            move = direction;
          }
        }
      }

      return {
        score: score,
        move: dir
      }
    }
  } else {
    this.grid.playerTurn = true;

    // It's the computer's turn, i.e. the random addition of a 2 tile or 4 tile
    // This is the min player
    var score = 0;

    // Get the available (empty) cells in the grid
    var cells = this.grid.availableCells();

    // Tile to be inserted could be a 2 or a 4
    for (var value in [2, 4]) {

      // Loop through the empty cells
      for (var i in cells) {

        // Create and insert a new tile with the given number
        var cell = cells[i];
        var tile = new Tile(cell, value);
        this.grid.insertTile(tile);

        // Calculate the value of this board
        var newScore = this.expectiminimax(depth).score;

        // The value to add to the total score is the probability that the value
        // is chosen (prob of 2 or prob of 4) multiplied by the probability that
        // that cell is chosen (each cell has equal probability) times the score
        // of the new board
        score += probabilityOfNewTile(value) * newScore * (1 / cells.length);

        // Remove the cell so that everything is back to how it started
        this.grid.removeTile(cell);
      }
    }
    // Not sure if the return value is correct
    return {
      score: score
    }
  }
}

// alpha-beta depth first search
AI.prototype.search = function(depth, alpha, beta, positions, cutoffs) {
  var bestScore;
  var bestMove = -1;
  var result;

  // the maxing player
  if (this.grid.playerTurn) {
    bestScore = alpha;
    for (var direction in [0, 1, 2, 3]) {
      var newGrid = this.grid.clone();
      if (newGrid.move(direction).moved) {
        positions++;
        if (newGrid.isWin()) {
          return { move: direction, score: 10000, positions: positions, cutoffs: cutoffs };
        }
        var newAI = new AI(newGrid);

        if (depth == 0) {
          result = { move: direction, score: newAI.eval() };
        } else {
          result = newAI.search(depth-1, bestScore, beta, positions, cutoffs);
          if (result.score > 9900) { // win
            result.score--; // to slightly penalize higher depth from win
          }
          positions = result.positions;
          cutoffs = result.cutoffs;
        }

        if (result.score > bestScore) {
          bestScore = result.score;
          bestMove = direction;
        }
        if (bestScore > beta) {
          cutoffs++
          return { move: bestMove, score: beta, positions: positions, cutoffs: cutoffs };
        }
      }
    }
  }

  else { // computer's turn, we'll do heavy pruning to keep the branching factor low
    bestScore = beta;

    // try a 2 and 4 in each cell and measure how annoying it is
    // with metrics from eval
    var candidates = [];
    var cells = this.grid.availableCells();
    var scores = { 2: [], 4: [] };
    for (var value in scores) {
      for (var i in cells) {
        scores[value].push(null);
        var cell = cells[i];
        var tile = new Tile(cell, parseInt(value, 10));
        this.grid.insertTile(tile);
        scores[value][i] = -this.grid.smoothness() + this.grid.islands();
        this.grid.removeTile(cell);
      }
    }

    // now just pick out the most annoying moves
    var maxScore = Math.max(Math.max.apply(null, scores[2]), Math.max.apply(null, scores[4]));
    for (var value in scores) { // 2 and 4
      for (var i=0; i<scores[value].length; i++) {
        if (scores[value][i] == maxScore) {
          candidates.push( { position: cells[i], value: parseInt(value, 10) } );
        }
      }
    }

    // search on each candidate
    for (var i=0; i<candidates.length; i++) {
      var position = candidates[i].position;
      var value = candidates[i].value;
      var newGrid = this.grid.clone();
      var tile = new Tile(position, value);
      newGrid.insertTile(tile);
      newGrid.playerTurn = true;
      positions++;
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        cutoffs++;
        return { move: null, score: alpha, positions: positions, cutoffs: cutoffs };
      }
    }
    //*/
        
    /*
    for (var samples=0; samples<4; samples++) {
      var newGrid = this.grid.clone();
      newGrid.computerMove();
      newAI = new AI(newGrid);
      result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
      positions = result.positions;
      cutoffs = result.cutoffs;

      if (result.score < bestScore) {
        bestScore = result.score;
      }
      if (bestScore < alpha) {
        //console.log('cutoff')
        cutoffs++;
        return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
      }

    }
    //*/
    /*
    for (var x=0; x<4; x++) {
      for (var y=0; y<4; y++) {
        var position = {x:x, y:y};
        if (this.grid.cellAvailable(position)) {
          for (var value in [2, 4]) {
          //for (var value in [2]) {
            var newGrid = this.grid.clone();
            var tile = new Tile(position, value);
            newGrid.insertTile(tile);
            newGrid.playerTurn = true;
            positions++;
            newAI = new AI(newGrid);
            //console.log('inserted tile, players turn is', newGrid.playerTurn);
            result = newAI.search(depth, alpha, bestScore, positions, cutoffs);
            positions = result.positions;
            cutoffs = result.cutoffs;

            if (result.score < bestScore) {
              bestScore = result.score;
            }
            if (bestScore < alpha) {
              //console.log('cutoff')
              cutoffs++;
              return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
            }
          }
        }
      }
    }
    //*/
  }

  return { move: bestMove, score: bestScore, positions: positions, cutoffs: cutoffs };
}

// performs a search and returns the best move
AI.prototype.getBest = function() {
  return this.iterativeDeep();
}

// performs iterative deepening over the alpha-beta search
AI.prototype.iterativeDeep = function() {
  var start = (new Date()).getTime();
  var depth = 0;
  var best;
  do {
    var newBest = this.search(depth, -10000, 10000, 0 ,0);
    if (newBest.move == -1) {
      //console.log('BREAKING EARLY');
      break;
    } else {
      best = newBest;
    }
    depth++;
  } while ( (new Date()).getTime() - start < minSearchTime);
  //console.log('depth', --depth);
  //console.log(this.translate(best.move));
  //console.log(best);
  return best
}

AI.prototype.translate = function(move) {
 return {
    0: 'up',
    1: 'right',
    2: 'down',
    3: 'left'
  }[move];
}

