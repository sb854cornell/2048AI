function KeyboardInputManager() {
  this.events = {};

  this.listen();
}

KeyboardInputManager.prototype.on = function (event, callback) {
  if (!this.events[event]) {
    this.events[event] = [];
  }
  this.events[event].push(callback);
};

KeyboardInputManager.prototype.emit = function (event, data) {
  var callbacks = this.events[event];
  console.log(this.events);
  if (callbacks) {
    callbacks.forEach(function (callback) {
      callback(data);
    });
  }
};

KeyboardInputManager.prototype.listen = function () {
  var self = this;

  var map = {
    38: 0, // Up
    39: 1, // Right
    40: 2, // Down
    37: 3, // Left
    75: 0, // vim keybindings
    76: 1,
    74: 2,
    72: 3
  };

  document.addEventListener("keydown", function (event) {
    var modifiers = event.altKey || event.ctrlKey || event.metaKey ||
                    event.shiftKey;
    var mapped    = map[event.which];

    if (!modifiers) {
      if (mapped !== undefined) {
        event.preventDefault();
        var feedbackContainer  = document.getElementById('feedback-container');
        feedbackContainer.innerHTML = ' ';
        self.emit("move", mapped);
      }

      if (event.which === 32) self.restart.bind(self)(event);
    }
  });

  var retry = document.getElementsByClassName("retry-button")[0];
  retry.addEventListener("click", this.restart.bind(this));

  var runEMButton = document.getElementById('run-em-button');
  runEMButton.addEventListener('click', function(e) {
    e.preventDefault();
    self.emit('run-em');
  });

  var runMMButton = document.getElementById('run-mm-button');
  runMMButton.addEventListener('click', function(e) {
    e.preventDefault();
    self.emit('run-mm');
  });

  var runIDDFSButton = document.getElementById('run-iddfs-button');
  runIDDFSButton.addEventListener('click', function(e) {
    e.preventDefault();
    self.emit('run-iddfs');
  });

  var runRButton = document.getElementById('run-r-button');
  runRButton.addEventListener('click', function(e) {
    e.preventDefault();
    self.emit('run-r');
  });

  var runPRButton = document.getElementById('run-pr-button');
  runPRButton.addEventListener('click', function(e) {
    e.preventDefault();
    self.emit('run-pr');
  });
};

KeyboardInputManager.prototype.restart = function (event) {
  event.preventDefault();
  this.emit("restart");
};
