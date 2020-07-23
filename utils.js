// Utility Functions

// Split and send args without first argument, useful for commands
exports.getArgs = (string, withInitial = false) =>
  string.split(' ').splice(withInitial ? 0 : 1)
