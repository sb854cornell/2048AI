/* Pre-allocate weighted boards
to save memory.*/

  var boardSetups = [
  [[3, 2, 1, 0],
   [2, 1, 0,-1],
   [1, 0,-1,-1],
   [0,-1,-1,-2]
  ],
  [[ 0, 1, 2,3],
   [-1, 0, 1,2], 
   [-1,-1, 0,1],
   [-2,-1,-1,0]
  ],
  [[-2,-1,-1,0],
   [-1,-1, 0,1],
   [-1, 0, 1,2],
   [ 0, 1, 2,3]
  ],
  [[0,-1,-1,-2],
   [1, 0,-1,-1],
   [2, 1, 0,-1],
   [3, 2, 1, 0]
  ]
]

function Grid(size) {
  this.size = size;
  this.startTiles   = 2;

  this.cells = [];

  this.build();
  this.playerTurn = true;
}

function fastLog(n){
  var counter = 0;
  var inverse = false;
  if (n < 1) {
    n = n*-1;
    inverse = true;
  }
  while (n>1) {
    n = n >> 1;
    counter ++;
  }
  if (counter == 0) {
    return 1;
  }
  return inverse ? 1/intToFloat(counter) : counter;
}

Grid.prototype.probabilityOfNewTile = function (value) {
  return (value == 2) ? 0.9 : 0.1;
}

// pre-allocate these objects (for speed)
Grid.prototype.indexes = [];
for (var x=0; x<4; x++) {
  Grid.prototype.indexes.push([]);
  for (var y=0; y<4; y++) {
    Grid.prototype.indexes[x].push( {x:x, y:y} );
  }
}

// Build a grid of the specified size
Grid.prototype.build = function () {
  for (var x = 0; x < this.size; x++) {
    var row = this.cells[x] = [];

    for (var y = 0; y < this.size; y++) {
      row.push(null);
    }
  }
};

// Find the first available random position
Grid.prototype.randomAvailableCell = function () {
  var cells = this.availableCells();

  return cells[Math.floor(Math.random() * cells.length)];
};

Grid.prototype.availableCells = function () {
  var cells = [];

  this.eachCell(function (x, y, tile) {
    if (!tile) {
      cells.push( {x:x, y:y} );
    }
  });

  return cells;
};

// Call callback for every cell
Grid.prototype.eachCell = function (callback) {
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      callback(x, y, this.cells[x][y]);
    }
  }
};

// Check if there are any cells available
Grid.prototype.cellsAvailable = function () {
  return !!this.availableCells().length;
};

// Check if the specified cell is taken
Grid.prototype.cellAvailable = function (cell) {
  return !this.cellOccupied(cell);
};

Grid.prototype.cellOccupied = function (cell) {
  return !!this.cellContent(cell);
};

Grid.prototype.cellContent = function (cell) {
  if (this.withinBounds(cell)) {
    return this.cells[cell.x][cell.y];
  } else {
    return null;
  }
};

// Check for available matches between tiles (more expensive check)
// returns the number of matches
Grid.prototype.tileMatchesAvailable = function () {
  var self = this;

  var tile;

  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      tile = this.cellContent({ x: x, y: y });

      if (tile) {
        for (var direction = 0; direction < 4; direction++) {
          var vector = self.getVector(direction);
          var cell   = { x: x + vector.x, y: y + vector.y };

          var other  = self.cellContent(cell);

          if (other && other.value === tile.value) {
            return true; //matches++; // These two tiles can be merged
          }
        }
      }
    }
  }
  return false; 
};

// Inserts a tile at its position
Grid.prototype.insertTile = function (tile) {
  this.cells[tile.x][tile.y] = tile;
};

Grid.prototype.removeTile = function (tile) {
  this.cells[tile.x][tile.y] = null;
};

Grid.prototype.withinBounds = function (position) {
  return position.x >= 0 && position.x < this.size &&
         position.y >= 0 && position.y < this.size;
};

Grid.prototype.clone = function() {
  newGrid = new Grid(this.size);
  newGrid.playerTurn = this.playerTurn;
  for (var x = 0; x < this.size; x++) {
    for (var y = 0; y < this.size; y++) {
      if (this.cells[x][y]) {
        newGrid.insertTile(this.cells[x][y].clone());
      }
    }
  }
  return newGrid;
};

