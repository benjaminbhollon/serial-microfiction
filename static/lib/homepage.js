//Declare variables
const releasedOn = JSON.parse(document.getElementById("releasedOn").innerText);

//Countdown to next flash
setInterval(() => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 1000 * 60;
  const daysToAdd = ((releasedOn.find(day => day > now.getUTCDay()) === undefined ? releasedOn[0] : releasedOn.find(day => day > now.getUTCDay())) - now.getUTCDay() + 7) % 7;
  const countdownTo = new Date(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + daysToAdd);
  const daysLeft = Math.floor((countdownTo - now - offset) / (1000 * 60 * 60 * 24));
  const hoursLeft = Math.floor((countdownTo - now - offset - (daysLeft * 1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
  const minutesLeft = Math.floor((countdownTo - now - offset - (daysLeft * 1000 * 60 * 60 * 24) - (hoursLeft * 1000 * 60 * 60)) / (1000 * 60));
  const secondsLeft = Math.floor((countdownTo - now - offset - (daysLeft * 1000 * 60 * 60 * 24) - (hoursLeft * 1000 * 60 * 60) - (minutesLeft * 1000 * 60)) / 1000);
  document.getElementById("countdown").innerText = daysLeft + " days, " + hoursLeft + " hours, " + minutesLeft + " minutes, " + secondsLeft + " seconds";
}, 1000);
