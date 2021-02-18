window.addEventListener('load', () => {
  document.body.scrollTop = document.body.scrollHeight;
});

//Set email preferences
function emailPrefs(frequency) {
  $.post('/subscribe/', () => {
    if (frequency === 'none') document.getElementById("subscribe").innerHTML = "<p>Well, all right. We won't ask you again. Hopefully you'll be coming back on your own?</p>";
    else {
      window.open(JSON.parse(document.getElementById('subscribeMessages').innerText)[frequency].link, '_blank');
      document.getElementById("subscribe").innerHTML = "<p>That's the entire story so far. Come back for a new chunk every weekday! (there's a countdown in the footer)</p>";
    }
  });
}

//Hits
let flashesRead = [];

async function logHit(entries, observer) {
  entries.forEach((entry) => {
    if (entry.isIntersecting && flashesRead.indexOf(entry.target.dataset.id) === -1) {
      flashesRead.push(entry.target.dataset.id);
      $.post('/flashes/' + entry.target.dataset.id + '/hit/');
    }
  });
};

const hitObserver = new IntersectionObserver(logHit);

document.querySelectorAll('article.flash').forEach((element) =>{
  hitObserver.observe(element);
});