// Set up the initial tiles to start the game with
Grid.prototype.addStartTiles = function () {
  for (var i=0; i<this.startTiles; i++) {
    this.addRandomTile();
  }
};

// Adds a tile in a random position
Grid.prototype.addRandomTile = function () {
  if (this.cellsAvailable()) {
    var value = Math.random() < 0.9 ? 2 : 4;
    //var value = Math.random() < 0.9 ? 256 : 512;
    var tile = new Tile(this.randomAvailableCell(), value);

    this.insertTile(tile);
  }
};

// Save all tile positions and remove merger info
Grid.prototype.prepareTiles = function () {
  this.eachCell(function (x, y, tile) {
    if (tile) {
      tile.mergedFrom = null;
      tile.savePosition();
    }
  });
};

// Move a tile and its representation
Grid.prototype.moveTile = function (tile, cell) {
  this.cells[tile.x][tile.y] = null;
  this.cells[cell.x][cell.y] = tile;
  tile.updatePosition(cell);
};


Grid.prototype.vectors = {
  0: { x: 0,  y: -1 }, // up
  1: { x: 1,  y: 0 },  // right
  2: { x: 0,  y: 1 },  // down
  3: { x: -1, y: 0 }   // left
}

// Get the vector representing the chosen direction
Grid.prototype.getVector = function (direction) {
  // Vectors representing tile movement
  return this.vectors[direction];
};

// Move tiles on the grid in the specified direction
// returns true if move was successful
Grid.prototype.move = function (direction) {
  // 0: up, 1: right, 2:down, 3: left
  var self = this;

  var cell, tile;

  var vector     = this.getVector(direction);
  var traversals = this.buildTraversals(vector);
  var moved      = false;
  var score      = 0;
  var won        = false;

  // Save the current tile positions and remove merger information
  this.prepareTiles();

  // Traverse the grid in the right direction and move tiles
  traversals.x.forEach(function (x) {
    traversals.y.forEach(function (y) {
      //console.log(self.indexes);
      cell = self.indexes[x][y];
      tile = self.cellContent(cell);

      if (tile) {
        //if (debug) {
          //console.log('tile @', x, y);
        //}
        var positions = self.findFarthestPosition(cell, vector);
        var next      = self.cellContent(positions.next);

        // Only one merger per row traversal?
        if (next && next.value === tile.value && !next.mergedFrom) {
          var merged = new Tile(positions.next, tile.value * 2);
          merged.mergedFrom = [tile, next];

          self.insertTile(merged);
          self.removeTile(tile);

          // Converge the two tiles' positions
          tile.updatePosition(positions.next);

          // Update the score
          score += merged.value;

          // The mighty 2048 tile
          if (merged.value === 2048) {
            won = true;
          }
        } else {
          self.moveTile(tile, positions.farthest);
        }

        if (!self.positionsEqual(cell, tile)) {
          self.playerTurn = false;
          moved = true; // The tile moved from its original cell!
        }
      }
    });
  });
  return {moved: moved, score: score, won: won};
};

Grid.prototype.computerMove = function() {
  this.addRandomTile();
  this.playerTurn = true;
}

// Build a list of positions to traverse in the right order
Grid.prototype.buildTraversals = function (vector) {
  var traversals = { x: [], y: [] };

  for (var pos = 0; pos < this.size; pos++) {
    traversals.x.push(pos);
    traversals.y.push(pos);
  }

  // Always traverse from the farthest cell in the chosen direction
  if (vector.x === 1) traversals.x = traversals.x.reverse();
  if (vector.y === 1) traversals.y = traversals.y.reverse();

  return traversals;
};

Grid.prototype.findFarthestPosition = function (cell, vector) {
  var previous;

  // Progress towards the vector direction until an obstacle is found
  do {
    previous = cell;
    cell     = { x: previous.x + vector.x, y: previous.y + vector.y };
  } while (this.withinBounds(cell) &&
           this.cellAvailable(cell));

  return {
    farthest: previous,
    next: cell // Used to check if a merge is required
  };
};

