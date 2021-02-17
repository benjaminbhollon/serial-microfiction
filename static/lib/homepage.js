window.addEventListener('load', () => {
  document.body.scrollTop = document.body.scrollHeight;
});

function emailPrefs(frequency) {
  if (frequency === 'none') {
    $.post('/subscribe/none/', () => {
      document.getElementById("subscribe").innerHTML = `
        <p>Well, all right. We won't ask you again. Hopefully you'll be coming back on your own?</p>
      `;
    });
    return false;
  }
  location.href = `/subscribe/${frequency}/`;
}

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
