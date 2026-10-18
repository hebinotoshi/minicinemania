const API_URL = 'https://script.google.com/macros/s/AKfycbwAgz2vJvYtR2yn8gEIatL-ki7aNq5HvgGmPLiwIN5AxTQljpXu9NNAQiAvV66FOHYH/exec';

var DATA = null, selDate = null, selArea = 'All';
var DOW = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

function esc(s) {
  return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
    return { '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c];
  });
}

function addDays(key, n) {
  var p = key.split('-').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n));
  return d.toISOString().slice(0, 10);
}

function label(key) {
  var p = key.split('-').map(Number);
  var d = new Date(Date.UTC(p[0], p[1] - 1, p[2]));
  return p[1] + '/' + p[2] + ' (' + DOW[d.getUTCDay()] + ')';
}

function render() {
  var dates = [];
  for (var i = 0; i < 7; i++) dates.push(addDays(DATA.today, i));
  document.getElementById('dates').innerHTML = dates.map(function (d) {
    return '<button class="chip' + (d === selDate ? ' on' : '') + '" data-date="' + d + '">' +
      (d === DATA.today ? 'Today' : label(d)) + '</button>';
  }).join('');

  var areas = ['All'];
  DATA.theaters.forEach(function (t) { if (areas.indexOf(t.area) < 0) areas.push(t.area); });
  document.getElementById('areas').innerHTML = areas.map(function (a) {
    return '<button class="chip' + (a === selArea ? ' on' : '') + '" data-area="' + esc(a) + '">' + esc(a) + '</button>';
  }).join('');

  var html = '';
  DATA.theaters.forEach(function (t) {
    if (selArea !== 'All' && t.area !== selArea) return;
    var films = t.films.filter(function (f) { return f.times && f.times[selDate] && f.times[selDate].length; })
      .sort(function (a, b) { return a.times[selDate][0].localeCompare(b.times[selDate][0]); });
    if (!films.length) return;
    html += '<section class="theater"><h2><a href="' + esc(t.url) + '" target="_blank" rel="noopener">' + esc(t.name) +
      '</a><span>' + esc(t.area) + '</span></h2>';
    films.forEach(function (f) {
      var titleHtml = f.url 
        ? '<a href="' + esc(f.url) + '" target="_blank" rel="noopener">' + esc(f.title) + '</a>' 
        : esc(f.title);

      html += '<div class="film">' +
        (f.poster ? '<img loading="lazy" src="' + esc(f.poster) + '" alt="">' : '<div class="noimg">🎞️</div>') +
        '<div><div class="title">' + titleHtml + '</div>' +
        (f.info ? '<div class="info">' + esc(f.info) + '</div>' : '') +
        '<div class="times">' + f.times[selDate].map(function (x) { return '<b>' + esc(x) + '</b>'; }).join('') + '</div>' +
        '</div></div>';
    });
    html += '</section>';
  });
  document.getElementById('out').innerHTML = html || '<div class="empty">No screenings found.</div>';
}

document.addEventListener('click', function (e) {
  var b = e.target.closest('.chip');
  if (!b) return;
  if (b.dataset.date) selDate = b.dataset.date;
  if (b.dataset.area) selArea = b.dataset.area;
  render();
});

fetch(API_URL)
  .then(function (res) { return res.json(); })
  .then(function (d) { DATA = d; selDate = d.today; render(); })
  .catch(function (err) {
    document.getElementById('out').innerHTML = '<div class="empty">Error loading schedule data.</div>';
  });