Grid.prototype.movesAvailable = function () {
  return this.cellsAvailable() || this.tileMatchesAvailable();
};

Grid.prototype.positionsEqual = function (first, second) {
  return first.x === second.x && first.y === second.y;
};

Grid.prototype.toString = function() {
  string = '';
  for (var i=0; i<4; i++) {
    for (var j=0; j<4; j++) {
      if (this.cells[j][i]) {
        string += this.cells[j][i].value + ' ';
      } else {
        string += '_ ';
      }
    }
    string += '\n';
  }
  return string;
}

Grid.prototype.safeCellContent = function (cell) {
  var result = this.cellContent(cell)
  if (result == null) {
    return 0;
  }
  return result.value;
}

Grid.prototype.weightedBoardScore = function () {  
  var sums = [0,0,0,0]
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      var currBlockVal = this.safeCellContent(this.indexes[x][y])
      for (var i=0; i<4; i++){
        sums[i] += boardSetups[i][x][y]*currBlockVal;
      }
    }
  }
  return fastLog(Math.max.apply(Math, sums));
}

Grid.prototype.max = function() {
  var max = 0;
  var posX = 0;
  var posY = 0;
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (this.cellOccupied(this.indexes[x][y])) {
        var value = this.cellContent(this.indexes[x][y]).value;
        if (value > max) {
          max = value;
          posX = x;
          posY = y;
        }
      }
    }
  }
  return max;
}

// Compute the similarity of each tile on the board
// to the tiles next to them. The game goes on longer
// if you have more blocks available to merge together.
// This function complements looking for the number
// of free spaces - if you don't have many free
// spaces, you want the resulting boardSimilarityScore
// to be high, and vice versa.
Grid.prototype.boardSimilarityScore = function () {
  var sim = 0
  var blockSim;
  var currBlockVal;
  var thisBlockVal;
  for (var x=0; x<4; x++){
    for (var y=0; y<4; y++){
      if (this.cellOccupied(this.indexes[x][y])) {
        blockSim = 0;
        currBlockVal = this.safeCellContent(this.indexes[x][y]);
        // check if any of the 4 blocks availabe in one move
        // are the same as this block
        if (this.withinBounds({x:x-1, y:y})){
          thisblockVal = this.safeCellContent(this.indexes[x-1][y]);
          if (currBlockVal == thisBlockVal) {
            blockSim += 0.5;
          }
          else {
            currLog = fastLog(currBlockVal);
            thisLog = fastLog(thisBlockVal);
            diff = Math.abs(currLog - thisLog);
            if (diff <= 2) {
              blockSim += 1;
            }
            else blockSim -= (.5*diff);
          }
        }
        if (this.withinBounds({x:x, y:y-1})){
          thisblockVal = this.safeCellContent(this.indexes[x][y-1]);
          if (currBlockVal == thisBlockVal) {
            blockSim += 0.5;
          }
          else {
            currLog = fastLog(currBlockVal);
            thisLog = fastLog(thisBlockVal);
            diff = Math.abs(currLog - thisLog);
            if (diff <= 2) {
              blockSim += 1;
            }
            else blockSim -= (.5*diff);
          }
        }
        if (this.withinBounds({x:x+1, y:y})){
          thisblockVal = this.safeCellContent(this.indexes[x+1][y]);
          if (currBlockVal == thisBlockVal) {
            blockSim += 0.5;
          }
          else {
            currLog = fastLog(currBlockVal);
            thisLog = fastLog(thisBlockVal);
            diff = Math.abs(currLog - thisLog);
            if (diff <= 2) {
              blockSim += 1;
            }
            else blockSim -= (.5*diff);
          }
        }
        if (this.withinBounds({x:x, y:y+1})) {
          thisblockVal = this.safeCellContent(this.indexes[x][y+1]);
          if (currBlockVal == thisBlockVal) {
            blockSim += 0.5;
          }
          else {
            currLog = fastLog(currBlockVal);
            thisLog = fastLog(thisBlockVal);
            diff = Math.abs(currLog - thisLog);
            if (diff <= 2) {
              blockSim += 1;
            }
            else blockSim -= (.5*diff);
          }
        }
        // weight the block similarity by the log base 2 value of
        // the block, since similar blocks of greater value are more
        // valuable.
        sim += (blockSim)// * fastLog(currBlockVal));
      }
    }
  }
  return fastLog(sim);
}

