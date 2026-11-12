(function(){


  var tabs=[].slice.call(document.querySelectorAll('.tab'));
  var TABHASH={'t-cursos':'cursos','t-talleres':'talleres','t-equipo':'equipo','t-sumate':'sumate'};
  function show(t,keepHash){
    if(!t) return;
    tabs.forEach(function(x){
      var on=x===t; x.setAttribute('aria-selected',on?'true':'false');
      document.getElementById(x.getAttribute('aria-controls')).hidden=!on;
    });
    if(!keepHash && TABHASH[t.id]){try{history.replaceState(null,'','#'+TABHASH[t.id]);}catch(e){}}
  }
  tabs.forEach(function(t){t.addEventListener('click',function(){show(t)})});

  document.querySelectorAll('[data-tab]').forEach(function(a){
    a.addEventListener('click',function(){
      var t=document.getElementById(a.dataset.tab);
      if(t){show(t,true);}
    });
  });
  // Abrir la pestaña que corresponde al link (#talleres, #agendar, #sumate...)
  var HASHTAB={cursos:'t-cursos',formaciones:'t-cursos','cursos-form':'t-cursos','edicion-vs':'t-cursos',
    talleres:'t-talleres','taller-form':'t-talleres',equipo:'t-equipo',agendar:'t-equipo',supervision:'t-equipo',sumate:'t-sumate'};
  function fromHash(){
    var h=(location.hash||'').slice(1); var id=HASHTAB[h]; if(!id) return;
    show(document.getElementById(id),true);
    var target=document.getElementById(h);
    if(h==='edicion-vs'&&target) target.open=true;
    if(target&&!/^(cursos|talleres|equipo)$/.test(h)) setTimeout(function(){target.scrollIntoView();},60);
    else{var tl=document.getElementById('formaciones'); if(tl) setTimeout(function(){tl.scrollIntoView();},60);}
  }
  if(tabs.length){fromHash(); window.addEventListener('hashchange',fromHash);}
  document.querySelectorAll('[data-motivo]').forEach(function(a){
    a.addEventListener('click',function(){
      if(!document.getElementById('c-motivo')) return;
      document.getElementById('c-motivo').value=a.dataset.motivo;
      var c=document.getElementById('c-curso');
      c.value=a.dataset.curso||(a.dataset.motivo==='clase'?'No aplica':c.value);
    });
  });
  var SF='https://splitforms.com/api/submit';
  var SUMATE_KEY='28ae80e7fdb540c5a15655d8b5a0ff84'; // clave de SplitForms del formulario «Sumate a TEKOHA»
  function txt(el){
    if(!el.tagName){return [].filter.call(el,function(x){return x.checked;}).map(function(x){return x.value;}).join(', ');}
    if(el.type==='checkbox') return el.checked?el.value:'';
    return el.tagName==='SELECT'?el.options[el.selectedIndex].text:el.value.trim();
  }
  function fail(pre,why){
    var el=document.getElementById(pre+'-fail'); el.hidden=false;
    var d=el.querySelector('.why'); if(!d){d=document.createElement('small');d.className='why';d.style.cssText='display:block;margin-top:6px;opacity:.75';el.appendChild(d);}
    d.textContent='Detalle técnico: '+why;
  }
  function wire(id,pre,key,subject,labels,valid){
    var form=document.getElementById(id); if(!form) return;
    var btn=form.querySelector('button[type=submit]');
    form.addEventListener('submit',function(e){
      e.preventDefault();
      var ok=valid(form);
      document.getElementById(pre+'-err').hidden=!!ok;
      document.getElementById(pre+'-done').hidden=true;
      document.getElementById(pre+'-fail').hidden=true;
      if(!ok) return;
      var body={access_key:key,subject:subject,from_name:'Web Victoria Marichal',botcheck:form.botcheck.value};
      Object.keys(labels).forEach(function(n){var el=form.elements[n]; if(el) body[labels[n]]=txt(el);});
      if(!key){fail(pre,'falta la clave del formulario'); return;}
      var c=(form.elements.contacto&&form.elements.contacto.value.trim())||(form.elements.mail&&form.elements.mail.value.trim());
      if(c&&c.indexOf('@')>0) body.replyto=c;
      var old=btn.textContent; btn.disabled=true; btn.textContent='Enviando…';
      fetch(SF,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},body:JSON.stringify(body)})
        .then(function(r){return r.json().catch(function(){return {success:false,message:'error '+r.status};});})
        .then(function(d){
          if(d&&d.success){form.reset();document.getElementById(pre+'-done').hidden=false;}
          else fail(pre,(d&&d.message)||'respuesta sin éxito');
        })
        .catch(function(err){fail(pre,'sin conexión con el servicio'+(err&&err.message?' ('+err.message+')':''));})
        .then(function(){btn.disabled=false;btn.textContent=old;});
    });
  }
  wire('agenda-form','f','61aa27133a2e4b7fb2e958afae502466','Nueva solicitud de consulta psicoterapéutica',
    {nombre:'Nombre',contacto:'Mail o WhatsApp',psi:'Psicóloga',modo:'Modalidad',motivo:'Motivo de consulta'},
    function(f){return f.nombre.value.trim()&&f.contacto.value.trim()&&document.getElementById('f-ok').checked;});
  wire('sup-form','sup','61aa27133a2e4b7fb2e958afae502466','Nueva solicitud de supervisión EMDR (Lucía Vitancurt)',
    {nombre:'Nombre',contacto:'Mail o WhatsApp',prof:'Profesión',emdr:'Formación en EMDR',tipo:'Modalidad de supervisión',modo:'Presencial o virtual',msg:'Qué quiere trabajar'},
    function(f){return f.nombre.value.trim()&&f.contacto.value.trim();});
  wire('t-form','t','beee97f61d5643c5ba4dd0d593f8fbf9','Nueva solicitud de taller, charla o capacitación',
    {nombre:'Nombre',org:'Institución u organización',contacto:'Mail o teléfono',tipo:'Tipo de propuesta',tema:'Tema',modo:'Modalidad',personas:'Cantidad de personas',fecha:'Fecha tentativa',msg:'Mensaje'},
    function(f){return f.nombre.value.trim()&&f.org.value.trim()&&f.contacto.value.trim();});
  wire('c-form','c','41916339f65841b5bb9991b5eaee2487','Nueva consulta sobre cursos y clases',
    {nombre:'Nombre',contacto:'Mail o WhatsApp',motivo:'Motivo',curso:'Curso',org:'Institución',msg:'Mensaje'},
    function(f){return f.nombre.value.trim()&&f.contacto.value.trim();});
  wire('s-form','s',SUMATE_KEY,'Nueva postulación para sumarse a TEKOHA',
    {nombre:'Nombre y apellido',mail:'Mail',tel:'WhatsApp',prof:'Profesión',formacion:'Formación',trauma:'Formación en trauma',genero:'Formación en género y diversidad',areas:'Le interesa participar en',modo:'Modalidad',poblacion:'Población',cv:'CV',motivo:'Por qué quiere sumarse'},
    function(f){return f.nombre.value.trim()&&f.mail.value.trim()&&f.formacion.value.trim()&&f.motivo.value.trim()&&document.getElementById('s-ok').checked;});
  document.querySelectorAll('[data-psi]').forEach(function(l){
    l.addEventListener('click',function(){var sel=document.getElementById('f-psi'); if(sel) sel.value=l.dataset.psi;});
  });
  document.querySelectorAll('[data-open]').forEach(function(a){
    a.addEventListener('click',function(){var d=document.getElementById(a.dataset.open); if(d) d.open=true;});
  });

  if(document.getElementById('prows')){
  var LD='https://ladiaria.com.uy/feminismos/articulo/';
  var P=[
    ['2026-10','Caras y Caretas','Prensa','Proyecto Ikové reclama que delitos sexuales contra menores sean imprescriptibles','','https://www.carasycaretas.com.uy/sociedad/proyecto-ikove-reclama-que-delitos-sexuales-contra-menores-sean-imprescriptibles-n100536'],
    ['2026-08','Equality Now','Prensa','Comunidades que sostienen: respuestas colectivas frente a la violencia sexual contra niñas, niños y adolescentes en América Latina','La voz de Uruguay desde Proyecto Ikové','https://equalitynow.org/es/news/news-and-insights-es/comunidades-que-sostienen-respuestas-colectivas-frente-a-la-violencia-sexual-contra-ninas-ninos-y-adolescentes-en-america-latina/'],
    ['2026-08','la diaria','Prensa','Investigación concluye que persisten déficits estructurales que limitan el acceso a la justicia de víctimas de violencia sexual','',LD+'2026/8/investigacion-concluye-que-persisten-deficits-estructurales-que-limitan-el-acceso-a-la-justicia-de-victimas-de-violencia-sexual/'],
    ['2026-05','Teledoce · Esta boca es mía','TV y video','Abusador del Prado: Policía difunde foto para identificarlo','','https://www.teledoce.com/programas/esta-boca-es-mia/abusador-del-prado-policia-difunde-foto-para-identificarlo/'],
    ['2026-02','la diaria','Prensa','Control coercitivo: una forma de violencia de género sutil cuya detección eficaz podría contribuir a prevenir femicidios','',LD+'2026/2/control-coercitivo-una-forma-de-violencia-de-genero-sutil-cuya-deteccion-eficaz-podria-contribuir-a-prevenir-femicidios/'],
    ['2025-10','la diaria','Prensa','Referentes feministas plantearon estrategias frente al recrudecimiento de la violencia y el avance de la extrema derecha','',LD+'2025/10/referentes-feministas-plantearon-estrategias-frente-al-recrudecimiento-de-la-violencia-y-el-avance-de-la-extrema-derecha/'],
    ['2025-10','la diaria · Cultura','Prensa','La obra «Jauría», sobre el caso español de La Manada, estrena su versión uruguaya','','https://ladiaria.com.uy/cultura/articulo/2025/10/la-obra-jauria-sobre-el-caso-espanol-de-la-manada-estrena-su-version-uruguaya/'],
    ['2025-08','la diaria','Prensa','Imprescriptibilidad de delitos sexuales y tipificación del suicidio femicida: dos proyectos de ley que ubican a las víctimas en el centro','',LD+'2025/8/imprescriptibilidad-de-delitos-sexuales-y-tipificacion-del-suicidio-femicida-dos-proyectos-de-ley-que-ubican-a-las-victimas-en-el-centro/'],
    ['2025-08','la diaria','Prensa','Cosse se refirió a un parlamento de puertas abiertas para que avance el proyecto de imprescriptibilidad de los delitos sexuales','',LD+'2025/8/cosse-se-refirio-a-un-parlamento-de-puertas-abiertas-para-que-avance-el-proyecto-de-imprescriptibilidad-de-los-delitos-sexuales/'],
    ['2025-07','la diaria','Prensa','Presentarán proyecto de ley para tipificar y sancionar la inducción al suicidio femicida en Uruguay','',LD+'2025/7/presentaran-proyecto-de-ley-para-tipificar-y-sancionar-la-induccion-al-suicidio-femicida-en-uruguay/'],
    ['2024-11','Canal 10','TV y video','Movilización por el caso de Milagros Chamorro','','https://www.canal10.com.uy/movilizacion-el-caso-milagros-chamorro-n961396'],
    ['2024-10','Subrayado','TV y video','«Buscó absolutamente todos los caminos»: piden justicia por joven que se suicidó tras denunciar violación grupal','','https://www.subrayado.com.uy/busco-absolutamente-todos-los-caminos-piden-justicia-joven-que-se-suicido-denunciar-violacion-grupal-n961060'],
    ['2024-08','la diaria','Prensa','Presentarán proyecto para que se declare el Día Nacional de Solidaridad con Víctimas y Sobrevivientes de Violencia Sexual','',LD+'2024/8/presentaran-proyecto-para-que-se-declare-el-dia-nacional-de-solidaridad-con-victimas-y-sobrevivientes-de-violencia-sexual/'],
    ['2024-08','la diaria','Prensa','Por primera vez se conmemora en Uruguay el Día de Solidaridad con Víctimas y Sobrevivientes de Violencia Sexual','',LD+'2024/8/por-primera-vez-se-conmemora-en-uruguay-el-dia-de-solidaridad-con-victimas-y-sobrevivientes-de-violencia-sexual/'],
    ['2024-08','Montevideo Portal','Prensa','Delitos sexuales contra menores: reimpulsan proyecto de ley para que no prescriban','','https://www.montevideo.com.uy/Noticias/Delitos-sexuales-contra-menores-reimpulsan-proyecto-de-ley-para-que-no-prescriban-uc896838'],
    ['2024-07','VTV · Día a Día','TV y video','Victoria Marichal y Nadia Tesija: la problemática de la violencia sexual en nuestro país','','https://vtv.com.uy/victoria-marichal-y-nadia-tesija-la-problematica-de-la-violencia-sexual-en-nuestro-pais/'],
    ['2024-07','la diaria','Prensa','La atención del Estado uruguayo a las víctimas de violencia sexual: un abordaje que se queda corto frente a la dimensión del problema','',LD+'2024/7/la-atencion-del-estado-uruguayo-a-las-victimas-de-violencia-sexual-un-abordaje-que-se-queda-corto-frente-la-dimension-del-problema/'],
    ['2024-04','la diaria','Prensa','Valientes, el movimiento regional de activistas sobrevivientes de violencia sexual infantil que también tiene representantes en Uruguay','',LD+'2024/4/valientes-el-movimiento-regional-de-activistas-sobrevivientes-de-violencia-sexual-infantil-que-tambien-tiene-representantes-en-uruguay/'],
    ['2024-03','Caras y Caretas','Prensa','Violación, abuso sexual y la sociedad hipócrita','Por Manuela Amengual','https://www.carasycaretas.com.uy/sociedad/violacion-abuso-sexual-y-la-sociedad-hipocrita-n71634'],
    ['2023-11','la diaria','Prensa','Violencia sexual en boliches, festivales y fiestas: las lógicas que operan y algunas iniciativas para el abordaje en Uruguay','',LD+'2023/11/violencia-sexual-en-boliches-festivales-y-fiestas-las-logicas-que-operan-y-algunas-iniciativas-para-el-abordaje-en-uruguay/'],
    ['2023-11','la diaria','Prensa','«Lo más importante es que nos digan “te creo”»: especialistas y denunciantes intercambiaron sobre los distintos impactos de la violencia sexual','',LD+'2023/11/lo-mas-importante-es-que-nos-digan-te-creo-especialistas-y-denunciantes-intercambiaron-sobre-los-distintos-impactos-de-la-violencia-sexual/'],
    ['2023-06','El Observador','Prensa','La Ley de Talles tiene la firma de todos los partidos y avanza hacia Diputados: ¿qué propone?','','https://www.elobservador.com.uy/nota/la-ley-de-talles-tiene-la-firma-de-todos-los-partidos-y-avanza-hacia-diputados-que-propone--20236918380'],
    ['2023-03','Montevideo Portal','Campaña','Una guía de cuatro pasos con consejos de Dove para «desintoxicar» las redes de tus hijos','Con Dove','https://www.montevideo.com.uy/Negocios-y-Tendencias/Una-guia-de-cuatro-pasos-con-consejos-de-Dove-para-desintoxicar-las-redes-de-tus-hijos-uc848413'],
    ['2023-03','la diaria','Prensa','Sacarse el preservativo de manera no consensuada en un encuentro sexual es una forma de violencia: qué hay detrás del stealthing','',LD+'2023/3/sacarse-el-preservativo-de-manera-no-consensuada-en-un-encuentro-sexual-es-una-forma-de-violencia-que-hay-detras-del-stealthing/'],
    ['2023-02','la diaria','Prensa','Psicología feminista: una corriente al servicio de la emancipación y la liberación de todas las personas','',LD+'2023/2/psicologia-feminista-una-corriente-al-servicio-de-la-emancipacion-y-la-liberacion-de-todas-las-personas/'],
    ['2022-12','la diaria','Prensa','«Por qué ahora»: un relato en primera persona sobre el impacto de la violencia sexual y el camino de la recuperación','Por Stephanie Demirdjian',LD+'2022/12/por-que-ahora-un-relato-en-primera-persona-sobre-el-impacto-de-la-violencia-sexual-y-el-camino-de-la-recuperacion/'],
    ['2022-12','Woman Times','Prensa','Victoria Marichal y el poder reparador de la palabra','Entrevista sobre «Por qué ahora»','https://womantimes.com/victoria-marichal-y-el-poder-reparador-de-la-palabra/'],
    ['2022-10','la diaria','Prensa','El amor que queremos: claves feministas para transformar las maneras de vincularnos afectivamente con varones','',LD+'2022/10/el-amor-que-queremos-claves-feministas-para-transformar-las-maneras-de-vincularnos-afectivamente-con-varones/'],
    ['2022-07','la diaria','Prensa','No alcanza con decir «no» y va más allá del «sí»: las tensiones solapadas bajo el concepto de consentimiento sexual','',LD+'2022/7/no-alcanza-con-decir-no-y-va-mas-alla-del-si-las-tensiones-solapadas-bajo-el-concepto-de-consentimiento-sexual/'],
    ['2022-06','la diaria','Prensa','Menos ghosting, más responsabilidad afectiva: cómo transformar las maneras de relacionarse en la era de la hiperconectividad','',LD+'2022/6/menos-ghosting-mas-responsabilidad-afectiva-como-transformar-las-maneras-de-relacionarse-en-la-era-de-la-hiperconectividad/'],
    ['2022-06','Brecha','Prensa','Vestirse de realidad','Sobre la ley de talles. Por Lucia Silveira Almeda','https://brecha.com.uy/sobre-la-ley-de-talles/'],
    ['2022-04','la diaria','Prensa','Reivindicar el derecho de las mujeres al placer, una de las estrategias feministas frente al discurso del terror sexual','',LD+'2022/4/reivindicar-el-derecho-de-las-mujeres-al-placer-una-de-las-estrategias-feministas-frente-al-discurso-del-terror-sexual/'],
    ['2022-03','Teledoce · Desayunos Informales','TV y video','8 de marzo: un día de conmemoración, reflexión y lucha','','https://www.teledoce.com/programas/desayunos-informales/segunda-manana/8-de-marzo-un-dia-de-conmemoracion-reflexion-y-lucha/'],
    ['2022-02','la diaria','Prensa','Qué es la cultura de la violación y cómo hacer para desarmarla','',LD+'2022/2/que-es-la-cultura-de-la-violacion-y-como-hacer-para-desarmarla/'],
    ['2022-01','Brecha','Prensa','«Todas las violaciones son políticas»','Por Camila Ghemi','https://brecha.com.uy/todas-las-violaciones-son-politicas/'],
    ['2021-08','la diaria','Prensa','Sobrevivir a la violencia sexual: que la norma sea romper el silencio','',LD+'2021/8/sobrevivir-a-la-violencia-sexual-que-la-norma-sea-romper-el-silencio/'],
    ['2021-07','la diaria','Prensa','Violencia de género e ideación suicida: una realidad silenciosa para muchas mujeres uruguayas','',LD+'2021/7/violencia-de-genero-e-ideacion-suicida-una-realidad-silenciosa-para-muchas-mujeres-uruguayas/'],
    ['','TV Ciudad','TV y video','Proyectos desarchivados: la imprescriptibilidad de los delitos sexuales','','https://www.facebook.com/TVCIUDADuy/videos/ladob-uno-de-los-proyectos-desarchivados-es-sobre-la-imprescriptibilidad-de-los-/1437787034265450/'],
    ['','TV Ciudad · La letra chica','TV y video','El amor después del amor','Con el filósofo Darío Sztajn','https://www.facebook.com/TVCIUDADuy/videos/laletrachica-hoy-el-amor-despu%C3%A9s-del-amor-nos-acompa%C3%B1an-el-fil%C3%B3sofo-dario-sztajn/713484466553373/'],
    ['','TV Ciudad · La letra chica','TV y video','La letra chica','','https://www.facebook.com/TVCIUDADuy/videos/laletrachica/586492272535964/'],
    ['','Skip Uruguay','Campaña','«Vestite como quieras, vestite para vos»','Campaña junto a Skip','https://www.facebook.com/skipuruguay/posts/vestite-como-quieras-vestite-para-vosjunto-a-la-psic-victoria-marichal-seguimos-/618169607197637/'],
    ["2026-09", "TV Ciudad", "TV y video", "Ideas cruzadas: Marina Mammoliti y Victoria Marichal", "", "https://www.youtube.com/watch?v=4FnSVYTUMNA"],
    ["2025-12", "Candigirls Podcast", "Podcasts y radio", "Episodio 3: OnlyFans, ¿empoderamiento o explotación sexual?", "", "https://www.youtube.com/watch?v=bQ10nDYSadQ"],
    ["2025-08", "UNI Radio", "Podcasts y radio", "Suicidio femicida con Victoria Marichal", "Con Florencia Pagola", "https://www.youtube.com/watch?v=g9X_TEBw73U"],
    ["2025-07", "Salvacabeza · Mente en corto", "Podcasts y radio", "La violencia sexual", "", "https://www.youtube.com/watch?v=tffZNtYIaEo"],
    ["2025-07", "TV Ciudad · Somos Nosotras", "TV y video", "Nuevos viejos vínculos", "", "https://www.youtube.com/watch?v=cUa47YQGrec&t=890s"],
    ["2025-06", "Justas · Thelma Fardin", "Podcasts y radio", "#1 Las sobrevivientes", "Videopodcast JUSTAS con Thelma Fardin", "https://www.youtube.com/watch?v=uau03OcCAes"],
    ["2024-08", "Arriba Gente", "TV y video", "Entrevista: víctimas de agresiones sexuales", "Victoria Marichal, psicóloga, Proyecto Ikové", "https://www.youtube.com/watch?v=XCMeuJXaCH0"],
    ["2024-08", "Teledoce · Desayunos Informales", "TV y video", "9 de agosto: Día Regional de Solidaridad con Víctimas y Sobrevivientes de Violencia Sexual", "", "https://www.youtube.com/watch?v=zJJibP7BgjE&t=7s"],
    ["2022-11", "Regenerades", "Podcasts y radio", "#32 Violencia basada en género: lo personal es político", "", "https://www.youtube.com/watch?v=N9dQJUIpZpo"],
    ["2022-09", "Silene Lencería", "Campaña", "Victoria Marichal, psicóloga", "", "https://www.youtube.com/watch?v=VyEWF3ExEek"],
    ["2022-03", "970 Universal", "Podcasts y radio", "Violencia de género y consumo responsable", "", "https://www.youtube.com/watch?v=l7YvfpnNQ5g"],
    ["2020-05", "El Caldero", "Podcasts y radio", "El Caldero en vivo: Red de Psicólogas Feministas", "", "https://www.youtube.com/watch?v=QNdzHKgrla4"],
    ["2019-05", "Andrea Cammarano", "TV y video", "Las aventuras de Ruli, un libro educativo con perspectiva de género", "", "https://www.youtube.com/watch?v=w__H0giq4MI"],
    ["2026-01", "Las Wachas", "Podcasts y radio", "La gordofobia, el clasismo y la discriminación hoy son un trend", "", "https://www.youtube.com/watch?v=qNN-emjgBIM"],
    ["2020", "Tarde o Temprano", "TV y video", "ONU alerta por el riesgo de aumento de violencia doméstica por la cuarentena", "", "https://www.youtube.com/watch?v=ImJ1YpA0XdE&t=4s"],
    ["", "Nos Pasan Cosas", "TV y video", "Abuso sexual: hablar es sanar", "", "https://www.youtube.com/watch?v=w2F3osGD-Iw"],
    ["", "Psicología al Sur", "TV y video", "Violencia sexual: abordaje feminista sensible al trauma", "", "https://www.youtube.com/watch?v=2KzoGxcNdeI"],
    ["", "TV Ciudad · Somos Nosotras", "TV y video", "Abuso sexual infantil", "", "https://www.youtube.com/watch?v=FDPtuTjomwQ"],
    ["", "YouTube", "TV y video", "Conversamos con Margarita Thove y Victoria Marichal sobre Proyecto Ikové", "", "https://www.youtube.com/watch?v=zf6CG07lsoQ"],
    ["", "MVD Noticias", "TV y video", "En el Parlamento se realizó un conversatorio sobre violencia sexual", "", "https://www.youtube.com/watch?v=pAEp-cACeko"],
    ["", "GaydarTV", "TV y video", "E47 | Gritar, exigir y pedir", "", "https://www.youtube.com/watch?v=IPsq9BRG1BY&t=1498s"]
  ];
  P.sort(function(a,b){if(!a[0])return b[0]?1:0;if(!b[0])return -1;return a[0]<b[0]?1:a[0]>b[0]?-1:0;});
  var MES=['ene','feb','mar','abr','may','jun','jul','ago','set','oct','nov','dic'];
  function fd(d){if(!d)return '—';var p=d.split('-');return p.length<2?p[0]:MES[+p[1]-1]+' '+p[0];}
  function esc(s){return s.replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]})}
  var filt='all', all=false, LIM=12, box=document.getElementById('prows'), more=document.getElementById('pmore');
  function render(){
    var list=P.filter(function(r){return filt==='all'||r[2]===filt});
    var shown=all?list:list.slice(0,LIM);
    box.innerHTML=shown.map(function(r){
      return '<a class="prow" href="'+esc(r[5])+'" target="_blank" rel="noopener"><span class="pd">'+fd(r[0])+'</span><span class="po">'+esc(r[1])+'</span><span class="pt">'+esc(r[3])+(r[4]?'<small>'+esc(r[4])+'</small>':'')+'</span><span class="ptype">'+esc(r[2])+' ↗</span></a>';
    }).join('');
    more.hidden=list.length<=LIM;
    more.textContent=all?'Ver menos':'Ver todas ('+list.length+')';
  }
  more.addEventListener('click',function(){all=!all;render();});
  document.querySelectorAll('.pf').forEach(function(b){
    b.addEventListener('click',function(){
      filt=b.dataset.f; all=false;
      document.querySelectorAll('.pf').forEach(function(x){x.setAttribute('aria-pressed',x===b?'true':'false')});
      render();
    });
  });
  render();
  }

  document.querySelectorAll('.copy').forEach(function(b){
    b.addEventListener('click',function(){
      var el=document.getElementById(b.dataset.copy), txt=el.textContent;
      function sel(){var r=document.createRange();r.selectNodeContents(el);var s=getSelection();s.removeAllRanges();s.addRange(r);b.textContent='Seleccionado';}
      try{navigator.clipboard.writeText(txt).then(function(){b.textContent='Copiado'},sel)}catch(err){sel()}
      setTimeout(function(){b.textContent='Copiar'},1800);
    });
  });
})();
