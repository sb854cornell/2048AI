var numGames = 0;

function GameManager(size, InputManager, Actuator) {
  this.size         = size; // Size of the grid
  this.inputManager = new InputManager;
  this.actuator     = new Actuator;

  this.running      = false;
  this.whichAI      = '';
  this.moveAgainTimeout;

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));

  this.inputManager.on('think', function() {
    var best = this.ai.getBest();
    this.actuator.showHint(best.move);
  }.bind(this));

  // Listen for the input manager to send a button click event
  this.inputManager.on('run-em', function() {
    if (this.running && this.whichAI === 'run-em') {
      // This AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = false;

    } else if (this.running) {
      // A different AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = true;
      this.whichAI = 'run-em';
      this.run('run-em');

    } else {
      // Nothing is running
      this.running = true;
      this.whichAI = 'run-em';
      this.run('run-em');
    }
  }.bind(this));

  this.inputManager.on('run-mm', function() {
    if (this.running && this.whichAI === 'run-mm') {
      // This AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = false;

    } else if (this.running) {
      // A different AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = true;
      this.whichAI = 'run-mm';
      this.run('run-mm');

    } else {
      // Nothing is running
      this.running = true;
      this.whichAI = 'run-mm';
      this.run('run-mm');
    }
  }.bind(this));

  this.inputManager.on('run-iddfs', function() {
    if (this.running && this.whichAI === 'run-iddfs') {
      // This AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = false;

    } else if (this.running) {
      // A different AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = true;
      this.whichAI = 'run-iddfs';
      this.run('run-iddfs');

    } else {
      // Nothing is running
      this.running = true;
      this.whichAI = 'run-iddfs';
      this.run('run-iddfs');
    }
  }.bind(this));

  this.inputManager.on('run-r', function() {
    if (this.running && this.whichAI === 'run-r') {
      // This AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = false;

    } else if (this.running) {
      // A different AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = true;
      this.whichAI = 'run-r';
      this.run('run-r');

    } else {
      // Nothing is running
      this.running = true;
      this.whichAI = 'run-r';
      this.run('run-r');
    }
  }.bind(this));

  this.inputManager.on('run-pr', function() {
    if (this.running && this.whichAI === 'run-pr') {
      // This AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = false;

    } else if (this.running) {
      // A different AI is running
      window.clearTimeout(this.moveAgainTimeout);
      this.running = true;
      this.whichAI = 'run-pr';
      this.run('run-pr');

    } else {
      // Nothing is running
      this.running = true;
      this.whichAI = 'run-pr';
      this.run('run-pr');
    }
  }.bind(this));

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function () {
  this.actuator.restart();
  this.running = false;
  this.setup();
};

// Set up the game
GameManager.prototype.setup = function () {
  this.grid         = new Grid(this.size);
  this.grid.addStartTiles();

  this.ai           = new AI(this.grid);

  this.score        = 0;
  this.over         = false;
  this.won          = false;

  // Update the actuator
  this.actuate();
};


// Sends the updated grid to the actuator
GameManager.prototype.actuate = function () {
  this.actuator.actuate(this.grid, {
    score: this.score,
    over:  this.over,
    won:   this.won
  });
};

// makes a given move and updates state
GameManager.prototype.move = function(direction) {
  var result = this.grid.move(direction);
  this.score += result.score;

  if (result.moved) {
      this.grid.computerMove();
  } /*else {
    this.won = true;
    console.log("game over");
    console.log("Max tile: "+this.grid.max());
    console.log("Avg time per move: "+this.ai.avgTime);
    console.log("Score: "+this.score);
  }*/

  //console.log(this.grid.valueSum());

  if (!this.grid.movesAvailable()) {
    this.over = true; // Game over!
    console.log("game over");
    console.log("Max tile: "+this.grid.max());
    console.log("Avg time per move: "+this.ai.avgTime);
    console.log("Total Time for this run: "+this.ai.totalTime);
    console.log("Number of moves: "+this.ai.numMoves);
    console.log("Score: "+this.score);
    console.log("new game");
    this.restart();
    numGames ++;
    if (numGames <= 30) {
      this.running = true;
      this.run(this.whichAI);
    }
  }
  this.actuate();
}

// moves continuously until game is over
GameManager.prototype.run = function(which) {
  var best;

   if (which === 'run-em') {
     best = this.ai.getBestExpectimax();

   } else if (which === 'run-mm') {
     best = this.ai.getBestMinimax();

   } else if (which === 'run-iddfs') {
     best = this.ai.getBestIDDFS();

   } else if (which === 'run-r') {
     best = this.ai.getRandom();

   } else if (which === 'run-pr') {
     best = this.ai.getPartiallyRandom();
   }
  //best = this.ai.getBestExpectimax();

  this.move(best.move);
  //var timeout = animationDelay;
  if (this.running && !this.over) {
    this.run(this.whichAI);
    //var self = this;
    //this.moveAgainTimeout = setTimeout(function() {
    //  self.run(self.whichAI);
    //}, timeout);
  }
}