// calculate how "monotonic" the board is -- it's best if the board
// focuses large amount values in one region of the board and
// small values in another region of the board. The board gets
// +1 for each column that matches the overall "trend" of the board
Grid.prototype.monotoneBoardScore = function () {
  var expectedTrend = 0;
  var trendSum = 0;
  for (var x=0; x<4; x++){
    var currentTrend = 0;
    //console.log(this.indexes[x][0])
    //console.log(this.safeCellContent(this.indexes[x][0]))
    var lastVal = this.safeCellContent(this.indexes[x][0]);
    var thisVal;
    for (var y=1; y<4; y++){
      thisVal = this.safeCellContent(this.indexes[x][y]);
      if (lastVal > thisVal && currentTrend <= 0) {
        currentTrend = -1;
      }
      else if (lastVal == thisVal) {
        currentTrend = 0;
      }
      else if (lastVal < thisVal && currentTrend >= 0
               && currentTrend < 2) {
        currentTrend = 1;
      }
      else {
        // the column is not following a trend of increasing or
        // decreasing. Set currentTrend to 100 to indicate that
        // this column isn't monotonic
        currentTrend = 100;
      }
      lastVal = thisVal;
    }
    if (expectedTrend == currentTrend || (expectedTrend == 0
              && currentTrend != 100) || currentTrend == 0) {
      trendSum += 1;
      // set the expectedTrend of the next column accordingly
      expectedTrend = currentTrend;
    }
    else if (expectedTrend != currentTrend && currentTrend != 100) {
      // this column didn't follow the expected trend, but has some
      // sort of trend going. Add .25 to the trendSum to indicate
      // some order in the column, and see if the rest of the
      // columns on the board match this trend.
      trendSum += .25;
      expectedTrend = currentTrend;
    }
    else {
      // there's no order in the column. Set expecteTrend to 0 so that
      // we can find a trend in the next column if it exists.
      expectedTrend = 0;
    }
  }
  expectedTrend = 0; // restart
  for (var y = 0; y < 4; y++){
    lastVal = this.safeCellContent(this.indexes[0][y]);
    thisVal = 0;
    for (var x = 1; x < 4; x++) {
      thisVal = this.safeCellContent(this.indexes[x][y]);
      if (lastVal > thisVal && currentTrend <= 0) {
        currentTrend = -1;
      }
      else if (lastVal == thisVal) {
        currentTrend = 0;
      }
      else if (lastVal < thisVal && currentTrend >= 0
               && currentTrend < 2) {
        currentTrend = 1;
      }
      else {
        // the column is not following a trend of increasing or
        // decreasing. Set currentTrend to 100 to indicate that
        // this column isn't monotonic
        currentTrend = 100;
      }
      lastVal = thisVal;
    }
    if (expectedTrend == currentTrend || (expectedTrend == 0
              && currentTrend != 100) || currentTrend == 0) {
      trendSum += 1;
      // set the expectedTrend of the next column accordingly
      expectedTrend = currentTrend;
    }
    else if (expectedTrend != currentTrend && currentTrend != 100) {
      // this column didn't follow the expected trend, but has some
      // sort of trend going. Add .25 to the trendSum to indicate
      // some order in the column, and see if the rest of the
      // columns on the board match this trend.
      trendSum += 0.25;
      expectedTrend = currentTrend;
    }
    else {
      // there's no order in the column. Set expecteTrend to 0 so that
      // we can find a trend in the next column if it exists.
      expectedTrend = 0;
    }
  }
  return trendSum;
}

// check for win
Grid.prototype.isWin = function() {
  for (var x=0; x<4; x++) {
    for (var y=0; y<4; y++) {
      if (this.cellOccupied(this.indexes[x][y])) {
        if (this.cellContent(this.indexes[x][y]).value == 2048) {
          return true;
        }
      }
    }
  }
  return false;
}