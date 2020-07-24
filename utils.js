// Utility Functions

// Split and send args without first argument, useful for commands
exports.getArgs = (string, withInitial = false) =>
  string.split(' ').splice(withInitial ? 0 : 1)

// Utility function to add commas to numbers
// Example -> 23456, 23,456
exports.addSeprator = value => {
  let nums = value.replace(/,/g, '')
  if (!nums) return
  return parseInt(nums).toLocaleString()
}

// Get hours, minutes passed
// Date in string
// TODO: fix xhrs 0min, 0hrs Xmin
exports.getHoursMin = string => {
  const message = []
  const milliseconds = Math.floor((new Date() - new Date(string)) / 1000)
  let minutes = Math.floor(milliseconds / 60)
  const hours = Math.floor(minutes / 60)
  minutes -= hours * 60
  if (hours) message.push(`${hours}${hours > 1 ? 'hrs' : 'hr'}`)
  if (minutes) message.push(`${minutes}${minutes > 1 ? 'mins' : 'min'}`)
  if (hours == 0 && minutes == 0) message.push('few seconds')
  return message.join(' ')
}
