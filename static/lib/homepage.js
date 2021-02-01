window.addEventListener('load', () => {
  document.body.scrollTop = document.body.scrollHeight;
});

function emailPrefs(frequency) {
  if (frequency === 'none') {
    $.post("/subscribe/none/", () => {
      document.getElementById("subscribe").innerHTML = `
        <p>Well, all right. We won't ask you again. Maybe you'll remember to come back on your own?</p>
      `;
    });
    return false;
  }
  location.href = `/subscribe/${frequency}/`;
}
