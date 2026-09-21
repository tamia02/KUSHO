// Used only by export.mjs: the markup + script that makes /search?q= work on the static build.
// The Shopify theme itself is untouched; on a real store Shopify's own search does this.
export const staticSearchMarkup = `
<div class="page-width" id="kusho-static-search" style="padding-bottom:6.4rem"></div>
<style>
#kusho-static-search .kss__count{margin:0 0 2.4rem;color:var(--stone);font-family:var(--font-ui);font-size:var(--fs-label);letter-spacing:var(--track-label);text-transform:uppercase;text-align:center}
#kusho-static-search .kss__grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:2.4rem 1.2rem;margin:0;padding:0;list-style:none}
@media(min-width:990px){#kusho-static-search .kss__grid{grid-template-columns:repeat(4,minmax(0,1fr));gap:4rem 2.4rem}}
#kusho-static-search a{display:block;color:var(--ink);text-decoration:none}
#kusho-static-search .kss__img{display:block;width:100%;aspect-ratio:1;object-fit:cover;background:var(--foam)}
#kusho-static-search .kss__title{margin:1.2rem 0 .4rem;font-family:var(--font-ui);font-size:var(--fs-small);letter-spacing:.04em;text-transform:uppercase}
#kusho-static-search .kss__price{font-family:var(--font-ui);font-size:var(--fs-price)}
#kusho-static-search .kss__was{margin-left:.6rem;color:var(--stone);text-decoration:line-through}
#kusho-static-search .kss__none{text-align:center;color:var(--stone)}
</style>
<script>
(function(){
  var q=(new URLSearchParams(location.search).get('q')||'').trim();
  var box=document.getElementById('kusho-static-search'); if(!box) return;
  var input=document.querySelector('.template-search__search input[type=search], .search__input'); if(input&&q) input.value=q;
  if(!q) return;
  fetch('/search-index.json').then(function(r){return r.json()}).then(function(items){
    var terms=q.toLowerCase().split(/\\s+/).filter(Boolean);
    var hits=items.filter(function(p){var hay=(p.title+' '+p.type+' '+p.tags+' '+p.handle).toLowerCase();return terms.every(function(t){return hay.indexOf(t)>=0})});
    var esc=function(s){return String(s).replace(/</g,'&lt;')};
    var inr=function(n){return '\\u20B9'+Number(n).toLocaleString('en-IN')};
    box.innerHTML = hits.length
      ? '<p class="kss__count">'+hits.length+' result'+(hits.length===1?'':'s')+' for \\u201c'+esc(q)+'\\u201d</p><ul class="kss__grid">'+hits.map(function(p){return '<li><a href="'+p.url+'"><img class="kss__img" src="'+p.image+'" alt="" loading="lazy"><p class="kss__title">'+esc(p.title)+'</p><p class="kss__price">'+inr(p.price)+(p.compare>p.price?'<span class="kss__was">'+inr(p.compare)+'</span>':'')+'</p></a></li>'}).join('')+'</ul>'
      : '<p class="kss__none">Nothing matches \\u201c'+esc(q)+'\\u201d. Try \\u201cpillow\\u201d, \\u201ccushion\\u201d or \\u201ccar\\u201d.</p>';
  });
})();
</script>`;
