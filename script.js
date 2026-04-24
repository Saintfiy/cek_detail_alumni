
var running = false;
var stopFlag = false;
var cntDone = 0, cntSkip = 0, cntErr = 0;

function addLog(msg, cls) {
  var b = document.getElementById('logBox');
  var d = document.createElement('div');
  d.className = cls || 'lo';
  var t = new Date().toLocaleTimeString('id-ID');
  d.textContent = t + '  ' + msg;
  b.appendChild(d);
  b.scrollTop = b.scrollHeight;
}

function updStats() {
  document.getElementById('sDone').textContent = cntDone;
  document.getElementById('sSkip').textContent = cntSkip;
  document.getElementById('sErr').textContent = cntErr;
}

function updProg(done, total) {
  var p = total > 0 ? Math.round(done / total * 100) : 0;
  document.getElementById('progFg').style.width = p + '%';
  document.getElementById('progTxt').textContent = done + '/' + total + ' (' + p + '%)';
}

function showCurrent(rec, result) {
  document.getElementById('curName').textContent = rec.full_name;
  document.getElementById('curName').style.color = '';
  var meta = [rec.major, rec.faculty, rec.entry_year].filter(Boolean).join(' • ');
  document.getElementById('curMeta').textContent = meta;
  if (!result) {
    document.getElementById('curGrid').innerHTML = '<span style="font-size:12px;color:#aaa">Tidak ada data ditemukan</span>';
    return;
  }
  var fields = [
    ['linkedin','LinkedIn'],['instagram','Instagram'],['facebook','Facebook'],['tiktok','TikTok'],
    ['email','Email'],['phone','Phone'],['workplace','Tempat Kerja'],
    ['position','Posisi'],['employment_type','Status'],['workplace_address','Alamat Kerja'],
    ['workplace_social_media','Sosmed Kantor']
  ];
  var h = '';
  for (var i = 0; i < fields.length; i++) {
    var k = fields[i][0], l = fields[i][1];
    if (result[k]) {
      h += '<div class="cf"><div class="cf-l">' + l + '</div><div class="cf-v">' + result[k] + '</div></div>';
    }
  }
  document.getElementById('curGrid').innerHTML = h || '<span style="font-size:12px;color:#aaa">Semua null</span>';
}

function doTest() {
  var url = document.getElementById('sbUrl').value.trim();
  var key = document.getElementById('sbKey').value.trim();
  addLog('Menguji koneksi ke tabel alumni...', 'li');
  fetch(url + '/rest/v1/alumni?select=full_name,nim&limit=3', {
    headers: { apikey: key, Authorization: 'Bearer ' + key }
  }).then(function(r) {
    if (r.ok) {
      r.json().then(function(d) {
        addLog('Berhasil! Contoh data: ' + JSON.stringify(d.map(function(x){ return x.full_name; })), 'lo');
      });
    } else {
      r.text().then(function(t) {
        addLog('Gagal HTTP ' + r.status + ': ' + t, 'le');
      });
    }
  }).catch(function(e) {
    addLog('Error: ' + e.message, 'le');
  });
}

function callAI(rec, callback) {
  var apiKey = document.getElementById('apiKey').value.trim();
  var uni = document.getElementById('uniName').value.trim();
  if (!apiKey) { callback(new Error('API Key Anthropic belum diisi'), null); return; }

  var nama = rec.full_name;
  var major = rec.major || '';
  var faculty = rec.faculty || '';
  var nim = rec.nim || '';
  var year = rec.entry_year || '';

  var prompt = 'Kamu adalah asisten pencarian data alumni universitas Indonesia.\n\nCari informasi terkini untuk alumni berikut menggunakan web search:\nNama: ' + nama + '\nNIM: ' + nim + '\nFakultas: ' + faculty + '\nProgram Studi: ' + major + '\nTahun Masuk: ' + year + '\nUniversitas: ' + uni + '\n\nLakukan pencarian dengan query:\n1. \"' + nama + ' ' + uni + '\"\n2. \"' + nama + ' ' + major + ' alumni\"\n3. \"' + nama + ' linkedin\"\n\nKembalikan HANYA JSON berikut tanpa markdown atau komentar apapun:\n{\"linkedin\":null,\"instagram\":null,\"facebook\":null,\"tiktok\":null,\"email\":null,\"phone\":null,\"workplace\":null,\"workplace_address\":null,\"position\":null,\"employment_type\":null,\"workplace_social_media\":null}\n\nIsi field yang berhasil ditemukan dengan data yang akurat. employment_type hanya boleh diisi: PNS, Swasta, atau Wirausaha. Jika tidak ditemukan sama sekali, semua isi null.';

  fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01'
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-20250514',
      max_tokens: 1000,
      tools: [{ type: 'web_search_20250305', name: 'web_search' }],
      messages: [{ role: 'user', content: prompt }]
    })
  }).then(function(r) {
    if (!r.ok) {
      r.text().then(function(t) {
        callback(new Error('API ' + r.status + ': ' + t.slice(0, 200)), null);
      });
      return;
    }
    r.json().then(function(data) {
      var text = '';
      for (var i = 0; i < data.content.length; i++) {
        if (data.content[i].type === 'text') { text += data.content[i].text; }
      }
      var s = text.indexOf('{');
      var e = text.lastIndexOf('}');
      if (s < 0 || e < 0) { callback(null, null); return; }
      try {
        callback(null, JSON.parse(text.slice(s, e + 1)));
      } catch(ex) {
        callback(null, null);
      }
    });
  }).catch(function(e) { callback(e, null); });
}

