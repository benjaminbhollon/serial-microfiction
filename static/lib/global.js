//Declare variables
const releasedOn = JSON.parse(document.getElementById("releasedOn").innerText);
const now = new Date();
const offset = now.getTimezoneOffset() * 1000 * 60;
const daysToAdd = ((releasedOn.find(day => day > now.getUTCDay()) === undefined ? releasedOn[0] : releasedOn.find(day => day > now.getUTCDay())) - now.getUTCDay() + 7) % 7;
const countdownTo = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToAdd);

//Countdown to next flash
function updateCountdown() {
  const now = new Date();
  const daysLeft = Math.floor((countdownTo - now - offset) / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((countdownTo - now - offset - (daysLeft * 1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((countdownTo - now - offset - (daysLeft * 1000 * 60 * 60 * 24) - (hoursLeft * 1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((countdownTo - now - offset - (daysLeft * 1000 * 60 * 60 * 24) - (hoursLeft * 1000 * 60 * 60) - (minutesLeft * 1000 * 60)) / 1000);
  document.getElementById("countdown").innerText = (daysLeft ? daysLeft + " days, " : "") + (!(!hoursLeft && !daysLeft) ? hoursLeft + " hours, " : "") + (!(!minutesLeft && !hoursLeft && !daysLeft) ? minutesLeft + " minutes, " : "") + secondsLeft + " seconds";
  if (countdownTo - now - offset < 0) document.getElementById("countdown").innerHTML = "<a href='/?s=#latest'>no time at all</a>";
}
setInterval(updateCountdown, 1000);
updateCountdown();
