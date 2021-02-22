// Set email preferences
function emailPrefs() {
  $.post('/subscribe/', () => {
    if (this.dataset.freq === 'none') document.getElementById('subscribe').innerHTML = "<p>Well, all right. We won't ask you again. Hopefully you'll be coming back on your own?</p>";
    else {
      document.getElementById('subscribe').innerHTML = "<p>That's the entire story so far. Come back for a new chunk soon! (there's a countdown in the footer)</p>";
    }
  });
}

// Hits
const flashesRead = [];

async function hit(id) {
  flashesRead.push(id);
  $.post(`/flashes/${id}/hit/`);
}

async function scrolledOver(entries) {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      history.pushState({ date: entry.target.id }, document.title, `#${entry.target.id}`);
      if (flashesRead.indexOf(entry.target.dataset.id) === -1) hit(entry.target.dataset.id);
    }
  });
}

const hitObserver = new IntersectionObserver(scrolledOver, {
  threshold: 0.5,
});

document.querySelectorAll('article.flash').forEach((element) => {
  hitObserver.observe(element);
});

window.addEventListener('load', () => {
  document.body.scrollTop = document.body.scrollHeight;
  $('#subscribe .button').click(emailPrefs);
});