function patchSupabase(rec, result, callback) {
  var url = document.getElementById('sbUrl').value.trim();
  var key = document.getElementById('sbKey').value.trim();
  var FIELDS = ['linkedin','instagram','facebook','tiktok','email','phone',
                'workplace','workplace_address','position','employment_type','workplace_social_media'];
  var payload = {};
  var any = false;
  for (var i = 0; i < FIELDS.length; i++) {
    var f = FIELDS[i];
    if (result[f] != null && result[f] !== '') {
      payload[f] = result[f];
      any = true;
    }
  }
  payload['tracking_status'] = 'Teridentifikasi dari sumber publik';
  payload['last_tracked_at'] = new Date().toISOString();
  if (!any) {
    payload['tracking_status'] = 'Belum ditemukan di sumber publik';
    payload['last_tracked_at'] = new Date().toISOString();
  }
  var val = encodeURIComponent(rec.full_name);
  fetch(url + '/rest/v1/alumni?full_name=eq.' + val, {
    method: 'PATCH',
    headers: {
      apikey: key,
      Authorization: 'Bearer ' + key,
      'Content-Type': 'application/json',
      Prefer: 'return=minimal'
    },
    body: JSON.stringify(payload)
  }).then(function(r) {
    if (!r.ok) {
      r.text().then(function(t) { callback(new Error('PATCH: ' + t), false); });
      return;
    }
    callback(null, any);
  }).catch(function(e) { callback(e, false); });
}

function processOne(subset, idx, total, delay, done) {
  if (stopFlag || idx >= subset.length) { done(); return; }
  var rec = subset[idx];
  addLog('[' + (idx + 1) + '/' + total + '] Mencari: ' + rec.full_name, 'li');
  document.getElementById('curName').textContent = rec.full_name;
  document.getElementById('curName').style.color = '';
  document.getElementById('curMeta').textContent = [rec.major, rec.faculty, rec.entry_year].filter(Boolean).join(' • ');
  document.getElementById('curGrid').innerHTML = '<span style="font-size:12px;color:#aaa">Mencari...</span>';

  callAI(rec, function(err, result) {
    if (err) {
      addLog('  ERROR: ' + err.message, 'le');
      cntErr++;
      showCurrent(rec, null);
      updStats();
      updProg(idx + 1, total);
      setTimeout(function() { processOne(subset, idx + 1, total, delay, done); }, delay);
      return;
    }
    showCurrent(rec, result);
    if (!result) {
      addLog('  Parse gagal, skip', 'lw');
      cntSkip++;
      updStats();
      updProg(idx + 1, total);
      setTimeout(function() { processOne(subset, idx + 1, total, delay, done); }, delay);
      return;
    }
    patchSupabase(rec, result, function(perr, hasData) {
      if (perr) {
        addLog('  Supabase error: ' + perr.message, 'le');
        cntErr++;
      } else if (hasData) {
        var found = [];
        var FIELDS = ['linkedin','instagram','facebook','tiktok','email','phone',
                      'workplace','workplace_address','position','employment_type','workplace_social_media'];
        for (var i = 0; i < FIELDS.length; i++) {
          if (result[FIELDS[i]]) { found.push(FIELDS[i]); }
        }
        addLog('  Tersimpan: ' + found.join(', '), 'lo');
        cntDone++;
      } else {
        addLog('  Tidak ditemukan, status diupdate', 'lw');
        cntSkip++;
      }
      updStats();
      updProg(idx + 1, total);
      setTimeout(function() { processOne(subset, idx + 1, total, delay, done); }, delay);
    });
  });
}

function doStart() {
  if (running) return;
  running = true;
  stopFlag = false;
  cntDone = 0;
  cntSkip = 0;
  cntErr = 0;
  updStats();
  document.getElementById('btnStart').disabled = true;
  document.getElementById('btnStop').disabled = false;

  var offset = parseInt(document.getElementById('startOff').value) || 0;
  var limit = parseInt(document.getElementById('sessLim').value) || 30;
  var delay = parseInt(document.getElementById('delayMs').value) || 2000;
  var subset = RECORDS.slice(offset, offset + limit);

  addLog('Memulai ' + subset.length + ' alumni dari offset ' + offset, 'li');
  updProg(0, subset.length);

  processOne(subset, 0, subset.length, delay, function() {
    addLog('Selesai! Tersimpan: ' + cntDone + '  Skip: ' + cntSkip + '  Error: ' + cntErr, 'lo');
    running = false;
    document.getElementById('btnStart').disabled = false;
    document.getElementById('btnStop').disabled = true;
  });
}

function doStop() {
  stopFlag = true;
  document.getElementById('btnStop').disabled = true;
  addLog('Menghentikan setelah alumni ini selesai...', 'lw');
}
