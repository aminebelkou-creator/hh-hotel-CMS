/**
 * The gallery lightbox: a native <dialog> per gallery, opened by the photo links (which work as
 * plain links without JavaScript). Arrow keys and swipe move between photos, Esc or a tap outside
 * closes, focus returns to the link. Under 1 KB, inline, no library; respects reduced motion via CSS.
 */
export const LIGHTBOX_SCRIPT = `(function(){var g=document.currentScript.previousElementSibling;if(!g||g.dataset.lb)return;g.dataset.lb='1';
var links=[].slice.call(g.querySelectorAll('a.hh-gallery-link'));if(!links.length)return;
var d=document.createElement('dialog');d.className='hh-lightbox';d.innerHTML='<button class="hh-lb-close" type="button" aria-label="'+g.dataset.close+'">&times;</button><button class="hh-lb-prev" type="button" aria-label="'+g.dataset.prev+'">&#8249;</button><figure><img alt=""><figcaption></figcaption></figure><button class="hh-lb-next" type="button" aria-label="'+g.dataset.next+'">&#8250;</button>';
g.appendChild(d);var img=d.querySelector('img'),cap=d.querySelector('figcaption'),i=0,x0=null;
function show(n){i=(n+links.length)%links.length;var a=links[i];img.src=a.href;img.alt=a.dataset.alt||'';cap.textContent=a.dataset.alt||'';}
links.forEach(function(a,n){a.addEventListener('click',function(e){e.preventDefault();show(n);d.showModal();});});
d.querySelector('.hh-lb-close').addEventListener('click',function(){d.close();});
d.querySelector('.hh-lb-prev').addEventListener('click',function(){show(i-1);});
d.querySelector('.hh-lb-next').addEventListener('click',function(){show(i+1);});
d.addEventListener('click',function(e){if(e.target===d)d.close();});
d.addEventListener('keydown',function(e){if(e.key==='ArrowRight')show(i+1);if(e.key==='ArrowLeft')show(i-1);});
d.addEventListener('touchstart',function(e){x0=e.touches[0].clientX;},{passive:true});
d.addEventListener('touchend',function(e){if(x0===null)return;var dx=e.changedTouches[0].clientX-x0;x0=null;if(dx>40)show(i-1);else if(dx<-40)show(i+1);},{passive:true});
d.addEventListener('close',function(){links[i].focus();});})();`
